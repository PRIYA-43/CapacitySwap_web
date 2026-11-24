
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import {
  Activity,
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  FileWarning,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PackagePlus,
  Settings,
  Sun,
  Wrench,
  X,
} from 'lucide-react';

import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import Brand from '../components/common/Brand';
import { auth } from '../firebase/firebase';
import { logoutUser } from '../services/authService';
import { getUserProfile } from '../services/userService';

const navigation = [
  {
    label: 'Dashboard',
    to: '/provider/dashboard',
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: 'My Machines',
    to: '/provider/machines',
    icon: Wrench,
    end: true,
  },
  {
    label: 'Add Machine',
    to: '/provider/machines/add',
    icon: PackagePlus,
    end: true,
  },
  {
    label: 'RFQ Inbox',
    to: '/provider/bookings',
    icon: ClipboardList,
    end: true,
  },
  {
    label: 'Bookings',
    to: '/provider/confirmed-bookings',
    icon: BriefcaseBusiness,
    end: true,
  },
  {
    label: 'Job Tracking',
    to: '/provider/jobs',
    icon: Activity,
    end: true,
  },
  {
    // FIXED: Navigate to the actual quotations route.
    label: 'Quotations',
    to: '/provider/quotations',
    icon: BriefcaseBusiness,
    end: true,
  },
  {
    label: 'Recent Activity',
    to: '/provider/recent-activity',
    icon: Activity,
    end: true,
  },
  {
    label: 'Notifications',
    to: '/provider/notifications',
    icon: Bell,
    end: true,
  },
  {
    label: 'Reports & Complaints',
    to: '/provider/reports',
    icon: FileWarning,
    end: true,
  },
  {
    label: 'Company Profile',
    to: '/provider/profile',
    icon: Building2,
    end: true,
  },
];

const currentDate = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

function ProviderLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [userProfile, setUserProfile] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [theme, setTheme] = useState(() =>
    window.localStorage.getItem('capacityswap-theme') || 'light'
  );

  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('capacityswap-theme', theme);
  }, [theme]);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) setUserProfile(null);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);

        if (active) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Provider layout profile error:', error);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const companyName =
    userProfile?.companyName || 'Company workspace';

  const fullName =
    userProfile?.fullName || 'Provider account';

  const email =
    userProfile?.email || auth.currentUser?.email || '';

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logoutUser();
      setUserProfile(null);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Firebase logout error:', error);
      alert('Unable to log out. Please try again.');
      setLoggingOut(false);
    }
  };

  return (
    <div className="provider-app">
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`provider-sidebar ${
          sidebarOpen ? 'sidebar-open' : ''
        }`}
      >
        <div className="sidebar-brand">
          <Brand />

          <button
            type="button"
            className="icon-button sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-workspace">
          <span className="workspace-avatar">
            {companyName.charAt(0).toUpperCase()}
          </span>

          <span>
            <strong>{companyName}</strong>
            <small>Provider workspace</small>
          </span>

          <ChevronDown size={15} />
        </div>

        <nav
          className="provider-nav"
          aria-label="Provider dashboard navigation"
        >
          <span className="sidebar-label">WORKSPACE</span>

          {navigation.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              onClick={() => {
                setSidebarOpen(false);
                setProfileOpen(false);
                setNotificationsOpen(false);
              }}
              className={({ isActive }) =>
                `provider-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <a
            className="sidebar-help"
            href="mailto:hello@capacityswap.io"
          >
            <CircleHelp size={18} />

            <span>
              <strong>Need a hand?</strong>
              <small>Email our team</small>
            </span>
          </a>

          <button
            type="button"
            className="provider-nav-link logout-link"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={18} />
            <span>
              {loggingOut ? 'Logging out...' : 'Logout'}
            </span>
          </button>

          <div className="sidebar-build">
            CAPACITYSWAP
          </div>
        </div>
      </aside>

      <div className="provider-main">
        <header className="provider-topbar">
          <button
            type="button"
            className="icon-button sidebar-open-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <div className="provider-date">
            {currentDate}
          </div>

          <div className="provider-top-actions">
            <div className="popover-anchor">
              <button
                type="button"
                className="icon-button notification-button"
                onClick={() =>
                  setNotificationsOpen((open) => !open)
                }
                aria-label="Show notifications"
              >
                <Bell size={18} />
              </button>

              {notificationsOpen && (
                <div className="top-popover notification-popover">
                  <strong>Recent notifications</strong>
                  <p>No notifications yet.</p>

                  <Link
                    to="/provider/notifications"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    View notifications
                  </Link>
                </div>
              )}
            </div>

            <div className="popover-anchor">
              <button
                type="button"
                className="icon-button header-settings-button"
                onClick={() => setSettingsOpen((open) => !open)}
                aria-label="Open settings"
                title="Settings"
              >
                <Settings size={18} />
              </button>
              {settingsOpen && (
                <div className="top-popover settings-popover">
                  <strong>Display settings</strong>
                  <p>Choose the appearance used across your workspace.</p>
                  <button
                    type="button"
                    onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
                  >
                    {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                    {theme === 'dark' ? 'Use light mode' : 'Use dark mode'}
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="icon-button theme-toggle-button"
              onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Use light mode' : 'Use dark mode'}
              title={theme === 'dark' ? 'Use light mode' : 'Use dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="popover-anchor">
              <button
                type="button"
                className="profile-trigger"
                onClick={() =>
                  setProfileOpen((open) => !open)
                }
                aria-expanded={profileOpen}
              >
                <span className="profile-avatar">
                  {fullName.charAt(0).toUpperCase()}
                </span>

                <span className="profile-copy">
                  <strong>{fullName}</strong>
                  <small>{companyName}</small>
                </span>

                <ChevronDown size={16} />
              </button>

              {profileOpen && (
                <div className="top-popover profile-popover">
                  <span>{email}</span>

                  <Link
                    to="/provider/profile"
                    onClick={() => setProfileOpen(false)}
                  >
                    Company profile
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    <LogOut size={15} />
                    {loggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main
          className="provider-content"
          onClick={() => {
            if (profileOpen) setProfileOpen(false);
            if (settingsOpen) setSettingsOpen(false);
            if (notificationsOpen) {
              setNotificationsOpen(false);
            }
          }}
        >
          <Outlet context={{ profile: userProfile }} />
        </main>
      </div>
    </div>
  );
}

export default ProviderLayout;
