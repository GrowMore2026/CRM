import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';
import { User, Mail, Shield, Calendar, Phone, Edit2, Save, X, Eye, EyeOff, Cake, Hash } from 'lucide-react';

const Profile = () => {
  const { currentUser, updateUser } = useApp();
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

  const handleSave = async () => {
    setErrorMsg('');
    const updates = { name: formData.name, phone: formData.phone, email: formData.email, birthdate: formData.birthdate, employeeId: formData.employeeId };
    
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
    // updateUser in AppProvider should handle backend update
    await updateUser(currentUser.id, updates);
    setIsEditing(false);
    setSaving(false);
    setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ 
        background: 'var(--bg-secondary)', 
        borderRadius: '12px', 
        padding: '2rem', 
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'var(--accent-primary)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '2rem',
              fontWeight: '700'
            }}>
              {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'AD'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>{currentUser?.name || 'Admin User'}</h2>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-tertiary)', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                <Shield size={12} />
                {currentUser?.role === 'superadmin' ? 'Super Admin' : currentUser?.role?.replace('_', ' ')}
              </div>
            </div>
          </div>
          
          {/* Edit / Save Actions */}
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
                  onClick={() => { setIsEditing(false); setFormData({ name: currentUser?.name || '', phone: currentUser?.phone || '', email: currentUser?.email || '' }); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                >
                  <X size={16} /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--success)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.85rem', opacity: saving ? 0.7 : 1 }}
                >
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Personal Information</h3>
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
                {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Unknown'}
              </span>
            </div>

          </div>
        </div>

        {/* Info Item - Password (Only in Edit Mode) */}
        {isEditing && (
          <div>
            <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
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
                  fontSize: '0.9rem' 
                }}
              >
                <Shield size={16} />
                {changePassword ? 'Cancel Password Change' : 'Change Password'}
              </button>
            </div>
            
            {changePassword && (
              <div>
                {errorMsg && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: '500' }}>
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
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPasswords ? "text" : "password"} 
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
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
                  <Shield size={14} /> Confirm New Password
                </span>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPasswords ? "text" : "password"} 
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
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
            </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
