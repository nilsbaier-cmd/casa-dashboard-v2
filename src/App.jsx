import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import translations from './data/translations';
import './styles/globals.css';

function App() {
  const [activeTab, setActiveTab] = useState('globe');
  const [language, setLanguage] = useState('en');
  const [semester, setSemester] = useState('2024-H2');

  // Get translations for current language
  const t = translations[language] || translations.en;

  // Count priority items for badges
  const priorityCount = 5;
  const systemicCount = 3;

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
        semester={semester}
        setSemester={setSemester}
        priorityCount={priorityCount}
        systemicCount={systemicCount}
      />
      
      {/* Main Content */}
      <main className="main-content">
        <Dashboard 
          activeTab={activeTab}
          translations={t}
        />
      </main>
    </div>
  );
}

export default App;
