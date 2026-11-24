import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from '../components/admin/AdminHeader';
import AdminSidebar from '../components/admin/AdminSidebar';
import { EMPTY_ADMIN_DATA, subscribeToAdminData } from '../services/adminService';

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() =>
    window.localStorage.getItem('capacityswap-admin-theme') || 'light'
  );
  const [data, setData] = useState(EMPTY_ADMIN_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      return subscribeToAdminData(
        (records) => {
          setData(records);
          setLoading(false);
          setError('');
        },
        (subscriptionError) => {
          console.error('Admin data subscription error:', subscriptionError);
          setError(subscriptionError.message || 'Unable to load platform records.');
          setLoading(false);
        }
      );
    } catch (subscriptionError) {
      console.error('Admin data subscription error:', subscriptionError);
      setError(subscriptionError.message || 'Unable to load platform records.');
      setLoading(false);
      return undefined;
    }
  }, []);

  return (
    <div className="provider-app admin-app" data-theme={theme}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={() => setSidebarOpen(false)} />
      <div className="provider-main">
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          theme={theme}
          onThemeChange={() => {
            const nextTheme = theme === 'dark' ? 'light' : 'dark';
            window.localStorage.setItem('capacityswap-admin-theme', nextTheme);
            setTheme(nextTheme);
          }}
        />
        <main className="provider-content admin-content">
          <Outlet context={{ data, loading, error }} />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
