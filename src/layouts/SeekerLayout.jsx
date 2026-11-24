import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import SeekerHeader from '../components/seeker/SeekerHeader';
import SeekerSidebar from '../components/seeker/SeekerSidebar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { getUserProfile } from '../services/userService';

function SeekerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) setProfile(null);
        return;
      }

      try {
        const userProfile = await getUserProfile(user.uid);
        if (active) setProfile(userProfile);
      } catch (error) {
        console.error('Seeker layout profile error:', error);
        if (active) setProfile(null);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <div className="provider-app seeker-app">
      <SeekerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={() => setSidebarOpen(false)} />
      <div className="provider-main">
        <SeekerHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="provider-content seeker-content">
          <Outlet context={{ profile }} />
        </main>
      </div>
    </div>
  );
}

export default SeekerLayout;
