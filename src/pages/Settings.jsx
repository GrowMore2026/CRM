import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { 
  Settings as SettingsIcon, Sun, Moon, Bell, Shield, Monitor, ToggleLeft, ToggleRight, 
  Download, User, Mail, Phone, Calendar, Cake, Hash, Save, X, Edit2, Eye, EyeOff 
} from 'lucide-react';

const Settings = () => {
  const { currentUser, updateUser, clients, leads, users, incentives } = useApp();
  const { theme, setTheme } = useOutletContext();
  const navigate = useNavigate();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  
  // Profile edit states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    birthdate: currentUser?.birthdate || '',
    employeeId: currentUser?.employeeId || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changePassword, setChangePassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Notification states
  const [emailAlerts, setEmailAlerts] = useState(() => {
    const saved = localStorage.getItem('settings-email-alerts');
    return saved !== 'false';
  });
  const [browserPopups, setBrowserPopups] = useState(() => {
    const saved = localStorage.getItem('settings-browser-popups');
    return saved !== 'false';
  });

  // Super Admin Control States
  const [inviteOnly, setInviteOnly] = useState(() => {
    const saved = localStorage.getItem('settings-invite-only');
    return saved !== 'false';
  });
  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    const saved = localStorage.getItem('settings-maintenance-mode');
    return saved === 'true';
  });

  const handleEmailToggle = () => {
    setEmailAlerts(prev => {
      localStorage.setItem('settings-email-alerts', !prev);
      return !prev;
    });
  };

  const handleBrowserToggle = () => {
    setBrowserPopups(prev => {
      localStorage.setItem('settings-browser-popups', !prev);
      return !prev;
    });
  };

  const handleInviteToggle = () => {
    setInviteOnly(prev => {
      localStorage.setItem('settings-invite-only', !prev);
      return !prev;
    });
  };

  const handleMaintenanceToggle = () => {
    setMaintenanceMode(prev => {
      localStorage.setItem('settings-maintenance-mode', !prev);
      return !prev;
    });
  };

  const handleSaveProfile = async () => {
    setErrorMsg('');
    const updates = { 
      name: formData.name, 
      phone: formData.phone, 
      email: formData.email, 
      birthdate: formData.birthdate, 
      employeeId: formData.employeeId 
    };
    
    if (changePassword) {
      if (formData.currentPassword !== currentUser?.password) {
        setErrorMsg('Current password is incorrect.');
        return;
      }
      if (!formData.newPassword || formData.newPassword !== formData.confirmPassword) {
        setErrorMsg('New password and confirm password do not match.');
        return;
      }
      updates.password = formData.newPassword;
    }

    setSaving(true);
    await updateUser(currentUser.id, updates);
    setIsEditing(false);
    setSaving(false);
    setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
  };

  const handleExportBackup = () => {
    try {
      const dataStr = JSON.stringify({
        exportedAt: new Date().toISOString(),
        clients: clients || [],
        leads: leads || [],
        users: users || [],
        incentives: incentives || [],
        systemVersion: 'v3.1.2-Stable'
      }, null, 2);
      
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `GrowMore_CRM_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      alert('Failed to generate backup: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '0 1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Section: Profile Settings & Info Editor */}
        <div className="card" style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '700' }}>
              <User size={18} style={{ color: 'var(--accent-primary)' }} /> Profile Information
            </h3>
            
            {/* Header controls for Edit Profile */}
            <div>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                >
                  <Edit2 size={16} /> Edit Profile
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => { 
                      setIsEditing(false); 
                      setFormData({ 
                        name: currentUser?.name || '', 
                        phone: currentUser?.phone || '', 
                        email: currentUser?.email || '',
                        birthdate: currentUser?.birthdate || '',
                        employeeId: currentUser?.employeeId || '',
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      }); 
                      setChangePassword(false);
                      setErrorMsg('');
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                  >
                    <X size={16} /> Cancel
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.85rem', opacity: saving ? 0.7 : 1 }}
                  >
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Info Item - Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <User size={14} /> Full Name
              </span>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
              ) : (
                <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {currentUser?.name || 'N/A'}
                </span>
              )}
            </div>

            {/* Info Item - Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Mail size={14} /> Email Address
              </span>
              {isEditing ? (
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
              ) : (
                <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {currentUser?.email || 'No email provided'}
                </span>
              )}
            </div>

            {/* Info Item - Phone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Phone size={14} /> Phone Number
              </span>
              {isEditing ? (
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({...formData, phone: val});
                  }}
                  style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
              ) : (
                <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {currentUser?.phone || 'No phone provided'}
                </span>
              )}
            </div>

            {/* Info Item - Birthdate */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Cake size={14} /> Birthdate
              </span>
              {isEditing ? (
                <input 
                  type="date" 
                  value={formData.birthdate}
                  onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                  style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
              ) : (
                <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {currentUser?.birthdate ? new Date(currentUser.birthdate).toLocaleDateString() : 'No birthdate provided'}
                </span>
              )}
            </div>

            {/* Info Item - Employee ID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Hash size={14} /> Employee ID
              </span>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  placeholder="e.g. EMP-1234"
                  style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
              ) : (
                <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {currentUser?.employeeId || 'No Employee ID provided'}
                </span>
              )}
            </div>

            {/* Info Item - Joined Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={14} /> Joined Date
              </span>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                {currentUser?.joing ? new Date(currentUser.joing).toLocaleDateString() : (currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Unknown')}
              </span>
            </div>
          </div>

          {/* Info Item - Password Change Sub-section (Only in Edit Mode) */}
          {isEditing && (
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
              <button 
                type="button"
                onClick={() => setChangePassword(!changePassword)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  background: changePassword ? 'var(--bg-tertiary)' : 'var(--bg-primary)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid var(--border-color)', 
                  padding: '0.5rem 1rem', 
                  borderRadius: 'var(--radius-md)', 
                  cursor: 'pointer', 
                  fontWeight: '600', 
                  fontSize: '0.85rem',
                  marginBottom: '1rem'
                }}
              >
                <Shield size={16} />
                {changePassword ? 'Cancel Password Change' : 'Change Password'}
              </button>
              
              {changePassword && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {errorMsg && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: '500' }}>
                      {errorMsg}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Shield size={14} /> Current Password
                      </span>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showPasswords ? "text" : "password"} 
                          placeholder="Enter current password"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                          style={{ padding: '0.5rem', paddingRight: '2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                        >
                          {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Shield size={14} /> New Password
                      </span>
                      <input 
                        type={showPasswords ? "text" : "password"} 
                        placeholder="New password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Shield size={14} /> Confirm New Password
                      </span>
                      <input 
                        type={showPasswords ? "text" : "password"} 
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Section 1: Themes & Appearance */}
        <div className="card" style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '700' }}>
            <Monitor size={18} style={{ color: 'var(--accent-primary)' }} /> Appearance
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Dark Mode toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Theme Mode</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Choose light or dark environment for the portal.</div>
              </div>
              <div 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                {theme === 'light' ? <Sun size={18} color="var(--warning)" /> : <Moon size={18} color="var(--accent-primary)" />}
                <div style={{ 
                  width: '40px', height: '22px', background: 'var(--accent-primary)', borderRadius: '999px', position: 'relative', marginLeft: '0.25rem', transition: 'all 0.2s'
                }}>
                  <div style={{ 
                    position: 'absolute', top: '2px', left: theme === 'light' ? '20px' : '2px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: 'all 0.2s'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Super Admin Controls (Only visible to Super Admins) */}
        {isSuperAdmin && (
          <div className="card" style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '700' }}>
              <Shield size={18} style={{ color: 'var(--accent-primary)' }} /> Super Admin Controls
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Registration Mode */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Registration Restriction</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Limit account creation to invite-only. When disabled, open signup is active.</div>
                </div>
                <div onClick={handleInviteToggle} style={{ cursor: 'pointer' }}>
                  <div style={{ 
                    width: '40px', height: '22px', background: inviteOnly ? 'var(--accent-primary)' : 'var(--text-muted)', borderRadius: '999px', position: 'relative', transition: 'all 0.2s'
                  }}>
                    <div style={{ 
                      position: 'absolute', top: '2px', left: inviteOnly ? '20px' : '2px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: 'all 0.2s'
                    }} />
                  </div>
                </div>
              </div>

              {/* Maintenance Mode */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>System Maintenance Mode</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Put portal offline for other employees (blocks access with maintenance page).</div>
                </div>
                <div onClick={handleMaintenanceToggle} style={{ cursor: 'pointer' }}>
                  <div style={{ 
                    width: '40px', height: '22px', background: maintenanceMode ? 'var(--danger)' : 'var(--text-muted)', borderRadius: '999px', position: 'relative', transition: 'all 0.2s'
                  }}>
                    <div style={{ 
                      position: 'absolute', top: '2px', left: maintenanceMode ? '20px' : '2px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: 'all 0.2s'
                    }} />
                  </div>
                </div>
              </div>

              {/* System Database Backup */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Export System Backup</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generate and download a complete JSON backup of the CRM database (Clients, Leads, etc.).</div>
                </div>
                <button 
                  onClick={handleExportBackup}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                >
                  <Download size={16} /> Export Backup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Notifications */}
        <div className="card" style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '700' }}>
            <Bell size={18} style={{ color: 'var(--accent-primary)' }} /> Notifications
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Email alerts */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Email Notifications</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Receive email alerts when clients request a stage change.</div>
              </div>
              <div onClick={handleEmailToggle} style={{ cursor: 'pointer' }}>
                <div style={{ 
                  width: '40px', height: '22px', background: emailAlerts ? 'var(--accent-primary)' : 'var(--text-muted)', borderRadius: '999px', position: 'relative', transition: 'all 0.2s'
                }}>
                  <div style={{ 
                    position: 'absolute', top: '2px', left: emailAlerts ? '20px' : '2px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: 'all 0.2s'
                  }} />
                </div>
              </div>
            </div>

            {/* Browser popups */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>System Toast Popups</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Show real-time notifications on the upper right corner of your browser.</div>
              </div>
              <div onClick={handleBrowserToggle} style={{ cursor: 'pointer' }}>
                <div style={{ 
                  width: '40px', height: '22px', background: browserPopups ? 'var(--accent-primary)' : 'var(--text-muted)', borderRadius: '999px', position: 'relative', transition: 'all 0.2s'
                }}>
                  <div style={{ 
                    position: 'absolute', top: '2px', left: browserPopups ? '20px' : '2px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: 'all 0.2s'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: System Information */}
        <div className="card" style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '700' }}>
            <Shield size={18} style={{ color: 'var(--accent-primary)' }} /> System Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Logged in as:</span>
              <strong style={{ display: 'block', color: 'var(--text-primary)', marginTop: '0.2rem' }}>{currentUser?.name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Access Role:</span>
              <strong style={{ display: 'block', color: 'var(--text-primary)', marginTop: '0.2rem', textTransform: 'capitalize' }}>
                {currentUser?.role === 'superadmin' ? 'Super Admin' : currentUser?.role}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Portal Version:</span>
              <strong style={{ display: 'block', color: 'var(--text-primary)', marginTop: '0.2rem' }}>v3.1.2-Stable</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Connection Status:</span>
              <strong style={{ display: 'block', color: '#10b981', marginTop: '0.2rem' }}>● Connected to Supabase</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
