import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronDown, ChevronUp } from 'lucide-react';

const RoutesTable = ({ routes = [], title, translations = {} }) => {
  const [sortField, setSortField] = useState('inad');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');

  const t = {
    searchPlaceholder: translations.searchPlaceholder || 'Search routes...',
    allPriorities: translations.allPriorities || 'All Priorities',
    highPriority: translations.highPriority || 'High Priority',
    watchList: translations.watchList || 'Watch List',
    clear: translations.clear || 'Clear',
    unreliable: translations.unreliable || 'Unreliable',
    routes: translations.routes || 'routes',
    exportCsv: translations.exportCsv || 'Export CSV',
    airline: translations.airline || 'Airline',
    lastStop: translations.lastStop || 'Last Stop',
    origin: translations.origin || 'Origin',
    inad: translations.inad || 'INAD',
    pax: translations.pax || 'PAX',
    density: translations.density || 'Density',
    confidence: translations.confidence || 'Confidence',
    priority: translations.priority || 'Priority',
  };

  // Process routes
  const processedRoutes = useMemo(() => {
    return routes
      .filter(route => {
        const matchesSearch = 
          route.airline.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.lastStop.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (route.originCity && route.originCity.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesPriority = filterPriority === 'all' || route.priority === filterPriority;
        return matchesSearch && matchesPriority;
      })
      .sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        const modifier = sortDirection === 'asc' ? 1 : -1;
        if (typeof aVal === 'number') return (aVal - bVal) * modifier;
        return String(aVal).localeCompare(String(bVal)) * modifier;
      });
  }, [routes, searchTerm, filterPriority, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const getPriorityBadgeClass = (priority) => {
    const classes = {
      HIGH_PRIORITY: 'priority-badge high',
      WATCH_LIST: 'priority-badge watch',
      CLEAR: 'priority-badge clear',
      UNRELIABLE: 'priority-badge unreliable',
    };
    return classes[priority] || 'priority-badge';
  };

  const formatPriority = (priority) => {
    const labels = {
      HIGH_PRIORITY: t.highPriority,
      WATCH_LIST: t.watchList,
      CLEAR: t.clear,
      UNRELIABLE: t.unreliable,
    };
    return labels[priority] || priority.replace('_', ' ');
  };

  const getConfidenceClass = (confidence) => {
    if (confidence >= 70) return 'high';
    if (confidence >= 40) return 'medium';
    return 'low';
  };

  const handleExport = () => {
    const headers = ['Airline', 'Last Stop', 'Origin', 'INAD', 'PAX', 'Density', 'Confidence', 'Priority'];
    const csvContent = [
      headers.join(','),
      ...processedRoutes.map(r => [
        r.airline,
        r.lastStop,
        r.originCity || '',
        r.inad,
        r.pax || '',
        r.density?.toFixed(4) || '',
        r.confidence || '',
        r.priority
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `routes-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h3 className="table-title">{title}</h3>
        <button className="btn btn-primary" onClick={handleExport}>
          <Download size={16} />
          {t.exportCsv}
        </button>
      </div>

      <div className="table-filters">
        <div className="search-input">
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="filter-select"
        >
          <option value="all">{t.allPriorities}</option>
          <option value="HIGH_PRIORITY">{t.highPriority}</option>
          <option value="WATCH_LIST">{t.watchList}</option>
          <option value="CLEAR">{t.clear}</option>
          <option value="UNRELIABLE">{t.unreliable}</option>
        </select>

        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          {processedRoutes.length} {t.routes}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('airline')} style={{ cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {t.airline} <SortIcon field="airline" />
                </span>
              </th>
              <th onClick={() => handleSort('lastStop')} style={{ cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {t.lastStop} <SortIcon field="lastStop" />
                </span>
              </th>
              <th>{t.origin}</th>
              <th onClick={() => handleSort('inad')} style={{ cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {t.inad} <SortIcon field="inad" />
                </span>
              </th>
              <th onClick={() => handleSort('pax')} style={{ cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {t.pax} <SortIcon field="pax" />
                </span>
              </th>
              <th onClick={() => handleSort('density')} style={{ cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {t.density} <SortIcon field="density" />
                </span>
              </th>
              <th onClick={() => handleSort('confidence')} style={{ cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {t.confidence} <SortIcon field="confidence" />
                </span>
              </th>
              <th>{t.priority}</th>
            </tr>
          </thead>
          <tbody>
            {processedRoutes.map((route, index) => (
              <tr key={`${route.airline}-${route.lastStop}-${index}`}>
                <td style={{ fontWeight: 600 }}>{route.airline}</td>
                <td>
                  <span className="iata-code">{route.lastStop}</span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {route.originCity || '—'}
                </td>
                <td style={{ fontWeight: 600 }}>{route.inad}</td>
                <td>{route.pax?.toLocaleString() || '—'}</td>
                <td>{route.density?.toFixed(4) || '—'}‰</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${getConfidenceClass(route.confidence)}`}
                        style={{ width: `${route.confidence || 0}%` }}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem' }}>{route.confidence || 0}%</span>
                  </div>
                </td>
                <td>
                  <span className={getPriorityBadgeClass(route.priority)}>
                    {formatPriority(route.priority)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {processedRoutes.length === 0 && (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          {translations.noResults || 'No routes match your search criteria'}
        </div>
      )}
    </div>
  );
};

export default RoutesTable;
