import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Workspace from './pages/Workspace';
import Marketplace from './pages/Marketplace';
import Library from './pages/Library';
import SharedNotebook from './pages/SharedNotebook';
import Settings from './pages/Settings';
import Layout from './layouts/Layout';
// NST Pages
import NstDashboard from './pages/nst/NstDashboard';
import NstSubjectPage from './pages/nst/NstSubject';
import NstStudy from './pages/nst/NstStudy';
// Onboarding
import OnboardingModal from './components/OnboardingModal';
import { getUserProfile } from './lib/userApi';

function App() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          const { needsOnboarding } = await getUserProfile(user.id);
          if (needsOnboarding) {
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error('Failed to check onboarding status:', error);
        }
      }
    };

    checkOnboarding();
  }, [isLoaded, isSignedIn, user]);

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
          {/* NST Routes - Subject Folders */}
          <Route path="/nst" element={<NstDashboard />} />
          <Route path="/nst/subject/:subjectId" element={<NstSubjectPage />} />
        </Route>
        {/* Workspace view - standalone layout for maximum space */}
        <Route path="/workspace/:id?" element={<Workspace />} />
        {/* NST Study Workspace - standalone layout */}
        <Route path="/nst/study/:subjectId/:noteId" element={<NstStudy />} />
        {/* Shared notebook view - outside of main layout for clean viewing */}
        <Route path="/shared/:id" element={<SharedNotebook />} />
        
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />
      </Routes>

      <OnboardingModal 
        open={showOnboarding} 
        onComplete={() => setShowOnboarding(false)} 
      />
    </>
  );
}

export default App;

