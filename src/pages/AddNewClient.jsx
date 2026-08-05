import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Briefcase, User, Mail, Phone, Wallet, Save, FileText } from 'lucide-react';
import { useApp } from '../context/AppProvider';
import ServicePicker from '../components/ServicePicker';

const AddNewClient = ({ titleOverride, buttonOverride, successMessageOverride }) => {
  const { addClient, currentUser, users, setSelectedClient } = useApp();
  const navigate = useNavigate();
  const salesUsers = users.filter(u => u.role === 'sales');
  
  const [formData, setFormData] = useState({
    company: '', customerName: '', email: '', phone: '', budget: '', collectedPayment: '', withGstPayment: '', onlyGstAmount: '', totalDealWithGst: '', totalDealGstAmount: '', service: [], closer: '', panNumber: '', gstNumber: '', creationDate: new Date().toISOString().split('T')[0]
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [formError, setFormError] = useState('');
  const [gstRate, setGstRate] = useState(18); // Default 18%

  const handleCollectedPaymentChange = (value) => {
    setFormData(prev => ({
      ...prev,
      collectedPayment: value
    }));
  };

  const handleBudgetChange = (value) => {
    const budget = Number(value) || 0;
    const rate = Number(gstRate) || 0;
    const totalGst = Math.round(budget * (rate / 100));
    const withGst = budget + totalGst;
    setFormData(prev => ({
      ...prev,
      budget: value,
      totalDealGstAmount: totalGst > 0 ? String(totalGst) : '',
      totalDealWithGst: withGst > 0 ? String(withGst) : ''
    }));
  };

  const handleGstRateChange = (rate) => {
    setGstRate(rate);
    const budget = Number(formData.budget) || 0;
    const totalGst = Math.round(budget * (Number(rate) / 100));
    const totalWithGst = budget + totalGst;

    setFormData(prev => ({
      ...prev,
      totalDealGstAmount: totalGst > 0 ? String(totalGst) : '',
      totalDealWithGst: totalWithGst > 0 ? String(totalWithGst) : ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.panNumber && !formData.gstNumber) {
      setFormError('Please provide either a Company PAN Number or a Company GST Number.');
      return;
    }
    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      setFormError('Invalid PAN Number format. It should be 10 characters (e.g. ABCDE1234F).');
      return;
    }
    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
      setFormError('Invalid GST Number format. It should be 15 characters (e.g. 22AAAAA0000A1Z5).');
      return;
    }
    setFormError('');
    const totalDeal = Number(formData.budget) || 0;
    const collected = Number(formData.collectedPayment) || 0;
    addClient({
      name: formData.customerName || formData.company,
      email: formData.email,
      phone: formData.phone,
      service: formData.service,
      company: formData.company,
      interested: true,
      feedback: '',
      createdBy: currentUser.id,
      managedBy: currentUser.id, // assigned to creator initially
      closer: formData.closer,
      totalDealAmount: totalDeal,
      paymentAmount: collected,
      withGstPayment: 0,
      onlyGstAmount: 0,
      totalDealGstAmount: Number(formData.totalDealGstAmount) || 0,
      totalDealWithGst: Number(formData.totalDealWithGst) || 0,
      paymentStatus: collected >= totalDeal && totalDeal > 0 ? 'Completed' : 'Pending',
      panNumber: formData.panNumber,
      gstNumber: formData.gstNumber,
      createdOn: formData.creationDate,
    });
    setSubmittedName(formData.company);
    setSubmitted(true);
    setFormData({ company: '', email: '', phone: '', budget: '', collectedPayment: '', withGstPayment: '', onlyGstAmount: '', totalDealWithGst: '', totalDealGstAmount: '', service: [], closer: '', panNumber: '', gstNumber: '', creationDate: new Date().toISOString().split('T')[0] });
  };

  const getDashboardPath = () => {
    if (!currentUser) return '/';
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') return `/${currentUser.role}/clients`;
    return `/${currentUser.role}/clients`;
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
      
      {/* Success banner */}
      {submitted && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 'var(--radius-xl)', padding: '0.9rem 1.2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>✅</span>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#34d399' }}>{successMessageOverride || 'Client Added Successfully!'}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>"<strong>{submittedName}</strong>" has been saved.</div>
            </div>
          </div>
          <button onClick={() => navigate(getDashboardPath())} style={{ fontSize: '0.76rem', padding: '0.35rem 0.9rem', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '9999px', color: '#34d399', cursor: 'pointer', whiteSpace: 'nowrap' }}>View Clients →</button>
        </div>
      )}

      {formError && (
        <div style={{ padding: '0.8rem 1.2rem', marginBottom: '1.5rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', fontSize: '0.85rem', fontWeight: '600' }}>
          ⚠️ {formError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          
          {/* Card 1: Company Profile */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              <Building2 size={20} color="var(--accent-primary)" /> Company Profile
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Company / Client Name *</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" className="form-control" placeholder="e.g. ACME PVT. LTD." value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value.toUpperCase() })} required style={{ paddingLeft: '2.75rem' }} />
                  <Briefcase size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">PAN Number</label>
                <input type="text" maxLength="10" pattern="^[A-Z]{5}[0-9]{4}[A-Z]{1}$" title="PAN must be 10 characters (e.g. ABCDE1234F)" className="form-control" placeholder="e.g. ABCDE1234F" value={formData.panNumber} onChange={e => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })} />
              </div>
              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input type="text" maxLength="15" pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$" title="GST must be 15 characters" className="form-control" placeholder="e.g. 22AAAAA0000A1Z5" value={formData.gstNumber} onChange={e => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })} />
              </div>
            </div>
          </div>

          {/* Card 2: Contact Details */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              <User size={20} color="var(--accent-primary)" /> Primary Contact
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Customer Name *</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" className="form-control" placeholder="e.g. John Doe" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} required style={{ paddingLeft: '2.75rem' }} />
                  <User size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <input type="email" className="form-control" placeholder="client@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required style={{ paddingLeft: '2.75rem' }} />
                  <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <div style={{ position: 'relative' }}>
                  <input type="tel" maxLength="10" pattern="\d{10}" title="Exactly 10 digits" className="form-control" placeholder="9876543210" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} required style={{ paddingLeft: '2.75rem' }} />
                  <Phone size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Deal & Assignment */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              <Wallet size={20} color="var(--accent-primary)" /> Deal & Payment
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Total Deal Amount (₹)</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" min="0" onKeyDown={e => (e.key === '-' || e.key === 'e') && e.preventDefault()} className="form-control" placeholder="0" value={formData.budget} onChange={e => handleBudgetChange(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold' }}>₹</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Total Deal With GST (₹) (Auto-calculated)</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" min="0" onKeyDown={e => (e.key === '-' || e.key === 'e') && e.preventDefault()} className="form-control" placeholder="0" value={formData.totalDealWithGst} onChange={e => setFormData({ ...formData, totalDealWithGst: e.target.value })} style={{ paddingLeft: '2.5rem' }} />
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold' }}>₹</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Total Deal GST Amount (₹) (Auto-calculated)</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" min="0" onKeyDown={e => (e.key === '-' || e.key === 'e') && e.preventDefault()} className="form-control" placeholder="0" value={formData.totalDealGstAmount} onChange={e => setFormData({ ...formData, totalDealGstAmount: e.target.value })} style={{ paddingLeft: '2.5rem' }} />
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold' }}>₹</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Collected Payment (₹)</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" min="0" onKeyDown={e => (e.key === '-' || e.key === 'e') && e.preventDefault()} className="form-control" placeholder="0" value={formData.collectedPayment} onChange={e => handleCollectedPaymentChange(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold' }}>₹</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">GST Rate (%)</label>
                <select className="form-control" value={gstRate} onChange={e => handleGstRateChange(e.target.value)}>
                  <option value="0">No GST (0%)</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sales Closer (Optional)</label>
                <select className="form-control" value={formData.closer} onChange={e => setFormData({ ...formData, closer: e.target.value })}>
                  <option value="">Assign to yourself (Default)</option>
                  {salesUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.id}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Form Created Date</label>
                <input type="date" className="form-control" value={formData.creationDate} onChange={e => setFormData({ ...formData, creationDate: e.target.value })} required />
              </div>
            </div>
          </div>

          {/* Card 4: Services */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              <FileText size={20} color="var(--accent-primary)" /> Required Services
            </h3>
            <ServicePicker value={formData.service} onChange={v => setFormData({ ...formData, service: v })} />
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem', fontSize: '1rem', fontWeight: '700', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 15px -3px rgba(30, 159, 111, 0.3)' }}>
              <Save size={20} /> {buttonOverride || 'Register Client'}
            </button>
            <button type="button" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1rem', borderRadius: 'var(--radius-lg)', fontWeight: '600' }} onClick={() => navigate(getDashboardPath())}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddNewClient;
