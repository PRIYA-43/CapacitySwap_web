
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import ProviderDashboard from './pages/provider/ProviderDashboard';
import MyMachines from './pages/provider/MyMachines';
import AddMachine from './pages/provider/AddMachine';
import BookingRequests from './pages/provider/BookingRequests';

import ProviderLayout from './layouts/ProviderLayout';
import SeekerLayout from './layouts/SeekerLayout';

import ProtectedRoute from './routes/ProtectedRoute';

import SeekerDashboard from './pages/seeker/SeekerDashboard';
import BrowseMachines from './pages/seeker/BrowseMachines';
import MachineDetails from './pages/seeker/MachineDetails';
import MyRFQs from './pages/seeker/MyRFQs';
import CreateRFQ from './pages/seeker/CreateRFQ';
import Quotations from './pages/seeker/Quotations';
import MyBookings from './pages/seeker/MyBookings';
import ActiveJobs from './pages/seeker/ActiveJobs';
import Notifications from './pages/seeker/Notifications';
import SeekerProfile from './pages/seeker/SeekerProfile';
import ReportIssue from './pages/ReportIssue';

import AdminLayout from './layouts/AdminLayout';
import AdminRoute from './routes/AdminRoute';
import ProviderQuotations from './pages/provider/Quotations';
import ProviderBookings from './pages/provider/ProviderBookings';
import ProviderJobTracking from './pages/provider/ProviderJobTracking';
import ProviderNotifications from './pages/provider/ProviderNotifications';
import ProviderRecentActivity from './pages/provider/ProviderRecentActivity';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const CompanyVerification = lazy(() => import('./pages/admin/CompanyVerification'));
const MachineManagement = lazy(() => import('./pages/admin/MachineManagement'));
const RFQManagement = lazy(() => import('./pages/admin/RFQManagement'));
const BookingManagement = lazy(() => import('./pages/admin/BookingManagement'));
const JobMonitoring = lazy(() => import('./pages/admin/JobMonitoring'));
const ReportsManagement = lazy(() => import('./pages/admin/ReportsManagement'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

function AdminPage({ children }) {
  return (
    <Suspense
      fallback={
        <div className="admin-loading" role="status">
          Loading admin workspace...
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Provider workspace */}
      <Route
        path="/provider"
        element={
          <ProtectedRoute>
            <ProviderLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ProviderDashboard />} />
        <Route path="machines" element={<MyMachines />} />
        <Route path="machines/add" element={<AddMachine />} />
        <Route path="bookings" element={<BookingRequests />} />
        <Route path="confirmed-bookings" element={<ProviderBookings />} />
        <Route path="jobs" element={<ProviderJobTracking />} />
        <Route path="notifications" element={<ProviderNotifications />} />
        <Route path="recent-activity" element={<ProviderRecentActivity />} />
        <Route path="quotations" element={<ProviderQuotations />} />

        {/* Reuse the Firestore-connected company profile */}
        <Route path="profile" element={<SeekerProfile />} />
        <Route path="reports" element={<ReportIssue />} />
      </Route>

      {/* Seeker workspace */}
      <Route
        path="/seeker"
        element={
          <ProtectedRoute>
            <SeekerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SeekerDashboard />} />
        <Route path="machines" element={<BrowseMachines />} />
        <Route path="machines/:machineId" element={<MachineDetails />} />
        <Route path="rfqs" element={<MyRFQs />} />
        <Route path="rfqs/create" element={<CreateRFQ />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="bookings" element={<MyBookings />} />
        <Route path="jobs" element={<ActiveJobs />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<SeekerProfile />} />
        <Route path="reports" element={<ReportIssue />} />
      </Route>

      {/* Admin workspace */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminPage><AdminDashboard /></AdminPage>} />
        <Route path="users" element={<AdminPage><UserManagement /></AdminPage>} />
        <Route path="companies" element={<AdminPage><CompanyVerification /></AdminPage>} />
        <Route path="machines" element={<AdminPage><MachineManagement /></AdminPage>} />
        <Route path="rfqs" element={<AdminPage><RFQManagement /></AdminPage>} />
        <Route path="bookings" element={<AdminPage><BookingManagement /></AdminPage>} />
        <Route path="jobs" element={<AdminPage><JobMonitoring /></AdminPage>} />
        <Route path="reports" element={<AdminPage><ReportsManagement /></AdminPage>} />
        <Route path="notifications" element={<AdminPage><AdminNotifications /></AdminPage>} />
        <Route path="analytics" element={<AdminPage><AdminAnalytics /></AdminPage>} />
        <Route path="settings" element={<AdminPage><AdminSettings /></AdminPage>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
