import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, CLIENTS_TABLE } from '../supabaseClient';
import { CLIENT_FEEDBACK_COLUMN, getClientCreationDate } from '../utils/clientRow';
import { insertTaskWithSchemaFallback, normalizeTask } from '../utils/taskRow';

const AppContext = createContext();
// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);

const formatErrors = (errors) =>
  [...new Set(errors.filter(Boolean).map((e) => e.message || String(e)))].join(' · ') ||
  'Unable to reach the database.';

// Flat incentive reward per completed task (override with VITE_TASK_INCENTIVE_AMOUNT in .env)
// const TASK_INCENTIVE_AMOUNT = Number(import.meta.env.VITE_TASK_INCENTIVE_AMOUNT) || 500;

// ─── Notes column fallback helpers ───────────────────────────────────────────
const CLIENT_NOTES_COLUMNS = ['client_feedback', 'feedback'];
function notesColumnOrder(preferred) {
  return [preferred, ...CLIENT_NOTES_COLUMNS.filter((k) => k !== preferred)];
}
async function insertClientWithNotesFallback(db, table, baseRow, notesText, preferredKey) {
  let lastRes = { data: null, error: null };
  for (const key of notesColumnOrder(preferredKey)) {
    lastRes = await db.from(table).insert([{ ...baseRow, [key]: notesText }]).select();
    if (!lastRes.error) return lastRes;
    const msg = typeof lastRes.error.message === 'string' ? lastRes.error.message : '';
    if (!(lastRes.error.code === 'PGRST204' && msg.includes(`'${key}'`))) return lastRes;
  }
  return lastRes;
}

export const AppProvider = ({ children }) => {
  const [users,      setUsers]      = useState([]);
  const [tasks,      setTasks]      = useState([]);
  const tasksRef = useRef([]);  // always-fresh ref to avoid stale closure in callbacks
  const currentUserRef = useRef(null);
  const [clients,    setClients]    = useState([]);
  const [leads,      setLeads]      = useState([]);
  const [leadLists,  setLeadLists]  = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [incentives, setIncentives] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [rawLeads, setRawLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loanRawLeads, setLoanRawLeads] = useState([]);
  const [loanCampaigns, setLoanCampaigns] = useState([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [loadError,   setLoadError]   = useState(null);
  const [actionError, setActionError] = useState(null);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('cms_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // ── Load all tables ────────────────────────────────────────
  const loadData = useCallback(async () => {
    setDataLoading(true);
    setLoadError(null);
    
    try {
      const promises = [
        supabase.from('users').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from(CLIENTS_TABLE).select('*'),
        supabase.from('leads').select('*'),
        supabase.from('lead_lists').select('*'),
        supabase.from('holidays').select('*'),
        supabase.from('raw_lead_campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('loan_campaigns').select('*').order('created_at', { ascending: false }),
      ];

      if (currentUserRef.current) {
        promises.push(
          supabase.from('notifications').select('*').eq('userId', currentUserRef.current.id).order('createdAt', { ascending: false })
        );
      }

      const results = await Promise.all(promises);
      const [usersRes, tasksRes, clientsRes, leadsRes, leadListsRes, holidaysRes, campaignsRes, loanCampaignsRes] = results;
      const notifRes = currentUserRef.current ? results[8] : { data: [], error: null };

      // Fetch raw leads in two parts: all claimed leads + latest 1000 unclaimed leads
      const [rawClaimedRes, rawUnclaimedRes, loanRawClaimedRes, loanRawUnclaimedRes] = await Promise.all([
        supabase.from('raw_leads').select('*').not('claimed_by', 'is', null).limit(50000),
        supabase.from('raw_leads').select('*').is('claimed_by', null).order('created_at', { ascending: false }).limit(100000),
        supabase.from('loan_raw_leads').select('*').not('claimed_by', 'is', null).limit(50000),
        supabase.from('loan_raw_leads').select('*').is('claimed_by', null).order('created_at', { ascending: false }).limit(100000)
      ]);
      
      const rawLeadsData = [
        ...(rawClaimedRes.data || []),
        ...(rawUnclaimedRes.data || [])
      ];

      const loanRawLeadsData = [
        ...(loanRawClaimedRes.data || []),
        ...(loanRawUnclaimedRes.data || [])
      ];

      const errors = [usersRes.error, tasksRes.error, clientsRes.error, leadsRes.error, leadListsRes.error, holidaysRes.error, rawClaimedRes.error, rawUnclaimedRes.error, loanCampaignsRes.error, loanRawClaimedRes.error, loanRawUnclaimedRes.error];
      if (notifRes.error && notifRes.error.code !== '42P01') {
        console.error('[supabase] notifications load error:', notifRes.error);
      }
      if (errors.some(Boolean)) {
        setLoadError(formatErrors(errors));
        console.error('[supabase] load errors:', errors.filter(Boolean));
      }

      setUsers(usersRes.data ?? []);
      const loadedTasks = (tasksRes.data ?? []).map(normalizeTask);
      tasksRef.current = loadedTasks;
      setTasks(loadedTasks);
      
      const loadedClients = clientsRes.data ?? [];
      loadedClients.sort((a, b) => getClientCreationDate(b) - getClientCreationDate(a));
      setClients(loadedClients);

      setLeads(leadsRes.data ?? []);
      setLeadLists(leadListsRes.data ?? []);
      setHolidays(holidaysRes.data ?? []);
      setRawLeads(rawLeadsData);
      setLoanRawLeads(loanRawLeadsData);
      if (campaignsRes?.data) setCampaigns(campaignsRes.data);
      if (loanCampaignsRes?.data) setLoanCampaigns(loanCampaignsRes.data);
      setNotifications(notifRes.data ?? []);
      setDataLoading(false);
    } catch (err) {
      console.error(err);
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (!cancelled) await loadData();
    })();

    // ── Realtime Auto-Update Subscriptions ──
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: CLIENTS_TABLE }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setClients(prev => {
            if (prev.some(c => c.id === payload.new.id)) return prev;
            const updated = [payload.new, ...prev];
            updated.sort((a, b) => getClientCreationDate(b) - getClientCreationDate(a));
            return updated;
          });
        } else if (payload.eventType === 'UPDATE') {
          setClients(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
        } else if (payload.eventType === 'DELETE') {
          setClients(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => {
            const task = normalizeTask(payload.new);
            if (prev.some(t => t.id === task.id)) return prev;
            tasksRef.current = [...prev, task];
            return tasksRef.current;
          });
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => {
            const task = normalizeTask(payload.new);
            tasksRef.current = prev.map(t => t.id === task.id ? task : t);
            return tasksRef.current;
          });
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => {
            tasksRef.current = prev.filter(t => t.id !== payload.old.id);
            return tasksRef.current;
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLeads(prev => {
            if (prev.some(l => l.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        } else if (payload.eventType === 'UPDATE') {
          setLeads(prev => prev.map(l => l.id === payload.new.id ? payload.new : l));
        } else if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(l => l.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_lists' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLeadLists(prev => {
            if (prev.some(l => l.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        } else if (payload.eventType === 'UPDATE') {
          setLeadLists(prev => prev.map(l => l.id === payload.new.id ? payload.new : l));
        } else if (payload.eventType === 'DELETE') {
          setLeadLists(prev => prev.filter(l => l.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setUsers(prev => {
            if (prev.some(u => u.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        } else if (payload.eventType === 'UPDATE') {
          setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new : u));
        } else if (payload.eventType === 'DELETE') {
          setUsers(prev => prev.filter(u => u.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incentives' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setIncentives(prev => {
            if (prev.some(i => i.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        } else if (payload.eventType === 'UPDATE') {
          setIncentives(prev => prev.map(i => i.id === payload.new.id ? payload.new : i));
        } else if (payload.eventType === 'DELETE') {
          setIncentives(prev => prev.filter(i => i.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'holidays' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setHolidays(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setHolidays(prev => prev.map(h => h.id === payload.new.id ? payload.new : h));
        } else if (payload.eventType === 'DELETE') {
          setHolidays(prev => prev.filter(h => h.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications(prev => {
            // Only add if it's for the current user and not already in the list
            if (currentUserRef.current && payload.new.userId === currentUserRef.current.id) {
              if (prev.some(n => n.id === payload.new.id)) return prev;
              return [payload.new, ...prev];
            }
            return prev;
          });
        } else if (payload.eventType === 'UPDATE') {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'raw_lead_campaigns' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCampaigns(prev => {
            if (prev.some(c => c.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setCampaigns(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
        } else if (payload.eventType === 'DELETE') {
          setCampaigns(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { 
      cancelled = true; 
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  useEffect(() => {
    if (currentUser) localStorage.setItem('cms_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('cms_current_user');
  }, [currentUser]);

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const login = (identifier, password) => {
    const cleanId = String(identifier).trim().toLowerCase();
    const user = users.find(u => {
      const matchId = String(u.id).trim().toLowerCase() === cleanId;
      const matchEmail = u.email && String(u.email).trim().toLowerCase() === cleanId;
      const matchEmpId = u.employeeId && String(u.employeeId).trim().toLowerCase() === cleanId;
      return (matchId || matchEmail || matchEmpId) && u.password === password;
    });
    if (user) { setCurrentUser(user); return true; }
    return false;
  };
  const logout = () => {
    setCurrentUser(null);
    setNotifications([]);
  };

  // ── Notifications ────────────────────────────────────────────────────────────
  // Send to a specific user. If it's the current user, also update local state.
  const addNotification = async (userId, message) => {
    const newNotif = {
      id: crypto.randomUUID(),
      userId,
      message,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    if (userId === currentUserRef.current?.id) {
      setNotifications(prev => [newNotif, ...prev]);
    }
    const { error } = await supabase.from('notifications').insert([newNotif]);
    if (error && error.code !== '42P01') console.error('[supabase] addNotification:', error);
  };

  // Notify all admins and superadmins (except the actor themselves)
  const notifyAdmins = useCallback(async (message, usersSnapshot, excludeId = null) => {
    const admins = usersSnapshot.filter(
      u => (u.role === 'admin' || u.role === 'superadmin') && u.id !== excludeId
    );
    await Promise.all(admins.map(admin => addNotification(admin.id, message)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markNotificationRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    const { error } = await supabase.from('notifications').update({ isRead: true }).eq('id', id);
    if (error) console.error('[supabase] markNotificationRead:', error);
  };

  const markAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    const { error } = await supabase.from('notifications').update({ isRead: true }).eq('userId', currentUser?.id).eq('isRead', false);
    if (error) console.error('[supabase] markAllNotificationsRead:', error);
  };

  const deleteNotification = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) console.error('[supabase] deleteNotification:', error);
  };

  // ── Users ────────────────────────────────────────────────────────────────────
  const addUser = (userData) => {
    if (users.find(u => u.id === userData.id)) return false;
    setUsers(prev => [...prev, userData]);
    supabase.from('users').insert([userData]).then(({ error }) => {
      if (error) console.error('[supabase] addUser:', error);
    });
    return true;
  };

  const updateUser = async (userId, details) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...details } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({ ...prev, ...details }));
    }
    const { data, error } = await supabase
      .from('users')
      .update(details)
      .eq('id', userId)
      .select();
    if (error) console.error('[supabase] updateUser error:', error);
    else console.log('[supabase] updateUser success:', data);
  };

  const removeUser = async (userId) => {
    // Optimistically remove from UI immediately
    setUsers(prev => prev.filter(u => u.id !== userId));
    setTasks(prev => prev.filter(t => t.createdBy !== userId && t.assignedTo !== userId));
    setClients(prev => prev.filter(c => c.managedBy !== userId && c.createdBy !== userId));
    setIncentives(prev => prev.filter(i => i.employeeId !== userId));
    setNotifications(prev => prev.filter(n => n.userId !== userId));

    // Step 1: Delete notifications linked to this user
    const { error: notifErr } = await supabase.from('notifications').delete().eq('userId', userId);
    if (notifErr) console.error('[supabase] removeUser — notifications:', notifErr);

    // Step 2: Delete incentives linked to this user
    const { error: incErr } = await supabase.from('incentives').delete().eq('employeeId', userId);
    if (incErr) console.error('[supabase] removeUser — incentives:', incErr);

    // Step 3: Delete tasks created by or assigned to this user
    await supabase.from('tasks').delete().eq('createdBy', userId);
    await supabase.from('tasks').delete().eq('assignedTo', userId);

    // Step 4: Get clients managed/created by this user and delete their incentives first, then the clients
    const { data: userClients } = await supabase
      .from(CLIENTS_TABLE).select('id').or(`managedBy.eq.${userId},createdBy.eq.${userId}`);
    if (userClients?.length) {
      for (const c of userClients) {
        await supabase.from('incentives').delete().eq('clientId', c.id);
      }
      await supabase.from(CLIENTS_TABLE).delete().or(`managedBy.eq.${userId},createdBy.eq.${userId}`);
    }

    // Step 5: Finally delete the user
    const { data, error } = await supabase.from('users').delete().eq('id', userId).select();
    if (error) console.error('[supabase] removeUser error:', error);
    else console.log('[supabase] removeUser success — deleted:', data);
  };

  // ── Tasks ────────────────────────────────────────────────────────────────────
  const addTask = (taskData) => {
    void insertTaskWithSchemaFallback(supabase, taskData).then(({ data, error }) => {
      if (error) {
        console.error('[supabase] addTask:', error);
        setActionError(`Task not saved: ${error.message || error.code}. Run create_app_tables.sql and retry.`);
        return;
      }
      setActionError(null);
      if (data?.length > 0) {
        const newTask = normalizeTask(data[0]);
        tasksRef.current = [...tasksRef.current, newTask];
        setTasks(prev => [...prev, newTask]);

        const creator = users.find(u => u.id === newTask.createdBy)?.name || newTask.createdBy;
        const assignee = users.find(u => u.id === newTask.assignedTo)?.name || newTask.assignedTo;

        // Notify the assigned employee (if different from creator)
        if (newTask.assignedTo && newTask.assignedTo !== newTask.createdBy) {
          addNotification(newTask.assignedTo, `📋 ${creator} assigned a new task to you: "${newTask.title}"`);
        }

        // Notify all admins/superadmins
        const adminMsg = newTask.assignedTo === newTask.createdBy
          ? `📋 ${creator} created a self-assigned task: "${newTask.title}"`
          : `📋 ${creator} assigned task "${newTask.title}" to ${assignee}`;
        notifyAdmins(adminMsg, users, newTask.createdBy);
      }
    });
  };

  /**
   * updateTaskStatus — also wires tasks → incentives:
   * When a task is marked Completed, a task-type incentive is created for
   * the assignee, with incentives.taskId → tasks.id (FK).
   */
  const updateTaskStatus = (taskId, status) => {
    const task = tasksRef.current.find(t => t.id === taskId);

    // Update local state + ref immediately
    tasksRef.current = tasksRef.current.map(t => t.id === taskId ? { ...t, status } : t);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

    // Persist to Supabase
    supabase.from('tasks').update({ status }).eq('id', taskId).then(({ error }) => {
      if (error) { console.error('[supabase] updateTaskStatus:', error); return; }

      // Notify admins when a task status changes
      if (task) {
        const employeeName = users.find(u => u.id === task.assignedTo)?.name || task.assignedTo;
        notifyAdmins(
          `✅ ${employeeName} marked task "${task.title}" as ${status}`,
          users,
          null // notify all admins regardless
        );
      }
    });
  };

  // ── Clients ──────────────────────────────────────────────────────────────────
  const addClient = (clientData) => {
    const rawBudget = clientData.budget;
    const budget = rawBudget === '' || rawBudget == null ? null : Number(rawBudget);
    const finiteBudget = Number.isFinite(budget) ? budget : null;

    const note = String(clientData.feedback ?? '').trim();
    const parts = [];
    
    // Record the form fill date
    const todayStr = clientData.createdOn || new Date().toISOString().split('T')[0];
    parts.push(`[Created on ${todayStr}]`);
    
    const company = String(clientData.company ?? '').trim();
    if (company) parts.push(`[Company] ${company}`);
    if (finiteBudget != null) parts.push(`[Budget ₹${finiteBudget}]`);
    const totalDealGst = Number(clientData.totalDealGstAmount) || 0;
    const totalDealWithGst = Number(clientData.totalDealWithGst) || 0;
    if (totalDealGst > 0) parts.push(`[Total Deal GST ₹${totalDealGst}]`);
    if (totalDealWithGst > 0) parts.push(`[Total Deal With GST ₹${totalDealWithGst}]`);
    const panNumber = String(clientData.panNumber ?? '').trim();
    if (panNumber) parts.push(`[PAN] ${panNumber}`);
    const gstNumber = String(clientData.gstNumber ?? '').trim();
    if (gstNumber) parts.push(`[GST] ${gstNumber}`);
    const svc = (clientData.service ?? []).filter(Boolean);
    if (svc.length) parts.push(`[Services] ${svc.join('; ')}`);
    if (note) parts.push(note);

    // ← createdBy and managedBy are FKs → users.id
    const totalDealAmount = clientData.totalDealAmount != null ? Number(clientData.totalDealAmount) : null;
    const initialPaymentAmount = Number(clientData.paymentAmount) || 0;

    if (initialPaymentAmount > 0) {
      const today = new Date().toISOString().split('T')[0];
      parts.push(`[Payment ₹${initialPaymentAmount} on ${today}]`);
    }

    const baseRow = {
      name:             clientData.name,
      email:            clientData.email,
      phone:            clientData.phone,
      interested:       Boolean(clientData.interested),
      createdBy:        clientData.createdBy,   // → users.id
      managedBy:        clientData.managedBy,   // → users.id
      closer:           clientData.closer || clientData.createdBy, // → users.id
      totalDealAmount:  totalDealAmount,
      paymentAmount:    initialPaymentAmount,
      paymentStatus:    clientData.paymentStatus || 'Pending',
      withGstPayment:   clientData.withGstPayment || 0,
      onlyGstAmount:    clientData.onlyGstAmount || 0,
      incentivePaid:    false,
      service:          clientData.service || [],
    };

    const notesText = parts.join('\n\n');

    const handleResult = ({ data, error }) => {
      if (error) {
        console.error('[supabase] addClient:', error);
        setActionError(`Client not saved: ${error.message || error.code}. Check create_app_tables.sql was run.`);
        return;
      }
      setActionError(null);
      if (data?.length > 0) {
        setClients(prev => {
          if (prev.some(c => c.id === data[0].id)) return prev;
          return [...prev, data[0]];
        });
        // Notify all admins about the new client
        const creatorName = users.find(u => u.id === clientData.createdBy)?.name || clientData.createdBy;
        notifyAdmins(
          `👤 ${creatorName} added a new client: "${clientData.name}" (${clientData.email})`,
          users,
          clientData.createdBy
        );
      }
    };

    if (!notesText.trim()) {
      void supabase.from(CLIENTS_TABLE).insert([baseRow]).select().then(handleResult);
    } else {
      void insertClientWithNotesFallback(supabase, CLIENTS_TABLE, baseRow, notesText, CLIENT_FEEDBACK_COLUMN)
        .then(handleResult);
    }
  };

  const addLoanFile = async (loanData) => {
    try {
      const { data, error } = await supabase.from('loan_files').insert([loanData]).select();
      if (error) throw error;
      // You could optionally keep a local state array for loan files, but for now we'll just insert
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('[supabase] addLoanFile error:', err);
      setActionError(`Loan file not saved: ${err.message || err.code}`);
      return { success: false, error: err.message };
    }
  };

  const transferClient = (clientId, newOwnerId) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, managedBy: newOwnerId } : c));
    supabase.from(CLIENTS_TABLE).update({ managedBy: newOwnerId }).eq('id', clientId).then(({ error }) => {
      if (error) { console.error('[supabase] transferClient:', error); return; }
      const client = clients.find(c => c.id === clientId);
      const sender = currentUserRef.current?.name || 'Someone';
      const newOwnerName = users.find(u => u.id === newOwnerId)?.name || newOwnerId;

      // Notify the new owner
      if (newOwnerId !== currentUserRef.current?.id) {
        addNotification(newOwnerId, `🔄 ${sender} transferred client "${client?.name}" to you`);
      }
      // Notify all admins
      notifyAdmins(
        `🔄 ${sender} transferred client "${client?.name}" to ${newOwnerName}`,
        users,
        currentUserRef.current?.id
      );
    });
  };

  /**
   * registerPayment — wires clients → incentives:
   * Creates incentive rows with:
   *   incentives.employeeId → users.id
   *   incentives.clientId   → clients.id  (the FK that was missing)
   *   incentive_type = 'payment'
   */
  const registerPayment = (clientId, amount) => {
    const paymentAmount = parseFloat(amount);
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const totalCut = paymentAmount * 0.10;
    const newIncentives = [];

    const closerId = client.closer || client.createdBy;

    if (client.createdBy === closerId) {
      newIncentives.push({
        id:                    `${Date.now()}-1`,
        employeeId:            client.createdBy,  // → users.id
        clientId:              client.id,          // → clients.id  ← the missing FK
        clientName:            client.name,
        clientPaymentAmount:   paymentAmount,
        amount:                totalCut,
        role:                  'Full (Creator & Closer)',
        status:                'Pending',
        taskId:                null,
        incentive_type:        'payment',
        createdAt:             new Date().toISOString(),
      });
    } else {
      newIncentives.push({
        id:                    `${Date.now()}-1`,
        employeeId:            client.createdBy,  // → users.id
        clientId:              client.id,          // → clients.id
        clientName:            client.name,
        clientPaymentAmount:   paymentAmount,
        amount:                totalCut * 0.5,
        role:                  'Lead Generator (50% Split)',
        status:                'Pending',
        taskId:                null,
        incentive_type:        'payment',
        createdAt:             new Date().toISOString(),
      });
      newIncentives.push({
        id:                    `${Date.now()}-2`,
        employeeId:            closerId,          // → users.id
        clientId:              client.id,          // → clients.id
        clientName:            client.name,
        clientPaymentAmount:   paymentAmount,
        amount:                totalCut * 0.5,
        role:                  'Closer (50% Split)',
        status:                'Pending',
        taskId:                null,
        incentive_type:        'payment',
        createdAt:             new Date().toISOString(),
      });
    }

    setIncentives(prev => [...prev, ...newIncentives]);
    supabase.from('incentives').insert(newIncentives).then(({ error }) => {
      if (error) console.error('[supabase] registerPayment incentives:', error);
    });

    const updates = {
      paymentAmount:  paymentAmount,
      paymentStatus:  'Completed',
      paymentDate:    new Date().toISOString(),
    };
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...updates } : c));
    supabase.from(CLIENTS_TABLE).update(updates).eq('id', clientId).then(({ error }) => {
      if (error) { console.error('[supabase] registerPayment clients:', error); return; }
      // Notify all admins about the payment
      const registeredBy = currentUserRef.current?.name || 'Someone';
      notifyAdmins(
        `💰 ${registeredBy} registered payment of ₹${paymentAmount.toLocaleString()} for client "${client.name}"`,
        users,
        currentUserRef.current?.id
      );
    });
  };

  const updateClientStatus = (clientId, interested) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, interested } : c));
    supabase.from(CLIENTS_TABLE).update({ interested }).eq('id', clientId).then(({ error }) => {
      if (error) console.error('[supabase] updateClientStatus:', error);
    });
  };

  const updateClientStage = (clientId, stage) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, stage } : c));
    supabase.from(CLIENTS_TABLE).update({ stage }).eq('id', clientId).then(({ error }) => {
      if (error) console.error('[supabase] updateClientStage:', error);
    });
  };

  const updateClientServiceStage = (clientId, serviceName, stage) => {
    if (!serviceName) return updateClientStage(clientId, stage); // Fallback if no specific service
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      const currentStages = typeof c.service_stages === 'object' && c.service_stages ? { ...c.service_stages } : {};
      currentStages[serviceName] = stage;
      
      const patch = { service_stages: currentStages };
      // Also update master stage if this is the only service, just for backward compatibility fallback
      if (c.service && Array.isArray(c.service) && c.service.length === 1) {
        patch.stage = stage;
      }
      
      supabase.from(CLIENTS_TABLE).update(patch).eq('id', clientId).then(({ error }) => {
        if (error) console.error('[supabase] updateClientServiceStage:', error);
      });
      return { ...c, ...patch };
    }));
  };

  const updateClientDetails = (clientId, details) => {
    const patch = { ...details };
    if (Object.prototype.hasOwnProperty.call(patch, 'feedback')) {
      patch[CLIENT_FEEDBACK_COLUMN] = patch.feedback;
      delete patch.feedback;
    }
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...patch } : c));
    supabase.from(CLIENTS_TABLE).update(patch).eq('id', clientId).then(({ error }) => {
      if (error) console.error('[supabase] updateClientDetails:', error);
    });
  };

  const removeClient = async (clientId) => {
    // Optimistically remove from UI immediately
    setClients(prev => prev.filter(c => c.id !== clientId));
    setIncentives(prev => prev.filter(inc => inc.clientId !== clientId));

    // Step 1: Delete related incentives first (FK constraint: incentives.clientId → clients.id)
    const { error: incErr } = await supabase
      .from('incentives')
      .delete()
      .eq('clientId', clientId);
    if (incErr) console.error('[supabase] removeClient — incentives delete error:', incErr);

    // Step 2: Now delete the client
    const { error: clientErr } = await supabase
      .from(CLIENTS_TABLE)
      .delete()
      .eq('id', clientId)
      .select();
    if (clientErr) {
      console.error('[supabase] removeClient — client delete error:', clientErr);
    } else {
      console.log('[supabase] removeClient — client deleted successfully:', clientId);
    }
  };

  // ── Leads ──────────────────────────────────────────────────────────────────
  const addLead = async (leadData) => {
    // Only add fields that actually have a value to avoid schema cache errors
    // if the database table is missing columns like 'budget' or 'company'.
    const baseRow = {
      name: leadData.name,
      source: leadData.source || 'Facebook Ads',
      status: leadData.status || 'CREATED',
    };
    const knownCols = ['id', 'created_at', 'name', 'company', 'email', 'phone', 'type_of_service', 'city', 'state', 'source', 'status', 'createdBy', 'managedBy', 'list_id', 'dynamic_data'];
    const dynamicData = { ...(leadData.dynamic_data || {}) };

    if (leadData.email) baseRow.email = leadData.email;
    if (leadData.phone) baseRow.phone = leadData.phone;
    if (leadData.createdBy) baseRow.createdBy = leadData.createdBy;
    if (leadData.managedBy) baseRow.managedBy = leadData.managedBy;
    if (leadData.type_of_service) baseRow.type_of_service = leadData.type_of_service;
    if (leadData.city) baseRow.city = leadData.city;
    if (leadData.state) baseRow.state = leadData.state;
    if (leadData.list_id) baseRow.list_id = leadData.list_id;
    if (leadData.company) baseRow.company = leadData.company;

    // Move unknown columns to dynamicData
    if (leadData.campaign) dynamicData.campaign = leadData.campaign;
    if (leadData.score !== undefined && leadData.score !== 0) dynamicData.score = leadData.score;
    if (leadData.budget !== undefined && leadData.budget !== 0) dynamicData.budget = leadData.budget;
    if (leadData.service && leadData.service.length > 0) dynamicData.service = leadData.service;
    if (leadData.notes) dynamicData.notes = leadData.notes;

    if (Object.keys(dynamicData).length > 0) {
      baseRow.dynamic_data = dynamicData;
    }

    const { data, error } = await supabase.from('leads').insert([baseRow]).select();
    if (error) {
      console.error('[supabase] addLead:', error);
      setActionError(`Lead not saved: ${error.message || error.code}.`);
      return;
    }
    setActionError(null);
    if (data?.length > 0) {
      setLeads(prev => {
        if (prev.some(l => l.id === data[0].id)) return prev;
        return [...prev, data[0]];
      });
      const creatorName = users.find(u => u.id === leadData.createdBy)?.name || leadData.createdBy;
      notifyAdmins(
        `🎯 ${creatorName} added a new lead: "${leadData.name}"`,
        users,
        leadData.createdBy
      );
    }
  };

  const addRawLeads = async (leadsArray) => {
    const { data, error } = await supabase.from('raw_leads').insert(leadsArray).select();
    if (error) {
      console.error('[supabase] addRawLeads error:', error);
      throw error;
    }
    if (data?.length > 0) {
      setRawLeads(prev => [...data, ...prev]);
    }
    return data;
  };

  const claimNextRawLead = async (userId) => {
    let attempts = 0;
    while(attempts < 3) {
      const activeCampaigns = campaigns.filter(c => 
        c.is_active && 
        (!c.assigned_to || c.assigned_to.split(',').includes(userId))
      );
      const activeCampaignIds = activeCampaigns.map(c => c.id);
      
      console.log('claimNextRawLead attempt:', attempts, 'userId:', userId, 'activeCampaignIds:', activeCampaignIds);

      if (activeCampaignIds.length === 0) return null;

      const { data: unassignedLeads, error: selectErr } = await supabase
        .from('raw_leads')
        .select('id')
        .is('claimed_by', null)
        .in('campaign_id', activeCampaignIds)
        .limit(5);
        
      console.log('unassignedLeads:', unassignedLeads, 'selectErr:', selectErr);
        
      if (!unassignedLeads || unassignedLeads.length === 0) {
        return null;
      }
      
      const targetId = unassignedLeads[0].id;
      
      const { data: claimed, error } = await supabase
        .from('raw_leads')
        .update({ claimed_by: userId, claimed_at: new Date().toISOString(), status: 'PENDING' })
        .eq('id', targetId)
        .is('claimed_by', null)
        .select();
        
      console.log('claimed update result:', claimed, 'error:', error);
        
      if (claimed && claimed.length > 0) {
        setRawLeads(prev => {
          const exists = prev.some(l => l.id === targetId);
          if (exists) return prev.map(l => l.id === targetId ? claimed[0] : l);
          return [claimed[0], ...prev];
        });
        return claimed[0];
      }
      attempts++;
    }
    return null;
  };

  const submitRawLeadStatus = async (leadId, status) => {
    const { data, error } = await supabase
      .from('raw_leads')
      .update({ status: status })
      .eq('id', leadId)
      .select();
      
    if (error) {
      console.error('[supabase] submitRawLeadStatus error:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      setRawLeads(prev => prev.map(l => l.id === leadId ? data[0] : l));
    }
  };

  const addLoanRawLeads = async (leadsArray) => {
    const { data, error } = await supabase.from('loan_raw_leads').insert(leadsArray).select();
    if (error) throw error;
    if (data?.length > 0) {
      setLoanRawLeads(prev => [...data, ...prev]);
    }
    return data;
  };

  const claimNextLoanRawLead = async (userId) => {
    let attempts = 0;
    while(attempts < 3) {
      const activeCampaigns = loanCampaigns.filter(c => 
        c.is_active && 
        (!c.assigned_to || c.assigned_to.split(',').includes(userId))
      );
      const activeCampaignIds = activeCampaigns.map(c => c.id);
      
      console.log('claimNextLoanRawLead userId:', userId);
      console.log('loanCampaigns:', loanCampaigns);
      console.log('activeCampaignIds:', activeCampaignIds);
      
      if (activeCampaignIds.length === 0) return null;

      const { data: unassignedLeads, error: selectErr } = await supabase
        .from('loan_raw_leads')
        .select('id')
        .is('claimed_by', null)
        .in('campaign_id', activeCampaignIds)
        .limit(5);
        
      console.log('unassignedLeads:', unassignedLeads, selectErr);
        
      if (!unassignedLeads || unassignedLeads.length === 0) return null;
      
      const targetId = unassignedLeads[0].id;
      
      const { data: claimed } = await supabase
        .from('loan_raw_leads')
        .update({ claimed_by: userId, claimed_at: new Date().toISOString(), status: 'PENDING' })
        .eq('id', targetId)
        .is('claimed_by', null)
        .select();
        
      if (claimed && claimed.length > 0) {
        setLoanRawLeads(prev => {
          const exists = prev.some(l => l.id === targetId);
          if (exists) return prev.map(l => l.id === targetId ? claimed[0] : l);
          return [claimed[0], ...prev];
        });
        return claimed[0];
      }
      attempts++;
    }
    return null;
  };

  const submitLoanRawLeadStatus = async (leadId, status) => {
    const { data, error } = await supabase
      .from('loan_raw_leads')
      .update({ status: status })
      .eq('id', leadId)
      .select();
    if (error) throw error;
    if (data && data.length > 0) {
      setLoanRawLeads(prev => prev.map(l => l.id === leadId ? data[0] : l));
    }
  };

  const updateLeadDetails = (leadId, details) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...details } : l));
    
    // The leads table only has certain columns. Unknown columns cause Supabase to reject the update.
    const knownCols = ['id', 'created_at', 'name', 'company', 'email', 'phone', 'type_of_service', 'city', 'state', 'source', 'status', 'createdBy', 'managedBy', 'list_id', 'dynamic_data'];
    const patch = {};
    const dynamicDataUpdate = {};
    let hasDynamicData = false;

    Object.keys(details).forEach(key => {
      if (knownCols.includes(key)) {
        patch[key] = details[key];
      } else {
        dynamicDataUpdate[key] = details[key];
        hasDynamicData = true;
      }
    });

    if (hasDynamicData) {
      // Find current lead to merge dynamic_data properly
      const currentLead = leads.find(l => l.id === leadId);
      patch.dynamic_data = { ...(currentLead?.dynamic_data || {}), ...dynamicDataUpdate };
    }

    supabase.from('leads').update(patch).eq('id', leadId).then(({ error }) => {
      if (error) console.error('[supabase] updateLeadDetails:', error);
    });
  };

  const removeLead = async (leadId) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
    const { error } = await supabase.from('leads').delete().eq('id', leadId).select();
    if (error) console.error('[supabase] removeLead error:', error);
  };

  const assignLeadListToSales = async (listId, salesUserId) => {
    setLeads(prev => prev.map(l => l.list_id === listId ? { ...l, managedBy: salesUserId } : l));
    const { error } = await supabase
      .from('leads')
      .update({ managedBy: salesUserId })
      .eq('list_id', listId);
    if (error) console.error('[supabase] assignLeadListToSales error:', error);
  };

  const convertLeadToClient = async (leadId, paymentAmount) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    
    // Remove lead from DB first
    await supabase.from('leads').delete().eq('id', leadId);
    setLeads(prev => prev.filter(l => l.id !== leadId));

    // Prepare client row
    const baseRow = {
      name:             lead.name,
      email:            lead.email,
      phone:            lead.phone,
      interested:       true,
      createdBy:        lead.createdBy,   
      managedBy:        lead.managedBy,   
      closer:           currentUserRef.current?.id || lead.createdBy, 
      totalDealAmount:  null,
      paymentAmount:    0, 
      paymentStatus:    'Pending',
      incentivePaid:    false,
      service:          lead.services || [],
    };
    
    const { data, error } = await supabase.from(CLIENTS_TABLE).insert([baseRow]).select();
    if (error) {
      console.error('[supabase] convertLeadToClient:', error);
      return;
    }
    
    if (data?.length > 0) {
      const newClient = data[0];
      setClients(prev => [...prev, newClient]);
      
      // Register payment to create incentives
      if (Number(paymentAmount) > 0) {
        registerPayment(newClient.id, Number(paymentAmount));
      }
    }
  };

  // Superadmin assigns a client to an admin (sets managedBy = adminId)
  const assignClientToAdmin = async (clientId, adminId) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, managedBy: adminId } : c));
    const { error } = await supabase
      .from(CLIENTS_TABLE)
      .update({ managedBy: adminId })
      .eq('id', clientId)
      .select();
    if (error) console.error('[supabase] assignClientToAdmin error:', error);
    else console.log('[supabase] assignClientToAdmin — assigned client', clientId, 'to admin', adminId);
  };

  // ── Incentives ───────────────────────────────────────────────────────────────
  const markIncentivesPaid = (employeeId) => {
    const paidAt = new Date().toISOString();
    setIncentives(prev =>
      prev.map(inc =>
        inc.employeeId === employeeId && inc.status === 'Pending'
          ? { ...inc, status: 'Paid', paidAt }
          : inc
      )
    );
    supabase.from('incentives')
      .update({ status: 'Paid', paidat: paidAt })
      .eq('employeeId', employeeId)
      .eq('status', 'Pending')
      .then(({ error }) => {
        if (error) console.error('[supabase] markIncentivesPaid:', error);
      });
  };

  const addLeadList = async (listData) => {
    try {
      const { data, error } = await supabase.from('lead_lists').insert([{
        ...listData,
        createdBy: currentUser?.name || 'System'
      }]).select();
      if (error) throw error;
      setLeadLists(prev => [...prev, data[0]]);
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('[supabase] addLeadList error:', err);
      setActionError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateLeadList = async (listId, updates) => {
    try {
      const { error } = await supabase.from('lead_lists').update(updates).eq('id', listId);
      if (error) throw error;
      setLeadLists(prev => prev.map(l => l.id === listId ? { ...l, ...updates } : l));
      return { success: true };
    } catch (err) {
      console.error('[supabase] updateLeadList error:', err);
      setActionError(err.message);
      return { success: false, error: err.message };
    }
  };

  const removeLeadList = async (listId) => {
    try {
      const { error } = await supabase.from('lead_lists').delete().eq('id', listId);
      if (error) throw error;
      setLeadLists(prev => prev.filter(l => l.id !== listId));
      setLeads(prev => prev.filter(l => l.list_id !== listId)); // optimistic
    } catch (err) {
      console.error('[supabase] removeLeadList error:', err);
      setActionError(err.message);
    }
  };

  const clearLeadList = async (listId) => {
    try {
      const { error } = await supabase.from('leads').delete().eq('list_id', listId);
      if (error) throw error;
      setLeads(prev => prev.filter(l => l.list_id !== listId));
    } catch (err) {
      console.error('[supabase] clearLeadList error:', err);
      setActionError(err.message);
    }
  };

  return (
    <AppContext.Provider value={{
      users, tasks, clients, leads, leadLists, incentives, notifications, currentUser, holidays,
      login, logout,
      addUser, updateUser, removeUser,
      addTask, updateTaskStatus,
      addClient, transferClient, registerPayment, updateClientStatus, updateClientStage, updateClientServiceStage, updateClientDetails, addLoanFile,
      addLead, updateLeadDetails, removeLead, convertLeadToClient, assignLeadListToSales, addLeadList, updateLeadList, removeLeadList, clearLeadList,
      rawLeads,
      campaigns,
      addRawLeads,
      claimNextRawLead,
      submitRawLeadStatus,
      setHolidays: (h) => setHolidays(h),
      setCampaigns,
      addCampaign: async (camp) => {
        const { data, error } = await supabase.from('raw_lead_campaigns').insert(camp).select();
        if (error) throw error;
        setCampaigns(prev => [data[0], ...prev]);
        return data[0];
      },
      updateCampaign: async (id, updates) => {
        const { data, error } = await supabase.from('raw_lead_campaigns').update(updates).eq('id', id).select();
        if (error) throw error;
        setCampaigns(prev => prev.map(c => c.id === id ? data[0] : c));
        return data[0];
      },
      deleteCampaign: async (id) => {
        const { error } = await supabase.from('raw_lead_campaigns').delete().eq('id', id);
        if (error) throw error;
        setCampaigns(prev => prev.filter(c => c.id !== id));
      },

      loanRawLeads,
      loanCampaigns,
      addLoanRawLeads,
      claimNextLoanRawLead,
      submitLoanRawLeadStatus,
      setLoanCampaigns,
      addLoanCampaign: async (camp) => {
        const { data, error } = await supabase.from('loan_campaigns').insert(camp).select();
        if (error) throw error;
        setLoanCampaigns(prev => [data[0], ...prev]);
        return data[0];
      },
      updateLoanCampaign: async (id, updates) => {
        const { data, error } = await supabase.from('loan_campaigns').update(updates).eq('id', id).select();
        if (error) throw error;
        setLoanCampaigns(prev => prev.map(c => c.id === id ? data[0] : c));
        return data[0];
      },
      deleteLoanCampaign: async (id) => {
        const { error } = await supabase.from('loan_campaigns').delete().eq('id', id);
        if (error) throw error;
        setLoanCampaigns(prev => prev.filter(c => c.id !== id));
      },
      addIncentive: async (inc) => {},
      selectedClient,
      setSelectedClient, removeClient, assignClientToAdmin,
      markIncentivesPaid, markNotificationRead, markAllNotificationsRead, deleteNotification,

      dataLoading, loadError, reloadData: loadData,
      actionError, dismissActionError: () => setActionError(null),
    }}>
      {children}
    </AppContext.Provider>
  );
};