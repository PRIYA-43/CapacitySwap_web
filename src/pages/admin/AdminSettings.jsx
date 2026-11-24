
import { useEffect, useState } from 'react';
import {
  Bell,
  Building2,
  Check,
  RotateCcw,
  Save,
  UserRound,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { PageHeading } from './UserManagement';

const SETTINGS_KEY = 'capacitySwapAdminPreferences';

const DEFAULT_SETTINGS = {
  platformName: 'CapacitySwap',
  supportEmail: 'hello@capacityswap.io',
  newRegistration: true,
  verificationRequest: true,
  reportedComplaint: true,
  bookingActivity: false,
  compactTables: false,
};

function loadSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);

    if (!stored) {
      return { ...DEFAULT_SETTINGS };
    }

    const parsed = JSON.parse(stored);

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch (error) {
    console.error('Unable to load admin preferences:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

function AdminSettings() {
  const [settings, setSettings] = useState(loadSettings);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
  });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Keep admin profile in sync with Firebase Auth.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setProfile({
        name: user?.displayName || 'Administrator',
        email: user?.email || '',
      });
    });

    return () => unsubscribe();
  }, []);

  const update = (event) => {
    const { name, value, checked, type } = event.target;

    setSettings((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setNotice('');
    setError('');
  };

  const save = (event) => {
    event.preventDefault();
    setNotice('');
    setError('');

    if (!settings.platformName.trim()) {
      setError('Platform name is required.');
      return;
    }

    if (!settings.supportEmail.trim()) {
      setError('Support email is required.');
      return;
    }

    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
      );

      setNotice('Your preferences have been saved successfully.');
    } catch (saveError) {
      console.error('Admin settings save error:', saveError);
      setError('Unable to save settings in this browser.');
    }
  };

  const resetSettings = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    setNotice('');
    setError('');
  };

  return (
    <div className="admin-page">
      <PageHeading
        eyebrow="WORKSPACE PREFERENCES"
        title="Admin settings"
        subtitle="Manage administrator profile, platform information, notifications, and display preferences."
      />

      {notice && (
        <p className="admin-save-notice" role="status">
          <Check size={16} />
          {notice}
        </p>
      )}

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      <form
        className="admin-settings-grid"
        onSubmit={save}
      >
        {/* ADMIN PROFILE */}
        <section className="admin-panel admin-settings-panel">
          <div className="admin-settings-heading">
            <span>
              <UserRound size={17} />
            </span>

            <div>
              <h2>Admin profile</h2>
              <p>Account details from your authenticated Firebase session.</p>
            </div>
          </div>

          <div className="admin-settings-fields">
            <label>
              <span>Display name</span>
              <input
                name="name"
                value={profile.name}
                readOnly
              />
            </label>

            <label>
              <span>Admin email</span>
              <input
                name="email"
                type="email"
                value={profile.email}
                readOnly
              />
            </label>
          </div>
        </section>

        {/* PLATFORM INFORMATION */}
        <section className="admin-panel admin-settings-panel">
          <div className="admin-settings-heading">
            <span>
              <Building2 size={17} />
            </span>

            <div>
              <h2>Platform information</h2>
              <p>Manage platform display and contact information.</p>
            </div>
          </div>

          <div className="admin-settings-fields">
            <label>
              <span>Platform name</span>
              <input
                name="platformName"
                value={settings.platformName}
                onChange={update}
                placeholder="CapacitySwap"
                required
              />
            </label>

            <label>
              <span>Support email</span>
              <input
                name="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={update}
                placeholder="support@example.com"
                required
              />
            </label>
          </div>
        </section>

        {/* NOTIFICATION PREFERENCES */}
        <section className="admin-panel admin-settings-panel">
          <div className="admin-settings-heading">
            <span>
              <Bell size={17} />
            </span>

            <div>
              <h2>Notification preferences</h2>
              <p>Choose the activity types you want to prioritize.</p>
            </div>
          </div>

          <div className="admin-setting-toggles">
            <Toggle
              name="newRegistration"
              checked={settings.newRegistration}
              onChange={update}
              title="New company registrations"
            />

            <Toggle
              name="verificationRequest"
              checked={settings.verificationRequest}
              onChange={update}
              title="Company verification requests"
            />

            <Toggle
              name="reportedComplaint"
              checked={settings.reportedComplaint}
              onChange={update}
              title="Reported complaints"
            />

            <Toggle
              name="bookingActivity"
              checked={settings.bookingActivity}
              onChange={update}
              title="Booking activity"
            />
          </div>
        </section>

        {/* DISPLAY PREFERENCES */}
        <section className="admin-panel admin-settings-panel">
          <div className="admin-settings-heading">
            <span>
              <Building2 size={17} />
            </span>

            <div>
              <h2>Display preferences</h2>
              <p>Customize how admin pages are displayed.</p>
            </div>
          </div>

          <div className="admin-setting-toggles">
            <Toggle
              name="compactTables"
              checked={settings.compactTables}
              onChange={update}
              title="Prefer compact tables"
            />
          </div>
        </section>

        {/* ACTIONS */}
        <div className="admin-settings-submit">
          <button
            type="button"
            className="admin-button"
            onClick={resetSettings}
          >
            <RotateCcw size={15} />
            Reset defaults
          </button>

          <button
            type="submit"
            className="admin-button admin-button-primary"
          >
            <Save size={15} />
            Save preferences
          </button>
        </div>
      </form>
    </div>
  );
}

function Toggle({ name, checked, onChange, title }) {
  return (
    <label className="admin-toggle-row">
      <span>{title}</span>

      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
      />

      <i />
    </label>
  );
}

export default AdminSettings;
