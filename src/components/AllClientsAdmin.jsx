import { useState } from 'react';
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
        <h1 className="text-h1" style={{ margin: 0, flex: 'none' }}>{title}</h1>
        {/* Search input */}
        <SearchBar 
          value={searchQ} 
          onChange={e => setSearchQ(e.target.value)} 
          placeholder="Search by name, email, phone, company…" 
          style={{ width: '300px', flex: 'none' }}
        />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '9999px', padding: '0.3rem 0.85rem', flex: 'none' }}>
          {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filteredClients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '2px dashed var(--border-color)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👥</div>
          <p style={{ fontWeight: '600', fontSize: '1rem' }}>No clients found</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>No clients match this criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: '1.2rem' }}>
          {filteredClients.flatMap(c => {
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
          }).map(({ c, activeService }) => {
            const specificStage = (c.service_stages && activeService && c.service_stages[activeService]) || c.stage || '1. Welcome Mail';
            const cardKey = `${c.id}-${activeService || 'none'}`;
            const isEdit = editingClient === cardKey;
            const manager = users.find(u => u.id === c.managedBy);
            const creator = users.find(u => u.id === c.createdBy);
            const closerUser = users.find(u => u.id === c.closer);
            const total = Number(c.totalDealAmount ?? getClientBudgetAmount(c)) || 0;
            const totalDealGst = getClientTotalDealGst(c);
            const totalWithGstVal = getClientTotalDealWithGst(c) || (total + totalDealGst);
            const collected = Number(c.paymentAmount) || 0;
            const remaining = totalWithGstVal - collected;
            const pct = totalWithGstVal > 0 ? Math.min(100, Math.round((collected / totalWithGstVal) * 100)) : 0;
            const fullPaid = remaining <= 0 && totalWithGstVal > 0;
            const services = getClientServicesList(c);
            const company = getClientCompanyName(c);
            const panNumber = getClientPanNumber(c);
            const gstNumber = getClientGstNumber(c);
            const stageStyle = STAGE_COLORS[specificStage] || STAGE_COLORS['1. Welcome Mail'];
            const ac = PALETTE[(c.name || '?').charCodeAt(0) % PALETTE.length];
            const initials = (c.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

            return (
              <div key={cardKey}
                style={{ background: 'var(--bg-secondary)', border: fullPaid ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: fullPaid ? '0 0 20px rgba(16,185,129,0.12)' : 'var(--shadow-md)' }}
                onMouseEnter={e => { if (!isEdit) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.3)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = fullPaid ? '0 0 20px rgba(16,185,129,0.12)' : 'var(--shadow-md)'; }}
              >
                {/* ── Header ── */}
                <div style={{ padding: '1rem 1.1rem 0.85rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.95rem', color: 'white', flexShrink: 0 }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEdit
                      ? <input className="form-control" style={{ marginBottom: '0.28rem', fontWeight: '600', padding: '0.28rem 0.5rem' }} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
                      : <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>}
                    {isEdit
                      ? <input className="form-control" style={{ fontSize: '0.78rem', padding: '0.26rem 0.5rem' }} value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })} placeholder="Company" />
                      : company && (
                        <div style={{ marginTop: '0.15rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: '0.35rem', fontSize: '0.7rem', fontWeight: '600', color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '0.25rem 0.55rem', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)', lineHeight: '1.3', wordBreak: 'break-word', maxWidth: '100%' }} title={company}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '0.15rem', opacity: 0.8 }}><path d="M3 21h18" /><path d="M9 8h1" /><path d="M9 12h1" /><path d="M9 16h1" /><path d="M14 8h1" /><path d="M14 12h1" /><path d="M14 16h1" /><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" /></svg>
                            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{company}</span>
                          </span>
                        </div>
                      )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0 }}>
                    {fullPaid && !isEdit && <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '0.16rem 0.44rem', borderRadius: '9999px', border: '1px solid rgba(16,185,129,0.28)' }}>✓ PAID</span>}
                    {isEdit
                      ? <select className="form-control" style={{ fontSize: '0.72rem', padding: '0.2rem 0.4rem' }} value={editForm.interested ? 'yes' : 'no'} onChange={e => setEditForm({ ...editForm, interested: e.target.value === 'yes' })}>
                        <option value="yes">Interested</option>
                        <option value="no">Not Interested</option>
                      </select>
                      : <span style={{ fontSize: '0.6rem', fontWeight: '700', color: c.interested ? '#34d399' : '#f87171', background: c.interested ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', padding: '0.16rem 0.44rem', borderRadius: '9999px', border: c.interested ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(248,113,113,0.3)' }}>
                        {c.interested ? '● Interested' : '● Not Interested'}
                      </span>}
                  </div>
                </div>

                {/* ── Contact ── */}
                <div style={{ padding: '0.6rem 1.1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {isEdit ? (
                    <>
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <input className="form-control" type="email" style={{ flex: 1, minWidth: '130px', fontSize: '0.78rem', padding: '0.26rem 0.48rem' }} value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" />
                        <input className="form-control" type="tel" maxLength="10" pattern="\d{10}" title="Phone number must be exactly 10 digits" style={{ flex: 1, minWidth: '100px', fontSize: '0.78rem', padding: '0.26rem 0.48rem' }} value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="Phone" />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <input className="form-control" type="text" maxLength="10" pattern="^[A-Z]{5}[0-9]{4}[A-Z]{1}$" title="PAN must be 10 characters: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)" style={{ flex: 1, minWidth: '130px', fontSize: '0.78rem', padding: '0.26rem 0.48rem' }} value={editForm.panNumber} onChange={e => setEditForm({ ...editForm, panNumber: e.target.value.toUpperCase() })} placeholder="PAN" />
                        <input className="form-control" type="text" maxLength="15" pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$" title="GST must be 15 characters (e.g. 22AAAAA0000A1Z5)" style={{ flex: 1, minWidth: '130px', fontSize: '0.78rem', padding: '0.26rem 0.48rem' }} value={editForm.gstNumber} onChange={e => setEditForm({ ...editForm, gstNumber: e.target.value.toUpperCase() })} placeholder="GST" />
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        {c.email}
                      </span>
                      {c.phone && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        {c.phone}
                      </span>}
                      {panNumber && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="14" x="3" y="5" rx="2"/><path d="M7 15h4"/><path d="M7 11h.01"/><path d="M14 11h3"/><path d="M14 15h3"/></svg>
                        PAN: {panNumber}
                      </span>}
                      {gstNumber && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                        GST: {gstNumber}
                      </span>}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.2rem' }}>
                    {manager && <span title="Assigned Admin" style={{ fontSize: '0.65rem', color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '0.12rem 0.5rem', borderRadius: '9999px', border: '1px solid rgba(59,130,246,0.2)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Admin: {manager.name}</span>}
                    {creator && <span title="Lead Generated By" style={{ fontSize: '0.65rem', color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '0.12rem 0.5rem', borderRadius: '9999px', border: '1px solid rgba(139,92,246,0.2)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Lead by: {creator.name}</span>}
                    {closerUser && <span title="Closed By" style={{ fontSize: '0.65rem', color: '#eab308', background: 'rgba(234,179,8,0.1)', padding: '0.12rem 0.5rem', borderRadius: '9999px', border: '1px solid rgba(234,179,8,0.2)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3-6 6"/><path d="m21 3-1 2"/><path d="m21 3-2-1"/><path d="m14 14 2 2"/><path d="m21 14-3 3"/><path d="m17 10-3 3"/><path d="m10 17-3 3"/></svg> Closed by: {closerUser.name}</span>}
                  </div>
                </div>

                {/* ── Services & Stages ── */}
                <div style={{ padding: '0.65rem 1.1rem', borderBottom: '1px solid var(--border-color)' }}>
                  {isEdit ? (
                    <ServicePicker value={editForm.service} onChange={v => setEditForm({ ...editForm, service: v })} />
                  ) : activeService ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: '500', padding: '0.15rem 0.42rem', borderRadius: '9999px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', alignSelf: 'flex-start' }}>{activeService}</span>
                      {readOnly ? (
                        <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: stageStyle.bg, color: stageStyle.color, border: `1px solid ${stageStyle.border}`, alignSelf: 'flex-start' }}>{specificStage}</span>
                      ) : (
                        <div style={{ position: 'relative' }}>
                          <select value={specificStage} onChange={e => updateClientServiceStage(c.id, activeService, e.target.value)}
                            style={{ width: '100%', padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: '600', background: stageStyle.bg, color: stageStyle.color, border: `1px solid ${stageStyle.border}`, borderRadius: 'var(--radius-md)', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
                            {STAGES.map(s => <option key={s} value={s} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{s}</option>)}
                          </select>
                          <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: stageStyle.color, pointerEvents: 'none', fontSize: '0.7rem' }}>▾</span>
                        </div>
                      )}
                    </div>
                  ) : services.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {services.map(s => {
                        const sStage = (c.service_stages && c.service_stages[s]) || c.stage || '1. Welcome Mail';
                        const sStyle = STAGE_COLORS[sStage] || STAGE_COLORS['1. Welcome Mail'];
                        const stageNumber = sStage.split('.')[0];
                        return (
                          <div key={s} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{s}</span>
                            {readOnly ? (
                              <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: sStyle.bg, color: sStyle.color, border: `1px solid ${sStyle.border}`, alignSelf: 'flex-start' }}>{sStage}</span>
                            ) : (
                              <div style={{ position: 'relative' }}>
                                <select value={sStage} onChange={e => updateClientServiceStage(c.id, s, e.target.value)}
                                  style={{ width: '100%', padding: '0.25rem 0.5rem', fontSize: '0.7rem', fontWeight: '600', background: sStyle.bg, color: sStyle.color, border: `1px solid ${sStyle.border}`, borderRadius: 'var(--radius-md)', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
                                  {STAGES.map(stageOpt => <option key={stageOpt} value={stageOpt} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{stageOpt}</option>)}
                                </select>
                                <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: sStyle.color, pointerEvents: 'none', fontSize: '0.6rem' }}>▾</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-secondary)' }}>General Stage</span>
                        {readOnly ? (
                          <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: (STAGE_COLORS[c.stage] || STAGE_COLORS['1. Welcome Mail']).bg, color: (STAGE_COLORS[c.stage] || STAGE_COLORS['1. Welcome Mail']).color, border: `1px solid ${(STAGE_COLORS[c.stage] || STAGE_COLORS['1. Welcome Mail']).border}`, alignSelf: 'flex-start' }}>{c.stage || '1. Welcome Mail'}</span>
                        ) : (
                          <div style={{ position: 'relative' }}>
                            <select value={c.stage || '1. Welcome Mail'} onChange={e => updateClientStage(c.id, e.target.value)}
                              style={{ width: '100%', padding: '0.25rem 0.5rem', fontSize: '0.7rem', fontWeight: '600', background: (STAGE_COLORS[c.stage] || STAGE_COLORS['1. Welcome Mail']).bg, color: (STAGE_COLORS[c.stage] || STAGE_COLORS['1. Welcome Mail']).color, border: `1px solid ${(STAGE_COLORS[c.stage] || STAGE_COLORS['1. Welcome Mail']).border}`, borderRadius: 'var(--radius-md)', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
                              {STAGES.map(stageOpt => <option key={stageOpt} value={stageOpt} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{stageOpt}</option>)}
                            </select>
                            <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: (STAGE_COLORS[c.stage] || STAGE_COLORS['1. Welcome Mail']).color, pointerEvents: 'none', fontSize: '0.6rem' }}>▾</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Payment ── */}
                <div style={{ padding: '0.85rem 1.1rem', borderBottom: '1px solid var(--border-color)' }}>
                  {isEdit ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <label style={{ fontSize: '0.62rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.2rem' }}>Total ₹</label>
                          <input className="form-control" type="number" min="0" onKeyDown={e => (e.key === '-' || e.key === 'e') && e.preventDefault()} style={{ fontSize: '0.82rem', padding: '0.3rem 0.52rem' }} value={editForm.totalDeal} onChange={e => {
                            const val = e.target.value;
                            const budget = Number(val) || 0;
                            const rate = Number(editForm.gstRate) || 18;
                            const gst = Math.round(budget * (rate / 100));
                            setEditForm({ ...editForm, totalDeal: val, totalDealGstAmount: gst > 0 ? String(gst) : '', totalDealWithGst: (budget + gst) > 0 ? String(budget + gst) : '' });
                          }} placeholder="0" />
                        </div>
                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <label style={{ fontSize: '0.62rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.2rem' }}>GST Rate (%)</label>
                          <select className="form-control" style={{ fontSize: '0.82rem', padding: '0.3rem 0.52rem' }} value={editForm.gstRate} onChange={e => {
                            const rate = Number(e.target.value);
                            const budget = Number(editForm.totalDeal) || 0;
                            const gst = Math.round(budget * (rate / 100));
                            setEditForm({ ...editForm, gstRate: rate, totalDealGstAmount: gst > 0 ? String(gst) : '', totalDealWithGst: (budget + gst) > 0 ? String(budget + gst) : '' });
                          }}>
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </div>
                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <label style={{ fontSize: '0.62rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.2rem' }}>With GST ₹</label>
                          <input className="form-control" type="number" min="0" onKeyDown={e => (e.key === '-' || e.key === 'e') && e.preventDefault()} style={{ fontSize: '0.82rem', padding: '0.3rem 0.52rem' }} value={editForm.totalDealWithGst} onChange={e => setEditForm({ ...editForm, totalDealWithGst: e.target.value })} placeholder="0" />
                        </div>
                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <label style={{ fontSize: '0.62rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.2rem' }}>GST Amount ₹</label>
                          <input className="form-control" type="number" min="0" onKeyDown={e => (e.key === '-' || e.key === 'e') && e.preventDefault()} style={{ fontSize: '0.82rem', padding: '0.3rem 0.52rem' }} value={editForm.totalDealGstAmount} onChange={e => setEditForm({ ...editForm, totalDealGstAmount: e.target.value })} placeholder="0" />
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.62rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          Payments
                          <button type="button" onClick={() => setEditForm(prev => ({ ...prev, payments: [...(prev.payments || []), { amount: '', date: '' }] }))} disabled={fullPaid} style={{ padding: '0.1rem 0.35rem', fontSize: '0.65rem', background: 'var(--accent-primary)', color: 'white', borderRadius: '4px', border: 'none', cursor: fullPaid ? 'not-allowed' : 'pointer', opacity: fullPaid ? 0.5 : 1 }}>+ Add</button>
                        </label>
                        {(editForm.payments || []).map((p, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <input className="form-control" type="number" min="0" placeholder="Amount ₹" disabled={fullPaid} style={{ flex: 1, fontSize: '0.78rem', padding: '0.26rem 0.48rem', opacity: fullPaid ? 0.6 : 1 }} value={p.amount} onChange={e => { const newP = [...editForm.payments]; newP[i].amount = e.target.value; setEditForm({ ...editForm, payments: newP }); }} />
                            <input className="form-control" type="date" disabled={fullPaid} style={{ flex: 1, fontSize: '0.78rem', padding: '0.26rem 0.48rem', opacity: fullPaid ? 0.6 : 1 }} value={p.date} onChange={e => { const newP = [...editForm.payments]; newP[i].date = e.target.value; setEditForm({ ...editForm, payments: newP }); }} />
                            {!fullPaid && <button type="button" onClick={() => { const newP = editForm.payments.filter((_, idx) => idx !== i); setEditForm({ ...editForm, payments: newP }); }} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '0 0.2rem' }}>×</button>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.26rem' }}>
                        <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Payment Progress</span>
                        <span style={{ fontSize: '0.67rem', fontWeight: '700', color: fullPaid ? '#10b981' : pct > 50 ? '#f59e0b' : 'var(--text-secondary)' }}>{pct}%</span>
                      </div>
                      <div style={{ height: '5px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.7rem' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: fullPaid ? 'linear-gradient(90deg,#10b981,#34d399)' : pct > 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: '999px', transition: 'width 0.5s ease' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
                        {[['Total (GST)', '#60a5fa', `₹${totalWithGstVal.toLocaleString('en-IN')}`], ['Collected', '#34d399', `₹${collected.toLocaleString('en-IN')}`], ['Remaining', fullPaid ? '#10b981' : '#f87171', fullPaid ? '₹0' : `₹${remaining.toLocaleString('en-IN')}`]].map(([lbl, clr, val]) => (
                          <div key={lbl} style={{ flex: 1, textAlign: 'center', padding: '0.32rem 0.18rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.1rem' }}>{lbl}</div>
                            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: clr }}>{val}</div>
                          </div>
                        ))}
                      </div>
                      {getClientPaymentsList(c).length > 0 && (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          <div style={{ fontWeight: '600', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Installments:</div>
                          {getClientPaymentsList(c).map((p, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0' }}>
                              <span>Payment {i + 1}</span>
                              <span style={{ color: 'var(--text-secondary)' }}>₹{Number(p.amount).toLocaleString('en-IN')} on {p.date}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* ── Assign to Admin (superadmin only) ── */}
                {isSuperAdmin && !isEdit && (
                  <div style={{ padding: '0.65rem 1.1rem', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'rgba(99,102,241,0.04)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                      📋 Assign to Admin
                    </div>
                    {/* Current assignment badge */}
                    {manager && manager.role === 'admin' && (
                      <div style={{ marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.18rem 0.55rem', borderRadius: '9999px', background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)' }}>
                          🛡️ Assigned: {manager.name}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <select
                          value={assignMap[c.id] || ''}
                          onChange={e => setAssignMap(prev => ({ ...prev, [c.id]: e.target.value }))}
                          style={{ width: '100%', padding: '0.32rem 0.6rem', fontSize: '0.75rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none', cursor: 'pointer', appearance: 'none' }}
                        >
                          <option value="">— Select Admin —</option>
                          {adminUsers.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                        <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)', fontSize: '0.7rem' }}>▾</span>
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: '0.74rem', padding: '0.32rem 0.75rem', whiteSpace: 'nowrap' }}
                        disabled={!assignMap[c.id]}
                        onClick={() => {
                          if (assignMap[c.id]) {
                            assignClientToAdmin(c.id, assignMap[c.id]);
                            setAssignMap(prev => ({ ...prev, [c.id]: '' }));
                          }
                        }}
                      >
                        Assign ↗
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Actions ── */}
                {(canEdit || canDelete) && (
                  <div style={{ padding: '0.6rem 1.1rem', display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.015)' }}>
                    {isEdit ? (
                      <>
                        <button className="btn btn-success" style={{ fontSize: '0.78rem', padding: '0.34rem 0.85rem' }} onClick={() => saveEdit(c.id)}>✓ Save</button>
                        <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.34rem 0.85rem' }} onClick={() => setEditingClient(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        {canEdit && <button className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '0.34rem 0.85rem' }} onClick={() => startEdit(c, cardKey)}>✎ Edit</button>}
                        {canDelete && <button className="btn btn-danger" style={{ fontSize: '0.78rem', padding: '0.34rem 0.85rem' }} onClick={() => setConfirmDeleteId(c.id)}>✕ Delete</button>}
                      </>
                    )}
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
