import React, { useState, useEffect } from 'react';
import { User } from './types';
import { LoginRegister } from './components/LoginRegister';
import { StudentPC } from './components/StudentPC';
import { StudentMobile } from './components/StudentMobile';
import { AdminDashboard } from './components/AdminDashboard';
import { ToastProvider } from './context/ToastContext';

export const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<'pc' | 'mobile'>('pc');

  // Detect mobile device
  const isMobileDevice = () => {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    );
  };

  useEffect(() => {
    // Restore session from localStorage if present
    const savedAdmin = localStorage.getItem('adminAuth') === 'true';
    if (savedAdmin) {
      setIsAdmin(true);
      return;
    }

    const savedUserStr = localStorage.getItem('currentUser');
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        setCurrentUser(u);
        setViewMode(isMobileDevice() ? 'mobile' : 'pc');
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const handleStudentLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAdmin(false);
    setViewMode(isMobileDevice() ? 'mobile' : 'pc');
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setCurrentUser(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('adminAuth');
    setCurrentUser(null);
    setIsAdmin(false);
  };

  if (isAdmin) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (currentUser) {
    if (viewMode === 'mobile') {
      return (
        <StudentMobile
          user={currentUser}
          onLogout={handleLogout}
          onSwitchToPC={() => setViewMode('pc')}
        />
      );
    }
    return (
      <StudentPC
        user={currentUser}
        onLogout={handleLogout}
        onSwitchToMobile={() => setViewMode('mobile')}
      />
    );
  }

  return (
    <LoginRegister
      onLoginSuccess={handleStudentLoginSuccess}
      onAdminLoginSuccess={handleAdminLoginSuccess}
    />
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
