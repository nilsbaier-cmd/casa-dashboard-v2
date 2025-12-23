import React from 'react';
import GlobeView from '../components/GlobeView';
import RoutesTable from '../components/RoutesTable';
import ChartContainer from '../components/ChartContainer';
import { PrioritySummaryCards } from '../components/StatCard';
import { sampleRoutes, summaryStats, systemicCases, priorityDistributionData, monthlyTrendData, regionData } from '../data/sampleData';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Download
} from 'lucide-react';

// Simple Bar Chart Component
const SimpleBarChart = ({ data, labelKey, valueKey, colorKey }) => {
  const maxValue = Math.max(...data.map(d => d[valueKey]));
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '100px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {item[labelKey]}
          </div>
          <div style={{ flex: 1, height: '24px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${(item[valueKey] / maxValue) * 100}%`,
                background: item[colorKey] || 'var(--color-primary)',
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }} 
            />
          </div>
          <div style={{ width: '40px', textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' }}>
            {item[valueKey]}
          </div>
        </div>
      ))}
    </div>
  );
};

// Overview Tab
const OverviewTab = ({ t }) => (
  <div>
    <PrioritySummaryCards data={summaryStats} translations={t} />
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '24px' }}>
      <ChartContainer title={t.priorityDistribution} icon="📊" downloadFileName="priority-distribution" translations={t}>
        <SimpleBarChart 
          data={priorityDistributionData} 
          labelKey="name" 
          valueKey="value" 
          colorKey="color"
        />
      </ChartContainer>
      
      <ChartContainer title={t.topRoutesByDensity} icon="📈" downloadFileName="top-routes-density" translations={t}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sampleRoutes
            .filter(r => r.priority !== 'CLEAR')
            .sort((a, b) => b.density - a.density)
            .slice(0, 5)
            .map((route, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--bg-tertiary)',
                borderRadius: '8px'
              }}>
                <span style={{ fontWeight: 600 }}>{route.airline} → {route.lastStop}</span>
                <span style={{ 
                  color: route.priority === 'HIGH_PRIORITY' ? 'var(--color-danger)' : 'var(--color-warning)',
                  fontWeight: 600
                }}>
                  {route.density.toFixed(4)}‰
                </span>
              </div>
            ))
          }
        </div>
      </ChartContainer>
    </div>

    <div style={{ marginTop: '24px' }}>
      <ChartContainer title={t.inadByRegion} icon="🌍" downloadFileName="inad-by-region" translations={t}>
        <SimpleBarChart 
          data={regionData} 
          labelKey="region" 
          valueKey="inad"
        />
      </ChartContainer>
    </div>
  </div>
);

// Globe Tab
const GlobeTab = ({ t }) => (
  <GlobeView routes={sampleRoutes} translations={t} />
);

// Airlines Tab
const AirlinesTab = ({ t }) => {
  const airlineStats = sampleRoutes.reduce((acc, route) => {
    if (!acc[route.airline]) {
      acc[route.airline] = { airline: route.airline, inad: 0, routes: 0, worstPriority: 'CLEAR' };
    }
    acc[route.airline].inad += route.inad;
    acc[route.airline].routes += 1;
    if (route.priority === 'HIGH_PRIORITY' || 
        (route.priority === 'WATCH_LIST' && acc[route.airline].worstPriority !== 'HIGH_PRIORITY')) {
      acc[route.airline].worstPriority = route.priority;
    }
    return acc;
  }, {});
  
  const airlines = Object.values(airlineStats).sort((a, b) => b.inad - a.inad);

  return (
    <div>
      <PrioritySummaryCards data={summaryStats} translations={t} />
      
      <div className="table-container" style={{ marginTop: '24px' }}>
        <div className="table-header">
          <h3 className="table-title">{t.airlinesOverview}</h3>
          <button className="btn btn-primary">
            <Download size={16} />
            {t.exportCsv}
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>{t.airline}</th>
              <th>{t.totalInad}</th>
              <th>{t.routes}</th>
              <th>{t.priority}</th>
            </tr>
          </thead>
          <tbody>
            {airlines.map((airline, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{airline.airline}</td>
                <td style={{ fontWeight: 600 }}>{airline.inad}</td>
                <td>{airline.routes}</td>
                <td>
                  <span className={`priority-badge ${airline.worstPriority === 'HIGH_PRIORITY' ? 'high' : airline.worstPriority === 'WATCH_LIST' ? 'watch' : 'clear'}`}>
                    {airline.worstPriority === 'HIGH_PRIORITY' ? t.highPriority : airline.worstPriority === 'WATCH_LIST' ? t.watchList : t.clear}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Priority Tab
const PriorityTab = ({ t }) => (
  <div>
    <PrioritySummaryCards data={summaryStats} translations={t} />
    
    <div style={{ marginTop: '24px' }}>
      <RoutesTable 
        routes={sampleRoutes} 
        title={t.routesOverview}
        translations={t}
      />
    </div>
  </div>
);

// Systemic Tab
const SystemicTab = ({ t }) => (
  <div>
    {/* Info Banner */}
    <div style={{ 
      background: 'linear-gradient(135deg, var(--color-primary-lighter), #fff)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px'
    }}>
      <AlertTriangle size={24} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
      <div>
        <h3 style={{ marginBottom: '4px', color: 'var(--text-primary)' }}>{t.systemicTitle}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
          {t.systemicDescription}
        </p>
      </div>
    </div>

    {/* Stats */}
    <div className="stats-grid" style={{ marginBottom: '24px' }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t.systemicCases}</span>
          <div className="card-icon danger">🔴</div>
        </div>
        <div className="card-value">{systemicCases.length}</div>
      </div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t.worseningTrends}</span>
          <div className="card-icon warning">📈</div>
        </div>
        <div className="card-value">
          {systemicCases.filter(c => c.trend === 'WORSENING').length}
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t.consecutiveFlags}</span>
          <div className="card-icon primary">🔗</div>
        </div>
        <div className="card-value">
          {systemicCases.filter(c => c.consecutive).length}
        </div>
      </div>
    </div>

    {/* Systemic Cases Table */}
    <div className="table-container">
      <div className="table-header">
        <h3 className="table-title">{t.confirmedSystemic}</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>{t.airline}</th>
            <th>{t.lastStop}</th>
            <th>{t.appearances}</th>
            <th>{t.consecutive}</th>
            <th>{t.trend}</th>
            <th>{t.latestPriority}</th>
          </tr>
        </thead>
        <tbody>
          {systemicCases.map((case_, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 600 }}>{case_.airline}</td>
              <td><span className="iata-code">{case_.lastStop}</span></td>
              <td>{case_.appearances} {t.semesters}</td>
              <td>
                {case_.consecutive ? (
                  <span style={{ color: 'var(--color-danger)', fontWeight: 500 }}>{t.yes}</span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>{t.no}</span>
                )}
              </td>
              <td>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  color: case_.trend === 'WORSENING' 
                    ? 'var(--color-danger)' 
                    : case_.trend === 'IMPROVING' 
                      ? 'var(--color-success)' 
                      : 'var(--text-secondary)',
                  fontWeight: 500
                }}>
                  {case_.trend === 'WORSENING' && <TrendingUp size={14} />}
                  {case_.trend === 'IMPROVING' && <TrendingDown size={14} />}
                  {case_.trend === 'WORSENING' ? t.worsening : case_.trend === 'IMPROVING' ? t.improving : t.stable}
                </span>
              </td>
              <td>
                <span className={`priority-badge ${case_.latestPriority === 'HIGH_PRIORITY' ? 'high' : 'watch'}`}>
                  {case_.latestPriority === 'HIGH_PRIORITY' ? t.highPriority : t.watchList}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Legal Tab
const LegalTab = ({ t }) => (
  <div>
    {/* Analysis Parameters */}
    <div className="card" style={{ marginBottom: '24px' }}>
      <h3 style={{ marginBottom: '16px' }}>{t.analysisParameters}</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '16px' 
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{t.period}</div>
          <div style={{ fontWeight: 600 }}>2024 H2 (Jul-Dec)</div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{t.thresholdMethod}</div>
          <div style={{ fontWeight: 600 }}>Median</div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{t.thresholdValue}</div>
          <div style={{ fontWeight: 600 }}>0.1368‰</div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{t.minimumInad}</div>
          <div style={{ fontWeight: 600 }}>6</div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{t.minimumPax}</div>
          <div style={{ fontWeight: 600 }}>5,000</div>
        </div>
      </div>
    </div>

    {/* High Priority Routes */}
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>🔴 {t.highPriorityRoutes}</h3>
        <button className="btn btn-secondary">
          <Download size={16} />
          {t.export}
        </button>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.875rem' }}>
        {t.highPriorityDescription}
      </p>
      <table>
        <thead>
          <tr>
            <th>{t.airline}</th>
            <th>{t.lastStop}</th>
            <th>{t.inad}</th>
            <th>{t.density}</th>
            <th>{t.confidence}</th>
          </tr>
        </thead>
        <tbody>
          {sampleRoutes
            .filter(r => r.priority === 'HIGH_PRIORITY')
            .map((route, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{route.airline}</td>
                <td><span className="iata-code">{route.lastStop}</span></td>
                <td style={{ fontWeight: 600 }}>{route.inad}</td>
                <td>{route.density.toFixed(4)}‰</td>
                <td>{route.confidence}%</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>

    {/* Watch List Routes */}
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>🟠 {t.watchListRoutes}</h3>
        <button className="btn btn-secondary">
          <Download size={16} />
          {t.export}
        </button>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.875rem' }}>
        {t.watchListDescription}
      </p>
      <table>
        <thead>
          <tr>
            <th>{t.airline}</th>
            <th>{t.lastStop}</th>
            <th>{t.inad}</th>
            <th>{t.density}</th>
            <th>{t.confidence}</th>
          </tr>
        </thead>
        <tbody>
          {sampleRoutes
            .filter(r => r.priority === 'WATCH_LIST')
            .map((route, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{route.airline}</td>
                <td><span className="iata-code">{route.lastStop}</span></td>
                <td style={{ fontWeight: 600 }}>{route.inad}</td>
                <td>{route.density.toFixed(4)}‰</td>
                <td>{route.confidence}%</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  </div>
);

// Main Dashboard Component
const Dashboard = ({ activeTab, translations }) => {
  const t = translations;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'globe': return <GlobeTab t={t} />;
      case 'overview': return <OverviewTab t={t} />;
      case 'airlines': return <AirlinesTab t={t} />;
      case 'priority': return <PriorityTab t={t} />;
      case 'systemic': return <SystemicTab t={t} />;
      case 'legal': return <LegalTab t={t} />;
      default: return <GlobeTab t={t} />;
    }
  };

  // Get current date
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-top">
          <span className="page-date">{today}</span>
        </div>
        <h1 className="page-title">{t.pageTitle}</h1>
        <p className="page-subtitle">{t.pageSubtitle}</p>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default Dashboard;
