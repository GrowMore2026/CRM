import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  style = {} 
}) => {
  return (
    <div style={{ flex: 1, minWidth: '280px', maxWidth: '400px', position: 'relative', ...style }}>
      <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
        <Search size={16} />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 2.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '9999px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.15)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'var(--shadow-sm)'; }}
      />
      {value && (
        <button 
          onClick={() => onChange({ target: { value: '' } })} 
          style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.7rem' }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchBar;
