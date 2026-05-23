import React, { useEffect } from 'react';
import { useStore } from './store/StoreContext';
import { Toast } from './components/Toast';
import { HomePage } from './pages/HomePage';
import { ConfigPage } from './pages/ConfigPage';
import { RackPage } from './pages/RackPage';
import { LinkPage } from './pages/LinkPage';
import { PortsPage } from './pages/PortsPage';
import { BackupPage } from './pages/BackupPage';

export default function App() {
  const { currentPage, darkMode, setCurrentPage } = useStore();

  useEffect(() => {
    const path = window.location.pathname;
    if (['/', '/config', '/rack', '/link', '/ports', '/backup'].includes(path)) {
      setCurrentPage(path);
    } else {
      setCurrentPage('/');
      window.history.pushState({}, '', '/');
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case '/config':
        return <ConfigPage />;
      case '/rack':
        return <RackPage />;
      case '/link':
        return <LinkPage />;
      case '/ports':
        return <PortsPage />;
      case '/backup':
        return <BackupPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {renderPage()}
      <Toast />
    </div>
  );
}