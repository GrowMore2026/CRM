import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppProvider';
import { supabase } from '../supabaseClient';
import { Upload, Download } from 'lucide-react';

const HolidayList = () => {
  const { currentUser, holidays: globalHolidays } = useApp();
  const currentYear = 2026;
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [modalMsg, setModalMsg] = useState(null);
  
  // Use global holidays if available, otherwise fallback to empty array
  const holidays = globalHolidays || [];

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, i, 1);
    return {
      monthIndex: i,
      label: d.toLocaleString('en-US', { month: 'short' }).toUpperCase() + ' ' + currentYear
    };
  });

  const getHolidaysForMonth = (monthIndex) => {
    return holidays.filter(h => {
      const d = new Date(h.date);
      return d.getMonth() === monthIndex && d.getFullYear() === currentYear;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const formatDay = (dateStr) => {
    const d = new Date(dateStr);
    return {
      dayNum: d.getDate().toString().padStart(2, '0'),
      dayName: d.toLocaleString('en-US', { weekday: 'short' })
    };
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      
      const newHolidays = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(',');
        if (parts.length >= 2) {
          let dateStr = parts[0].trim();
          const name = parts.slice(1).join(',').trim();
          
          // Check if date is in DD-MM-YYYY or DD/MM/YYYY format
          const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
          if (ddmmyyyyMatch) {
            // Convert to YYYY-MM-DD
            const [_, day, month, year] = ddmmyyyyMatch;
            dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }

          // basic validation
          if (dateStr && name && !isNaN(new Date(dateStr).getTime())) {
            newHolidays.push({ date: dateStr, name });
          }
        }
      }

      if (newHolidays.length > 0) {
        try {
          const { error: delError } = await supabase.from('holidays').delete().not('id', 'is', null);
          if (delError) throw delError;
          
          const { error: insError } = await supabase.from('holidays').insert(newHolidays);
          if (insError) throw insError;
          
          setModalMsg({ type: 'success', text: 'Holidays updated successfully! All portals will reflect this change immediately.' });
        } catch (err) {
          console.error('[supabase] update holidays error:', err);
          setModalMsg({ type: 'error', text: 'Error updating holidays. Check console for details.' });
        }
      } else {
        setModalMsg({ type: 'error', text: 'No valid holidays found in CSV. Make sure format is: YYYY-MM-DD, Holiday Name' });
      }
      
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const downloadDemoCSV = () => {
    const csvContent = "2026-01-14, Makar Sankranti\n2026-01-26, Republic Day\n2026-02-15, Maha Shivratri\n2026-03-04, Holi\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'demo_holidays.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canUpload = currentUser?.role === 'superadmin' || currentUser?.role === 'digital_marketing';

  return (
    <div className="dashboard-container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
        {canUpload && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary"
              onClick={downloadDemoCSV}
              title="Download a sample CSV format"
            >
              <Download size={18} />
              Demo CSV
            </button>
            <input 
              type="file" 
              accept=".csv" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload size={18} />
              {uploading ? 'Uploading...' : 'Import CSV'}
            </button>
          </div>
        )}
      </div>
      
      {holidays.length === 0 && !uploading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px dashed var(--border-color)', marginBottom: '2rem' }}>
          No holidays found. {canUpload ? 'Please upload a CSV file.' : 'Waiting for admin to upload the holiday list.'}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {months.map((month) => {
          const monthHolidays = getHolidaysForMonth(month.monthIndex);
          
          return (
            <div key={month.label} style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', border: '1px solid var(--border-color)', minHeight: '180px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                {month.label}
              </div>
              
              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {monthHolidays.length > 0 ? (
                  monthHolidays.map((h, i) => {
                    const { dayNum, dayName } = formatDay(h.date);
                    return (
                      <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '35px' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1' }}>{dayNum}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{dayName}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          {h.name}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flex: 1, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No Holidays
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalMsg && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: 'var(--shadow-xl)',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: modalMsg.type === 'success' ? 'var(--success)' : 'var(--danger)'
            }}>
              {modalMsg.type === 'success' ? 'Success' : 'Attention'}
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              lineHeight: '1.5',
              marginBottom: '2rem'
            }}>
              {modalMsg.text}
            </p>
            <button 
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
              onClick={() => setModalMsg(null)}
            >
              OK
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default HolidayList;
