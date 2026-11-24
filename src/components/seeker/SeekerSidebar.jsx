
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  FileWarning,
  LayoutDashboard,
  LogOut,
  Search,
} from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Brand from '../common/Brand';
import { auth } from '../../firebase/firebase';
import { logoutUser } from '../../services/authService';
import { getUserProfile } from '../../services/userService';

const navigation = [
  { label: 'Dashboard', to: '/seeker/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Browse Machines', to: '/seeker/machines', icon: Search, end: true },
  { label: 'My RFQs', to: '/seeker/rfqs', icon: ClipboardList, end: true },
  { label: 'Quotations', to: '/seeker/quotations', icon: BriefcaseBusiness, end: true },
  { label: 'My Bookings', to: '/seeker/bookings', icon: CalendarDays, end: true },
  { label: 'Active Jobs', to: '/seeker/jobs', icon: Activity, end: true },
  { label: 'Notifications', to: '/seeker/notifications', icon: Bell, end: true },
  { label: 'Reports & Complaints', to: '/seeker/reports', icon: FileWarning, end: true },
  { label: 'Company Profile', to: '/seeker/profile', icon: Building2, end: true },
];

function SeekerSidebar({ open = false, onNavigate = () => {}, onClose = () => {} }) {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('Company workspace');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setCompanyName('Company workspace');
        return;
      }

      try {
        const profile = await getUserProfile(firebaseUser.uid);

        if (profile) {
          setCompanyName(
            profile.companyName || profile.company || 'Company workspace'
          );
        }
      } catch (error) {
        console.error('Error loading seeker company details:', error);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Unable to log out. Please try again.');
    }
  };

  return (
    <>
      {open && (
        <button
          className="sidebar-backdrop"
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}

      <aside className={`provider-sidebar seeker-sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand />
        </div>

        <div className="sidebar-workspace">
          <span className="workspace-avatar">
            {companyName.charAt(0).toUpperCase()}
          </span>
          <span>
            <strong>{companyName}</strong>
            <small>Seeker workspace</small>
          </span>
        </div>

        <nav className="provider-nav" aria-label="Seeker dashboard navigation">
          <span className="sidebar-label">WORKSPACE</span>

          {navigation.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `provider-nav-link ${isActive && !to.includes('#') ? 'active' : ''}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link className="sidebar-help" to="/seeker/profile">
            <CircleHelp size={18} />
            <span>
              <strong>Need a hand?</strong>
              <small>View company profile</small>
            </span>
          </Link>

          <button
            type="button"
            className="provider-nav-link logout-link"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>

          <div className="sidebar-build">CAPACITYSWAP</div>
        </div>
      </aside>
    </>
  );
}

export default SeekerSidebar;
