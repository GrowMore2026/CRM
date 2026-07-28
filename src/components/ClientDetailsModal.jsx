import React, { useState } from 'react';
import { X, Mail, Phone, CreditCard, FileText, Building2, CheckCircle, MapPin, Calendar, Edit, Save } from 'lucide-react';
import { useApp } from '../context/AppProvider';
import { 
  getClientCreationDate, 
  getClientTotalDealGst, 
  getClientTotalDealWithGst,
  getClientPanNumber,
  getClientGstNumber,
  getClientCompanyName,
  getClientBudgetAmount,
  parseClientFeedback,
  getClientFeedbackText,
  getClientPaymentsList
} from '../utils/clientRow';



const ALL_SERVICES = ['Private Limited Company', 'Start-up + DSE', 'Seed Funds', 'One Person Company', 'LLP Registration', 'Section 8 / NGO', 'Partnership Firm', 'ISO Certification', 'FSSAI License', 'IEC / Import-Export', 'GeM Registration', 'Udyam Registration', 'Startup India', 'PMEGP Grant', 'CGTMSE Guarantee', 'Mudra Loan', 'Stand-Up India', 'Startup India Seed Fund', 'Working Capital Loans', 'Term Loans', 'Venture Capital', 'Invoice Financing', 'NBFC Tie-ups', 'Website Development', 'SEO & Digital Marketing', 'CRM Solutions', 'Social Media', 'Logo & Branding', 'ROC Compliance', 'GST Filing', 'Income Tax Returns', 'Annual Filings', 'Audit Support', 'Trademark Registration', 'Patent Filing', 'Copyright Protection', 'Shram Suvidha', 'Legal Compliance', 'Other'];

const STAGES = [
  '1. Welcome Mail',
  '2. Document Stage / DSC In Process',
  '3. Pitch Deck',
  '4. Application',
  '5. Done Application'
];

const ClientDetailsModal = ({ client, onClose }) => {
  const { users, currentUser, updateClientDetails, clients } = useApp();
  const [isEditing, setIsEditing] = useState(false);

  const currentClient = clients.find(c => c.id === client?.id) || client;

  if (!currentClient) return null;

  const initials = (currentClient.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Parse fields robustly
  const services = Array.isArray(currentClient.service) 
    ? currentClient.service 
    : (typeof currentClient.service === 'string' ? currentClient.service.split(',').map(s=>s.trim()).filter(Boolean) : []);
  
  const company = getClientCompanyName(currentClient);
  const panNumber = getClientPanNumber(currentClient);
  const gstNumber = getClientGstNumber(currentClient);
  const note = currentClient.note || currentClient.notes || parseClientFeedback(getClientFeedbackText(currentClient)).note || '';
  const total = Number(currentClient.totalDealAmount ?? getClientBudgetAmount(currentClient)) || 0;
  const totalDealGst = getClientTotalDealGst(currentClient);
  const totalDealWithGst = getClientTotalDealWithGst(currentClient) || (total + totalDealGst);
  const collected = Number(currentClient.paymentAmount) || 0;
  const pct = totalDealWithGst > 0 ? Math.min(100, Math.round((collected / totalDealWithGst) * 100)) : 0;
  
  const creatorName = (id) => users.find(u => u.id === id)?.name || id;

  const rawDate = getClientCreationDate(currentClient) || currentClient.created_at || currentClient.timestamp;
  const formattedDate = rawDate && !isNaN(new Date(rawDate).getTime())
    ? new Date(rawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  // Form State
  const [editForm, setEditForm] = useState({
    name: currentClient.name || '',
    company: company || '',
    email: currentClient.email || '',
    phone: currentClient.phone || '',
    city: currentClient.city || '',
    panNumber: panNumber || '',
    gstNumber: gstNumber || '',
    totalDeal: total || '',
    gstRate: totalDealGst && total ? Math.round((totalDealGst / total) * 100) : 18,
    totalDealGstAmount: totalDealGst || '',
    totalDealWithGst: totalDealWithGst || '',
    note: note || '',
    stage: currentClient.stage || '1. Welcome Mail',
    managedBy: currentClient.managedBy || '',
    createdBy: currentClient.createdBy || '',
    closer: currentClient.closer || ''
  });

  const [selectedServices, setSelectedServices] = useState(services);
  const [paymentsList, setPaymentsList] = useState(getClientPaymentsList(currentClient));
  const [searchServiceText, setSearchServiceText] = useState('');

  const handleBudgetChange = (value) => {
    const budgetVal = Number(value) || 0;
    const rate = Number(editForm.gstRate) || 18;
    const gst = Math.round(budgetVal * (rate / 100));
    setEditForm(prev => ({
      ...prev,
      totalDeal: value,
      totalDealGstAmount: gst > 0 ? String(gst) : '',
      totalDealWithGst: (budgetVal + gst) > 0 ? String(budgetVal + gst) : ''
    }));
  };

  const handleGstRateChange = (rate) => {
    const budgetVal = Number(editForm.totalDeal) || 0;
    const gst = Math.round(budgetVal * (Number(rate) / 100));
    setEditForm(prev => ({
      ...prev,
      gstRate: rate,
      totalDealGstAmount: gst > 0 ? String(gst) : '',
      totalDealWithGst: (budgetVal + gst) > 0 ? String(budgetVal + gst) : ''
    }));
  };

  const saveDetails = () => {
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
    const budgetVal = Number(editForm.totalDeal) || 0;
    if (budgetVal) parts.push(`[Budget ₹${budgetVal}]`);
    const tdGst = Number(editForm.totalDealGstAmount) || 0;
    const tdWithGst = Number(editForm.totalDealWithGst) || 0;
    if (tdGst > 0) parts.push(`[Total Deal GST ₹${tdGst}]`);
    if (tdWithGst > 0) parts.push(`[Total Deal With GST ₹${tdWithGst}]`);
    if (editForm.panNumber) parts.push(`[PAN] ${editForm.panNumber.trim()}`);
    if (editForm.gstNumber) parts.push(`[GST] ${editForm.gstNumber.trim()}`);
    
    // Save payments from paymentsList
    let totalCollected = 0;
    paymentsList.forEach(p => {
      if (p.amount && p.date) {
        parts.push(`[Payment ₹${p.amount} on ${p.date}][Verified]`);
        totalCollected += Number(p.amount) || 0;
      }
    });

    if (selectedServices.length) parts.push(`[Services] ${selectedServices.join('; ')}`);
    if (editForm.note) parts.push(editForm.note);

    updateClientDetails(currentClient.id, {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      city: editForm.city,
      totalDealAmount: budgetVal,
      feedback: parts.join('\n\n'),
      stage: editForm.stage,
      managedBy: editForm.managedBy || null,
      createdBy: editForm.createdBy || null,
      closer: editForm.closer || null,
      service: selectedServices,
      paymentAmount: totalCollected,
      paymentStatus: totalCollected >= tdWithGst && tdWithGst > 0 ? 'Completed' : 'Pending'
    });
    setIsEditing(false);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-primary)', borderRadius: '1rem', width: '100%', maxWidth: '550px', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', flex: 1 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '700', border: '1px solid var(--border-color)', flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1 }}>
              {isEditing ? (
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', width: '100%' }}>
                  <input 
                    className="form-control" 
                    type="text" 
                    value={editForm.name} 
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    style={{ fontSize: '1.1rem', fontWeight: '700', padding: '0.3rem 0.6rem' }}
                  />
                  <select
                    value={editForm.stage}
                    onChange={e => setEditForm({ ...editForm, stage: e.target.value })}
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.85rem', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
                  >
                    {STAGES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{client.name}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center' }}>
                    {company && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500' }}><Building2 size={13} color="var(--text-muted)"/> {company}</span>}
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={13} /> Created: {formattedDate}
                    </span>
                    {(['superadmin', 'admin'].includes(currentUser?.role)) ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.3rem 0.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Stage:</span>
                        <select
                          value={currentClient.stage || '1. Welcome Mail'}
                          onChange={(e) => updateClientDetails(currentClient.id, { stage: e.target.value })}
                          style={{ 
                            background: 'transparent', 
                            color: 'var(--text-primary)', 
                            border: 'none', 
                            fontSize: '0.8rem', 
                            fontWeight: '700', 
                            outline: 'none', 
                            cursor: 'pointer', 
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            paddingRight: '1.25rem',
                            backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'%236366f1\' height=\'18\' viewBox=\'0 0 24 24\' width=\'18\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/></svg>")',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right center',
                            minWidth: '150px'
                          }}
                        >
                          {STAGES.map(s => (
                            <option key={s} value={s} style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)', padding: '0.5rem' }}>{s}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      currentClient.stage && (
                        <span style={{ fontSize: '0.78rem', fontWeight: '600', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                          Stage: {currentClient.stage}
                        </span>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" type="tel" maxLength="10" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '') })} />
                </div>
                <div className="form-group">
                  <label className="form-label">PAN Number</label>
                  <input className="form-control" type="text" maxLength="10" placeholder="e.g. ABCDE1234F" value={editForm.panNumber} onChange={e => setEditForm({ ...editForm, panNumber: e.target.value.toUpperCase() })} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input className="form-control" type="text" maxLength="15" placeholder="e.g. 22AAAAA0000A1Z5" value={editForm.gstNumber} onChange={e => setEditForm({ ...editForm, gstNumber: e.target.value.toUpperCase() })} />
                </div>
              </div>

              {/* Assignment Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.8rem 0 1.2rem 0' }}>
                 <div style={{ position: 'relative' }}>
                   <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: '600' }}>Admin Assignment</label>
                   <select 
                     value={editForm.managedBy} 
                     onChange={e => setEditForm({ ...editForm, managedBy: e.target.value })}
                     style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '9999px', padding: '0.35rem 0.8rem', fontSize: '0.8rem', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
                   >
                     <option value="">🛡️ ASSIGN ADMIN</option>
                     {users.filter(u => u.role === 'admin').map(u => (
                       <option key={u.id} value={u.id}>🛡️ {u.name}</option>
                     ))}
                   </select>
                 </div>

                 <div style={{ position: 'relative' }}>
                   <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: '600' }}>Lead By</label>
                   <select 
                     value={editForm.createdBy} 
                     onChange={e => setEditForm({ ...editForm, createdBy: e.target.value })}
                     style={{ background: 'rgba(165,180,252,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '9999px', padding: '0.35rem 0.8rem', fontSize: '0.8rem', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
                   >
                     <option value="">👤 LEAD BY</option>
                     {users.filter(u => u.role === 'sales').map(u => (
                       <option key={u.id} value={u.id}>👤 {u.name}</option>
                     ))}
                   </select>
                 </div>

                 <div style={{ position: 'relative' }}>
                   <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: '600' }}>Closed By</label>
                   <select 
                     value={editForm.closer} 
                     onChange={e => setEditForm({ ...editForm, closer: e.target.value })}
                     style={{ background: 'rgba(253,230,138,0.1)', color: '#b45309', border: '1px solid rgba(217,119,6,0.25)', borderRadius: '9999px', padding: '0.35rem 0.8rem', fontSize: '0.8rem', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
                   >
                     <option value="">💰 CLOSED BY</option>
                     {users.map(u => (
                       <option key={u.id} value={u.id}>💰 {u.name}</option>
                     ))}
                   </select>
                 </div>
              </div>

              {/* Services Selector */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <h4 style={{ margin: '0 0 0.8rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>Services Selection</h4>
                <div style={{ position: 'relative', marginBottom: '0.8rem' }}>
                  <input 
                    type="text" 
                    placeholder="🔍 Search services…" 
                    value={searchServiceText} 
                    onChange={e => setSearchServiceText(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.8rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '150px', overflowY: 'auto', padding: '0.2rem' }}>
                  {ALL_SERVICES.filter(s => s.toLowerCase().includes(searchServiceText.toLowerCase())).map(s => {
                    const isSel = selectedServices.includes(s);
                    return (
                      <span 
                        key={s} 
                        onClick={() => setSelectedServices(prev => isSel ? prev.filter(x => x !== s) : [...prev, s])}
                        style={{ 
                          fontSize: '0.78rem', 
                          fontWeight: '500', 
                          padding: '0.25rem 0.6rem', 
                          borderRadius: '9999px', 
                          cursor: 'pointer', 
                          background: isSel ? 'var(--accent-primary)' : 'var(--bg-secondary)', 
                          color: isSel ? 'white' : 'var(--text-primary)', 
                          border: `1px solid ${isSel ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                          transition: 'all 0.2s'
                        }}
                      >
                        {s} {isSel ? '✕' : '+'}
                      </span>
                    );
                  })}
                </div>
              </div>



              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>Deal Financials</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Total Deal Amount (₹)</label>
                    <input className="form-control" type="number" min="0" value={editForm.totalDeal} onChange={e => handleBudgetChange(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GST Rate (%)</label>
                    <select className="form-control" value={editForm.gstRate} onChange={e => handleGstRateChange(e.target.value)}>
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Deal With GST (₹)</label>
                    <input className="form-control" type="number" min="0" value={editForm.totalDealWithGst} onChange={e => setEditForm({ ...editForm, totalDealWithGst: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Deal GST Amount (₹)</label>
                    <input className="form-control" type="number" min="0" value={editForm.totalDealGstAmount} onChange={e => setEditForm({ ...editForm, totalDealGstAmount: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Payments List */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>Payments</h4>
                  <button 
                    type="button" 
                    onClick={() => setPaymentsList([...paymentsList, { amount: '', date: new Date().toISOString().split('T')[0], verified: true }])}
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    + Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '150px', overflowY: 'auto', padding: '0.2rem' }}>
                  {paymentsList.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        placeholder="Amount" 
                        value={p.amount} 
                        onChange={e => {
                          const updated = [...paymentsList];
                          updated[idx].amount = e.target.value;
                          setPaymentsList(updated);
                        }}
                        style={{ flex: 1, padding: '0.4rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                      />
                      <input 
                        type="date" 
                        value={p.date ? (p.date.includes('T') ? p.date.split('T')[0] : p.date) : ''} 
                        onChange={e => {
                          const updated = [...paymentsList];
                          updated[idx].date = e.target.value;
                          setPaymentsList(updated);
                        }}
                        style={{ flex: 1, padding: '0.4rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setPaymentsList(paymentsList.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '1rem', cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  {paymentsList.length === 0 && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>No payments added yet.</div>
                  )}
                </div>
              </div>



              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows="3" style={{ resize: 'vertical' }} value={editForm.note} onChange={e => setEditForm({ ...editForm, note: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', fontWeight: '600' }} onClick={saveDetails}>
                  <Save size={16} style={{ marginRight: '0.5rem' }} /> Save Changes
                </button>
                <button className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }} onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Contact Details */}
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact & Legal Info</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Mail size={16} color="var(--text-muted)"/> <span style={{ wordBreak: 'break-all' }}>{currentClient.email || '—'}</span></div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Phone size={16} color="var(--text-muted)"/> {currentClient.phone || '—'}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><MapPin size={16} color="var(--text-muted)"/> {currentClient.city || '—'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><CreditCard size={16} color="var(--text-muted)"/> {panNumber || '—'}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><FileText size={16} color="var(--text-muted)"/> {gstNumber || '—'}</div>
                </div>
              </div>



              {/* Services & Team */}
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Services & Team</h4>
              <div style={{ border: '1px solid var(--border-color)', padding: '1.2rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.2rem' }}>
                  {currentClient.createdBy && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lead by: <strong style={{ color: 'var(--text-primary)' }}>{creatorName(currentClient.createdBy)}</strong></div>}
                  {currentClient.closer && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Closed by: <strong style={{ color: 'var(--text-primary)' }}>{creatorName(currentClient.closer)}</strong></div>}
                  {currentClient.managedBy && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assigned Admin: <strong style={{ color: 'var(--text-primary)' }}>{creatorName(currentClient.managedBy)}</strong></div>}
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                  {services.length > 0 ? services.map(s => (
                    <span key={s} style={{ fontSize: '0.8rem', fontWeight: '500', padding: '0.3rem 0.6rem', background: 'var(--bg-secondary)', borderRadius: '4px', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle size={14} color="var(--text-muted)" /> {s}
                    </span>
                  )) : <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No services listed</span>}
                </div>
              </div>

              {/* Financials Summary */}
              {(totalDealWithGst > 0 || collected > 0) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.8rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financials</h4>
                  <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--text-primary)', borderRadius: '2px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '1rem' }}>
                    <span style={{ color: 'var(--text-primary)' }}>₹{collected.toLocaleString('en-IN')} collected</span>
                    <span>₹{totalDealWithGst.toLocaleString('en-IN')} total deal (GST)</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                     <div style={{ flex: 1, minWidth: '120px' }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem', fontSize: '0.8rem' }}>Payment Status</div>
                        <div style={{ fontWeight: '500' }}>{currentClient.paymentStatus || (collected >= total && total > 0 ? 'Completed' : 'Pending')}</div>
                     </div>
                     {totalDealGst > 0 && (
                       <div style={{ flex: 1, minWidth: '120px' }}>
                          <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem', fontSize: '0.8rem' }}>Total Deal GST</div>
                          <div style={{ fontWeight: '500' }}>₹{totalDealGst.toLocaleString('en-IN')}</div>
                       </div>
                     )}
                     {totalDealWithGst > 0 && (
                       <div style={{ flex: 1, minWidth: '120px' }}>
                          <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem', fontSize: '0.8rem' }}>Total Deal With GST</div>
                          <div style={{ fontWeight: '500' }}>₹{totalDealWithGst.toLocaleString('en-IN')}</div>
                       </div>
                     )}
                     <div style={{ flex: 1, minWidth: '120px' }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem', fontSize: '0.8rem' }}>With GST Payment</div>
                        <div style={{ fontWeight: '500' }}>₹{(Number(currentClient.withGstPayment) || 0).toLocaleString('en-IN')}</div>
                     </div>
                     <div style={{ flex: 1, minWidth: '120px' }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem', fontSize: '0.8rem' }}>Only GST Amount</div>
                        <div style={{ fontWeight: '500' }}>₹{(Number(currentClient.onlyGstAmount) || 0).toLocaleString('en-IN')}</div>
                     </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {note && (
                <div>
                  <h4 style={{ margin: '0 0 0.8rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</h4>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', lineHeight: '1.5' }}>
                    {note}
                  </div>
                </div>
              )}

              {/* Super Admin Edit Access Trigger */}
              {currentUser?.role === 'superadmin' && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }} onClick={() => setIsEditing(true)}>
                    <Edit size={16} /> Edit Client Details
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsModal;
