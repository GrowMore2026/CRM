import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppProvider';
import { Upload, FileText, Search, User, Phone, Mail, Building, MapPin, Calendar, Plus, Edit2, Trash2, Eye, ArrowLeft } from 'lucide-react';

const LoanRawLeads = () => {
  const { currentUser, loanRawLeads, loanCampaigns, addLoanCampaign, updateLoanCampaign, deleteLoanCampaign, addLoanRawLeads, claimNextLoanRawLead, submitLoanRawLeadStatus, addLead, users } = useApp();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [activeLead, setActiveLead] = useState(null);
  const [leadStatus, setLeadStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalConfig, setModalConfig] = useState({ show: false, message: '', type: 'error' });
  
  const [uploadingCampaignId, setUploadingCampaignId] = useState(null);
  const [viewingCampaignId, setViewingCampaignId] = useState(null);
  const [loanCampaignSearchQ, setCampaignSearchQ] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loanCampaignForm, setLoanCampaignForm] = useState({ name: '', description: '', assigned_to: [] });
  const [assigneeSearchQ, setAssigneeSearchQ] = useState('');

  const showModal = (msg, type = 'error') => setModalConfig({ show: true, message: msg, type });
  const closeModal = () => setModalConfig({ show: false, message: '', type: 'error' });

  useEffect(() => {
    setCurrentPage(1);
  }, [viewingCampaignId, searchQ]);

  useEffect(() => {
    if (currentUser?.role === 'loan_employee' || currentUser?.role === 'loan_admin') {
      const existingActive = loanRawLeads?.find(l => l.claimed_by === currentUser.id && l.status === 'PENDING');
      setActiveLead(existingActive || null);
    }
  }, [currentUser, loanRawLeads]);

  const handleNextLead = async () => {
    setIsProcessing(true);
    try {
      const lead = await claimNextLoanRawLead(currentUser.id);
      if (!lead) {
        showModal("No more raw leads available in the queue right now.", 'error');
      } else {
        setActiveLead(lead);
      }
    } catch (err) {
      console.error(err);
      showModal("Error claiming lead.", 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitStatus = async () => {
    if (!leadStatus) return showModal("Please select a status first.", 'error');
    setIsProcessing(true);
    try {
      if (leadStatus === 'intretsed' || leadStatus === 'call back') {
        // Convert to real lead
        await addLead({
          name: activeLead.director_name || activeLead.company_name || 'Unknown',
          company: activeLead.company_name,
          email: activeLead.email,
          phone: activeLead.phone,
          city: '',
          state: activeLead.state,
          type_of_service: '',
          source: 'Raw Lead',
          list_id: null,
          status: 'CREATED'
        });
      }
      await submitLoanRawLeadStatus(activeLead.id, leadStatus);
      setLeadStatus('');
      setActiveLead(null);
      // Wait a moment then fetch next automatically
      setTimeout(() => handleNextLead(), 500);
    } catch (err) {
      console.error(err);
      showModal("Error submitting lead status.", 'error');
      setIsProcessing(false);
    }
  };

  const canUpload = currentUser?.role === 'superadmin';

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        // Simple CSV parser ignoring quotes handling for simplicity,
        // but let's handle basic quoted commas
        const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length < 2) return resolve([]);
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
          // split by comma not inside quotes
          const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
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

  const handleUploadClick = (campId) => {
    setUploadingCampaignId(campId);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsedData = await parseCSV(file);
      const leadsToInsert = [];

      for (const row of parsedData) {
        // Map columns to the exact 6 fields the user requested
        // "First Name, Last Name, Number, PAYMENT DATE, AMOUNT, PAYMENT MODE"
        const rowKeys = Object.keys(row);
        
        const firstNameKey = rowKeys.find(k => k.includes('first') && k.includes('name'));
        const lastNameKey = rowKeys.find(k => k.includes('last') && k.includes('name'));
        const numberKey = rowKeys.find(k => k.includes('number') || k.includes('phone') || k.includes('mobile'));
        const paymentDateKey = rowKeys.find(k => k.includes('payment') && k.includes('date'));
        const amountKey = rowKeys.find(k => k.includes('amount'));
        const paymentModeKey = rowKeys.find(k => k.includes('payment') && k.includes('mode'));

        const first_name = firstNameKey ? row[firstNameKey] : (rowKeys.find(k => k.includes('name')) ? row[rowKeys.find(k => k.includes('name'))] : '');
        const last_name = lastNameKey ? row[lastNameKey] : '';
        const number = numberKey ? row[numberKey] : '';
        const payment_date = paymentDateKey ? row[paymentDateKey] : '';
        const amount = amountKey ? parseFloat(row[amountKey]) || null : null;
        const payment_mode = paymentModeKey ? row[paymentModeKey] : '';

        // Only insert if at least one meaningful field exists
        if (first_name || number) {
          leadsToInsert.push({
            campaign_id: uploadingCampaignId,
            first_name,
            last_name,
            number,
            payment_date,
            amount,
            payment_mode,
            status: 'PENDING',
            claimed_by: null,
            claimed_at: null
          });
        }
      }

      if (leadsToInsert.length > 0) {
        await addLoanRawLeads(leadsToInsert);
        showModal(`Successfully uploaded ${leadsToInsert.length} raw leads!`, 'success');
      } else {
        showModal("No valid leads found in the CSV.", 'error');
      }
    } catch (err) {
      console.error(err);
      showModal("Error uploading CSV: " + err.message, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!loanCampaignForm.name) return showModal("Campaign name is required.", 'error');
    setIsProcessing(true);
    try {
      await addLoanCampaign({
        name: loanCampaignForm.name,
        description: loanCampaignForm.description,
        assigned_to: loanCampaignForm.assigned_to.length > 0 ? loanCampaignForm.assigned_to.join(',') : null,
        is_active: true
      });
      setShowCreateModal(false);
      setLoanCampaignForm({ name: '', description: '', assigned_to: [] });
      showModal("Campaign created successfully!", 'success');
    } catch(err) {
      console.error(err);
      showModal("Error creating loanCampaign: " + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleCampaign = async (id, currentStatus) => {
    try {
      await updateLoanCampaign(id, { is_active: !currentStatus });
    } catch (err) {
      console.error(err);
      showModal("Error updating loanCampaign status.", 'error');
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to delete this loanCampaign? All raw leads associated with it will be orphaned or deleted based on your DB rules.')) return;
    try {
      await deleteLoanCampaign(id);
      showModal("Campaign deleted.", 'success');
    } catch (err) {
      console.error(err);
      showModal("Error deleting loanCampaign.", 'error');
    }
  };

  const filteredLeads = (loanRawLeads || []).filter(lead => {
    const q = searchQ.toLowerCase();
    return (
      (lead.company_name || '').toLowerCase().includes(q) ||
      (lead.director_name || '').toLowerCase().includes(q) ||
      (lead.phone || '').toLowerCase().includes(q) ||
      (lead.email || '').toLowerCase().includes(q) ||
      (lead.state || '').toLowerCase().includes(q)
    );
  });

  const filteredLoanCampaigns = (loanCampaigns || []).filter(camp => {
    const q = loanCampaignSearchQ.toLowerCase();
    return (
      (camp.name || '').toLowerCase().includes(q) ||
      (camp.description || '').toLowerCase().includes(q)
    );
  });

  if (currentUser?.role === 'loan_employee' || currentUser?.role === 'loan_admin') {
    return (
      <>
        {modalConfig.show && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="card animate-scale-in" style={{ background: 'var(--bg-primary)', padding: '2.5rem', borderRadius: '1rem', border: `1px solid ${modalConfig.type === 'error' ? '#ef4444' : '#10b981'}`, maxWidth: '450px', width: '90%', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: modalConfig.type === 'error' ? '#fef2f2' : '#dcfce7', color: modalConfig.type === 'error' ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                {modalConfig.type === 'error' ? <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>!</span> : <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>✓</span>}
              </div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.25rem' }}>
                {modalConfig.type === 'error' ? 'Whoops!' : 'Success!'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
                {modalConfig.message}
              </p>
              <button 
                onClick={closeModal}
                style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', width: '100%' }}
              >
                OK
              </button>
            </div>
          </div>
        )}
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', marginTop: '2rem' }}>

        {!activeLead ? (
          <div className="card" style={{ background: 'var(--bg-secondary)', padding: '3rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid var(--border-color)', maxWidth: '500px', width: '100%' }}>
            <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.5rem auto' }} />
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Ready for your next lead?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Pull the next available raw lead from the global queue.</p>
            <button 
              onClick={handleNextLead}
              disabled={isProcessing}
              style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontWeight: '700', fontSize: '1.1rem', cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1, width: '100%' }}
            >
              {isProcessing ? 'Finding Lead...' : 'Get Next Lead'}
            </button>
          </div>
        ) : (
          <div className="card" style={{ background: 'var(--bg-secondary)', padding: '2.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', maxWidth: '600px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={32} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>{activeLead.first_name} {activeLead.last_name}</h2>
                <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <Calendar size={16} /> {activeLead.payment_date || 'No Payment Date'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Phone</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={16} color="var(--accent-primary)" /> {activeLead.number || '-'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Amount</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>₹ {activeLead.amount || '-'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Payment Date</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} color="var(--accent-primary)" /> {activeLead.payment_date || '-'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Payment Mode</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={16} color="var(--accent-primary)" /> {activeLead.payment_mode || '-'}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>Log Outcome</h3>
              <select 
                value={leadStatus} 
                onChange={(e) => setLeadStatus(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginBottom: '1.5rem' }}
              >
                <option value="">Select an outcome...</option>
                <option value="not pick up">not pick up</option>
                <option value="intro">intro</option>
                <option value="call back">call back</option>
                <option value="intretsed">intretsed</option>
                <option value="not intrested">not intrested</option>
                <option value="language issue">language issue</option>
                <option value="connectivity issue">connectivity issue</option>
                <option value="DND">DND</option>
                <option value="Voice Mail">Voice Mail</option>
              </select>
              
              <button 
                onClick={handleSubmitStatus}
                disabled={isProcessing || !leadStatus}
                style={{ width: '100%', background: leadStatus ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: leadStatus ? 'white' : 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '6px', fontWeight: '700', fontSize: '1rem', cursor: (isProcessing || !leadStatus) ? 'not-allowed' : 'pointer', transition: '0.2s' }}
              >
                {isProcessing ? 'Saving...' : 'Submit & Get Next'}
              </button>
            </div>
          </div>
        )}
      </div>
      </>
    );
  }

  return (
    <>
      {isUploading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--glass-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(8px)' }}>
          <div style={{ width: '60px', height: '60px', border: '5px solid var(--bg-tertiary)', borderTop: '5px solid var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1.5rem', boxShadow: '0 0 20px var(--accent-light)' }} />
          <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Uploading Leads...</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>Please do not close this window while we process the CSV.</p>
        </div>
      )}
      {modalConfig.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card animate-scale-in" style={{ background: 'var(--bg-primary)', padding: '2.5rem', borderRadius: '1rem', border: `1px solid ${modalConfig.type === 'error' ? '#ef4444' : '#10b981'}`, maxWidth: '450px', width: '90%', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: modalConfig.type === 'error' ? '#fef2f2' : '#dcfce7', color: modalConfig.type === 'error' ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              {modalConfig.type === 'error' ? <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>!</span> : <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>✓</span>}
            </div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.25rem' }}>
              {modalConfig.type === 'error' ? 'Whoops!' : 'Success!'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
              {modalConfig.message}
            </p>
            <button 
              onClick={closeModal}
              style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', width: '100%' }}
            >
              OK
            </button>
          </div>
        </div>
      )}
      
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {viewingCampaignId ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                  onClick={() => setViewingCampaignId(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  <ArrowLeft size={16} /> Back to LoanCampaigns
                </button>
                <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>
                  Campaign: {loanCampaigns?.find(c => c.id === viewingCampaignId)?.name || 'Unknown'}
                </h2>
              </div>
              <button 
                onClick={() => handleUploadClick(viewingCampaignId)}
                disabled={isUploading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: isUploading ? 'not-allowed' : 'pointer', transition: '0.2s' }}
              >
                <Upload size={18} /> Upload CSV
              </button>
            </div>



            {/* Table */}
            <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>First Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Last Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Number</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Payment Date</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Amount</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Payment Mode</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>State</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Sales Rep</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const loanCampaignFilteredLeads = filteredLeads.filter(l => l.campaign_id === viewingCampaignId);
                    const paginatedLeads = loanCampaignFilteredLeads.slice((currentPage - 1) * 25, currentPage * 25);
                    
                    if (loanCampaignFilteredLeads.length === 0) {
                      return (
                        <tr>
                          <td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No raw leads found in this campaign.
                          </td>
                        </tr>
                      );
                    }

                    return paginatedLeads.map(lead => (
                      <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>{lead.first_name || '-'}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.last_name || '-'}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.number || '-'}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.payment_date || '-'}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.amount ? `₹${lead.amount}` : '-'}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.payment_mode || '-'}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.state || '-'}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: lead.status === 'PENDING' ? '#fef9c3' : lead.status && lead.status !== 'UNASSIGNED' ? '#dcfce7' : '#f3f4f6', color: lead.status === 'PENDING' ? '#854d0e' : lead.status && lead.status !== 'UNASSIGNED' ? '#166534' : '#374151', border: `1px solid ${lead.status === 'PENDING' ? '#fef08a' : lead.status && lead.status !== 'UNASSIGNED' ? '#bbf7d0' : '#e5e7eb'}` }}>
                            {lead.status || 'UNASSIGNED'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                          {lead.claimed_by ? (users?.find(u => u.id === lead.claimed_by)?.name || 'Unknown') : '-'}
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {(() => {
              const loanCampaignFilteredLeads = filteredLeads.filter(l => l.loanCampaign_id === viewingCampaignId);
              const totalPages = Math.max(1, Math.ceil(loanCampaignFilteredLeads.length / 25));
              
              if (totalPages > 1) {
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Showing {(currentPage - 1) * 25 + 1} to {Math.min(currentPage * 25, loanCampaignFilteredLeads.length)} of {loanCampaignFilteredLeads.length} leads
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, transition: '0.2s' }}
                      >
                        Previous
                      </button>
                      <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, transition: '0.2s' }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Lead LoanCampaigns</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your raw lead upload pools and route them to specific loan employees.</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '250px' }}>
                  <Search size={18} color="var(--text-muted)" style={{ marginRight: '0.75rem' }} />
                  <input
                    type="text"
                    placeholder="Search loanCampaigns..."
                    value={loanCampaignSearchQ}
                    onChange={(e) => setCampaignSearchQ(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, color: 'var(--text-primary)', fontSize: '0.95rem' }}
                  />
                </div>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.7rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}
                >
                  <Plus size={18} /> Create Campaign
                </button>
              </div>
            </div>

            <input 
              type="file" 
              accept=".csv" 
              style={{ display: 'none' }} 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
              {filteredLoanCampaigns.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
                  No loanCampaigns found. {loanCampaignSearchQ ? 'Try a different search.' : 'Create one to get started!'}
                </div>
              ) : (
                filteredLoanCampaigns.map(camp => {
                  const campLeads = (loanRawLeads || []).filter(l => l.campaign_id === camp.id);
                  const total = campLeads.length;
                  const called = campLeads.filter(l => l.status && l.status !== 'UNASSIGNED' && l.status !== 'PENDING').length;
                  const remaining = total - called;
                  
                  return (
                    <div key={camp.id} className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{camp.name}</h3>
                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', background: camp.is_active ? '#dcfce7' : '#f3f4f6', color: camp.is_active ? '#166534' : '#4b5563' }}>
                              {camp.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <Trash2 size={16} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => handleDeleteCampaign(camp.id)} />
                          </div>
                          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>{camp.description || 'No description'}</p>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Created {new Date(camp.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ background: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                          Total: {total}
                        </span>
                        <span style={{ background: '#dbeafe', color: '#1e3a8a', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                          Remaining: {remaining}
                        </span>
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                          Call Done: {called}
                        </span>
                        <div style={{ flex: 1 }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Active</span>
                          <div 
                            onClick={() => handleToggleCampaign(camp.id, camp.is_active)}
                            style={{ width: '40px', height: '24px', background: camp.is_active ? 'var(--accent-primary)' : 'var(--bg-tertiary)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.2s' }}
                          >
                            <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: camp.is_active ? '19px' : '3px', transition: '0.2s' }}></div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setViewingCampaignId(camp.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
                        >
                          <Eye size={16} /> View Leads
                        </button>
                        <button 
                          onClick={() => handleUploadClick(camp.id)}
                          disabled={isUploading}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'var(--text-primary)', cursor: isUploading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
                        >
                          <Upload size={16} /> Upload CSV
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        Assigned to: <strong style={{ color: 'var(--text-primary)' }}>
                          {!camp.assigned_to ? 'All Loan Employees' : camp.assigned_to.split(',').map(id => users?.find(u => u.id === id)?.name || 'Unknown').join(', ')}
                        </strong>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card animate-scale-in" style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-color)', maxWidth: '400px', width: '90%', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>Create Campaign</h2>
            <form onSubmit={handleCreateCampaign}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Campaign Name *</label>
                <input 
                  type="text" 
                  required
                  value={loanCampaignForm.name} 
                  onChange={e => setLoanCampaignForm({...loanCampaignForm, name: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} 
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Description</label>
                <input 
                  type="text" 
                  value={loanCampaignForm.description} 
                  onChange={e => setLoanCampaignForm({...loanCampaignForm, description: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} 
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>Assign To (Multiple)</span>
                </label>
                <div style={{ marginBottom: '0.5rem', position: 'relative' }}>
                  <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    placeholder="Search loan employees..."
                    value={assigneeSearchQ}
                    onChange={(e) => setAssigneeSearchQ(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', background: 'var(--bg-secondary)' }}>
                  {(!assigneeSearchQ || 'all loan admins & employees'.includes(assigneeSearchQ.toLowerCase())) && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={loanCampaignForm.assigned_to.length === 0}
                        onChange={() => setLoanCampaignForm({...loanCampaignForm, assigned_to: []})}
                      />
                      <span style={{ fontWeight: loanCampaignForm.assigned_to.length === 0 ? '600' : '400' }}>All Loan Admins & Employees</span>
                    </label>
                  )}
                  {users?.filter(u => (u.role === 'loan_employee' || u.role === 'loan_admin') && (u.name || '').toLowerCase().includes(assigneeSearchQ.toLowerCase())).map(user => (
                    <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={loanCampaignForm.assigned_to.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLoanCampaignForm({...loanCampaignForm, assigned_to: [...loanCampaignForm.assigned_to, user.id]});
                          } else {
                            setLoanCampaignForm({...loanCampaignForm, assigned_to: loanCampaignForm.assigned_to.filter(id => id !== user.id)});
                          }
                        }}
                      />
                      <span>{user.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isProcessing} style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: isProcessing ? 0.7 : 1 }}>
                  {isProcessing ? 'Saving...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LoanRawLeads;
