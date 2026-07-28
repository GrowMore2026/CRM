import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Plus, UploadCloud, Download } from 'lucide-react';
import { useApp } from '../context/AppProvider';

const CreateLeadListModal = ({ isOpen, onClose }) => {
  const { addLeadList, addLead, currentUser } = useApp();

  const [listName, setListName] = useState('');
  const [description, setDescription] = useState('');
  const [leadSource, setLeadSource] = useState('Open');
  const [errorMsg, setErrorMsg] = useState(null);

  // Default columns
  const [columns, setColumns] = useState([
    { id: '1', name: 'Name' },
    { id: '2', name: 'Phone Number' },
    { id: '3', name: 'Email Address' },
    { id: '4', name: 'Type of Service' },
    { id: '5', name: 'City' },
    { id: '6', name: 'State' }
  ]);
  const [newColumnName, setNewColumnName] = useState('');

  const [csvFile, setCsvFile] = useState(null);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setListName('');
      setDescription('');
      setLeadSource('Open');
      setColumns([
        { id: '1', name: 'Name' },
        { id: '2', name: 'Phone Number' },
        { id: '3', name: 'Email Address' },
        { id: '4', name: 'Type of Service' },
        { id: '5', name: 'City' },
        { id: '6', name: 'State' }
      ]);
      setNewColumnName('');
      setCsvFile(null);
      setRemoveDuplicates(true);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    setColumns([...columns, { id: Date.now().toString(), name: newColumnName.trim() }]);
    setNewColumnName('');
  };

  const handleRemoveColumn = (id) => {
    setColumns(columns.filter(c => c.id !== id));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setCsvFile(file);
    } else {
      alert("Please upload a valid CSV file.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setCsvFile(file);
    } else {
      alert("Please upload a valid CSV file.");
    }
  };

  const handleDownloadSample = () => {
    const header = columns.map(c => `"${c.name.replace(/"/g, '""')}"`).join(',') + '\n';
    const sampleRow = columns.map(c => `"Sample ${c.name}"`).join(',') + '\n';
    const blob = new Blob([header + sampleRow], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'sample_lead_list.csv';
    link.click();
    URL.revokeObjectURL(url);
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

  const handleSubmit = async () => {
    if (!listName.trim()) {
      setErrorMsg("Please enter a Lead List Name.");
      return;
    }
    if (!csvFile) {
      setErrorMsg("Please upload a CSV file.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Lead List
      const listData = {
        name: listName.trim(),
        description: description.trim(),
        columns: columns.map(c => c.name)
      };

      const listRes = await addLeadList(listData);
      if (!listRes.success) throw new Error(listRes.error);
      const newListId = listRes.data.id;

      // 2. Parse CSV
      let parsedData = await parseCSV(csvFile);

      // 3. Filter Duplicates if needed
      if (removeDuplicates) {
        const uniqueSet = new Set();
        parsedData = parsedData.filter(row => {
          const email = Object.keys(row).find(k => k.toLowerCase().includes('email')) ? row[Object.keys(row).find(k => k.toLowerCase().includes('email'))] : '';
          const phone = Object.keys(row).find(k => k.toLowerCase().includes('phone')) ? row[Object.keys(row).find(k => k.toLowerCase().includes('phone'))] : '';

          const key = `${email}-${phone}`.toLowerCase();
          if (!key || key === '-') return true;

          if (uniqueSet.has(key)) return false;
          uniqueSet.add(key);
          return true;
        });
      }

      // 4. Save Leads
      for (const row of parsedData) {
        const leadObj = {
          name: '',
          email: '',
          phone: '',
          source: leadSource,
          status: 'CREATED',
          list_id: newListId,
          dynamic_data: {}
        };

        Object.keys(row).forEach(key => {
          const lkey = key.toLowerCase();
          if (lkey.includes('name')) leadObj.name = row[key];
          else if (lkey.includes('email')) leadObj.email = row[key];
          else if (lkey.includes('phone')) leadObj.phone = row[key];
          else if (lkey.includes('service') || lkey.includes('type')) leadObj.type_of_service = row[key];
          else if (lkey.includes('city')) leadObj.city = row[key];
          else if (lkey.includes('state') && !lkey.includes('status')) leadObj.state = row[key];
          else leadObj.dynamic_data[key] = row[key];
        });

        await addLead(leadObj);
      }

      onClose();
    } catch (err) {
      console.error(err);
      alert("Error creating list: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />

      <div style={{ position: 'relative', background: 'var(--bg-secondary)', width: '100%', maxWidth: '600px', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: '700' }}>Create Lead List</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {currentUser?.role === 'loan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>Lead Source</label>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  <input type="radio" value="Open" checked={leadSource === 'Open'} onChange={() => setLeadSource('Open')} />
                  Open
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  <input type="radio" value="DSA" checked={leadSource === 'DSA'} onChange={() => setLeadSource('DSA')} />
                  DSA
                </label>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>Lead List Name</label>
            <input
              type="text"
              placeholder="Enter lead list name..."
              value={listName}
              onChange={e => setListName(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>Description</label>
            <textarea
              placeholder="Enter description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box', minHeight: '80px', outline: 'none', resize: 'vertical' }}
            />
          </div>

          {/* Mapping Section */}
          <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '1.25rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '700' }}>CSV Columns Mapping</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Define the columns expected in your CSV upload.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {columns.map((col, idx) => (
                <div key={col.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>{idx + 1}. {col.name}</span>
                  <button onClick={() => handleRemoveColumn(col.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="New column name..."
                value={newColumnName}
                onChange={e => setNewColumnName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              />
              <button onClick={handleAddColumn} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
                <Plus size={16} /> Add More Column
              </button>
            </div>
          </div>

          {/* Upload Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>Upload CSV File</label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--bg-primary)' }}
            >
              <UploadCloud size={32} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {csvFile ? csvFile.name : "Click to browse or drag and drop your CSV here"}
              </span>
              <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          </div>

          {/* Toggle */}
          <label
            onClick={(e) => { e.preventDefault(); setRemoveDuplicates(!removeDuplicates); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginTop: '0.5rem' }}
          >
            <div style={{ width: '36px', height: '20px', background: removeDuplicates ? 'var(--accent-primary)' : 'var(--bg-tertiary)', borderRadius: '10px', position: 'relative', transition: '0.2s' }}>
              <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: removeDuplicates ? '18px' : '2px', transition: '0.2s' }} />
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Remove duplicate data automatically</span>
          </label>

          </div>

          {/* Footer */}
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={onClose} disabled={isSubmitting} style={{ flex: 1, padding: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting} style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                {isSubmitting ? 'Creating...' : 'Create Lead List'}
              </button>
            </div>

            <button onClick={handleDownloadSample} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
              <Download size={14} /> Download Sample Lead CSV
            </button>
          </div>

        </div>
      </div>

      {errorMsg && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setErrorMsg(null)} />
          <div style={{ position: 'relative', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-xl)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
            </div>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.25rem' }}>Error</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>{errorMsg}</p>
            <button onClick={() => setErrorMsg(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', width: '100%', transition: '0.2s' }}>Okay</button>
          </div>
        </div>,
        document.body
      )}
    </>,
    document.body
  );
};

export default CreateLeadListModal;