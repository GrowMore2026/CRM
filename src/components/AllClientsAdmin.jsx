import { useState, useMemo } from 'react';
import { useApp } from '../context/AppProvider';
import { 
  getClientCreationDate, 
  getClientTotalDealGst, 
  getClientTotalDealWithGst,
  getClientPanNumber,
  getClientGstNumber,
  getClientCompanyName,
  getClientBudgetAmount,
  getClientServicesList,
  parseClientFeedback,
  getClientFeedbackText,
  getClientPaymentsList
} from '../utils/clientRow';
import SearchBar from './SearchBar';

const ALL_SERVICES = ['Private Limited Company', 'Start-up + DSE', 'Seed Funds', 'One Person Company', 'LLP Registration', 'Section 8 / NGO', 'Partnership Firm', 'ISO Certification', 'FSSAI License', 'IEC / Import-Export', 'GeM Registration', 'Udyam Registration', 'Startup India', 'PMEGP Grant', 'CGTMSE Guarantee', 'Mudra Loan', 'Stand-Up India', 'Startup India Seed Fund', 'Working Capital Loans', 'Term Loans', 'Venture Capital', 'Invoice Financing', 'NBFC Tie-ups', 'Website Development', 'SEO & Digital Marketing', 'CRM Solutions', 'Social Media', 'Logo & Branding', 'ROC Compliance', 'GST Filing', 'Income Tax Returns', 'Annual Filings', 'Audit Support', 'Trademark Registration', 'Patent Filing', 'Copyright Protection', 'Shram Suvidha', 'Legal Compliance', 'Other'];

const PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

const STAGES = [
  '1. Welcome Mail',
  '2. Document Stage / DSC In Process',
  '3. Pitch Deck',
  '4. Application',
  '5. Done Application',
];

const STAGE_COLORS = {
  '1. Welcome Mail': { bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: 'rgba(99,102,241,0.4)' },
  '2. Document Stage / DSC In Process': { bg: 'rgba(14,165,233,0.15)', color: '#7dd3fc', border: 'rgba(14,165,233,0.4)' },
  '3. Pitch Deck': { bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: 'rgba(245,158,11,0.4)' },
  '4. Application': { bg: 'rgba(249,115,22,0.15)', color: '#fdba74', border: 'rgba(249,115,22,0.4)' },
  '5. Done Application': { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.4)' },
};

// ── Mini ServicePicker ────────────────────────────────────────────────────────
const ServicePicker = ({ value = [], onChange }) => {
  const [search, setSearch] = useState('');
  const filtered = ALL_SERVICES.filter(s => s.toLowerCase().includes(search.toLowerCase()));
  const toggle = s => onChange(value.includes(s) ? value.filter(x => x !== s) : [...value, s]);
  return (
    <div>
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.28rem', marginBottom: '0.45rem' }}>
          {value.map(s => (
            <span key={s} onClick={() => toggle(s)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.22rem', fontSize: '0.65rem', fontWeight: '600', padding: '0.15rem 0.48rem', borderRadius: '9999px', background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)', cursor: 'pointer' }}>
              {s} <span style={{ opacity: 0.7 }}>✕</span>
            </span>
          ))}
        </div>
      )}
      <input type="text" placeholder="🔍 Search services…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '0.38rem 0.65rem', marginBottom: '0.35rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.78rem', outline: 'none' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxHeight: '90px', overflowY: 'auto' }}>
        {filtered.map(s => {
          const sel = value.includes(s);
          return (
            <span key={s} onClick={() => toggle(s)}
              style={{ fontSize: '0.67rem', fontWeight: '500', padding: '0.18rem 0.45rem', borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', background: sel ? 'rgba(99,102,241,0.25)' : 'var(--bg-tertiary)', color: sel ? '#a5b4fc' : 'var(--text-secondary)', border: sel ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--border-color)' }}>
              {sel ? '✓ ' : ''}{s}
            </span>
          );
        })}
      </div>
      {value.includes('Other') && (
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Type custom service and press Enter..."
            style={{ flex: 1, padding: '0.38rem 0.65rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.78rem', outline: 'none' }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const custom = e.target.value.trim();
                if (custom && !value.includes(custom)) {
                  onChange([...value, custom]);
                }
                e.target.value = '';
              }
            }}
            onBlur={e => {
              const custom = e.target.value.trim();
              if (custom && !value.includes(custom)) {
                onChange([...value, custom]);
              }
              e.target.value = '';
            }}
          />
        </div>
      )}
    </div>
  );
};

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
const ConfirmModal = ({ clientName, onConfirm, onCancel }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '2rem', maxWidth: '380px', width: '90%', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', textAlign: 'center' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🗑️</div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Delete Client?</h3>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        This will permanently delete <strong style={{ color: 'var(--text-primary)' }}>{clientName}</strong> and all their data from the database. This cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button className="btn btn-secondary" style={{ minWidth: '90px' }} onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" style={{ minWidth: '90px' }} onClick={onConfirm}>Yes, Delete</button>
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const AllClientsAdmin = ({ paymentFilter, processFilter, stageFilter, readOnly, preFilteredClients, titleOverride, combineServices = true }) => {
  const { clients, users, currentUser, updateClientStage, updateClientServiceStage, updateClientDetails, removeClient, assignClientToAdmin , setSelectedClient } = useApp();

  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [assignMap, setAssignMap] = useState({}); // clientId → selected adminId
  const [searchQ, setSearchQ] = useState('');

  const adminUsers = users.filter(u => u.role === 'admin');

  // Use preFilteredClients if provided (e.g. admin's assigned clients), else filter from all clients
  let baseClients = preFilteredClients ?? clients;
  if (!readOnly && currentUser?.role === 'admin' && !preFilteredClients) {
    baseClients = baseClients.filter(c => c.managedBy === currentUser.id);
  }
  let filteredClients = baseClients;
  if (paymentFilter === 'Completed')
    filteredClients = filteredClients.filter(c => c.paymentStatus === 'Completed');
  else if (paymentFilter === 'Pending')
    filteredClients = filteredClients.filter(c => c.paymentStatus !== 'Completed');

  let title = titleOverride || 'All System Clients';
  if (!titleOverride && paymentFilter === 'Completed') title = 'Paid Clients';
  if (!titleOverride && paymentFilter === 'Pending') title = 'Clients with Remaining Payment';
  if (!titleOverride && processFilter === 'Under Process') title = 'Clients Under Process';
  if (!titleOverride && processFilter === 'Completed') title = 'Process Completed Clients';

  if (processFilter === 'Under Process') {
    filteredClients = filteredClients.filter(c => {
      const services = getClientServicesList(c) || [];
      if (services.length === 0) {
         const s = c.stage || '1. Welcome Mail';
         return s !== '5. Done Application';
      }
      return services.some(s => {
         const specificStage = (c.service_stages && c.service_stages[s]) || c.stage || '1. Welcome Mail';
         return specificStage !== '5. Done Application';
      });
    });
  } else if (processFilter === 'Completed') {
    filteredClients = filteredClients.filter(c => {
      const services = getClientServicesList(c) || [];
      if (services.length === 0) {
         const s = c.stage || '1. Welcome Mail';
         return s === '5. Done Application';
      }
      return services.every(s => {
         const specificStage = (c.service_stages && c.service_stages[s]) || c.stage || '1. Welcome Mail';
         return specificStage === '5. Done Application';
      });
    });
  }

  // Search filter — runs last, on top of all other filters
  if (searchQ.trim()) {
    const q = searchQ.toLowerCase();
    filteredClients = filteredClients.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (getClientCompanyName(c) || '').toLowerCase().includes(q)
    );
  }

  const displayItems = useMemo(() => {
    return filteredClients.flatMap(c => {
      if (combineServices) {
        return [{ c, activeService: null }];
      }
      const services = getClientServicesList(c);
      const validServices = services || [];
      if (validServices.length === 0) return [{ c, activeService: null }];
      return validServices.map(s => ({ c, activeService: s }));
    }).filter(({ c, activeService }) => {
      const specificStage = (c.service_stages && activeService && c.service_stages[activeService]) || c.stage || '1. Welcome Mail';
      if (stageFilter && specificStage !== stageFilter) return false;
      if (processFilter === 'Under Process' && specificStage === '5. Done Application') return false;
      if (processFilter === 'Completed' && specificStage !== '5. Done Application') return false;
      return true;
    });
  }, [filteredClients, combineServices, stageFilter, processFilter]);

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isSuperAdmin || currentUser?.role === 'accountant';
  const canDelete = isSuperAdmin;             // only superadmin can delete

  const startEdit = (c, cardKey) => {
    const parsed = parseClientFeedback(getClientFeedbackText(c));
    let payments = getClientPaymentsList(c);
    if (payments.length === 0 && c.paymentAmount > 0) {
      payments = [{ amount: c.paymentAmount, date: c.paymentDate ? c.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0] }];
    }
    setEditForm({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      company: getClientCompanyName(c) || '',
      service: getClientServicesList(c) || [],
      totalDeal: c.totalDealAmount ?? getClientBudgetAmount(c) ?? '',
      collectedPayment: c.paymentAmount ?? 0,
      interested: c.interested,
      note: parsed.note || '',
      panNumber: parsed.panNumber || '',
      gstNumber: parsed.gstNumber || '',
      payments: payments,
      totalDealGstAmount: parsed.totalDealGst || '',
      totalDealWithGst: parsed.totalDealWithGst || '',
      gstRate: parsed.totalDealGst && parsed.budget ? Math.round((parsed.totalDealGst / parsed.budget) * 100) : 18,
    });
    setEditingClient(cardKey);
  };

  const saveEdit = clientId => {
    if (editForm.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(editForm.panNumber)) {
      alert('Invalid PAN Number format. It should be 10 characters (e.g. ABCDE1234F).');
      return;
    }
    if (editForm.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(editForm.gstNumber)) {
      alert('Invalid GST Number format. It should be 15 characters (e.g. 22AAAAA0000A1Z5).');
      return;
    }
    const parts = [];
    if (editForm.company) parts.push(`[Company] ${editForm.company.trim()}`);
    const budget = Number(editForm.totalDeal) || 0;
    if (budget) parts.push(`[Budget ₹${budget}]`);
    const totalDealGst = Number(editForm.totalDealGstAmount) || 0;
    const totalDealWithGst = Number(editForm.totalDealWithGst) || 0;
    if (totalDealGst > 0) parts.push(`[Total Deal GST ₹${totalDealGst}]`);
    if (totalDealWithGst > 0) parts.push(`[Total Deal With GST ₹${totalDealWithGst}]`);
    if (editForm.panNumber) parts.push(`[PAN] ${editForm.panNumber.trim()}`);
    if (editForm.gstNumber) parts.push(`[GST] ${editForm.gstNumber.trim()}`);
    (editForm.payments || []).forEach(p => {
      if (p.amount && p.date) parts.push(`[Payment ₹${p.amount} on ${p.date}]${p.verified ? ' [Verified]' : ''}`);
    });
    const svc = (editForm.service || []).filter(Boolean);
    if (svc.length) parts.push(`[Services] ${svc.join('; ')}`);
    if (editForm.note) parts.push(editForm.note);

    const totalDeal = Number(editForm.totalDeal) || 0;
    const collected = (editForm.payments || []).filter(p => p.verified).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    updateClientDetails(clientId, {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      interested: editForm.interested,
      feedback: parts.join('\n\n'),
      service: svc,
      totalDealAmount: totalDeal,
      paymentAmount: collected,
      paymentStatus: collected >= totalDeal && totalDeal > 0 ? 'Completed' : 'Pending',
    });
    setEditingClient(null);
  };

  const handleDelete = id => {
    removeClient(id);
    setConfirmDeleteId(null);
  };

  const confirmClient = clients.find(c => c.id === confirmDeleteId);

  return (
    <div className="animate-fade-in">
      {/* Confirm Modal */}
      {confirmDeleteId && confirmClient && (
        <ConfirmModal
          clientName={confirmClient.name}
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {/* Search input */}
        <SearchBar 
          value={searchQ} 
          onChange={e => setSearchQ(e.target.value)} 
          placeholder="Search by name, email, phone, company…" 
          style={{ width: '300px', flex: 'none' }}
        />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '9999px', padding: '0.3rem 0.85rem', flex: 'none' }}>
          {displayItems.length} client{displayItems.length !== 1 ? 's' : ''}
        </span>
      </div>

      {displayItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '2px dashed var(--border-color)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👥</div>
          <p style={{ fontWeight: '600', fontSize: '1rem' }}>No clients found</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>No clients match this criteria.</p>
        </div>
      ) : (

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {displayItems.map(({ c, activeService }) => {
            const company = getClientCompanyName(c);
            const services = getClientServicesList(c) || [];
            const creatorName = (id) => users.find(u => u.id === id)?.name || 'Sales';
            const closerName = c.closer ? (users.find(u => u.id === c.closer)?.name || 'Sales') : null;
            const total = Number(c.totalDealAmount ?? getClientBudgetAmount(c)) || 0;
            const collected = Number(c.paymentAmount) || 0;
            const pct = total > 0 ? Math.min(100, Math.round((collected / total) * 100)) : 0;
            const cInitials = (c.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

            return (
              <div 
                key={`${c.id}-${activeService || 'none'}`}
                className="card" 
                onClick={() => setSelectedClient(c)}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', position: 'relative' }}
              >
                {canDelete && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(c.id); }}
                    style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--danger-color)', zIndex: 10 }}
                    title="Delete Client"
                  >
                    🗑️
                  </button>
                )}
                
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem', flexShrink: 0 }}>
                    {cInitials}
                  </div>
                  <div style={{ paddingRight: canDelete ? '24px' : '0' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{c.name}</div>
                    {c.email && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.email}</div>}
                  </div>
                </div>

                {company && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>🏢 {company}</div>}
                {c.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>📞 {c.phone}</div>}

                {activeService ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Service:</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{activeService}</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {((c.service_stages && c.service_stages[activeService]) || c.stage || '1. Welcome Mail').replace(/^\d+\.\s*/, '')}
                      </span>
                    </div>
                  </div>
                ) : services.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Services:</div>
                    {services.map(s => {
                      const sStageKey = (c.service_stages && c.service_stages[s]) || c.stage || '1. Welcome Mail';
                      const stgInfo = STAGES.find(ps => ps === sStageKey) || sStageKey;
                      const label = typeof stgInfo === 'string' ? stgInfo : stgInfo;
                      return (
                        <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          <span style={{ color: 'var(--text-primary)' }}>{s}</span>
                          <span style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{label.replace(/^\d+\.\s*/, '')}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Stage: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{(c.stage || 'Not Started').replace(/^\d+\.\s*/, '')}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {c.createdBy && <span>Lead: {creatorName(c.createdBy)}</span>}
                  {closerName && <span>Closer: {closerName}</span>}
                </div>

                {(total > 0 || collected > 0) && (
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Collected: ₹{collected.toLocaleString('en-IN')}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>Total: ₹{total.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-primary)', borderRadius: '999px' }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllClientsAdmin;
