import React, { useState, useRef, useCallback } from 'react';
import { Maximize2, Download, X, Minimize2 } from 'lucide-react';

/**
 * ChartContainer - Wrapper for charts/graphs with fullscreen and download capabilities
 * 
 * @param {string} title - Chart title
 * @param {string} icon - Emoji icon for the chart
 * @param {React.ReactNode} children - Chart content
 * @param {string} downloadFileName - Name for downloaded PNG file
 * @param {object} translations - Translation object for labels
 */
const ChartContainer = ({ 
  title, 
  icon = '📊', 
  children, 
  downloadFileName = 'chart',
  translations = {}
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartRef = useRef(null);
  const contentRef = useRef(null);

  const t = {
    fullscreen: translations.fullscreen || 'Fullscreen',
    download: translations.download || 'Download PNG',
    close: translations.close || 'Close',
    ...translations
  };

  // Download chart as PNG
  const handleDownload = useCallback(async () => {
    if (!contentRef.current) return;

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        logging: false,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `${downloadFileName}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to download chart:', error);
      // Fallback: alert user
      alert('Download failed. Please try again or take a screenshot.');
    }
  }, [downloadFileName]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle escape key to close fullscreen
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  // Prevent body scroll when fullscreen
  React.useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const ChartContent = () => (
    <div ref={contentRef} className="chart-content">
      {children}
    </div>
  );

  return (
    <>
      {/* Normal View */}
      <div className="chart-container" ref={chartRef}>
        <div className="chart-header">
          <h3 className="chart-title">
            <span>{icon}</span>
            {title}
          </h3>
          <div className="chart-controls">
            <button 
              className="chart-btn" 
              onClick={handleDownload}
              title={t.download}
              aria-label={t.download}
            >
              <Download size={16} />
            </button>
            <button 
              className="chart-btn" 
              onClick={toggleFullscreen}
              title={t.fullscreen}
              aria-label={t.fullscreen}
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
        <ChartContent />
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fullscreen-overlay" onClick={toggleFullscreen}>
          <div 
            className="fullscreen-content" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fullscreen-header">
              <h3 className="chart-title">
                <span>{icon}</span>
                {title}
              </h3>
              <div className="chart-controls">
                <button 
                  className="chart-btn" 
                  onClick={handleDownload}
                  title={t.download}
                >
                  <Download size={16} />
                </button>
                <button 
                  className="fullscreen-close" 
                  onClick={toggleFullscreen}
                  title={t.close}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div ref={contentRef} className="chart-content" style={{ minHeight: '500px' }}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChartContainer;
