import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const holidays = [
  { date: '15 Aug', day: 'Saturday', name: 'Independence Day' },
  { date: '28 Aug', day: 'Friday', name: 'Raksha Bandhan' },
  { date: '04 Sep', day: 'Friday', name: 'Janmashtami' },
  { date: '02 Oct', day: 'Friday', name: 'Gandhi Jayanti' },
];

const UpcomingHolidays = () => {
  const navigate = useNavigate();

  return (
    <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '1.25rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Upcoming Holidays</h3>
        <ArrowRight size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => navigate('/holidays')} />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {holidays.map((h, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{h.date}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{h.day}</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {h.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingHolidays;
