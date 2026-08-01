import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, FileText, CheckSquare, MessageSquare, Home, Wallet, Save } from 'lucide-react';
import { useApp } from '../context/AppProvider';

const AddNewLoanFile = ({ titleOverride, buttonOverride, successMessageOverride }) => {
  const { addLoanFile, currentUser } = useApp();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    // Lead Source
    source: 'Open',
    dsaName: '',
    dsaNumber: '',
    dsaLocation: '',
    referral1Name: '',
    referral1Number: '',
    referral2Name: '',
    referral2Number: '',
    bankerName: '',
    bankerPhone: '',
    // Type of Loan
    typeOfLoan: 'Business Loan',
    // Basic Details
    fullName: '', age: '', mobileNumber: '', alternateMobile: '', city: '', occupation: '', employmentType: 'Salaried', panCardNumber: '',
    loginDate: '', chequeHandoverDate: '',
    // Loan Requirement
    loanPurpose: '', propertyType: '', propertyLocation: '', propertyValue: '', loanAmount: '', downPayment: '',
    // Employment & Income
    employer: '', workExperience: '', monthlyIncome: '', annualIncome: '', salaryBank: '', coApplicant: 'No', coApplicantName: '',
    // Existing Liabilities
    currentLoans: '', creditCardDues: '', totalEmi: '', cibilScore: '',
    // Property Documents (Checklist)
    docAgreementToSell: false, docSaleDeed: false, docBuilderAgreement: false, docApprovedPlan: false, docOcCc: false,
    // Income Documents (Checklist)
    docPanAadhaar: false, docSalarySlips: false, docBankStatement: false, docItr: false, docBusinessFinancials: false,
    // Closing Questions
    appliedElsewhere: 'No', previousRejection: 'No', preferredBank: '', loanTimeline: '', bestTimeToContact: ''
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let finalValue = type === 'checkbox' ? checked : value;
    if (name === 'panCardNumber' && typeof finalValue === 'string') {
      finalValue = finalValue.toUpperCase();
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Construct the loan object
    let notesText = '';
    if (formData.source === 'DSA') {
      notesText = `DSA Partner Details:\n- Name: ${formData.dsaName}\n- Number: ${formData.dsaNumber}\n- Location: ${formData.dsaLocation}`;
    }

    // Add Referral Details
    if (formData.referral1Name || formData.referral1Number || formData.referral2Name || formData.referral2Number) {
      if (notesText) notesText += '\n\n';
      notesText += `Referral Details:\n`;
      if (formData.referral1Name || formData.referral1Number) {
        notesText += `- Referral 1 Name: ${formData.referral1Name || '—'}\n  Referral 1 Number: ${formData.referral1Number || '—'}\n`;
      }
      if (formData.referral2Name || formData.referral2Number) {
        notesText += `- Referral 2 Name: ${formData.referral2Name || '—'}\n  Referral 2 Number: ${formData.referral2Number || '—'}\n`;
      }
    }

    // Add Banker Details
    if (formData.bankerName || formData.bankerPhone) {
      if (notesText) notesText += '\n\n';
      notesText += `Banker Details:\n- Banker Name: ${formData.bankerName || '—'}\n- Banker Phone: ${formData.bankerPhone || '—'}`;
    }

    const payload = {
      ...formData,
      notes: notesText,
      createdBy: currentUser.id,
      age: formData.age ? parseInt(formData.age, 10) : null,
      propertyValue: formData.propertyValue ? parseFloat(formData.propertyValue) : null,
      loanAmount: formData.loanAmount ? parseFloat(formData.loanAmount) : null,
      downPayment: formData.downPayment ? parseFloat(formData.downPayment) : null,
      monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : null,
      annualIncome: formData.annualIncome ? parseFloat(formData.annualIncome) : null,
      creditCardDues: formData.creditCardDues ? parseFloat(formData.creditCardDues) : null,
      totalEmi: formData.totalEmi ? parseFloat(formData.totalEmi) : null,
      loginDate: formData.loginDate || null,
      chequeHandoverDate: formData.chequeHandoverDate || null,
    };
    
    const result = await addLoanFile(payload);
    
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    
    setSubmittedName(formData.fullName);
    setSubmitted(true);
    // Reset
    setFormData({
      source: 'Open',
      dsaName: '',
      dsaNumber: '',
      dsaLocation: '',
      referral1Name: '',
      referral1Number: '',
      referral2Name: '',
      referral2Number: '',
      bankerName: '',
      bankerPhone: '',
      typeOfLoan: 'Business Loan',
      fullName: '', age: '', mobileNumber: '', alternateMobile: '', city: '', occupation: '', employmentType: 'Salaried', panCardNumber: '',
      loanPurpose: '', propertyType: '', propertyLocation: '', propertyValue: '', loanAmount: '', downPayment: '',
      employer: '', workExperience: '', monthlyIncome: '', annualIncome: '', salaryBank: '', coApplicant: 'No', coApplicantName: '',
      currentLoans: '', creditCardDues: '', totalEmi: '', cibilScore: '',
      docAgreementToSell: false, docSaleDeed: false, docBuilderAgreement: false, docApprovedPlan: false, docOcCc: false,
      docPanAadhaar: false, docSalarySlips: false, docBankStatement: false, docItr: false, docBusinessFinancials: false,
      appliedElsewhere: 'No', previousRejection: 'No', preferredBank: '', loanTimeline: '', bestTimeToContact: ''
    });
  };

  const getDashboardPath = () => {
    if (!currentUser) return '/';
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') return `/${currentUser.role}/clients`;
    return `/${currentUser.role}`;
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
      
      {submitted && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 'var(--radius-xl)', padding: '0.9rem 1.2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>✅</span>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#34d399' }}>{successMessageOverride || 'Loan File Created Successfully!'}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>"<strong>{submittedName}</strong>" has been saved.</div>
            </div>
          </div>
          <button onClick={() => navigate(getDashboardPath())} style={{ fontSize: '0.76rem', padding: '0.35rem 0.9rem', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '9999px', color: '#34d399', cursor: 'pointer', whiteSpace: 'nowrap' }}>Go to Dashboard →</button>
        </div>
      )}

      {formError && (
        <div style={{ padding: '0.8rem 1.2rem', marginBottom: '1.5rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', fontSize: '0.85rem', fontWeight: '600' }}>
          ⚠️ {formError}
        </div>
      )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Card 0: Lead Source */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              <FileText size={20} color="var(--accent-primary)" /> Lead Source
            </h3>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <input type="radio" name="source" value="Open" checked={formData.source === 'Open'} onChange={handleChange} style={{ accentColor: 'var(--accent-primary)', width: '1.1rem', height: '1.1rem' }} />
                Open
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <input type="radio" name="source" value="DSA" checked={formData.source === 'DSA'} onChange={handleChange} style={{ accentColor: 'var(--accent-primary)', width: '1.1rem', height: '1.1rem' }} />
                DSA
              </label>
            </div>
            {formData.source === 'DSA' && (
              <div className="grid grid-cols-3 gap-4" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">DSA Name *</label>
                  <input type="text" name="dsaName" className="form-control" placeholder="DSA Partner Name" value={formData.dsaName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">DSA Number *</label>
                  <input type="text" name="dsaNumber" className="form-control" placeholder="DSA Phone/ID" value={formData.dsaNumber} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">DSA Location *</label>
                  <input type="text" name="dsaLocation" className="form-control" placeholder="DSA City/Branch" value={formData.dsaLocation} onChange={handleChange} required />
                </div>
              </div>
            )}
          </div>

          {/* Card 1: Type of Loan */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              <FileText size={20} color="var(--accent-primary)" /> Type of Loan
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {['Personal Loan', 'Business Loan', 'Home Loan', 'Mortgage Loan', 'Loan Against Property', 'Machinery Loan', 'Education Loan', 'Working Capital Loan', 'Balance Transfer & Top-Up Loan', 'Car loan'].map(loanType => (
                <label key={loanType} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  <input type="radio" name="typeOfLoan" value={loanType} checked={formData.typeOfLoan === loanType} onChange={handleChange} style={{ accentColor: 'var(--accent-primary)', width: '1.1rem', height: '1.1rem' }} />
                  {loanType}
                </label>
              ))}
            </div>
          </div>

          {/* Card 1: Basic Details */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              <User size={20} color="var(--accent-primary)" /> Basic Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Row 1: Full Name and PAN card */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" name="fullName" className="form-control" placeholder="Applicant Name" value={formData.fullName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">PAN card Number</label>
                  <input type="text" name="panCardNumber" className="form-control" placeholder="ABCDE1234F" value={formData.panCardNumber} onChange={handleChange} style={{ textTransform: 'uppercase' }} />
                </div>
              </div>

              {/* Row 2: Mobile, Alternate Mobile, City, Age */}
              <div className="grid grid-cols-4 gap-4">
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input type="tel" name="mobileNumber" className="form-control" placeholder="10-digit number" value={formData.mobileNumber} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Alternate Mobile Number</label>
                  <input type="tel" name="alternateMobile" className="form-control" placeholder="10-digit number" value={formData.alternateMobile} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" name="city" className="form-control" placeholder="City" value={formData.city} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input type="number" name="age" className="form-control" placeholder="e.g. 35" value={formData.age} onChange={handleChange} />
                </div>
              </div>

              {/* Row 2.5: Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Login Date</label>
                  <input type="date" name="loginDate" className="form-control" value={formData.loginDate} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cheque Handover Date</label>
                  <input type="date" name="chequeHandoverDate" className="form-control" value={formData.chequeHandoverDate} onChange={handleChange} />
                </div>
              </div>

              {/* Row 3: Employment Type and Occupation */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Employment Type</label>
                  <select name="employmentType" className="form-control" value={formData.employmentType} onChange={handleChange}>
                    <option value="Salaried">Salaried</option>
                    <option value="Self-Employed">Self-Employed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Occupation</label>
                  <input type="text" name="occupation" className="form-control" placeholder="e.g. Engineer" value={formData.occupation} onChange={handleChange} />
                </div>
              </div>
 
              {/* Referrals (Optional) */}
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Referrals (Optional)</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Referral 1 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">1. Referral Name</label>
                      <input type="text" name="referral1Name" className="form-control" placeholder="First Referral Name" value={formData.referral1Name || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Referral Number</label>
                      <input type="tel" name="referral1Number" className="form-control" placeholder="First Referral Phone" value={formData.referral1Number || ''} onChange={handleChange} />
                    </div>
                  </div>

                  {/* Referral 2 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">2. Referral Name</label>
                      <input type="text" name="referral2Name" className="form-control" placeholder="Second Referral Name" value={formData.referral2Name || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Referral Number</label>
                      <input type="tel" name="referral2Number" className="form-control" placeholder="Second Referral Phone" value={formData.referral2Number || ''} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Loan Requirement */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              <Home size={20} color="var(--accent-primary)" /> Loan Requirement
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Purpose of Loan</label>
                <input type="text" name="loanPurpose" className="form-control" placeholder="e.g. Home Purchase" value={formData.loanPurpose} onChange={handleChange} />
              </div>
              
              {['Home Loan', 'Mortgage Loan', 'Loan Against Property'].includes(formData.typeOfLoan) && (
                <>
                  <div className="form-group">
                    <label className="form-label">Property Type</label>
                    <input type="text" name="propertyType" className="form-control" placeholder="e.g. Apartment" value={formData.propertyType} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Property Location</label>
                    <input type="text" name="propertyLocation" className="form-control" placeholder="City / Area" value={formData.propertyLocation} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Property Value (₹)</label>
                    <input type="number" name="propertyValue" className="form-control" placeholder="0" value={formData.propertyValue} onChange={handleChange} />
                  </div>
                </>
              )}
              <div className="form-group">
                <label className="form-label">Loan Amount Required (₹)</label>
                <input type="number" name="loanAmount" className="form-control" placeholder="0" value={formData.loanAmount} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Down Payment (₹)</label>
                <input type="number" name="downPayment" className="form-control" placeholder="0" value={formData.downPayment} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Card 3: Employment & Income */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              <Briefcase size={20} color="var(--accent-primary)" /> Employment & Income
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Employer / Business Name</label>
                <input type="text" name="employer" className="form-control" placeholder="Company Name" value={formData.employer} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Work Experience (Years)</label>
                <input type="number" name="workExperience" className="form-control" placeholder="e.g. 5" value={formData.workExperience} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Income (₹)</label>
                <input type="number" name="monthlyIncome" className="form-control" placeholder="0" value={formData.monthlyIncome} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Annual Income (₹)</label>
                <input type="number" name="annualIncome" className="form-control" placeholder="0" value={formData.annualIncome} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Salary Account Bank</label>
                <input type="text" name="salaryBank" className="form-control" placeholder="Bank Name" value={formData.salaryBank} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Co-Applicant?</label>
                <select name="coApplicant" className="form-control" value={formData.coApplicant} onChange={handleChange}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              
              {formData.coApplicant === 'Yes' && (
                <div className="form-group">
                  <label className="form-label">Co-Applicant Name *</label>
                  <input type="text" name="coApplicantName" className="form-control" placeholder="Co-Applicant Full Name" value={formData.coApplicantName} onChange={handleChange} required />
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Existing Liabilities */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              <Wallet size={20} color="var(--accent-primary)" /> Existing Liabilities
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Current Loans</label>
                <input type="text" name="currentLoans" className="form-control" placeholder="e.g. Car Loan, Personal Loan" value={formData.currentLoans} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Credit Card Dues (₹)</label>
                <input type="number" name="creditCardDues" className="form-control" placeholder="0" value={formData.creditCardDues} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Total Monthly EMI (₹)</label>
                <input type="number" name="totalEmi" className="form-control" placeholder="0" value={formData.totalEmi} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">CIBIL Score / Repayment History</label>
                <input type="text" name="cibilScore" className="form-control" placeholder="e.g. 750" value={formData.cibilScore} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Card 5: Documents (Side by Side) */}
          <div className="grid grid-cols-2 gap-4" style={{ gap: '1.5rem' }}>
            <div className="card" style={{ padding: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                <FileText size={20} color="var(--accent-primary)" /> Property Documents
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="docAgreementToSell" checked={formData.docAgreementToSell} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem' }} /> Agreement to Sell
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="docSaleDeed" checked={formData.docSaleDeed} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem' }} /> Sale Deed
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="docBuilderAgreement" checked={formData.docBuilderAgreement} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem' }} /> Builder Agreement
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="docApprovedPlan" checked={formData.docApprovedPlan} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem' }} /> Approved Plan
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="docOcCc" checked={formData.docOcCc} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem' }} /> OC/CC (if applicable)
                </label>
              </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                <CheckSquare size={20} color="var(--accent-primary)" /> Income Documents
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="docPanAadhaar" checked={formData.docPanAadhaar} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem' }} /> PAN & Aadhaar
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="docSalarySlips" checked={formData.docSalarySlips} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem' }} /> Salary Slips (6 months)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="docBankStatement" checked={formData.docBankStatement} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem' }} /> Bank Statement (12 months)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="docItr" checked={formData.docItr} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem' }} /> 2 Years Form 16 / ITR [3 Years]
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="docBusinessFinancials" checked={formData.docBusinessFinancials} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem' }} /> Business Financials (if self-emp)
                </label>
              </div>
            </div>
          </div>

          {/* Card 6: Closing Questions */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              <MessageSquare size={20} color="var(--accent-primary)" /> Closing Questions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Applied Elsewhere?</label>
                <select name="appliedElsewhere" className="form-control" value={formData.appliedElsewhere} onChange={handleChange}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Any Previous Rejection?</label>
                <select name="previousRejection" className="form-control" value={formData.previousRejection} onChange={handleChange}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Preferred Bank</label>
                <input type="text" name="preferredBank" className="form-control" placeholder="e.g. HDFC, SBI" value={formData.preferredBank} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Required Loan Timeline</label>
                <input type="text" name="loanTimeline" className="form-control" placeholder="e.g. 1 Month" value={formData.loanTimeline} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Best Time to Contact</label>
                <input type="text" name="bestTimeToContact" className="form-control" placeholder="e.g. Weekdays 4 PM - 6 PM" value={formData.bestTimeToContact} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Banker Name</label>
                <input type="text" name="bankerName" className="form-control" placeholder="Banker Full Name" value={formData.bankerName || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Banker Phone Number</label>
                <input type="tel" name="bankerPhone" className="form-control" placeholder="Banker Phone/Contact" value={formData.bankerPhone || ''} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem', fontSize: '1rem', fontWeight: '700', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 15px -3px rgba(30, 159, 111, 0.3)' }}>
              <Save size={20} /> {buttonOverride || 'Submit Loan File'}
            </button>
            <button type="button" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1rem', borderRadius: 'var(--radius-lg)', fontWeight: '600' }} onClick={() => navigate(getDashboardPath())}>
              Cancel
            </button>
          </div>
      </form>
    </div>
  );
};

export default AddNewLoanFile;
