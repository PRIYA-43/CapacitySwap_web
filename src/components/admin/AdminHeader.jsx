import { useState } from 'react';
import { ChevronDown, LogOut, Menu, Moon, Search, ShieldCheck, Sun } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebase';
import { logoutUser } from '../../services/authService';

const currentDate = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

function AdminHeader({ onMenuClick, theme, onThemeChange }) {
  const [query, setQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    navigate(`/admin/users${params.size ? `?${params.toString()}` : ''}`);
  };

  const logout = async () => {
    try {
      await logoutUser();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Admin logout failed:', error);
      alert('Unable to log out. Please try again.');
    }
  };

  return (
    <header className="provider-topbar admin-topbar">
      <button type="button" className="icon-button sidebar-open-button" onClick={onMenuClick} aria-label="Open navigation"><Menu size={19} /></button>
      <form className="admin-header-search" role="search" onSubmit={submitSearch}>
        <Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search users and companies" placeholder="Search users, companies, listings" /><button type="submit" aria-label="Submit search"><Search size={15} /></button>
      </form>
      <span className="provider-date admin-date">{currentDate}</span>
      <div className="provider-top-actions">
        <button
          type="button"
          className="icon-button admin-theme-toggle"
          onClick={onThemeChange}
          aria-label={theme === 'dark' ? 'Use light mode' : 'Use dark mode'}
          title={theme === 'dark' ? 'Use light mode' : 'Use dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="popover-anchor">
          <button type="button" className="profile-trigger" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen}>
            <span className="profile-avatar admin-avatar"><ShieldCheck size={17} /></span>
            <span className="profile-copy"><strong>{auth.currentUser?.displayName || 'Administrator'}</strong><small>Platform Administrator</small></span><ChevronDown size={16} />
          </button>
          {profileOpen && <div className="top-popover profile-popover"><span>{auth.currentUser?.email || 'Administrator account'}</span><Link to="/admin/settings" onClick={() => setProfileOpen(false)}>Admin settings</Link><button type="button" onClick={logout}><LogOut size={15} /> Logout</button></div>}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
