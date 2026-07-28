import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { Mail, Lock, Sun, Moon, User } from 'lucide-react';

const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, users, dataLoading, loadError, reloadData } = useApp();
  const navigate = useNavigate();
  
  // Theme state: defaults to light, checks localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dashboard-theme') || 'light';
  });
  
  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('dashboard-theme', newTheme);
      return newTheme;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (dataLoading) {
      setError('Loading accounts…');
      return;
    }
    if (users.length === 0 && loadError) {
      setError('Accounts could not be loaded from the database. Use Retry above or verify .env.');
      return;
    }

    if (login(id, password)) {
      navigate('/');
    } else {
      setError('Invalid ID or Password');
    }
  };

  return (
    <div className={`login-wrapper ${theme}`}>
      {/* Theme Toggle Button */}
      <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme">
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      {/* Left Side */}
      <div className="login-left">
        <div className="login-logo">
          <img 
            src={theme === 'light' ? '/Logos/logo.png' : '/Logos/white-logo.png'} 
            alt="CRM Logo" 
            style={{ height: '64px' }} 
            onError={(e) => { e.target.style.display='none' }} 
          />
        </div>
        
        <h1 className="login-heading">
          Manage your<br/>customer<br/>relationships<br/>
          <span className="login-heading-highlight">intelligently.</span>
        </h1>
        
        <p className="login-subtext">
          Streamline your sales process, automate tasks, and get deep insights into your business performance with our next-generation CRM platform.
        </p>
      </div>

      {/* Right Side */}
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-card-title">Welcome Back</h2>
          <p className="login-card-subtitle">Please enter your details to sign in.</p>

          {loadError && (
            <div className="login-error-box">
              <div style={{ marginBottom: '0.5rem' }}>{loadError}</div>
              <button type="button" className="btn btn-primary w-full" style={{ padding: '0.5rem' }} onClick={() => reloadData()}>
                Retry connection
              </button>
            </div>
          )}

          {error && (
            <div className="login-error-text">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label className="login-label">User ID</label>
              <div style={{ position: 'relative' }}>
                <div className="login-icon">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="GrowMore Admin"
                  className="login-input"
                  required
                />
              </div>
            </div>

            <div className="login-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label className="login-label">Password</label>
              </div>
              <div style={{ position: 'relative' }}>
                <div className="login-icon">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="login-input"
                  required
                />
              </div>
            </div>

            <div className="login-remember">
              <input type="checkbox" id="remember" className="login-checkbox" />
              <label htmlFor="remember" style={{ cursor: 'pointer' }}>Remember me for 30 days</label>
            </div>

            <button type="submit" className="login-submit" disabled={dataLoading}>
              {dataLoading ? 'Loading…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
      
      <style>{`
        /* CSS Variables for Light & Dark Theme */
        .login-wrapper.light {
          --login-bg: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          --login-card-bg: #ffffff;
          --login-text-primary: #0f172a;
          --login-text-secondary: #334155;
          --login-text-muted: #64748b;
          --login-input-bg: #f8fafc;
          --login-border: #cbd5e1;
          --login-card-border: #f1f5f9;
          --login-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
          --login-accent: #10b981;
          --login-accent-hover: #059669;
        }

        .login-wrapper.dark {
          --login-bg: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          --login-card-bg: #1e293b;
          --login-text-primary: #f8fafc;
          --login-text-secondary: #cbd5e1;
          --login-text-muted: #94a3b8;
          --login-input-bg: #0f172a;
          --login-border: #334155;
          --login-card-border: #334155;
          --login-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
          --login-accent: #10b981;
          --login-accent-hover: #34d399;
        }

        /* Layout & Shared Styles */
        .login-wrapper {
          display: flex;
          min-height: 100vh;
          background: var(--login-bg);
          color: var(--login-text-primary);
          font-family: 'Inter', sans-serif;
          transition: background 0.3s ease, color 0.3s ease;
          position: relative;
        }
        
        .theme-toggle {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: var(--login-card-bg);
          border: 1px solid var(--login-border);
          color: var(--login-text-primary);
          padding: 0.5rem;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 10;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .theme-toggle:hover {
          transform: scale(1.05);
          border-color: var(--login-accent);
        }

        .login-left {
          flex: 1;
          padding: 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: transparent;
        }
        
        .login-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: auto;
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--login-text-primary);
        }
        
        .login-heading {
          font-size: 4rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          color: var(--login-text-primary);
          transition: color 0.3s ease;
        }
        
        .login-heading-highlight {
          color: var(--login-accent);
        }
        
        .login-subtext {
          font-size: 1.125rem;
          color: var(--login-text-muted);
          line-height: 1.6;
          max-width: 480px;
          margin-bottom: auto;
          transition: color 0.3s ease;
        }
        
        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: transparent;
          padding: 4rem;
        }
        
        .login-card {
          width: 100%;
          max-width: 440px;
          background: var(--login-card-bg);
          border-radius: 1rem;
          padding: 3rem;
          box-shadow: var(--login-shadow);
          border: 1px solid var(--login-card-border);
          transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        
        .login-card-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--login-text-primary);
          margin-bottom: 0.5rem;
          transition: color 0.3s ease;
        }
        
        .login-card-subtitle {
          color: var(--login-text-muted);
          margin-bottom: 2rem;
          transition: color 0.3s ease;
        }
        
        .login-form-group {
          margin-bottom: 1.25rem;
        }
        
        .login-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--login-text-secondary);
          margin-bottom: 0.5rem;
          transition: color 0.3s ease;
        }
        
        .login-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--login-text-muted);
          display: flex;
          align-items: center;
          transition: color 0.3s ease;
        }
        
        .login-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          border-radius: 0.5rem;
          border: 1px solid var(--login-border);
          outline: none;
          color: var(--login-text-primary);
          background-color: var(--login-input-bg);
          transition: border-color 0.2s, background-color 0.3s ease, color 0.3s ease;
          font-size: 0.875rem;
        }
        
        .login-input:focus {
          border-color: var(--login-accent);
        }
        
        .login-forgot {
          font-size: 0.875rem;
          color: var(--login-accent);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        
        .login-forgot:hover {
          color: var(--login-accent-hover);
        }
        
        .login-remember {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
          font-size: 0.875rem;
          color: var(--login-text-muted);
          transition: color 0.3s ease;
        }
        
        .login-checkbox {
          width: 1rem;
          height: 1rem;
          accent-color: var(--login-accent);
          cursor: pointer;
          border-radius: 0.25rem;
          border: 1px solid var(--login-border);
        }
        
        .login-submit {
          width: 100%;
          padding: 0.875rem;
          background-color: var(--login-accent);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .login-submit:hover {
          background-color: var(--login-accent-hover);
        }
        
        .login-error-box {
          background-color: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        
        .login-error-text {
          background-color: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          text-align: center;
          font-size: 0.875rem;
        }
        
        /* Responsive */
        @media (max-width: 900px) {
          .login-wrapper {
            flex-direction: column;
          }
          .login-left {
            padding: 3rem 2rem;
            flex: none;
          }
          .login-heading {
            font-size: 2.5rem;
            margin-top: 2rem;
          }
          .login-logo {
            margin-bottom: 0;
          }
          .login-subtext {
            margin-bottom: 0;
          }
          .login-card {
            padding: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
