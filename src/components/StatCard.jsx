import React from 'react';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  iconColor = 'primary', 
  trend = null, 
  trendDirection = 'neutral',
  subtitle = null 
}) => {
  const iconColorClasses = {
    primary: 'card-icon primary',
    danger: 'card-icon danger',
    warning: 'card-icon warning',
    success: 'card-icon success',
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
        <div className={iconColorClasses[iconColor] || iconColorClasses.primary}>
          {icon}
        </div>
      </div>
      <div className="card-value">{value}</div>
      {subtitle && (
        <div className="card-subtitle">{subtitle}</div>
      )}
      {trend && (
        <div className={`card-trend ${trendDirection === 'up' ? 'up' : trendDirection === 'down' ? 'down' : ''}`}>
          {trendDirection === 'up' ? '↑' : '↓'} {trend}
        </div>
      )}
    </div>
  );
};

// Priority Summary Cards Component
export const PrioritySummaryCards = ({ data, translations = {} }) => {
  const t = {
    totalInad: translations.totalInad || 'Total INAD',
    highPriority: translations.highPriority || 'High Priority',
    watchList: translations.watchList || 'Watch List',
    unreliable: translations.unreliable || 'Unreliable',
    threshold: translations.threshold || 'Threshold',
    method: translations.method || 'Method',
  };

  return (
    <div className="stats-grid">
      <StatCard
        title={t.totalInad}
        value={data.totalInad?.toLocaleString() || '0'}
        icon="✈️"
        iconColor="primary"
      />
      <StatCard
        title={t.highPriority}
        value={data.highPriority || '0'}
        icon="🔴"
        iconColor="danger"
        trend={data.highPriorityTrend}
        trendDirection={data.highPriorityTrend?.startsWith('+') ? 'up' : 'down'}
      />
      <StatCard
        title={t.watchList}
        value={data.watchList || '0'}
        icon="🟠"
        iconColor="warning"
      />
      <StatCard
        title={t.unreliable}
        value={data.unreliable || '0'}
        icon="⚪"
        iconColor="success"
      />
      <StatCard
        title={t.threshold}
        value={`${data.threshold || '0'}‰`}
        icon="📏"
        iconColor="primary"
        subtitle={translations.densityThreshold || 'Density threshold'}
      />
      <StatCard
        title={t.method}
        value={data.method || 'Median'}
        icon="⚙️"
        iconColor="primary"
        subtitle={translations.calculationMethod || 'Calculation method'}
      />
    </div>
  );
};

export default StatCard;
