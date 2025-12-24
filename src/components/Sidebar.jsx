import React from 'react';
import {
  Globe,
  LayoutDashboard,
  Plane,
  AlertTriangle,
  RefreshCw,
  FileText,
  Settings,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

// Translations for sidebar
const translations = {
  en: {
    analysis: 'Analysis',
    globe: 'Globe View',
    overview: 'Overview',
    airlines: 'Airlines',
    priority: 'Priority Analysis',
    historic: 'Historic Trends',
    systemic: 'Systemic Cases',
    legal: 'Legal Summary',
    settings: 'Settings',
    configuration: 'Configuration',
    help: 'Help & Docs',
    semester: 'Semester',
    language: 'Language',
  },
  de: {
    analysis: 'Analyse',
    globe: 'Globus-Ansicht',
    overview: 'Übersicht',
    airlines: 'Fluggesellschaften',
    priority: 'Prioritätsanalyse',
    historic: 'Historische Trends',
    systemic: 'Systemische Fälle',
    legal: 'Rechtliche Zusammenfassung',
    settings: 'Einstellungen',
    configuration: 'Konfiguration',
    help: 'Hilfe & Docs',
    semester: 'Semester',
    language: 'Sprache',
  },
  fr: {
    analysis: 'Analyse',
    globe: 'Vue Globe',
    overview: 'Aperçu',
    airlines: 'Compagnies Aériennes',
    priority: 'Analyse des Priorités',
    historic: 'Tendances Historiques',
    systemic: 'Cas Systémiques',
    legal: 'Résumé Juridique',
    settings: 'Paramètres',
    configuration: 'Configuration',
    help: 'Aide & Docs',
    semester: 'Semestre',
    language: 'Langue',
  },
};

// Default semesters (used when no data is loaded)
const defaultSemesters = [
  { value: '2024-H2', label: '2024 H2 (Jul-Dec)' },
  { value: '2024-H1', label: '2024 H1 (Jan-Jun)' },
  { value: '2023-H2', label: '2023 H2 (Jul-Dec)' },
  { value: '2023-H1', label: '2023 H1 (Jan-Jun)' },
  { value: '2022-H2', label: '2022 H2 (Jul-Dec)' },
];

const Sidebar = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  semester,
  setSemester,
  semesters = [],
  priorityCount = 0,
  systemicCount = 0
}) => {
  // Use provided semesters or fallback to defaults
  const semesterOptions = semesters.length > 0 ? semesters : defaultSemesters;
  const t = translations[language] || translations.en;

  const navItems = [
    { id: 'globe', icon: Globe, label: t.globe },
    { id: 'overview', icon: LayoutDashboard, label: t.overview },
    { id: 'airlines', icon: Plane, label: t.airlines },
    { id: 'priority', icon: AlertTriangle, label: t.priority, badge: { count: priorityCount, type: 'danger' } },
    { id: 'historic', icon: TrendingUp, label: t.historic },
    { id: 'systemic', icon: RefreshCw, label: t.systemic, badge: { count: systemicCount, type: 'warning' } },
    { id: 'legal', icon: FileText, label: t.legal },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">✈️</div>
          <div>
            <div className="sidebar-logo-text">CASA</div>
            <div className="sidebar-logo-subtitle">Reporting Dashboard</div>
          </div>
        </div>
      </div>

      {/* Semester Selector */}
      <div className="semester-selector">
        <div className="semester-label">{t.semester}</div>
        <select
          className="semester-select"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        >
          {semesterOptions.map(sem => (
            <option key={sem.value} value={sem.value}>
              {sem.label}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">{t.analysis}</div>
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="nav-item-icon">
                <item.icon size={18} />
              </div>
              <span>{item.label}</span>
              {item.badge && (
                <span className={`nav-item-badge ${item.badge.type}`}>
                  {item.badge.count}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Settings Section */}
        <div className="nav-section">
          <div className="nav-section-title">{t.settings}</div>
          <div
            className={`nav-item ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <div className="nav-item-icon">
              <Settings size={18} />
            </div>
            <span>{t.configuration}</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
          >
            <div className="nav-item-icon">
              <HelpCircle size={18} />
            </div>
            <span>{t.help}</span>
          </div>
        </div>
      </nav>

      {/* Language Selector */}
      <div className="language-selector">
        <div className="semester-label">{t.language}</div>
        <div className="language-buttons">
          <button 
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
          >
            EN
          </button>
          <button 
            className={`lang-btn ${language === 'de' ? 'active' : ''}`}
            onClick={() => setLanguage('de')}
          >
            DE
          </button>
          <button 
            className={`lang-btn ${language === 'fr' ? 'active' : ''}`}
            onClick={() => setLanguage('fr')}
          >
            FR
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
