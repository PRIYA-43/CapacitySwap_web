
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

import {
  Building2,
  Camera,
  Check,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  X,
} from 'lucide-react';

import { auth, db, storage } from '../../firebase/firebase';

const emptyProfile = {
  company: '',
  email: '',
  phone: '',
  address: '',
  businessType: '',
  gstin: '',
  description: '',
  logo: '',
};

function SeekerProfile() {
  const [profile, setProfile] = useState(emptyProfile);
  const [form, setForm] = useState(emptyProfile);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [companyId, setCompanyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;

      if (!user) {
        setError('Please log in to view your company profile.');
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
          throw new Error('Your user profile was not found.');
        }

        const userData = userSnapshot.data();

        if (!userData.companyId) {
          throw new Error('No company is linked to your account.');
        }

        const companyRef = doc(db, 'companies', userData.companyId);
        const companySnapshot = await getDoc(companyRef);

        if (!companySnapshot.exists()) {
          throw new Error('Your company profile was not found.');
        }

        const companyData = companySnapshot.data();

        const loadedProfile = {
          company: companyData.companyName || '',
          email: companyData.businessEmail || userData.email || user.email || '',
          phone: companyData.phone || userData.phone || '',
          address: companyData.address || '',
          businessType: companyData.businessType || '',
          gstin: companyData.gstin || '',
          description: companyData.description || '',
          logo: companyData.logo || '',
        };

        if (!active) return;

        setCompanyId(userData.companyId);
        setProfile(loadedProfile);
        setForm(loadedProfile);
        setError('');
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load your company profile.');
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const update = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const selectLogo = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Choose an image file for the company logo.');
      return;
    }

    if (file.size > 1024 * 1024) {
      setError('The logo image must be smaller than 1 MB.');
      return;
    }

    setSelectedLogo(file);

    const reader = new FileReader();

    reader.onload = () => {
      setForm((current) => ({
        ...current,
        logo: String(reader.result),
      }));
      setError('');
    };

    reader.onerror = () => {
      setError('The selected logo could not be read.');
    };

    reader.readAsDataURL(file);
  };

  const save = async (event) => {
    event.preventDefault();

    if (
      !form.company.trim() ||
      !form.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      setError('Enter a company name and a valid business email.');
      return;
    }

    if (!companyId) {
      setError('Company information is not available. Please log in again.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let logoUrl = profile.logo;

      // Upload a newly selected logo to Firebase Storage.
      if (selectedLogo) {
        const logoRef = ref(
          storage,
          `companies/${companyId}/company-logo`
        );

        await uploadBytes(logoRef, selectedLogo);
        logoUrl = await getDownloadURL(logoRef);
      }

      const updated = {
        companyName: form.company.trim(),
        businessEmail: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        businessType: form.businessType.trim(),
        gstin: form.gstin.trim(),
        description: form.description.trim(),
        logo: logoUrl,
        updatedAt: serverTimestamp(),
      };

      const companyRef = doc(db, 'companies', companyId);

      await setDoc(companyRef, updated, { merge: true });

      const updatedProfile = {
        company: updated.companyName,
        email: updated.businessEmail,
        phone: updated.phone,
        address: updated.address,
        businessType: updated.businessType,
        gstin: updated.gstin,
        description: updated.description,
        logo: logoUrl,
      };

      setProfile(updatedProfile);
      setForm(updatedProfile);
      setSelectedLogo(null);
      setEditing(false);
      setNotice('Your company profile was successfully saved.');
    } catch (err) {
      console.error('Company profile save error:', err);
      setError(err.message || 'Unable to save your company profile.');
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setForm(profile);
    setSelectedLogo(null);
    setEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="seeker-page company-profile-page">
        <p>Loading your company profile...</p>
      </div>
    );
  }

  return (
    <div className="seeker-page company-profile-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow-label">BUSINESS INFORMATION</span>
          <h1>Company profile</h1>
          <p>Keep your organization details ready for manufacturing enquiries.</p>
        </div>

        {!editing && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditing(true);
              setNotice('');
              setError('');
            }}
          >
            <Pencil size={16} /> Edit profile
          </button>
        )}
      </div>

      {notice && (
        <p className="seeker-success-message" role="status">
          <Check size={16} /> {notice}
        </p>
      )}

      {error && !editing && (
        <p className="field-error" role="alert">{error}</p>
      )}

      {editing ? (
        <form
          className="provider-panel seeker-profile-form"
          onSubmit={save}
          noValidate
        >
          <div className="seeker-profile-edit-header">
            <h2>Edit company details</h2>
            <button
              type="button"
              className="seeker-icon-text-button"
              onClick={cancel}
              disabled={saving}
            >
              <X size={15} /> Cancel
            </button>
          </div>

          <div className="seeker-profile-logo-row">
            <span className="seeker-company-logo">
              {form.logo ? (
                <img src={form.logo} alt="Company logo preview" />
              ) : (
                <Building2 size={24} />
              )}
            </span>

            <label className="seeker-logo-upload">
              <Camera size={15} /> Change logo
              <input
                type="file"
                accept="image/*"
                onChange={selectLogo}
                disabled={saving}
              />
            </label>

            <small>Image only, up to 1 MB</small>
          </div>

          <div className="seeker-form-grid">
            <ProfileField
              label="Company Name"
              name="company"
              value={form.company}
              onChange={update}
              required
            />

            <ProfileField
              label="Business Email"
              name="email"
              type="email"
              value={form.email}
              onChange={update}
              required
            />

            <ProfileField
              label="Phone Number"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={update}
            />

            <ProfileField
              label="Business Type"
              name="businessType"
              value={form.businessType}
              onChange={update}
            />

            <ProfileField
              label="GSTIN (optional)"
              name="gstin"
              value={form.gstin}
              onChange={update}
            />

            <ProfileField
              label="Company Address"
              name="address"
              value={form.address}
              onChange={update}
              wide
            />

            <ProfileField
              label="Company Description"
              name="description"
              value={form.description}
              onChange={update}
              as="textarea"
              wide
            />
          </div>

          {error && (
            <p className="field-error" role="alert">{error}</p>
          )}

          <div className="seeker-form-footer">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={cancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : (
        <section className="provider-panel seeker-profile-card">
          <div className="seeker-profile-cover" />

          <div className="seeker-profile-overview">
            <span className="seeker-company-logo">
              {profile.logo ? (
                <img
                  src={profile.logo}
                  alt={`${profile.company} logo`}
                />
              ) : (
                <Building2 size={27} />
              )}
            </span>

            <div>
              <h2>{profile.company || 'Company name not set'}</h2>
              <p>{profile.businessType || 'Business type not set'}</p>
            </div>
          </div>

          <div className="seeker-profile-details">
            <ProfileValue
              icon={Mail}
              label="Business email"
              value={profile.email}
            />

            <ProfileValue
              icon={Phone}
              label="Phone number"
              value={profile.phone}
            />

            <ProfileValue
              icon={MapPin}
              label="Company address"
              value={profile.address}
            />

            <ProfileValue
              icon={Building2}
              label="GSTIN"
              value={profile.gstin || 'Not provided'}
            />

            <div className="seeker-profile-description">
              <span>Company description</span>
              <p>
                {profile.description ||
                  'Add a short description of your company and the work you do.'}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ProfileField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  as,
  wide,
  required = false,
}) {
  const id = `company-${name}`;

  return (
    <label
      className={`field-group seeker-field ${
        wide ? 'seeker-field-wide' : ''
      }`}
      htmlFor={id}
    >
      <span>{label}</span>

      {as === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          value={value || ''}
          onChange={onChange}
          rows="4"
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value || ''}
          onChange={onChange}
          required={required}
        />
      )}
    </label>
  );
}

function ProfileValue({ icon: Icon, label, value }) {
  return (
    <div className="seeker-profile-value">
      <span className="seeker-profile-value-icon">
        <Icon size={16} />
      </span>

      <div>
        <small>{label}</small>
        <strong>{value || 'Not provided'}</strong>
      </div>
    </div>
  );
}

export default SeekerProfile;
