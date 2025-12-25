import React, { useMemo, useEffect } from 'react';
import GlobeView from '../components/GlobeView';
import RoutesTable from '../components/RoutesTable';
import ChartContainer from '../components/ChartContainer';
import HistoricTrends from '../components/HistoricTrends';
import { PrioritySummaryCards } from '../components/StatCard';
import { useData } from '../context/DataContext';
import { sampleRoutes, summaryStats as defaultSummaryStats, systemicCases as defaultSystemicCases, priorityDistributionData as defaultPriorityData, regionData as defaultRegionData } from '../data/sampleData';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Loader,
  RefreshCw
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
const OverviewTab = ({ t, routes, summaryStats, priorityDistributionData }) => (
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
          {routes
            .filter(r => r.priority !== 'CLEAR' && r.density)
            .sort((a, b) => (b.density || 0) - (a.density || 0))
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
                  {route.density?.toFixed(4) || 'N/A'}‰
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
          data={defaultRegionData}
          labelKey="region"
          valueKey="inad"
        />
      </ChartContainer>
    </div>
  </div>
);

// Globe Tab
const GlobeTab = ({ t, routes }) => (
  <GlobeView routes={routes} translations={t} />
);

// Airlines Tab
const AirlinesTab = ({ t, routes, summaryStats }) => {
  const airlineStats = routes.reduce((acc, route) => {
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
const PriorityTab = ({ t, routes, summaryStats }) => (
  <div>
    <PrioritySummaryCards data={summaryStats} translations={t} />

    <div style={{ marginTop: '24px' }}>
      <RoutesTable
        routes={routes}
        title={t.routesOverview}
        translations={t}
      />
    </div>
  </div>
);

// Systemic Tab
const SystemicTab = ({ t }) => {
  const { systemicCases, fetchSystemicCases, isLoading, semesters, dataReady } = useData();
  const [hasLoaded, setHasLoaded] = React.useState(false);

  // Fetch systemic cases when tab is active
  useEffect(() => {
    if (dataReady && semesters.length >= 2 && !hasLoaded && !systemicCases) {
      fetchSystemicCases()
        .then(() => setHasLoaded(true))
        .catch((err) => {
          console.error('Failed to load systemic cases:', err);
          setHasLoaded(true); // Prevent infinite retry
        });
    }
  }, [dataReady, semesters, hasLoaded, systemicCases, fetchSystemicCases]);

  // Use real data or fall back to sample data
  const cases = systemicCases?.cases || defaultSystemicCases;

  if (isLoading && !cases.length) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
        <RefreshCw size={32} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>
          {t.loadingSystemic || 'Loading systemic cases...'}
        </p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Info Banner */}
      <div style={{
        background: 'var(--bg-tertiary)',
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
          <div className="card-value">{cases.length}</div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t.worseningTrends}</span>
            <div className="card-icon warning">📈</div>
          </div>
          <div className="card-value">
            {cases.filter(c => c.trend === 'WORSENING').length}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t.consecutiveFlags}</span>
            <div className="card-icon primary">🔗</div>
          </div>
          <div className="card-value">
            {cases.filter(c => c.consecutive).length}
          </div>
        </div>
      </div>

      {/* Systemic Cases Table */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">{t.confirmedSystemic}</h3>
          {dataReady && semesters.length >= 2 && (
            <button
              className="btn btn-secondary"
              onClick={() => fetchSystemicCases()}
              disabled={isLoading}
            >
              <RefreshCw size={16} style={isLoading ? { animation: 'spin 1s linear infinite' } : {}} />
              {t.refresh || 'Refresh'}
            </button>
          )}
        </div>
        {cases.length > 0 ? (
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
              {cases.map((case_, i) => (
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
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>{t.noSystemicCases || 'No systemic cases detected. Routes must appear on priority list for 2+ consecutive semesters.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Legal Tab
const LegalTab = ({ t, routes, analysisData }) => {
  // Extract config from analysisData or use defaults
  const config = analysisData?.config || {};
  const threshold = analysisData?.threshold || 0.1368;
  const semester = analysisData?.semester || '2024-H2';

  // Format semester for display
  const formatSemester = (sem) => {
    if (!sem) return 'N/A';
    const [year, half] = sem.split('-');
    return half === 'H1' ? `${year} H1 (Jan-Jun)` : `${year} H2 (Jul-Dec)`;
  };

  // Filter routes by priority
  const highPriorityRoutes = routes.filter(r => r.priority === 'HIGH_PRIORITY');
  const watchListRoutes = routes.filter(r => r.priority === 'WATCH_LIST');

  return (
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
            <div style={{ fontWeight: 600 }}>{formatSemester(semester)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{t.thresholdMethod}</div>
            <div style={{ fontWeight: 600 }}>{config.threshold_method || 'median'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{t.thresholdValue}</div>
            <div style={{ fontWeight: 600 }}>{typeof threshold === 'number' ? threshold.toFixed(4) : threshold}‰</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{t.minimumInad}</div>
            <div style={{ fontWeight: 600 }}>{config.min_inad || 6}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{t.minimumPax}</div>
            <div style={{ fontWeight: 600 }}>{(config.min_pax || 5000).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* High Priority Routes */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>🔴 {t.highPriorityRoutes} ({highPriorityRoutes.length})</h3>
          <button className="btn btn-secondary">
            <Download size={16} />
            {t.export}
          </button>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.875rem' }}>
          {t.highPriorityDescription}
        </p>
        {highPriorityRoutes.length > 0 ? (
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
              {highPriorityRoutes.map((route, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{route.airline}</td>
                  <td><span className="iata-code">{route.lastStop}</span></td>
                  <td style={{ fontWeight: 600 }}>{route.inad}</td>
                  <td>{route.density?.toFixed(4) || 'N/A'}‰</td>
                  <td>{route.confidence || 'N/A'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No high priority routes found.</p>
        )}
      </div>

      {/* Watch List Routes */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>🟠 {t.watchListRoutes} ({watchListRoutes.length})</h3>
          <button className="btn btn-secondary">
            <Download size={16} />
            {t.export}
          </button>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.875rem' }}>
          {t.watchListDescription}
        </p>
        {watchListRoutes.length > 0 ? (
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
              {watchListRoutes.map((route, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{route.airline}</td>
                  <td><span className="iata-code">{route.lastStop}</span></td>
                  <td style={{ fontWeight: 600 }}>{route.inad}</td>
                  <td>{route.density?.toFixed(4) || 'N/A'}‰</td>
                  <td>{route.confidence || 'N/A'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No watch list routes found.</p>
        )}
      </div>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    color: 'var(--text-muted)'
  }}>
    <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
    <p style={{ marginTop: '16px' }}>Loading analysis data...</p>
    <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Main Dashboard Component
const Dashboard = ({ activeTab, translations, analysisData, isLoading }) => {
  const t = translations;

  // Process analysis data or use sample data
  const { routes, summaryStats, priorityDistributionData } = useMemo(() => {
    if (analysisData?.routes) {
      // Use real data from backend
      const routes = analysisData.routes.map(r => ({
        airline: r.airline,
        lastStop: r.lastStop,
        originCity: r.originCity || '',
        originCountry: r.originCountry || '',
        originLat: r.originLat,
        originLng: r.originLng,
        inad: r.inad,
        pax: r.pax,
        density: r.density,
        confidence: r.confidence,
        priority: r.priority
      }));

      const summary = {
        totalInad: analysisData.summary?.total_inad || 0,
        highPriority: analysisData.summary?.high_priority || 0,
        watchList: analysisData.summary?.watch_list || 0,
        unreliable: analysisData.summary?.unreliable || 0,
        threshold: analysisData.threshold?.toFixed(4) || '0',
        method: analysisData.config?.threshold_method || 'median'
      };

      const priorityData = [
        { name: 'High Priority', value: summary.highPriority, color: '#DC2626' },
        { name: 'Watch List', value: summary.watchList, color: '#D97706' },
        { name: 'Clear', value: analysisData.summary?.clear || 0, color: '#16A34A' },
        { name: 'Unreliable', value: summary.unreliable, color: '#64748B' }
      ];

      return {
        routes,
        summaryStats: summary,
        priorityDistributionData: priorityData
      };
    }

    // Fall back to sample data
    return {
      routes: sampleRoutes,
      summaryStats: defaultSummaryStats,
      priorityDistributionData: defaultPriorityData
    };
  }, [analysisData]);

  const renderTabContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    switch (activeTab) {
      case 'globe': return <GlobeTab t={t} routes={routes} />;
      case 'overview': return <OverviewTab t={t} routes={routes} summaryStats={summaryStats} priorityDistributionData={priorityDistributionData} />;
      case 'airlines': return <AirlinesTab t={t} routes={routes} summaryStats={summaryStats} />;
      case 'priority': return <PriorityTab t={t} routes={routes} summaryStats={summaryStats} />;
      case 'historic': return <HistoricTrends translations={t} />;
      case 'systemic': return <SystemicTab t={t} />;
      case 'legal': return <LegalTab t={t} routes={routes} analysisData={analysisData} />;
      default: return <GlobeTab t={t} routes={routes} />;
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
