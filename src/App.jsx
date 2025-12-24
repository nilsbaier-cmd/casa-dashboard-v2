import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Configuration from './pages/Configuration';
import HelpDocs from './pages/HelpDocs';
import { DataProvider, useData } from './context/DataContext';
import translations from './data/translations';
import './styles/globals.css';

// Main App content (uses DataContext)
function AppContent() {
  const [activeTab, setActiveTab] = useState('globe');
  const [language, setLanguage] = useState('en');

  const {
    semesters,
    currentSemester,
    changeSemester,
    analysisData,
    isLoading,
    error,
  } = useData();

  // Get translations for current language
  const t = translations[language] || translations.en;

  // Calculate counts from analysis data
  const priorityCount = analysisData?.summary?.high_priority || 0;
  const systemicCount = analysisData?.summary?.watch_list || 0;

  // Determine which page to show
  const renderContent = () => {
    if (activeTab === 'config') {
      return <Configuration translations={t} />;
    }
    if (activeTab === 'help') {
      return <HelpDocs translations={t} />;
    }
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
      {/* Background */}
      <div className="app-background" />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        semester={currentSemester || ''}
        setSemester={changeSemester}
        semesters={semesters}
        priorityCount={priorityCount}
        systemicCount={systemicCount}
      />

      {/* Main Content */}
      <main className="main-content">
        {error && (
          <div className="error-banner" style={{
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

// App wrapper with DataProvider
function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;
