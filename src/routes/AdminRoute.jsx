
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth } from '../firebase/firebase';

function AdminRoute({ children }) {
  const location = useLocation();

  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus('unauthenticated');
        return;
      }

      try {
        const tokenResult = await getIdTokenResult(user, true);

        if (tokenResult.claims.admin === true) {
          setStatus('authorized');
        } else {
          setStatus('denied');
        }
      } catch (error) {
        console.error('Admin authorization error:', error);
        setStatus('denied');
      }
    });

    return () => unsubscribe();
  }, []);

  if (status === 'checking') {
    return <div className="admin-loading">Checking administrator access...</div>;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (status === 'denied') {
    return <AccessDenied />;
  }

  return children;
}

function AccessDenied() {
  return (
    <div className="admin-loading">
      <h2>Access Denied</h2>
      <p>You do not have administrator permission to access this page.</p>
    </div>
  );
}

export default AdminRoute;
