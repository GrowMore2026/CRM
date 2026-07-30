import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import ClientDetailsModal from './ClientDetailsModal';
import { LogOut, Bell, Menu, X, Sun, Moon, Search as SearchIcon, ChevronDown, User, Settings } from 'lucide-react';
import { 
  HiOutlineSquares2X2, 
  HiOutlineBriefcase, 
  HiOutlineClipboardDocumentCheck, 
  HiOutlineWallet, 
  HiOutlineUserPlus, 
  HiOutlineUsers, 
  HiOutlineShieldCheck, 
  HiOutlineClipboardDocumentList,
  HiOutlineCalendarDays,
  HiOutlineDocumentText,
  HiOutlineXCircle,
  HiOutlineCheckCircle,
  HiOutlineBell,
  HiOutlineMegaphone,
  HiOutlineIdentification,
  HiOutlineCog6Tooth
} from "react-icons/hi2";

const Layout = () => {
  const { currentUser, logout, loadError, actionError, reloadData, dismissActionError, notifications, markNotificationRead, clients, users, selectedClient, setSelectedClient } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [openMenus, setOpenMenus] = useState({});

  const isAccountant = currentUser?.role === 'accountant';
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('dashboard-theme');
    if (saved) return saved;
    return 'light';
  });

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('settings-accent-color') || 'emerald';
  });

  useEffect(() => {
    localStorage.setItem('dashboard-theme', theme);
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  useEffect(() => {
    const ACCENTS = {
      emerald: { primary: '#10b981', hover: '#059669', light: 'rgba(16, 185, 129, 0.15)' },
      ocean: { primary: '#0284c7', hover: '#0369a1', light: 'rgba(2, 132, 199, 0.15)' },
      royal: { primary: '#7c3aed', hover: '#6d28d9', light: 'rgba(124, 58, 237, 0.15)' },
      tangerine: { primary: '#ea580c', hover: '#c2410c', light: 'rgba(234, 88, 12, 0.15)' }
    };
    const config = ACCENTS[accentColor];
    if (config) {
      localStorage.setItem('settings-accent-color', accentColor);
      document.documentElement.style.setProperty('--accent-primary', config.primary);
      document.documentElement.style.setProperty('--accent-hover', config.hover);
      document.documentElement.style.setProperty('--accent-light', config.light);
    }
  }, [accentColor]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const getPageTitle = () => {
    const p = location.pathname;
    
    if (p.includes('/users')) return 'System Users';
    if (p.includes('/admin-clients')) return 'Admin Clients';
    if (p.includes('/new-clients')) return 'New Clients';
    if (p.includes('/employee-data')) return 'Employee Data';
    if (p.includes('/add-loan-file')) return 'Add New Loan File';
    if (p.includes('/add-client')) return 'Add New Client';
    if (p.includes('/payment-history')) return 'Payment History';
    if (p.includes('/completed')) return 'Completed Documents';
    if (p.includes('/digital-marketing/leads')) return 'Marketing Leads';
    if (p.includes('/leads')) return 'Marketing Leads';
    if (p.includes('/holidays')) return `Holiday List ${new Date().getFullYear()}`;
    if (p.includes('/rejected-files') || p.includes('/loan-rejected-files')) return 'Rejected Files';
    
    if (p.includes('/profile')) return 'My Profile';
    if (p.includes('/settings')) return 'Settings';
    if (p.includes('/notifications')) return 'Notifications';
    if (p.includes('/raw-leads')) return 'Raw Leads';
    if (p.includes('/called-leads')) return 'Called Leads';
    if (p.includes('/pipeline')) {
      const stage = new URLSearchParams(location.search).get('stage');
      if (stage) return stage;
      return 'Pipeline';
    }
    
    if (p.includes('/loan-clients')) {
      return 'Loan Clients';
    }
    
    if (p.includes('/clients')) {
      if (currentUser?.role === 'superadmin') return 'All System Clients';
      if (currentUser?.role === 'accountant') return 'All Clients';
      if (currentUser?.role === 'digital_marketing') return 'Marketing Clients';
      if (currentUser?.role === 'loan_employee' || currentUser?.role === 'loan_admin') return 'Loan Clients';
      return 'My Clients';
    }
    
    return 'Dashboard';
  };

  const adminIds = new Set((users || []).filter(u => u.role === 'admin').map(u => u.id));
  const unassignedCount = (clients || []).filter(c => !adminIds.has(c.managedBy)).length;

  const navLinks = {
    admin: [
      { path: '/admin', label: 'Dashboard', icon: <HiOutlineSquares2X2 size={24} /> },
      { path: '/admin/clients', label: 'My Clients', icon: <HiOutlineBriefcase size={24} /> },
      { path: '/admin/completed', label: 'Completed Documents', icon: <HiOutlineClipboardDocumentCheck size={24} /> },
      { path: '/notifications', label: 'Notifications', icon: <HiOutlineBell size={24} /> },
      { path: '/holidays', label: 'Holiday List', icon: <HiOutlineCalendarDays size={24} /> },

      { path: '/settings', label: 'Settings', icon: <HiOutlineCog6Tooth size={24} /> },
    ],

    sales: [
      { path: '/sales', label: 'Dashboard', icon: <HiOutlineSquares2X2 size={24} /> },
      { path: '/sales/add-client', label: 'Add New Client', icon: <HiOutlineUserPlus size={24} /> },
      { path: '/sales/leads', label: 'Marketing Leads', icon: <HiOutlineUsers size={24} /> },
      { path: '/sales/clients', label: 'My Clients', icon: <HiOutlineBriefcase size={24} /> },
      { path: '/payment-history', label: 'Payment History', icon: <HiOutlineWallet size={24} /> },
      { path: '/notifications', label: 'Notifications', icon: <HiOutlineBell size={24} /> },
      { path: '/holidays', label: 'Holiday List', icon: <HiOutlineCalendarDays size={24} /> },
      { 
        path: '/raw-leads', 
        label: 'Raw Leads', 
        icon: <HiOutlineDocumentText size={24} />,
        submenu: [
          { path: '/raw-leads', label: 'Raw Leads' },
          { path: '/called-leads', label: 'Called Leads' }
        ]
      },

      { path: '/settings', label: 'Settings', icon: <HiOutlineCog6Tooth size={24} /> },
    ],

    accountant: [
      { path: '/accountant', label: 'Dashboard', icon: <HiOutlineSquares2X2 size={24} /> },
      { path: '/accountant/clients', label: 'All Clients', icon: <HiOutlineBriefcase size={24} /> },
      { path: '/accountant/employee-data', label: 'Employee Data', icon: <HiOutlineUsers size={24} /> },
      { path: '/payment-history', label: 'Payment History', icon: <HiOutlineWallet size={24} /> },
      { path: '/notifications', label: 'Notifications', icon: <HiOutlineBell size={24} /> },
      { path: '/holidays', label: 'Holiday List', icon: <HiOutlineCalendarDays size={24} /> },
      { path: '/settings', label: 'Settings', icon: <HiOutlineCog6Tooth size={24} /> },
    ],

    digital_marketing: [
      { path: '/digital-marketing', label: 'Dashboard', icon: <HiOutlineSquares2X2 size={24} /> },
      { path: '/digital-marketing/leads', label: 'Marketing Leads', icon: <HiOutlineUsers size={24} /> },
      { path: '/notifications', label: 'Notifications', icon: <HiOutlineBell size={24} /> },
      { path: '/holidays', label: 'Holiday List', icon: <HiOutlineCalendarDays size={24} /> },
      { path: '/settings', label: 'Settings', icon: <HiOutlineCog6Tooth size={24} /> },
    ],

    loan_employee: [
      { path: '/loan-employee', label: 'Dashboard', icon: <HiOutlineSquares2X2 size={24} /> },
      { path: '/loan-employee/add-loan-file', label: 'Add New Loan File', icon: <HiOutlineDocumentText size={24} /> },
      { 
        path: '/loan-employee/clients', 
        label: 'Clients', 
        icon: <HiOutlineUsers size={24} />,
        submenu: [
          { path: '/loan-employee/clients', label: 'All Clients' },
          { path: '/loan-employee/clients?status=Basic+Details', label: 'Basic Details' },
          { path: '/loan-employee/clients?status=Documentation', label: 'Documentation' },
          { path: '/loan-employee/clients?status=Login+Process', label: 'Login Process' },
          { path: '/loan-employee/clients?status=Login+With+Technical+Legal', label: 'Login With Technical Legal' },
          { path: '/loan-employee/clients?status=PD', label: 'PD' },
          { path: '/loan-employee/clients?status=Query', label: 'Query' },
          { path: '/loan-employee/clients?status=Query+Solve', label: 'Query Solve' },
          { path: '/loan-employee/clients?status=Sanction', label: 'Sanction' },
          { path: '/loan-employee/clients?status=Agreement', label: 'Agreement' },
          { path: '/loan-employee/clients?status=Disbursement', label: 'Disbursement' },
          { path: '/loan-employee/clients?status=PD+status+clear', label: 'PD status clear' },
          { path: '/loan-employee/clients?status=Cheque+Handover', label: 'Cheque Handover' },
        ]
      },
      { path: '/loan-employee/approved-files', label: 'Approved Files', icon: <HiOutlineCheckCircle size={24} /> },
      { path: '/loan-employee/rejected-files', label: 'Rejected Files', icon: <HiOutlineXCircle size={24} /> },
      { path: '/notifications', label: 'Notifications', icon: <HiOutlineBell size={24} /> },
      { path: '/holidays', label: 'Holiday List', icon: <HiOutlineCalendarDays size={24} /> },
      { 
        path: '/loan-raw-leads', 
        label: 'Loan Raw Leads', 
        icon: <HiOutlineDocumentText size={24} />,
        submenu: [
          { path: '/loan-raw-leads', label: 'Loan Raw Leads' },
          { path: '/loan-called-leads', label: 'Called Leads' }
        ]
      },
      { path: '/settings', label: 'Settings', icon: <HiOutlineCog6Tooth size={24} /> },
    ],

    loan_admin: [
      { path: '/loan-admin', label: 'Dashboard', icon: <HiOutlineSquares2X2 size={24} /> },
      { path: '/loan-admin/add-loan-file', label: 'Add New Loan File', icon: <HiOutlineDocumentText size={24} /> },
      { path: '/loan-admin/clients', label: 'Clients', icon: <HiOutlineUsers size={24} /> },
      { path: '/loan-admin/approved-files', label: 'Approved Files', icon: <HiOutlineCheckCircle size={24} /> },
      { path: '/loan-admin/rejected-files', label: 'Rejected Files', icon: <HiOutlineXCircle size={24} /> },
      { path: '/loan-admin/users', label: 'Loan Employees', icon: <HiOutlineUsers size={24} /> },
      { path: '/notifications', label: 'Notifications', icon: <HiOutlineBell size={24} /> },
      { path: '/holidays', label: 'Holiday List', icon: <HiOutlineCalendarDays size={24} /> },
      { 
        path: '/loan-raw-leads', 
        label: 'Loan Raw Leads', 
        icon: <HiOutlineDocumentText size={24} />,
        submenu: [
          { path: '/loan-raw-leads', label: 'Loan Raw Leads' },
          { path: '/loan-called-leads', label: 'Called Leads' }
        ]
      },
      { path: '/settings', label: 'Settings', icon: <HiOutlineCog6Tooth size={24} /> },
    ],

    superadmin: [
      { path: '/superadmin', label: 'Dashboard', icon: <HiOutlineSquares2X2 size={24} /> },
      { 
        path: '/superadmin/loan-clients', 
        label: 'Loan', 
        icon: <HiOutlineDocumentText size={24} />,
        submenu: [
          { path: '/superadmin/loan-clients', label: 'Clients' },
          { path: '/superadmin/loan-approved-files', label: 'Approved Files' },
          { path: '/superadmin/loan-rejected-files', label: 'Rejected Files' },
        ]
      },
      { path: '/superadmin/admin-clients', label: 'Admin Clients', icon: <HiOutlineShieldCheck size={24} /> },
      { path: '/superadmin/new-clients', label: 'New Clients', icon: <HiOutlineClipboardDocumentList size={24} />, badge: unassignedCount },
      { path: '/superadmin/leads', label: 'Marketing Leads', icon: <HiOutlineMegaphone size={24} /> },
      { 
        path: '/superadmin/users', 
        label: 'System Users', 
        icon: <HiOutlineUsers size={24} />,
        submenu: [
          { path: '/superadmin/users', label: 'All System Users' },
          { path: '/superadmin/users/admin', label: 'Admin Employees' },
          { path: '/superadmin/users/accountant', label: 'Accountant Employees' },
          { path: '/superadmin/users/digital-marketing', label: 'Digital Marketing Employees' },
          { path: '/superadmin/users/sales', label: 'Sales Employees' },
          { path: '/superadmin/users/loan-admin', label: 'Loan Admin Employees' },
          { path: '/superadmin/users/loan-employee', label: 'Loan Employees' },
        ]
      },
      { path: '/superadmin/employee-data', label: 'Employee Data', icon: <HiOutlineIdentification size={24} /> },
      { path: '/superadmin/clients', label: 'All System Clients', icon: <HiOutlineBriefcase size={24} /> },
      { path: '/superadmin/pipeline', label: 'Filter by Stage', icon: <HiOutlineSquares2X2 size={24} /> },

      { path: '/superadmin/completed', label: 'Completed Documents', icon: <HiOutlineClipboardDocumentCheck size={24} /> },
      { path: '/notifications', label: 'Notifications', icon: <HiOutlineBell size={24} /> },
      { path: '/holidays', label: 'Holiday List', icon: <HiOutlineCalendarDays size={24} /> },
      { 
        path: '/raw-leads', 
        label: 'Raw Leads', 
        icon: <HiOutlineDocumentText size={24} />,
        submenu: [
          { path: '/raw-leads', label: 'Raw Leads' },
          { path: '/called-leads', label: 'Called Leads' }
        ]
      },
      { 
        path: '/loan-raw-leads', 
        label: 'Loan Raw Leads', 
        icon: <HiOutlineDocumentText size={24} />,
        submenu: [
          { path: '/loan-raw-leads', label: 'Loan Raw Leads' },
          { path: '/loan-called-leads', label: 'Called Leads' }
        ]
      },
      { path: '/settings', label: 'Settings', icon: <HiOutlineCog6Tooth size={24} /> },
    ]
  };

  const links = currentUser ? navLinks[currentUser.role] : [];
  const dashboardPath = links.length > 0 ? links[0].path : '/';

  const sidebarContent = (
    <>
      <div className="sidebar-header">
        <Link to={dashboardPath} style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none', width: '100%' }}>
          <img 
            src={theme === 'light' ? '/Logos/logo.png' : '/Logos/white-logo.png'} 
            alt="GrowMore CRM Logo" 
            style={{ height: isCollapsed ? '28px' : '36px', transition: 'height 0.3s' }} 
            onError={(e) => { e.target.style.display='none' }} 
          />
        </Link>
      </div>

      <nav className="sidebar-nav">
        {links.map((link, idx) => {
          const basePath = link.path.split('?')[0];
          const isDashboard = link.label === 'Dashboard';
          
          let pathMatch;
          if (isDashboard) {
            pathMatch = location.pathname === basePath || location.pathname === `${basePath}/`;
          } else {
            pathMatch = location.pathname === basePath || location.pathname.startsWith(`${basePath}/`);
          }

          if (link.submenu) {
            const isSubmenuActive = location.pathname.startsWith(basePath) || link.submenu.some(sub => location.pathname === sub.path.split('?')[0]);
            const isOpen = openMenus[link.label] ?? isSubmenuActive;
            
            return (
              <div key={idx}>
                <div
                  className={`nav-item ${isSubmenuActive ? 'active' : ''}`}
                  onClick={() => {
                    setOpenMenus(prev => ({ ...prev, [link.label]: !isOpen }));
                    if (link.path) navigate(link.path);
                  }}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {link.icon}
                  <span className="nav-label" style={{ flex: 1 }}>{link.label}</span>
                  <ChevronDown className="nav-chevron" size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
                {isOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {link.submenu.map((sub, sidx) => {
                      const subParts = sub.path.split('?');
                      const subPathBase = subParts[0];
                      let isSubActive = location.pathname === subPathBase;
                      
                      if (isSubActive) {
                        const currentParams = new URLSearchParams(location.search);
                        const subParams = new URLSearchParams(subParts[1] || '');
                        if (currentParams.get('status') !== subParams.get('status')) {
                          isSubActive = false;
                        }
                      }
                      
                      return (
                        <Link
                          key={sidx}
                          to={sub.path}
                          className={`nav-item submenu-item ${isSubActive ? 'active' : ''}`}
                          onClick={closeSidebar}
                          style={{ paddingLeft: '3.25rem', paddingRight: '1.5rem', fontSize: '0.9rem', paddingTop: '0.85rem', paddingBottom: '0.85rem', minHeight: '36px' }}
                        >
                          <svg className="submenu-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '0.75rem' }}>
                            <circle cx="12" cy="12" r="5" />
                          </svg>
                          <span className="nav-label" style={{ flex: 1 }}>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = link.sub
            ? pathMatch && location.search.includes(encodeURIComponent(link.stageKey).replace(/%20/g, '+'))
            : pathMatch && !link.sub;
          
          return (
            <Link
              key={idx}
              to={link.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
              style={link.sub ? { paddingLeft: '2.2rem', fontSize: '0.8rem', opacity: isActive ? 1 : 0.75 } : {}}
            >
              {link.icon}
              <span className="nav-label" style={{ flex: 1 }}>{link.label}</span>
              {link.badge > 0 && (
                <span className="nav-badge" style={{ fontSize: '0.65rem', fontWeight: '700', background: '#ef4444', color: 'white', borderRadius: '9999px', padding: '0.1rem 0.42rem', minWidth: '1.1rem', textAlign: 'center' }}>
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button (Visual match to design) */}
      <div className="sidebar-footer">
        <div 
          className="sidebar-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </span>
          <span className="nav-label" style={{ flex: 1 }}>Collapse</span>
        </div>
      </div>
    </>
  );

  const isMaintenanceMode = localStorage.getItem('settings-maintenance-mode') === 'true';
  const isUserSuperAdmin = currentUser?.role === 'superadmin';

  if (isMaintenanceMode && !isUserSuperAdmin && currentUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '2rem', textAlign: 'center' }}>
        <div style={{ padding: '3rem', background: 'var(--bg-secondary)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', maxWidth: '500px' }}>
          <Settings size={64} style={{ color: 'var(--accent-primary)', marginBottom: '1.5rem', display: 'inline-block', animation: 'spin 4s linear infinite' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>System Maintenance</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            The CRM portal is currently undergoing scheduled maintenance and system optimization. 
            All services will resume shortly.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`dashboard-layout animate-fade-in ${theme === 'light' ? 'theme-light' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}>

        {/* Mobile hamburger - visually hidden on desktop, but we handle it in the new header */}
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
          style={{ display: 'none' }}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

      {/* Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="main-content" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
        {/* New Top Header Bar */}
        <header style={{ 
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1rem 2rem', 
          background: 'var(--bg-secondary)', 
          borderBottom: '1px solid var(--border-color)',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Left: Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {getPageTitle()}
              </h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {location.pathname.includes('/profile') 
                  ? 'Manage your account details' 
                  : `Welcome back, ${currentUser?.name?.split(' ')[0] || 'User'}!`}
              </span>
            </div>
          </div>

          {/* Right: Actions & Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            
            {/* Notifications Squircle */}
            <button
              onClick={() => navigate('/notifications')}
              style={{ 
                width: '44px', 
                height: '44px', 
                border: '1px solid var(--border-color)', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                position: 'relative', 
                background: 'transparent', 
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: '0', 
                  right: '0', 
                  background: 'var(--accent-primary)', 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%',
                  transform: 'translate(25%, -25%)',
                  border: '2px solid var(--bg-secondary)'
                }} />
              )}
            </button>

            {/* Vertical Divider */}
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.25rem 0 0.5rem' }}></div>

            {/* Profile Block */}
            <div>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {currentUser?.name || 'Admin User'}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {currentUser?.role === 'superadmin' ? 'Super Admin' : currentUser?.role?.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '14px', 
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hover))', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: '700', 
                  fontSize: '0.95rem' 
                }}>
                  {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'AD'}
                </div>
              </div>
            </div>

            {/* Logout Squircle Button */}
            <button
              onClick={() => setShowLogoutModal(true)}
              style={{ 
                width: '44px', 
                height: '44px', 
                border: '1px solid var(--border-color)', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: 'transparent', 
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginLeft: '0.25rem'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--danger-light)';
                e.currentTarget.style.color = 'var(--danger)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <LogOut size={20} />
            </button>

          </div>
        </header>

        <div style={{ flex: 1, padding: '2rem' }}>
          {(loadError || actionError) && (
            <div
              role="alert"
              style={{
                margin: '0 0 1rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: loadError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.12)',
              color: loadError ? 'var(--danger)' : 'var(--warning)',
              fontSize: '0.875rem',
            }}
          >
            {loadError && (
              <div style={{ marginBottom: actionError ? '0.75rem' : 0 }}>
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Database load</strong>
                {loadError}{' '}
                <button type="button" className="btn btn-secondary" style={{ marginTop: '0.35rem', padding: '0.25rem 0.65rem', fontSize: '0.8rem' }} onClick={() => reloadData()}>
                  Retry load
                </button>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                  Confirm your .env VITE_SUPABASE_URL points at the same Supabase project where you ran the SQL scripts. Restart npm run dev after editing .env.
                </span>
              </div>
            )}
            {actionError && (
              <div>
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Save failed</strong>
                {actionError}{' '}
                <button type="button" className="btn btn-secondary" style={{ marginTop: '0.35rem', padding: '0.25rem 0.65rem', fontSize: '0.8rem' }} onClick={dismissActionError}>
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}
          <Outlet context={{ theme, setTheme, accentColor, setAccentColor }} />
        </div>
      </main>

        </div>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className={theme === 'light' ? 'theme-light' : ''} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1.5rem', padding: '2rem', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)', padding: '1rem', borderRadius: '50%', marginBottom: '1.25rem' }}>
              <LogOut size={32} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Sign Out</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Are you sure you want to log out of your account?</p>
            
            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              <button 
                onClick={() => setShowLogoutModal(false)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', fontWeight: '600', fontSize: '0.95rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--border-color)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', fontWeight: '600', fontSize: '0.95rem', background: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedClient && <ClientDetailsModal client={selectedClient} onClose={() => setSelectedClient(null)} />}
    </>
  );
};

export default Layout;
