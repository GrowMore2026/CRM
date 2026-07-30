const fs = require('fs');
let code = fs.readFileSync('src/pages/LoanRawLeads.jsx', 'utf8');
const split1 = code.indexOf("if (currentUser?.role === 'loan_employee') {");
const queueStart = code.indexOf('<div className="animate-fade-in"', split1);
const queueEnd = code.indexOf('</>\n    );\n  }', queueStart);
let queueContent = code.substring(queueStart, queueEnd).trim();
const split2 = code.indexOf('return (', queueEnd);
const campaignsStart = code.indexOf('<div style={{ display: \'flex\'', split2);
const campaignsEnd = code.lastIndexOf('</>');
let campaignsContent = code.substring(campaignsStart, campaignsEnd).trim();
let newCode = code.substring(0, split1) + `  const showQueue = currentUser?.role === 'loan_employee' || currentUser?.role === 'loan_admin';
  const showCampaigns = currentUser?.role === 'superadmin' || currentUser?.role === 'loan_admin';

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {modalConfig.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card animate-scale-in" style={{ background: 'var(--bg-primary)', padding: '2.5rem', borderRadius: '1rem', border: \`1px solid \${modalConfig.type === 'error' ? '#ef4444' : '#10b981'}\`, maxWidth: '450px', width: '90%', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
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

      {showQueue && (
        <div style={{ marginBottom: '3rem' }}>
          ${queueContent}
        </div>
      )}

      {showCampaigns && (
        <div className="animate-fade-in" style={{ marginTop: showQueue ? '3rem' : '0' }}>
          ${campaignsContent}
        </div>
      )}
    </div>
  );
}

export default LoanRawLeads;
`;
fs.writeFileSync('src/pages/LoanRawLeads.jsx', newCode, 'utf8');
console.log('Successfully refactored LoanRawLeads.jsx');
