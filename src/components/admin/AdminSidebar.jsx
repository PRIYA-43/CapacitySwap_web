import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  FileWarning,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import Brand from '../common/Brand';
import { logoutUser } from '../../services/authService';

const links = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, end: true },
  { label: 'User Management', to: '/admin/users', icon: Users },
  { label: 'Company Verification', to: '/admin/companies', icon: ShieldCheck },
  { label: 'Machine Management', to: '/admin/machines', icon: Wrench },
  { label: 'RFQ Management', to: '/admin/rfqs', icon: ClipboardList },
  { label: 'Booking Management', to: '/admin/bookings', icon: CalendarDays },
  { label: 'Job Monitoring', to: '/admin/jobs', icon: Activity },
  { label: 'Reports & Complaints', to: '/admin/reports', icon: FileWarning },
  { label: 'Notifications', to: '/admin/notifications', icon: Bell },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

function AdminSidebar({ open = false, onNavigate = () => {}, onClose = () => {} }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Admin logout failed:', error);
      alert('Unable to log out. Please try again.');
    }
  };

  return (
    <>
      {open && <button className="sidebar-backdrop" type="button" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`provider-sidebar admin-sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><Brand /></div>
        <div className="admin-workspace-badge"><span><ShieldCheck size={17} /></span><div><strong>Platform Admin</strong><small>CONTROL CENTER</small></div></div>
        <nav className="provider-nav" aria-label="Admin dashboard navigation">
          <span className="sidebar-label">ADMINISTRATION</span>
          {links.map(({ label, to, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => `provider-nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button type="button" className="provider-nav-link logout-link" onClick={handleLogout}><LogOut size={18} /><span>Logout</span></button>
          <div className="sidebar-build">CAPACITYSWAP</div>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
