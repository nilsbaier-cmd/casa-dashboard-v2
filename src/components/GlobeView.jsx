import React, { useRef, useEffect, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { Maximize2, Download, X, RotateCcw } from 'lucide-react';

// Switzerland coordinates
const SWITZERLAND = { lat: 46.8182, lng: 8.2275, name: 'Switzerland' };

// Priority colors
const PRIORITY_COLORS = {
  HIGH_PRIORITY: '#EF4444',
  WATCH_LIST: '#F59E0B',
  CLEAR: '#10B981',
  UNRELIABLE: '#94A3B8',
};

const GlobeView = ({ routes = [], translations = {}, onRouteSelect }) => {
  const globeRef = useRef();
  const containerRef = useRef();
  const [selectedPriorities, setSelectedPriorities] = useState(['HIGH_PRIORITY', 'WATCH_LIST', 'CLEAR']);
  const [minInad, setMinInad] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const t = {
    title: translations.title || 'Route Visualization',
    resetView: translations.resetView || 'Reset View',
    fullscreen: translations.fullscreen || 'Fullscreen',
    download: translations.download || 'Download PNG',
    close: translations.close || 'Close',
    minInad: translations.minInad || 'Min INAD',
    routes: translations.routes || 'Routes',
    origins: translations.origins || 'Origins',
    totalInad: translations.totalInad || 'Total INAD',
    highPriority: translations.highPriority || 'High Priority',
    watchList: translations.watchList || 'Watch List',
    clear: translations.clear || 'Clear',
    switzerland: translations.switzerland || 'Switzerland',
    flightRoute: translations.flightRoute || 'Flight Route',
  };

  // Filter routes
  const filteredRoutes = useMemo(() => {
    return routes.filter(route => 
      selectedPriorities.includes(route.priority) && 
      route.inad >= minInad
    );
  }, [routes, selectedPriorities, minInad]);

  // Generate arc data
  const arcsData = useMemo(() => {
    return filteredRoutes.map(route => ({
      startLat: route.originLat,
      startLng: route.originLng,
      endLat: SWITZERLAND.lat,
      endLng: SWITZERLAND.lng,
      color: [PRIORITY_COLORS[route.priority], '#0D9488'],
      stroke: Math.min(Math.max(route.inad / 3, 1), 5),
      ...route,
    }));
  }, [filteredRoutes]);

  // Generate points data
  const pointsData = useMemo(() => {
    const uniqueOrigins = new Map();
    filteredRoutes.forEach(route => {
      if (!uniqueOrigins.has(route.lastStop)) {
        uniqueOrigins.set(route.lastStop, {
          lat: route.originLat,
          lng: route.originLng,
          name: route.lastStop,
          city: route.originCity,
          size: Math.min(Math.max(route.inad * 0.3, 0.3), 1.5),
          color: PRIORITY_COLORS[route.priority],
          inad: route.inad,
          priority: route.priority,
        });
      }
    });
    
    uniqueOrigins.set('Switzerland', {
      lat: SWITZERLAND.lat,
      lng: SWITZERLAND.lng,
      name: 'Switzerland',
      city: 'Destination',
      size: 1.5,
      color: '#0D9488',
      isDestination: true,
    });
    
    return Array.from(uniqueOrigins.values());
  }, [filteredRoutes]);

  // Set initial position
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 40, lng: 15, altitude: 2.5 }, 1000);
    }
  }, []);

  const togglePriority = (priority) => {
    setSelectedPriorities(prev => 
      prev.includes(priority) 
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const resetView = () => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 40, lng: 15, altitude: 2.5 }, 1000);
    }
  };

  const handleDownload = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#1e293b',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `globe-routes-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const GlobeComponent = ({ height = 450 }) => (
    <Globe
      ref={globeRef}
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
      backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
      
      arcsData={arcsData}
      arcColor="color"
      arcStroke="stroke"
      arcDashLength={0.5}
      arcDashGap={0.2}
      arcDashAnimateTime={2000}
      arcAltitudeAutoScale={0.4}
      arcLabel={d => `
        <div style="
          background: rgba(255,255,255,0.95);
          padding: 12px 16px;
          border-radius: 8px;
          font-family: Inter, sans-serif;
          min-width: 180px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          color: #111827;
        ">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #111827;">
            ${d.airline} → ${d.lastStop}
          </div>
          <div style="color: #6B7280; font-size: 12px; margin-bottom: 8px;">
            ${d.originCity || 'Unknown'}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 12px;">
            <span style="color: #6B7280;">INAD:</span>
            <span style="font-weight: 600; color: #111827;">${d.inad}</span>
            <span style="color: #6B7280;">PAX:</span>
            <span style="color: #111827;">${d.pax?.toLocaleString() || 'N/A'}</span>
            <span style="color: #6B7280;">Density:</span>
            <span style="color: #111827;">${d.density?.toFixed(4) || 'N/A'}‰</span>
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
            <span style="
              padding: 3px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 600;
              background: ${d.priority === 'HIGH_PRIORITY' ? '#FEE2E2' : d.priority === 'WATCH_LIST' ? '#FEF3C7' : '#D1FAE5'};
              color: ${PRIORITY_COLORS[d.priority]};
            ">${d.priority.replace('_', ' ')}</span>
          </div>
        </div>
      `}
      onArcClick={d => onRouteSelect && onRouteSelect(d)}
      
      pointsData={pointsData}
      pointAltitude={0.01}
      pointRadius="size"
      pointColor="color"
      
      atmosphereColor="#0D9488"
      atmosphereAltitude={0.15}
      
      animateIn={true}
      height={height}
    />
  );

  return (
    <>
      <div className="globe-section">
        <div className="globe-header">
          <h2 className="globe-title">🌍 {t.title}</h2>
          <div className="chart-controls">
            <button className="chart-btn" onClick={resetView} title={t.resetView}>
              <RotateCcw size={16} />
            </button>
            <button className="chart-btn" onClick={handleDownload} title={t.download}>
              <Download size={16} />
            </button>
            <button className="chart-btn" onClick={() => setIsFullscreen(true)} title={t.fullscreen}>
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="globe-filters">
          <div className="filter-pills">
            {Object.entries(PRIORITY_COLORS).slice(0, 3).map(([key, color]) => (
              <button
                key={key}
                className={`filter-pill ${key.toLowerCase().replace('_', '')} ${selectedPriorities.includes(key) ? 'active' : ''}`}
                onClick={() => togglePriority(key)}
                style={{
                  borderColor: selectedPriorities.includes(key) ? color : undefined,
                  background: selectedPriorities.includes(key) ? `${color}15` : undefined,
                  color: selectedPriorities.includes(key) ? color : undefined,
                }}
              >
                {key === 'HIGH_PRIORITY' ? t.highPriority : key === 'WATCH_LIST' ? t.watchList : t.clear}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.minInad}:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={minInad}
              onChange={(e) => setMinInad(Number(e.target.value))}
              style={{ width: '80px' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: '24px' }}>{minInad}</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {filteredRoutes.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.routes}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {new Set(filteredRoutes.map(r => r.lastStop)).size}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.origins}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {filteredRoutes.reduce((sum, r) => sum + r.inad, 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.totalInad}</div>
            </div>
          </div>
        </div>

        {/* Globe */}
        <div className="globe-container" ref={containerRef}>
          <GlobeComponent height={450} />
        </div>

        {/* Legend */}
        <div className="globe-legend">
          <div className="legend-item">
            <div className="legend-dot high"></div>
            <span>{t.highPriority}</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot watch"></div>
            <span>{t.watchList}</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot clear"></div>
            <span>{t.clear}</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot dest"></div>
            <span>🇨🇭 {t.switzerland}</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fullscreen-overlay" onClick={() => setIsFullscreen(false)}>
          <div className="fullscreen-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '95vw', maxHeight: '95vh' }}>
            <div className="fullscreen-header">
              <h3 className="chart-title">🌍 {t.title}</h3>
              <div className="chart-controls">
                <button className="chart-btn" onClick={handleDownload}>
                  <Download size={16} />
                </button>
                <button className="fullscreen-close" onClick={() => setIsFullscreen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div style={{ height: 'calc(95vh - 80px)' }}>
              <GlobeComponent height={window.innerHeight * 0.85} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobeView;
