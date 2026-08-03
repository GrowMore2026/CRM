import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Users } from 'lucide-react';
import { Routes, Route, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useApp } from '../context/AppProvider';
import { 
  getClientCompanyName,
  getClientServicesList,
  getClientCreationDate,
  getStatusStyle
} from '../utils/clientRow';
import UpcomingHolidays from '../components/UpcomingHolidays';

const DigitalMarketingOverview = () => {
  const { clients, leadLists, leads } = useApp();
  const navigate = useNavigate();
  const [selectedListId, setSelectedListId] = useState('');

  useEffect(() => {
    if (leadLists && leadLists.length > 0 && !selectedListId) {
      setSelectedListId(leadLists[0].id);
    }
  }, [leadLists, selectedListId]);

  // Aggregate data for the donut chart
  let totalAssignedLeads = 0;
  let totalCalled = 0;
  
  const assignedLists = leadLists?.filter(list => {
    const listLeads = leads?.filter(l => l.list_id === list.id) || [];
    return listLeads.some(l => l.managedBy);
  }) || [];
  
  assignedLists.forEach(list => {
    const listLeads = leads?.filter(l => l.list_id === list.id) || [];
    totalAssignedLeads += listLeads.length;
    totalCalled += listLeads.filter(l => l.status && l.status !== 'CREATED').length;
  });

  const totalRemaining = totalAssignedLeads - totalCalled;
  
  const pieData = [
    { name: 'Called', value: totalCalled, color: '#10b981' },
    { name: 'Remaining', value: totalRemaining, color: '#ff6b6b' }
  ];
  
  const calledPct = totalAssignedLeads > 0 ? Math.round((totalCalled / totalAssignedLeads) * 100) : 0;
  const remainingPct = totalAssignedLeads > 0 ? Math.round((totalRemaining / totalAssignedLeads) * 100) : 0;

  const totalLists = leadLists?.length || 0;
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];
  
  const listsDonutData = (leadLists || []).map((list, index) => {
    return {
      name: list.name,
      value: 1, // Equal size slices just to represent the list exists
      color: COLORS[index % COLORS.length]
    };
  });

  const STATUSES = ['INTERESTED', 'NOT_INTERESTED', 'CALLBACK', 'CONTACTED', 'DND', 'CUT_CALL', 'CREATED'];
  const STATUS_COLORS = {
    'INTERESTED': '#10b981',
    'NOT_INTERESTED': '#ef4444',
    'CALLBACK': '#3b82f6',
    'CONTACTED': '#f59e0b',
    'DND': '#6b7280',
    'CUT_CALL': '#8b5cf6',
    'CREATED': '#94a3b8'
  };
  
  const leadsStatusData = (leadLists || []).map(list => {
    const listLeads = leads?.filter(l => l.list_id === list.id) || [];
    const counts = { name: list.name, Total: listLeads.length };
    STATUSES.forEach(s => counts[s] = 0);
    listLeads.forEach(l => {
      const s = l.status || 'CREATED';
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }).sort((a, b) => b.Total - a.Total);

  // Compute status distribution for the selected lead list
  const selectedListLeads = leads?.filter(l => l.list_id === selectedListId) || [];
  const selectedListStatusData = STATUSES.map(status => {
    const count = selectedListLeads.filter(l => (l.status || 'CREATED') === status).length;
    return {
      name: status,
      value: count,
      color: STATUS_COLORS[status]
    };
  }).filter(item => item.value > 0);

  const selectedListTotalLeads = selectedListLeads.length;

  // Compute overall status distribution for all leads combined
  const allLeadsStatusData = STATUSES.map(status => {
    const count = leads?.filter(l => (l.status || 'CREATED') === status).length || 0;
    return {
      name: status,
      value: count,
      color: STATUS_COLORS[status]
    };
  }).filter(item => item.value > 0);

  const allLeadsTotal = leads?.length || 0;

  return (
    <div className="animate-fade-in">
      {/* First Line: Total Lead Lists & List Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>
        {totalLists > 0 && (
          <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', minWidth: 0 }}>
            <h3 className="text-h3" style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>Total Lead Lists</h3>
            <div style={{ height: '220px', width: '100%', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={listsDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    dataKey="value"
                    stroke="none"
                    paddingAngle={2}
                  >
                    {listsDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                    itemStyle={{ color: 'var(--text-primary)' }}
                    formatter={(value, name) => ['Created', name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.2' }}>{totalLists}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>LISTS</div>
              </div>
            </div>
          </div>
        )}

        {totalLists > 0 && (
          <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="text-h3" style={{ margin: 0, color: 'var(--text-primary)', fontWeight: '700' }}>List Status</h3>
              <select 
                value={selectedListId} 
                onChange={(e) => setSelectedListId(e.target.value)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer', maxWidth: '180px' }}
              >
                {leadLists?.map(list => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
            </div>

            {selectedListTotalLeads === 0 ? (
              <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No leads in this list
              </div>
            ) : (
              <>
                <div style={{ height: '220px', width: '100%', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={selectedListStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        dataKey="value"
                        stroke="none"
                        paddingAngle={2}
                      >
                        {selectedListStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.2' }}>{selectedListTotalLeads}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>LEADS</div>
                  </div>
                </div>
                
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '120px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {selectedListStatusData.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }}></div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '700' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {allLeadsTotal > 0 && (
          <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', minWidth: 0 }}>
            <h3 className="text-h3" style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>All Leads Status</h3>
            
            <div style={{ height: '220px', width: '100%', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allLeadsStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    dataKey="value"
                    stroke="none"
                    paddingAngle={2}
                  >
                    {allLeadsStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.2' }}>{allLeadsTotal}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>TOTAL</div>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '120px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {allLeadsStatusData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }}></div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '700' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Second Line: Upcoming Holidays */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <UpcomingHolidays />
        </div>
      </div>
    </div>
  );
};



import { Upload, Eye, Edit2, MoreVertical, Download, UserPlus, Search, ListPlus, Trash2 } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import CreateLeadListModal from '../components/CreateLeadListModal';

const LeadListCard = ({ list, leads, users, onUploadCsv, onViewLeads, onDeleteLeads, onTrashList, onToggleActive, onAssignList }) => {
  const listLeads = leads.filter(l => l.list_id === list.id);
  const total = listLeads.length;
  const callDone = listLeads.filter(l => l.status && l.status !== 'CREATED').length;
  const remaining = total - callDone;
  
  const assignedUserIds = [...new Set(listLeads.map(l => l.managedBy).filter(Boolean))];
  const assignedUserNames = assignedUserIds.map(id => {
    const u = users?.find(user => user.id === id);
    return u ? u.name : 'Unknown';
  }).join(', ');
  
  const isActive = list.is_active !== false;

  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
      
      {/* Top Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-primary)' }}>{list.name}</h3>
            <span style={{ background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isActive ? 'var(--accent-primary)' : '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
            <Edit2 size={14} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
            <Trash2 size={14} color="#ef4444" style={{ cursor: 'pointer', transition: '0.2s' }} onClick={() => onTrashList(list.id)} />
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{list.description || list.name}</p>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Created {new Date(list.created_at || new Date()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Stats & Actions Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
        
        {/* Stats */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total:</span> <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{total.toLocaleString()}</span>
          </div>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
            <span style={{ color: '#3b82f6' }}>Remaining: {remaining.toLocaleString()}</span>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--accent-primary)' }}>Call Done: {callDone.toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); onToggleActive(list.id, !isActive); }}>
            <span style={{ fontSize: '0.85rem', color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: '600' }}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
            <div style={{ width: '36px', height: '20px', background: isActive ? 'var(--accent-primary)' : 'var(--border-color)', borderRadius: '10px', position: 'relative', transition: '0.3s' }}>
              <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: isActive ? '18px' : '2px', transition: '0.3s' }} />
            </div>
          </label>

          <button onClick={() => onViewLeads(list.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Eye size={14} /> View Leads
          </button>
          
          <button onClick={() => onUploadCsv(list.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Upload size={14} /> Upload CSV
          </button>
          
          <button onClick={() => onDeleteLeads(list.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}>
            <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>−</span> Delete Leads
          </button>

        </div>
      </div>

      {/* Bottom Tag / Assignment */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.5rem' }}>
        {assignedUserIds.length > 0 ? (
          <>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Assigned to: <strong style={{ color: 'var(--text-primary)' }}>{assignedUserNames}</strong>
            </div>
            <button 
              onClick={() => onAssignList(list)}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
              title="Change Assignment"
            >
              <Edit2 size={14} />
            </button>
          </>
        ) : (
          <button 
            onClick={() => onAssignList(list)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} 
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
          >
            <UserPlus size={14} /> Assign List
          </button>
        )}
      </div>
    </div>
  );
};

const DigitalMarketingLeads = () => {
  const { leads, leadLists, removeLeadList, clearLeadList, updateLeadList, setSelectedClient, addLead, updateLeadDetails, currentUser, users, assignLeadListToSales } = useApp();
  const [searchQ, setSearchQ] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterState, setFilterState] = useState('');
  
  const [showLeadListModal, setShowLeadListModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [listToClear, setListToClear] = useState(null);
  const [listToTrash, setListToTrash] = useState(null);
  const [assignModalList, setAssignModalList] = useState(null);
  const [selectedSalesUserId, setSelectedSalesUserId] = useState('');

  const fileInputRef = useRef(null);
  const [uploadListId, setUploadListId] = useState(null);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const salesUsers = users?.filter(u => u.role === 'sales') || [];

  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', source: '', ownerName: '', type_of_service: '', city: '', state: '' 
  });

  const navigate = useNavigate();

  const handleViewLeads = (listId) => {
    if (currentUser?.role === 'superadmin') {
      navigate(`/superadmin/leads/${listId}`);
    } else {
      navigate(`/digital-marketing/leads/${listId}`);
    }
  };

  const handleUploadCsv = (listId) => {
    setUploadListId(listId);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length < 2) return resolve([]);
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          let row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push(row);
        }
        resolve(data);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv') && uploadListId) {
      setIsUploading(true);
      try {
        const parsedData = await parseCSV(file);
        const existingLead = leads.find(l => l.list_id === uploadListId && l.managedBy);
        const ownerId = existingLead ? existingLead.managedBy : null;

        for (const row of parsedData) {
          const rowKeys = Object.keys(row);
          const nameKey = rowKeys.find(k => k.toLowerCase().includes('name')) || rowKeys[0];
          const emailKey = rowKeys.find(k => k.toLowerCase().includes('email'));
          const phoneKey = rowKeys.find(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('mobile') || k.toLowerCase().includes('contact'));
          const serviceKey = rowKeys.find(k => k.toLowerCase().includes('service'));
          const cityKey = rowKeys.find(k => k.toLowerCase().includes('city'));
          const stateKey = rowKeys.find(k => k.toLowerCase().includes('state'));

          const leadData = {
            list_id: uploadListId,
            name: row[nameKey] || '',
            email: emailKey ? row[emailKey] : '',
            phone: phoneKey ? row[phoneKey] : '',
            source: 'CSV Upload',
            type_of_service: serviceKey ? row[serviceKey] : '',
            city: cityKey ? row[cityKey] : '',
            state: stateKey ? row[stateKey] : '',
            status: 'CREATED',
            dynamic_data: row,
            managedBy: ownerId
          };
          if (leadData.name || leadData.phone || leadData.email) {
            await addLead(leadData);
          }
        }
        setUploadMessage({ type: 'success', text: 'CSV uploaded successfully!' });
      } catch (err) {
        console.error(err);
        setUploadMessage({ type: 'error', text: 'Failed to parse and upload CSV.' });
      } finally {
        setIsUploading(false);
      }
    } else if (file) {
      setUploadMessage({ type: 'error', text: 'Please upload a valid CSV file.' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadListId(null);
  };

  const handleDeleteLeads = (listId) => {
    setListToClear(listId);
  };

  const handleTrashList = (listId) => {
    setListToTrash(listId);
  };

  const handleToggleActive = (listId, isActive) => {
    updateLeadList(listId, { is_active: isActive });
  };

  const openAddModal = () => {
    setFormData({ name: '', email: '', phone: '', source: '', ownerName: '', type_of_service: '', city: '', state: '' });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    let ownerId = currentUser?.id;
    if (formData.ownerName) {
      const ownerStr = formData.ownerName.toLowerCase().trim();
      const matchedUser = users?.find(u => 
        u.name.toLowerCase().includes(ownerStr) || 
        (u.email && u.email.toLowerCase() === ownerStr)
      );
      if (matchedUser) ownerId = matchedUser.id;
    }

    addLead({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      type_of_service: formData.type_of_service,
      city: formData.city,
      state: formData.state,
      source: formData.source || 'Manual Entry',
      createdBy: currentUser?.id,
      managedBy: ownerId
    });
    setShowAddModal(false);
  };

  const openEditModal = (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      type_of_service: lead.type_of_service || '',
      city: lead.city || '',
      state: lead.state || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingLead) return;

    updateLeadDetails(editingLead.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      type_of_service: formData.type_of_service,
      city: formData.city,
      state: formData.state
    });
    setShowEditModal(false);
    setEditingLead(null);
  };

  const uniqueServices = [...new Set(leads.map(l => l.type_of_service).filter(Boolean))];
  const uniqueCities = [...new Set(leads.map(l => l.city).filter(Boolean))];
  const uniqueStates = [...new Set(leads.map(l => l.state).filter(Boolean))];

  const displayLeads = leads.filter(c => {
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      if (!((c.name || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q) ||
          (c.city || '').toLowerCase().includes(q) ||
          (c.state || '').toLowerCase().includes(q) ||
          (c.type_of_service || '').toLowerCase().includes(q))) {
        return false;
      }
    }
    
    if (filterDate) {
      const cDate = c.created_at || c.createdAt;
      if (!cDate) return false;
      const cDateStr = new Date(cDate).toISOString().split('T')[0];
      if (cDateStr !== filterDate) return false;
    }
    
    if (filterService && c.type_of_service !== filterService) return false;
    if (filterCity && c.city !== filterCity) return false;
    if (filterState && c.state !== filterState) return false;
    
    return true;
  });

  const displayLists = leadLists.filter(l => 
    (l.name || '').toLowerCase().includes(searchQ.toLowerCase()) || 
    (l.description || '').toLowerCase().includes(searchQ.toLowerCase())
  ).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  return (
    <>
      {isUploading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--glass-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(8px)' }}>
          <div style={{ width: '60px', height: '60px', border: '5px solid var(--bg-tertiary)', borderTop: '5px solid var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1.5rem', boxShadow: '0 0 20px var(--accent-light)' }} />
          <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Uploading Leads...</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>Please do not close this window while we process the CSV.</p>
        </div>
      )}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" style={{ display: 'none' }} />
      <CreateLeadListModal isOpen={showLeadListModal} onClose={() => setShowLeadListModal(false)} />
      <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setShowLeadListModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'filter 0.2s', border: 'none' }} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>
            <ListPlus size={16} /> Create Lead List
          </button>
        </div>
        <SearchBar 
          value={searchQ} 
          onChange={e => setSearchQ(e.target.value)} 
          placeholder="Search leads..." 
          style={{ width: '300px', flex: 'none' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {displayLists.map(list => (
          <LeadListCard 
            key={list.id} 
            list={list} 
            leads={leads} 
            users={users}
            onUploadCsv={handleUploadCsv} 
            onViewLeads={handleViewLeads} 
            onDeleteLeads={handleDeleteLeads} 
            onTrashList={handleTrashList} 
            onToggleActive={handleToggleActive}
            onAssignList={setAssignModalList}
          />
        ))}
        {leadLists.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No lead lists found. Create your first lead list!</p>
          </div>
        )}
      </div>

      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>Add New Lead</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="Leads Name *" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ boxSizing: 'border-box', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }} />
              <input type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ boxSizing: 'border-box', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }} />
              <input type="text" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ boxSizing: 'border-box', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }} />
              <input type="text" placeholder="Type of Service" value={formData.type_of_service} onChange={e => setFormData({...formData, type_of_service: e.target.value})} style={{ boxSizing: 'border-box', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input type="text" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} style={{ boxSizing: 'border-box', minWidth: 0, flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }} />
                <input type="text" placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} style={{ boxSizing: 'border-box', minWidth: 0, flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <button type="submit" style={{ boxSizing: 'border-box', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', background: 'var(--accent-primary)', color: 'white', fontWeight: '700', marginTop: '0.5rem', cursor: 'pointer' }}>Save Lead</button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingLead && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>Edit Lead</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="Leads Name *" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ boxSizing: 'border-box', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }} />
              <input type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ boxSizing: 'border-box', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }} />
              <input type="text" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ boxSizing: 'border-box', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }} />
              <input type="text" placeholder="Type of Service" value={formData.type_of_service} onChange={e => setFormData({...formData, type_of_service: e.target.value})} style={{ boxSizing: 'border-box', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input type="text" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} style={{ boxSizing: 'border-box', minWidth: 0, flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }} />
                <input type="text" placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} style={{ boxSizing: 'border-box', minWidth: 0, flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <button type="submit" style={{ boxSizing: 'border-box', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', background: 'var(--accent-primary)', color: 'white', fontWeight: '700', marginTop: '0.5rem', cursor: 'pointer' }}>Update Lead</button>
            </form>
          </div>
        </div>
      )}

      {listToClear && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setListToClear(null)} />
          <div style={{ position: 'relative', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-xl)', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>Clear List?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>Are you sure you want to delete ALL leads inside this list? The list itself will remain. This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setListToClear(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: 'none', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>Cancel</button>
              <button onClick={() => { clearLeadList(listToClear); setListToClear(null); }} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>Clear Leads</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {uploadMessage && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setUploadMessage(null)} />
          <div style={{ position: 'relative', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-xl)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              {uploadMessage.type === 'success' ? (
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
              )}
            </div>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.25rem' }}>
              {uploadMessage.type === 'success' ? 'Success!' : 'Error'}
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {uploadMessage.text}
            </p>
            <button onClick={() => setUploadMessage(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', width: '100%', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>
              Okay
            </button>
          </div>
        </div>,
        document.body
      )}

      {listToTrash && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setListToTrash(null)} />
          <div style={{ position: 'relative', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-xl)', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>Delete Entire List?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>Are you sure you want to completely delete this list AND all its leads? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setListToTrash(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: 'none', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>Cancel</button>
              <button onClick={() => { removeLeadList(listToTrash); setListToTrash(null); }} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>Delete List</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {assignModalList && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setAssignModalList(null)} />
          <div style={{ position: 'relative', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-xl)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>Assign Campaign</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Assign all leads in <strong>{assignModalList.name}</strong> to a sales representative.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select 
                value={selectedSalesUserId} 
                onChange={e => setSelectedSalesUserId(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="">Select an employee...</option>
                {salesUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  onClick={() => setAssignModalList(null)} 
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    // if selectedSalesUserId is empty, it unassigns
                    assignLeadListToSales(assignModalList.id, selectedSalesUserId || null);
                    setAssignModalList(null);
                    setSelectedSalesUserId('');
                  }} 
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', background: selectedSalesUserId ? 'var(--accent-primary)' : '#ef4444', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                >
                  {selectedSalesUserId ? 'Confirm Assign' : 'Unassign All'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const DigitalMarketingLeadListView = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const { leads, leadLists, addLead, removeLead, users, currentUser } = useApp();
  const list = leadLists.find(l => l.id === listId);
  
  const [filterDate, setFilterDate] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterState, setFilterState] = useState('');
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const getSalesUserName = (userId) => {
    const u = users.find(user => user.id === userId);
    return u ? u.name : '-';
  };
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', type_of_service: '', city: '', state: '' });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;



  const listLeads = leads.filter(l => l.list_id === listId);

  const getLeadDate = (lead) => {
    const csvDateKey = Object.keys(lead.dynamic_data || {}).find(k => k.toLowerCase() === 'date');
    if (csvDateKey && lead.dynamic_data[csvDateKey]) return lead.dynamic_data[csvDateKey];
    return lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-GB').replace(/\//g, '-') : '-';
  };

  const filteredLeads = listLeads.filter(l => {
    const d = getLeadDate(l);
    const formattedFilterDate = filterDate ? filterDate.split('-').reverse().join('-') : '';
    const dateMatch = formattedFilterDate ? d.includes(formattedFilterDate) : true;
    const srvMatch = filterService ? (l.type_of_service || '').toLowerCase().includes(filterService.toLowerCase()) : true;
    const ctyMatch = filterCity ? (l.city || '').toLowerCase().includes(filterCity.toLowerCase()) : true;
    const stMatch = filterState ? (l.state || '').toLowerCase().includes(filterState.toLowerCase()) : true;
    return dateMatch && srvMatch && ctyMatch && stMatch;
  });

  const dynamicKeys = new Set();
  listLeads.forEach(lead => {
    if (lead.dynamic_data) Object.keys(lead.dynamic_data).forEach(k => dynamicKeys.add(k));
  });
  const ignoredDynamicKeys = new Set(['date', 'notes', 'score', 'budget', 'company', 'service', 'campaign']);
  const customColumns = Array.from(dynamicKeys).filter(k => !ignoredDynamicKeys.has(k.toLowerCase()));

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterService, filterCity, filterState]);

  if (!list) return <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>List not found.</div>;

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const currentLeads = filteredLeads.slice((validCurrentPage - 1) * itemsPerPage, validCurrentPage * itemsPerPage);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    const existingLead = listLeads.find(l => l.managedBy);
    const ownerId = existingLead ? existingLead.managedBy : null;
    
    addLead({
      name: formData.name, email: formData.email, phone: formData.phone,
      type_of_service: formData.type_of_service, city: formData.city, state: formData.state,
      source: 'Manual Entry', list_id: listId, managedBy: ownerId
    });
    setShowAddModal(false);
    setFormData({ name: '', email: '', phone: '', type_of_service: '', city: '', state: '' });
  };

  const handleSelectAll = (e) => {
    setSelectedLeads(e.target.checked ? filteredLeads.map(l => l.id) : []);
  };

  const toggleSelect = (id) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(lId => lId !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedLeads) {
      await removeLead(id);
    }
    setSelectedLeads([]);
    setShowBulkDeleteModal(false);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(currentUser?.role === 'superadmin' ? '/superadmin/leads' : '/digital-marketing/leads')} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
            &larr; Back to Lists
          </button>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>{list.name} Leads</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {selectedLeads.length > 0 && (
            <button onClick={() => setShowBulkDeleteModal(true)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
              Delete {selectedLeads.length} Selected
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
            + Add single Lead
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
        <input type="text" placeholder="Filter by Service" value={filterService} onChange={e => setFilterService(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
        <input type="text" placeholder="Filter by City" value={filterCity} onChange={e => setFilterCity(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
        <input type="text" placeholder="Filter by State" value={filterState} onChange={e => setFilterState(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
        {(filterDate || filterService || filterCity || filterState) && (
          <button onClick={() => { setFilterDate(''); setFilterService(''); setFilterCity(''); setFilterState(''); }} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}>
            Clear Filters
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
              <th style={{ padding: '1rem', width: '40px' }}>
                <input type="checkbox" checked={selectedLeads.length > 0 && selectedLeads.length === filteredLeads.length} onChange={handleSelectAll} style={{ cursor: 'pointer' }} />
              </th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Name</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Company</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Phone</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Email</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>City</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>State</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Service</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Sales Rep</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Sales Notes</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Date</th>
              {customColumns.map(col => <th key={col} style={{ padding: '1rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{col}</th>)}
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentLeads.map(lead => (
              <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>
                  <input type="checkbox" checked={selectedLeads.includes(lead.id)} onChange={() => toggleSelect(lead.id)} style={{ cursor: 'pointer' }} />
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>{lead.name}</td>
                <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.company || lead.dynamic_data?.company || '-'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.phone || '-'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.email || '-'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.city || '-'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.state || '-'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.type_of_service || '-'}</td>
                <td style={{ padding: '1rem' }}>
                  {(() => {
                    const s = lead.status || 'CREATED';
                    const st = getStatusStyle(s);
                    return (
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                        {s}
                      </span>
                    );
                  })()}
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem' }}>{lead.managedBy ? getSalesUserName(lead.managedBy) : 'Unassigned'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={lead.notes || lead.dynamic_data?.notes || ''}>{lead.notes || lead.dynamic_data?.notes || '-'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{getLeadDate(lead)}</td>
                {customColumns.map(col => <td key={col} style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.dynamic_data?.[col] || '-'}</td>)}
                <td style={{ padding: '1rem' }}>
                  <button onClick={() => setLeadToDelete(lead.id)} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '1rem', transition: '0.2s', padding: '0.5rem' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Delete Lead">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <button 
            disabled={validCurrentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer', opacity: validCurrentPage === 1 ? 0.5 : 1 }}
          >
            Previous
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Page <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{validCurrentPage}</span> of {totalPages}
          </span>
          <button 
            disabled={validCurrentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer', opacity: validCurrentPage === totalPages ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      )}

      {showAddModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowAddModal(false)} />
          <div style={{ position: 'relative', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-xl)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Add Single Lead</h3>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
              <input type="text" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
              <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
              <input type="text" placeholder="Type of Service" value={formData.type_of_service} onChange={e => setFormData({...formData, type_of_service: e.target.value})} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
              <input type="text" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
              <input type="text" placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
              <button type="submit" style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Save Lead</button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {leadToDelete && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setLeadToDelete(null)} />
          <div style={{ position: 'relative', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-xl)', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>Delete Lead?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>Are you sure you want to permanently delete this lead? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setLeadToDelete(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: 'none', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>Cancel</button>
              <button onClick={() => { removeLead(leadToDelete); setLeadToDelete(null); }} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showBulkDeleteModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowBulkDeleteModal(false)} />
          <div style={{ position: 'relative', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-xl)', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>Delete {selectedLeads.length} Leads?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>Are you sure you want to permanently delete {selectedLeads.length} selected leads? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setShowBulkDeleteModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: 'none', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>Cancel</button>
              <button onClick={handleBulkDelete} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>Delete All</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const DigitalMarketingDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<DigitalMarketingOverview />} />
      <Route path="/leads" element={<DigitalMarketingLeads />} />
      <Route path="/leads/:listId" element={<DigitalMarketingLeadListView />} />
    </Routes>
  );
};

export { DigitalMarketingLeads, DigitalMarketingLeadListView };
export default DigitalMarketingDashboard;
