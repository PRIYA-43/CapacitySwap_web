
import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Factory,
  LockKeyhole,
  UserRound,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { registerUser } from '../../services/authService';
import { createUserProfile } from '../../services/userService';

const initialForm = {
  name: '',
  company: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  address: '',
  businessType: '',
  role: 'provider',
  terms: false,
};

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role');

  const [values, setValues] = useState({
    ...initialForm,
    role: requestedRole === 'seeker' ? 'seeker' : 'provider',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const updateValue = (event) => {
    const { name, value, checked, type } = event.target;

    setValues((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: '',
    }));

    setAuthError('');
  };

  const validate = () => {
    const nextErrors = {};

    const requiredFields = [
      'name',
      'company',
      'email',
      'phone',
      'password',
      'confirmPassword',
      'address',
      'businessType',
    ];

    requiredFields.forEach((field) => {
      if (!values[field].trim()) {
        nextErrors[field] = 'This field is required.';
      }
    });

    if (
      values.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
    ) {
      nextErrors.email = 'Enter a valid business email.';
    }

    if (
      values.phone &&
      !/^[+()\d\s.-]{7,20}$/.test(values.phone)
    ) {
      nextErrors.phone = 'Enter a valid phone number.';
    }

    if (
      values.password &&
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(values.password)
    ) {
      nextErrors.password =
        'Use 8+ characters with uppercase, lowercase, and a number.';
    }

    if (
      values.confirmPassword &&
      values.password !== values.confirmPassword
    ) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!values.terms) {
      nextErrors.terms = 'Please accept the terms to continue.';
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    setAuthError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const profile = {
        name: values.name.trim(),
        company: values.company.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
        businessType: values.businessType,
        role: values.role,
      };

      // Create the Firebase Authentication account.
      const user = await registerUser(
        profile.email,
        values.password
      );

      // Save the user and company information in Firestore.
      try {
        await createUserProfile(user.uid, profile);
      } catch (profileError) {
        // Try to remove the newly created Auth account if
        // saving the Firestore profile fails.
        await user.delete().catch(() => {});
        throw profileError;
      }

      setSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);

      const errorMessages = {
        'auth/email-already-in-use':
          'This email is already registered.',
        'auth/invalid-email':
          'Please enter a valid email address.',
        'auth/weak-password':
          'Please choose a stronger password.',
        'auth/network-request-failed':
          'Network error. Please try again.',
        'auth/too-many-requests':
          'Too many attempts. Please try again later.',
        'permission-denied':
          'Unable to save your profile. Please contact support or try again.',
        'unavailable':
          'The service is temporarily unavailable. Please try again.',
      };

      setAuthError(
        errorMessages[error.code] ||
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="registration-success">
          <span className="success-icon">
            <CheckCircle2 size={30} />
          </span>

          <span className="kicker">Registration complete</span>

          <h2>Your company is ready to get started.</h2>

          <p>
            Your account has been created successfully.
            A verification email has been sent to your registered
            email address. Please verify your email before logging in.
          </p>

          <button
            type="button"
            className="btn btn-primary auth-submit"
            onClick={() => navigate('/login', { replace: true })}
          >
            Go to Login <ArrowRight size={17} />
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout imageAlt="Industrial production floor for manufacturing company onboarding">
      <div className="auth-form-heading register-heading">
        <span className="kicker">Company registration</span>

        <h2>Create Your CapacitySwap Account</h2>

        <p>
          Set up your business profile. You can use both provider
          and seeker features as you grow.
        </p>
      </div>

      <form
        className="auth-form register-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="form-grid-two">
          <Field
            label="Full Name"
            name="name"
            value={values.name}
            onChange={updateValue}
            error={errors.name}
            autoComplete="name"
          />

          <Field
            label="Company Name"
            name="company"
            value={values.company}
            onChange={updateValue}
            error={errors.company}
            autoComplete="organization"
          />

          <Field
            label="Business Email"
            name="email"
            type="email"
            value={values.email}
            onChange={updateValue}
            error={errors.email}
            autoComplete="email"
          />

          <Field
            label="Phone Number"
            name="phone"
            type="tel"
            value={values.phone}
            onChange={updateValue}
            error={errors.phone}
            autoComplete="tel"
          />

          <PasswordField
            label="Password"
            name="password"
            value={values.password}
            onChange={updateValue}
            error={errors.password}
            visible={showPassword}
            onToggle={() =>
              setShowPassword((value) => !value)
            }
            autoComplete="new-password"
          />

          <PasswordField
            label="Confirm Password"
            name="confirmPassword"
            value={values.confirmPassword}
            onChange={updateValue}
            error={errors.confirmPassword}
            visible={showConfirmPassword}
            onToggle={() =>
              setShowConfirmPassword((value) => !value)
            }
            autoComplete="new-password"
          />

          <div className="field-group">
            <label htmlFor="register-business-type">
              Business Type
            </label>

            <select
              id="register-business-type"
              name="businessType"
              value={values.businessType}
              onChange={updateValue}
              aria-invalid={Boolean(errors.businessType)}
            >
              <option value="">Select business type</option>
              <option value="Job Shop">Job Shop</option>
              <option value="Contract Manufacturer">
                Contract Manufacturer
              </option>
              <option value="OEM">OEM</option>
              <option value="Fabricator">Fabricator</option>
              <option value="Other">Other</option>
            </select>

            {errors.businessType && (
              <span className="field-error">
                {errors.businessType}
              </span>
            )}
          </div>

          <div className="field-group address-field">
            <label htmlFor="register-address">
              Company Address
            </label>

            <input
              id="register-address"
              name="address"
              value={values.address}
              onChange={updateValue}
              autoComplete="street-address"
              aria-invalid={Boolean(errors.address)}
              placeholder="Street, city, region, postal code"
            />

            {errors.address && (
              <span className="field-error">
                {errors.address}
              </span>
            )}
          </div>
        </div>

        <fieldset className="role-picker">
          <legend>Choose your starting workspace</legend>

          <p>
            This sets your first destination only.
            Your company can use both roles.
          </p>

          <div className="role-options">
            <label
              className={`role-option ${
                values.role === 'provider' ? 'selected' : ''
              }`}
            >
              <input
                type="radio"
                name="role"
                value="provider"
                checked={values.role === 'provider'}
                onChange={updateValue}
              />

              <span className="role-option-icon">
                <Factory size={20} />
              </span>

              <span>
                <strong>Capacity Provider</strong>
                <small>
                  I have machines and want to share unused capacity.
                </small>
              </span>
            </label>

            <label
              className={`role-option ${
                values.role === 'seeker' ? 'selected' : ''
              }`}
            >
              <input
                type="radio"
                name="role"
                value="seeker"
                checked={values.role === 'seeker'}
                onChange={updateValue}
              />

              <span className="role-option-icon">
                <UserRound size={20} />
              </span>

              <span>
                <strong>Capacity Seeker</strong>
                <small>
                  I need manufacturing machines or production capacity.
                </small>
              </span>
            </label>
          </div>
        </fieldset>

        <label className="checkbox-label terms-label">
          <input
            type="checkbox"
            name="terms"
            checked={values.terms}
            onChange={updateValue}
          />

          <span>
            I agree to the Terms &amp; Conditions and Privacy Policy.
          </span>
        </label>

        {errors.terms && (
          <span className="field-error terms-error">
            {errors.terms}
          </span>
        )}

        {authError && (
          <div className="auth-error" role="alert">
            {authError}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary auth-submit"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
          {!loading && <ArrowRight size={17} />}
        </button>

      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </AuthLayout>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
}) {
  return (
    <div className="field-group">
      <label htmlFor={`register-${name}`}>{label}</label>

      <input
        id={`register-${name}`}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
      />

      {error && (
        <span className="field-error">{error}</span>
      )}
    </div>
  );
}

function PasswordField({
  label,
  name,
  value,
  onChange,
  error,
  visible,
  onToggle,
  autoComplete,
}) {
  return (
    <div className="field-group">
      <label htmlFor={`register-${name}`}>{label}</label>

      <div className={`input-with-icon ${error ? 'has-error' : ''}`}>
        <LockKeyhole size={16} aria-hidden="true" />

        <input
          id={`register-${name}`}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
        />

        <button
          type="button"
          className="input-icon-button"
          onClick={onToggle}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {error && (
        <span className="field-error">{error}</span>
      )}
    </div>
  );
}

export default Register;
