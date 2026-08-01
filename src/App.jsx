import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppProvider';

// Pages
import Login from './pages/Login';
import AdminDashboard, { ManageUsers } from './pages/AdminDashboard';
import SalesDashboard from './pages/SalesDashboard';
import AccountantDashboard from './pages/AccountantDashboard';
import DigitalMarketingDashboard from './pages/DigitalMarketingDashboard';
import LoanEmployeeDashboard from './pages/LoanEmployeeDashboard';
import LoanAdminDashboard from './pages/LoanAdminDashboard';
import LoanClients from './pages/LoanClients';
import PaymentHistory from './pages/PaymentHistory';
import HolidayList from './pages/HolidayList';
import Profile from './pages/Profile';
import RawLeads from './pages/RawLeads';
import CalledLeads from './pages/CalledLeads';
import LoanRawLeads from './pages/LoanRawLeads';
import LoanCalledLeads from './pages/LoanCalledLeads';
import NotificationsPage from './pages/NotificationsPage';
import Settings from './pages/Settings';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  const { currentUser } = useApp();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={
            currentUser?.role === 'admin' ? <Navigate to="/admin" /> :
            currentUser?.role === 'sales' ? <Navigate to="/sales" /> :
            currentUser?.role === 'accountant' ? <Navigate to="/accountant" /> :
            currentUser?.role === 'digital_marketing' ? <Navigate to="/digital-marketing" /> :
            currentUser?.role === 'loan_employee' ? <Navigate to="/loan-employee" /> :
            currentUser?.role === 'loan_admin' ? <Navigate to="/loan-admin" /> :
            currentUser?.role === 'superadmin' ? <Navigate to="/superadmin" /> :
            <Navigate to="/login" />
          } />
          <Route path="admin/*" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard readOnly={false} canManageUsers={true} />
            </ProtectedRoute>
          } />
          <Route path="sales/*" element={
            <ProtectedRoute allowedRoles={['sales']}>
              <SalesDashboard />
            </ProtectedRoute>
          } />
          <Route path="superadmin/*" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <AdminDashboard readOnly={true} canManageUsers={true} />
            </ProtectedRoute>
          } />
          <Route path="superadmin/loan-dashboard/*" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <LoanAdminDashboard hideHolidays={true} />
            </ProtectedRoute>
          } />
          <Route path="superadmin/loan-clients" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <LoanClients />
            </ProtectedRoute>
          } />
          <Route path="superadmin/loan-approved-files" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <LoanClients filterStatus="Cheque Handover" />
            </ProtectedRoute>
          } />
          <Route path="superadmin/loan-rejected-files" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <LoanClients filterStatus="Rejected" />
            </ProtectedRoute>
          } />
          <Route path="accountant/*" element={
            <ProtectedRoute allowedRoles={['accountant']}>
              <AccountantDashboard />
            </ProtectedRoute>
          } />
          <Route path="digital-marketing/*" element={
            <ProtectedRoute allowedRoles={['digital_marketing']}>
              <DigitalMarketingDashboard />
            </ProtectedRoute>
          } />
          <Route path="loan-employee/*" element={
            <ProtectedRoute allowedRoles={['loan_employee']}>
              <LoanEmployeeDashboard />
            </ProtectedRoute>
          } />
          <Route path="loan-employee/clients" element={
            <ProtectedRoute allowedRoles={['loan_employee']}>
              <LoanClients />
            </ProtectedRoute>
          } />
          <Route path="loan-employee/approved-files" element={
            <ProtectedRoute allowedRoles={['loan_employee']}>
              <LoanClients filterStatus="Cheque Handover" />
            </ProtectedRoute>
          } />
          <Route path="loan-employee/rejected-files" element={
            <ProtectedRoute allowedRoles={['loan_employee']}>
              <LoanClients filterStatus="Rejected" />
            </ProtectedRoute>
          } />
          <Route path="loan-admin/*" element={
            <ProtectedRoute allowedRoles={['loan_admin']}>
              <LoanAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="loan-admin/clients" element={
            <ProtectedRoute allowedRoles={['loan_admin']}>
              <LoanClients />
            </ProtectedRoute>
          } />
          <Route path="loan-admin/approved-files" element={
            <ProtectedRoute allowedRoles={['loan_admin']}>
              <LoanClients filterStatus="Cheque Handover" />
            </ProtectedRoute>
          } />
          <Route path="loan-admin/rejected-files" element={
            <ProtectedRoute allowedRoles={['loan_admin']}>
              <LoanClients filterStatus="Rejected" />
            </ProtectedRoute>
          } />
          <Route path="loan-admin/users" element={
            <ProtectedRoute allowedRoles={['loan_admin']}>
              <ManageUsers roleFilter="loan_employee" readOnly={false} canManageUsers={true} allowedRolesToCreate={['loan_employee']} />
            </ProtectedRoute>
          } />
          <Route path="loan-raw-leads" element={
            <ProtectedRoute allowedRoles={['superadmin', 'loan_admin', 'loan_employee']}>
              <LoanRawLeads />
            </ProtectedRoute>
          } />
          <Route path="loan-called-leads" element={
            <ProtectedRoute allowedRoles={['superadmin', 'loan_admin', 'loan_employee']}>
              <LoanCalledLeads />
            </ProtectedRoute>
          } />
          <Route path="payment-history" element={
            <ProtectedRoute allowedRoles={['admin', 'sales', 'accountant', 'superadmin']}>
              <PaymentHistory />
            </ProtectedRoute>
          } />
          <Route path="holidays" element={<HolidayList />} />
          <Route path="raw-leads" element={<RawLeads />} />
          <Route path="called-leads" element={<CalledLeads />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
