
import { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from 'lucide-react';

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { getIdTokenResult } from 'firebase/auth';

import AuthLayout from '../../components/auth/AuthLayout';

import {
  loginUser,
  loginWithGoogle,
  logoutUser,
  resetPassword,
} from '../../services/authService';

import { getUserProfile } from '../../services/userService';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState({
    email: '',
    password: '',
    remember: true,
  });

  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Common login process for email and Google authentication
  const handleAuthenticatedUser = async (user) => {
    // Step 1: Check email verification
    if (!user.emailVerified) {
      await logoutUser();

      setNotice(
        'Please verify your email address before logging in. Check your inbox for the verification email.'
      );

      return;
    }

    // Step 2: Refresh Firebase token and check admin claim
    const tokenResult = await getIdTokenResult(user, true);

    const isAdmin = tokenResult.claims.admin === true;

    // Step 3: Admin dashboard redirection
    if (isAdmin) {
      const requestedPath = location.state?.from?.pathname;

      const destination =
        requestedPath && requestedPath.startsWith('/admin')
          ? requestedPath
          : '/admin';

      navigate(destination, { replace: true });
      return;
    }

    // Step 4: Retrieve normal user Firestore profile
    const profile = await getUserProfile(user.uid);

    // Step 5: Check account status
    if (profile.status !== 'active') {
      await logoutUser();

      setNotice(
        'Your account is not active. Please contact support.'
      );

      return;
    }

    // Step 6: Determine user workspace
    const role = profile.defaultWorkspace;

    if (role !== 'provider' && role !== 'seeker') {
      await logoutUser();

      setNotice(
        'Your account workspace is invalid. Please contact support.'
      );

      return;
    }

    // Step 7: Determine dashboard destination
    const defaultDestination =
      role === 'seeker'
        ? '/seeker/dashboard'
        : '/provider/dashboard';

    const requestedPath = location.state?.from?.pathname;

    const destination =
      requestedPath &&
      (role === 'provider'
        ? requestedPath.startsWith('/provider')
        : requestedPath.startsWith('/seeker'))
        ? requestedPath
        : defaultDestination;

    navigate(destination, { replace: true });
  };

  // Update input values
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

    setNotice('');
  };

  // Email and password login
  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!values.email.trim()) {
      nextErrors.email = 'Enter your business email.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
    ) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!values.password) {
      nextErrors.password = 'Enter your password.';
    } else if (values.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    setNotice('');

    try {
      const user = await loginUser(
        values.email.trim(),
        values.password,
        values.remember
      );

      await handleAuthenticatedUser(user);
    } catch (error) {
      console.error('Login error:', error);

      const errorMessages = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/too-many-requests':
          'Too many attempts. Please try again later.',
        'auth/network-request-failed':
          'Network error. Check your internet connection.',
        'auth/user-disabled':
          'This account has been disabled.',
      };

      setNotice(
        errorMessages[error.code] ||
        error.message ||
        'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Continue with Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    setNotice('');
    setErrors({});

    try {
      const user = await loginWithGoogle(values.remember);

      await handleAuthenticatedUser(user);
    } catch (error) {
      console.error('Google login error:', error);

      const errorMessages = {
        'auth/popup-closed-by-user':
          'Google sign-in was cancelled. Please try again.',

        'auth/popup-blocked':
          'Your browser blocked the Google sign-in popup. Please allow popups and try again.',

        'auth/cancelled-popup-request':
          'A sign-in request is already running.',

        'auth/account-exists-with-different-credential':
          'An account already exists with this email. Please sign in using your original login method.',

        'auth/network-request-failed':
          'Network error. Check your internet connection.',

        'auth/unauthorized-domain':
          'This website domain is not authorized for Google sign-in.',
      };

      setNotice(
        errorMessages[error.code] ||
        error.message ||
        'Google login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const handleForgotPassword = async () => {
    const email = values.email.trim();

    if (!email) {
      setErrors({
        email: 'Enter your email address first.',
      });
      return;
    }

    try {
      setLoading(true);
      setNotice('');

      await resetPassword(email);

      setNotice(
        'Password reset email sent. Please check your inbox.'
      );
    } catch (error) {
      console.error('Password reset error:', error);

      setNotice(
        error.code === 'auth/user-not-found'
          ? 'No account found with this email.'
          : 'Unable to send password reset email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form-heading">
        <span className="kicker">Provider & seeker access</span>

        <h2>Welcome Back!</h2>

        <p>
          Sign in to continue to your CapacitySwap workspace.
        </p>
      </div>

      {/* Google Login */}
      <button
        type="button"
        className="btn btn-ghost auth-submit google-login-button"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <span className="google-icon" aria-hidden="true">
          G
        </span>

        {loading ? 'Please wait...' : 'Continue with Google'}
      </button>

      <div className="auth-divider">
        <span>OR CONTINUE WITH EMAIL</span>
      </div>

      {/* Email Login */}
      <form
        className="auth-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="field-group">
          <label htmlFor="login-email">
            Email address
          </label>

          <div
            className={`input-with-icon ${
              errors.email ? 'has-error' : ''
            }`}
          >
            <Mail size={17} aria-hidden="true" />

            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="name@company.com"
              value={values.email}
              onChange={updateValue}
              aria-invalid={Boolean(errors.email)}
            />
          </div>

          {errors.email && (
            <span className="field-error">
              {errors.email}
            </span>
          )}
        </div>

        <div className="field-group">
          <div className="field-label-row">
            <label htmlFor="login-password">
              Password
            </label>

            <button
              type="button"
              className="text-link forgot-link"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>

          <div
            className={`input-with-icon ${
              errors.password ? 'has-error' : ''
            }`}
          >
            <LockKeyhole size={17} aria-hidden="true" />

            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={values.password}
              onChange={updateValue}
              aria-invalid={Boolean(errors.password)}
            />

            <button
              type="button"
              className="input-icon-button"
              onClick={() =>
                setShowPassword((value) => !value)
              }
              aria-label={
                showPassword ? 'Hide password' : 'Show password'
              }
            >
              {showPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>
          </div>

          {errors.password && (
            <span className="field-error">
              {errors.password}
            </span>
          )}
        </div>

        <div className="auth-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="remember"
              checked={values.remember}
              onChange={updateValue}
            />

            <span>Remember me</span>
          </label>
        </div>

        {notice && (
          <p className="auth-inline-notice" role="alert">
            {notice}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary auth-submit"
          disabled={loading}
        >
          {loading ? 'Please wait...' : 'Login'}

          {!loading && <ArrowRight size={17} />}
        </button>
      </form>

      <p className="auth-switch">
        New to CapacitySwap?{' '}
        <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}

export default Login;
