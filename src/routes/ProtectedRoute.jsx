
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../firebase/firebase';
import { getUserProfile } from '../services/userService';

function ProtectedRoute({ children }) {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;

      if (!user) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        // Require a verified email address.
        await user.reload();

        if (!user.emailVerified) {
          if (active) {
            setAuthorized(false);
            setLoading(false);
          }
          return;
        }

        // Load the actual user's Firestore profile.
        const profile = await getUserProfile(user.uid);

        if (!active) return;

        // Block disabled or inactive accounts.
        if (profile.status !== 'active') {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        // Determine which workspace the URL is requesting.
        const requiredRole = location.pathname.startsWith('/provider')
          ? 'provider'
          : location.pathname.startsWith('/seeker')
            ? 'seeker'
            : null;

        // Check the user's registered workspace permissions.
        const capabilities = Array.isArray(profile.capabilities)
          ? profile.capabilities
          : [profile.defaultWorkspace];

        const hasAccess =
          requiredRole === null ||
          capabilities.includes(requiredRole);

        setAuthorized(hasAccess);
      } catch (error) {
        console.error('Protected route authentication error:', error);

        if (active) {
          setAuthorized(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="auth-loading" role="status">
        <p>Verifying your account...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
