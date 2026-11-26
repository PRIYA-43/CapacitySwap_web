
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { auth } from '../../firebase/firebase';
import { logoutUser } from '../../services/authService';
import { getUserProfile } from '../../services/userService';

const currentDate = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

function SeekerHeader({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchState, setSearchState] = useState(() => ({
    locationSearch: location.search,
    value: new URLSearchParams(location.search).get('search') || '',
  }));

  const query = searchState.locationSearch === location.search
    ? searchState.value
    : new URLSearchParams(location.search).get('search') || '';

  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() =>
    window.localStorage.getItem('capacityswap-theme') || 'light'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('capacityswap-theme', theme);
  }, [theme]);

  const [userProfile, setUserProfile] = useState({
    fullName: '',
    companyName: '',
    email: '',
  });

  // Load the authenticated user's details from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUserProfile({
          fullName: '',
          companyName: '',
          email: '',
        });
        return;
      }

      try {
        const profile = await getUserProfile(firebaseUser.uid);

        setUserProfile({
          fullName:
            profile?.fullName ||
            firebaseUser.displayName ||
            'Seeker account',

          companyName:
            profile?.companyName ||
            profile?.company ||
            'Company not set',

          email: profile?.email || firebaseUser.email || '',
        });
      } catch (error) {
        console.error('Error loading seeker header profile:', error);

        setUserProfile({
          fullName: firebaseUser.displayName || 'Seeker account',
          companyName: 'Company not set',
          email: firebaseUser.email || '',
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (query.trim()) {
      params.set('search', query.trim());
    }

    navigate(`/seeker/machines${params.size ? `?${params.toString()}` : ''}`);
  };

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
    <header className="provider-topbar seeker-topbar">
      <button
        type="button"
        className="icon-button sidebar-open-button"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu size={19} />
      </button>

      <form
        className="seeker-header-search"
        onSubmit={handleSearch}
        role="search"
      >
        <Search size={17} aria-hidden="true" />

        <input
          aria-label="Search machines"
          value={query}
          onChange={(event) =>
            setSearchState({
              locationSearch: location.search,
              value: event.target.value,
            })
          }
          placeholder="Search machines or categories"
        />

        <button type="submit" aria-label="Submit search">
          <Search size={16} />
        </button>
      </form>

      <span className="provider-date seeker-date">
        {currentDate}
      </span>

      <div className="provider-top-actions">
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

        {/* Firebase user profile */}
        <div className="popover-anchor">
          <button
            type="button"
            className="profile-trigger"
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
          >
            <span className="profile-avatar">
              {(userProfile.fullName || 'S').charAt(0).toUpperCase()}
            </span>

            <span className="profile-copy">
              <strong>
                {userProfile.fullName || 'Seeker account'}
              </strong>

              <small>
                {userProfile.companyName || 'Company not set'}
              </small>
            </span>

            <ChevronDown size={16} />
          </button>

          {profileOpen && (
            <div className="top-popover profile-popover">
              <span>
                {userProfile.email || 'Email not available'}
              </span>

              <Link
                to="/seeker/profile"
                onClick={() => setProfileOpen(false)}
              >
                <UserRound size={15} />
                Company profile
              </Link>

              <button type="button" onClick={handleLogout}>
                <LogOut size={15} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default SeekerHeader;
