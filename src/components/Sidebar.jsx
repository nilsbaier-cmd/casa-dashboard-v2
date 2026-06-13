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
  TrendingUp,
  Moon,
  Sun,
  X
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
  systemicCount = 0,
  isOpen = false,
  onClose = () => {},
  theme = 'light',
  onToggleTheme = () => {}
}) => {
  // Use provided semesters or fallback to defaults
  const semesterOptions = semesters.length > 0 ? semesters : defaultSemesters;
  const t = translations[language] || translations.en;
  const isDark = theme === 'dark';

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
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">✈️</div>
          <div>
            <div className="sidebar-logo-text">CASA</div>
            <div className="sidebar-logo-subtitle">Reporting Dashboard</div>
          </div>
        </div>
        <button
          className="icon-button sidebar-close"
          onClick={onClose}
          aria-label={t.closeMenu || 'Close menu'}
        >
          <X size={18} />
        </button>
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
            <button
              key={item.id}
              type="button"
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
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
            </button>
          ))}
        </div>

        {/* Settings Section */}
        <div className="nav-section">
          <div className="nav-section-title">{t.settings}</div>
          <button
            type="button"
            className={`nav-item ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
            aria-current={activeTab === 'config' ? 'page' : undefined}
          >
            <div className="nav-item-icon">
              <Settings size={18} />
            </div>
            <span>{t.configuration}</span>
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
            aria-current={activeTab === 'help' ? 'page' : undefined}
          >
            <div className="nav-item-icon">
              <HelpCircle size={18} />
            </div>
            <span>{t.help}</span>
          </button>
        </div>
      </nav>

      {/* Language Selector */}
      <div className="language-selector">
        <div className="semester-label">{t.language}</div>
        <div className="language-buttons">
          {['en', 'de', 'fr'].map((lng) => (
            <button
              key={lng}
              type="button"
              className={`lang-btn ${language === lng ? 'active' : ''}`}
              onClick={() => setLanguage(lng)}
              aria-pressed={language === lng}
            >
              {lng.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Theme toggle */}
      <div className="sidebar-footer-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-pressed={isDark}
          aria-label={isDark ? (t.lightMode || 'Switch to light mode') : (t.darkMode || 'Switch to dark mode')}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          <span>{isDark ? (t.lightMode || 'Light') : (t.darkMode || 'Dark')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
