import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle } from 'lucide-react';
import { useData } from '../context/DataContext';

/**
 * Historic Trends Component
 * Displays trend analysis across multiple semesters
 */
const HistoricTrends = ({ translations }) => {
  const t = translations;
  const {
    semesters,
    historicData,
    fetchHistoricData,
    isLoading,
    dataReady
  } = useData();

  const [hasLoaded, setHasLoaded] = useState(false);

  // Load historic data when component mounts
  useEffect(() => {
    if (dataReady && semesters.length >= 2 && !hasLoaded && !historicData) {
      fetchHistoricData()
        .then(() => setHasLoaded(true))
        .catch((err) => {
          console.error('Failed to load historic data:', err);
          setHasLoaded(true); // Prevent infinite retry
        });
    }
  }, [dataReady, semesters, hasLoaded, historicData, fetchHistoricData]);

  // Get trend icon based on direction
  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'worsening':
        return <TrendingUp size={20} style={{ color: 'var(--color-danger)' }} />;
      case 'improving':
        return <TrendingDown size={20} style={{ color: 'var(--color-success)' }} />;
      default:
        return <Minus size={20} style={{ color: 'var(--text-muted)' }} />;
    }
  };

  // Get trend color
  const getTrendColor = (direction) => {
    switch (direction) {
      case 'worsening':
        return 'var(--color-danger)';
      case 'improving':
        return 'var(--color-success)';
      default:
        return 'var(--text-muted)';
    }
  };

  // Calculate max value for chart scaling
  const getMaxValue = () => {
    if (!historicData?.semesters) return 10;
    return Math.max(
      ...historicData.semesters.map(s => s.highPriorityCount + s.watchListCount),
      10
    );
  };

  if (!dataReady || semesters.length < 2) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
        <AlertTriangle size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
        <h3 style={{ marginBottom: '8px' }}>{t.insufficientData || 'Insufficient Data'}</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t.needMultipleSemesters || 'Historic trend analysis requires data from at least 2 semesters.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
        <RefreshCw size={32} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>
          {t.loadingHistoric || 'Loading historic data...'}
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

  if (!historicData) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
        <button
          className="btn btn-primary"
          onClick={() => fetchHistoricData()}
          disabled={isLoading}
        >
          <RefreshCw size={16} />
          {t.loadHistoricData || 'Load Historic Data'}
        </button>
      </div>
    );
  }

  const maxValue = getMaxValue();
  const trend = historicData.trend || { direction: 'stable', highPriorityChange: 0, watchListChange: 0 };

  return (
    <div>
      {/* Trend Summary Banner */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {getTrendIcon(trend.direction)}
            <div>
              <h3 style={{ marginBottom: '4px' }}>
                {t.overallTrend || 'Overall Trend'}
              </h3>
              <span style={{
                fontWeight: 600,
                color: getTrendColor(trend.direction),
                textTransform: 'uppercase'
              }}>
                {trend.direction === 'worsening' ? (t.worsening || 'Worsening') :
                 trend.direction === 'improving' ? (t.improving || 'Improving') :
                 (t.stable || 'Stable')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {t.highPriorityChange || 'High Priority Change'}
              </div>
              <span style={{
                fontWeight: 600,
                color: trend.highPriorityChange > 0 ? 'var(--color-danger)' :
                       trend.highPriorityChange < 0 ? 'var(--color-success)' :
                       'var(--text-muted)'
              }}>
                {trend.highPriorityChange > 0 ? '+' : ''}{trend.highPriorityChange}
              </span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {t.watchListChange || 'Watch List Change'}
              </div>
              <span style={{
                fontWeight: 600,
                color: trend.watchListChange > 0 ? 'var(--color-warning)' :
                       trend.watchListChange < 0 ? 'var(--color-success)' :
                       'var(--text-muted)'
              }}>
                {trend.watchListChange > 0 ? '+' : ''}{trend.watchListChange}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>{t.semesterComparison || 'Semester Comparison'}</h3>

        {/* Bar Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {historicData.semesters?.map((semester, index) => (
            <div key={semester.semester} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '100px', fontSize: '0.875rem', fontWeight: 500 }}>
                {semester.semester}
              </div>
              <div style={{ flex: 1, display: 'flex', gap: '4px', height: '32px' }}>
                {/* High Priority Bar */}
                <div
                  style={{
                    width: `${(semester.highPriorityCount / maxValue) * 50}%`,
                    background: 'var(--color-danger)',
                    borderRadius: '4px 0 0 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '0 8px',
                    minWidth: semester.highPriorityCount > 0 ? '30px' : '0',
                    transition: 'width 0.3s ease'
                  }}
                >
                  <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>
                    {semester.highPriorityCount}
                  </span>
                </div>
                {/* Watch List Bar */}
                <div
                  style={{
                    width: `${(semester.watchListCount / maxValue) * 50}%`,
                    background: 'var(--color-warning)',
                    borderRadius: '0 4px 4px 0',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 8px',
                    minWidth: semester.watchListCount > 0 ? '30px' : '0',
                    transition: 'width 0.3s ease'
                  }}
                >
                  <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>
                    {semester.watchListCount}
                  </span>
                </div>
              </div>
              <div style={{ width: '80px', textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {semester.totalInad} {t.total || 'total'}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--color-danger)' }} />
            <span style={{ fontSize: '0.875rem' }}>{t.highPriority || 'High Priority'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--color-warning)' }} />
            <span style={{ fontSize: '0.875rem' }}>{t.watchList || 'Watch List'}</span>
          </div>
        </div>
      </div>

      {/* Semester Details Table */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">{t.semesterDetails || 'Semester Details'}</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>{t.semester || 'Semester'}</th>
              <th>{t.highPriority || 'High Priority'}</th>
              <th>{t.watchList || 'Watch List'}</th>
              <th>{t.totalInad || 'Total INAD'}</th>
              <th>{t.threshold || 'Threshold'}</th>
              <th>{t.change || 'Change'}</th>
            </tr>
          </thead>
          <tbody>
            {historicData.semesters?.map((semester, index) => {
              const prevSemester = index > 0 ? historicData.semesters[index - 1] : null;
              const change = prevSemester ?
                (semester.highPriorityCount + semester.watchListCount) -
                (prevSemester.highPriorityCount + prevSemester.watchListCount) : 0;

              return (
                <tr key={semester.semester}>
                  <td style={{ fontWeight: 600 }}>{semester.semester}</td>
                  <td>
                    <span className="priority-badge high">{semester.highPriorityCount}</span>
                  </td>
                  <td>
                    <span className="priority-badge watch">{semester.watchListCount}</span>
                  </td>
                  <td>{semester.totalInad}</td>
                  <td>{semester.threshold?.toFixed(4)}‰</td>
                  <td>
                    {index === 0 ? (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: change > 0 ? 'var(--color-danger)' :
                               change < 0 ? 'var(--color-success)' :
                               'var(--text-muted)',
                        fontWeight: 500
                      }}>
                        {change > 0 ? <TrendingUp size={14} /> : change < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                        {change > 0 ? '+' : ''}{change}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoricTrends;
