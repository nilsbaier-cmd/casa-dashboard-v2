import React, { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Configuration from './pages/Configuration';
import HelpDocs from './pages/HelpDocs';
import { DataProvider, useData } from './context/DataContext';
import translations from './data/translations';
import './styles/globals.css';

// Small helpers for persisted UI preferences (language + theme).
const readPref = (key, fallback) => {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};
const writePref = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore (private mode etc.) */
  }
};

// Main App content (uses DataContext)
function AppContent() {
  const [activeTab, setActiveTab] = useState('globe');
  const [language, setLanguage] = useState(() => readPref('casa.language', 'en'));
  const [theme, setTheme] = useState(() => readPref('casa.theme', 'light'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    semesters,
    currentSemester,
    changeSemester,
    analysisData,
    isLoading,
    error,
  } = useData();

  // Apply + persist theme.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    writePref('casa.theme', theme);
  }, [theme]);

  // Persist language.
  useEffect(() => {
    writePref('casa.language', language);
  }, [language]);

  const t = translations[language] || translations.en;

  const priorityCount = analysisData?.summary?.high_priority || 0;
  const systemicCount = analysisData?.summary?.watch_list || 0;

  const toggleTheme = useCallback(
    () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark')),
    []
  );

  // On mobile, selecting a tab should also close the drawer.
  const handleSelectTab = useCallback((tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  }, []);

  const renderContent = () => {
    if (activeTab === 'config') return <Configuration translations={t} />;
    if (activeTab === 'help') return <HelpDocs translations={t} />;
    return (
      <Dashboard
        activeTab={activeTab}
        translations={t}
        analysisData={analysisData}
        isLoading={isLoading}
      />
    );
  };

  return (
    <div className="app-container">
      <div className="app-background" />

      {/* Backdrop behind the mobile drawer */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        language={language}
        setLanguage={setLanguage}
        semester={currentSemester || ''}
        setSemester={changeSemester}
        semesters={semesters}
        priorityCount={priorityCount}
        systemicCount={systemicCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="main-content">
        {/* Mobile top bar with hamburger (hidden on desktop via CSS) */}
        <div className="mobile-topbar">
          <button
            className="icon-button"
            onClick={() => setSidebarOpen(true)}
            aria-label={t.openMenu || 'Open menu'}
          >
            <Menu size={20} />
          </button>
          <span className="mobile-topbar-title">CASA</span>
        </div>

        {error && (
          <div className="error-banner" role="alert" style={{
            background: 'var(--color-danger-light)',
            color: 'var(--color-danger)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;
