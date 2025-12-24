import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Upload, Server, FileSpreadsheet } from 'lucide-react';
import { useData } from '../context/DataContext';

const Configuration = ({ translations = {} }) => {
  const {
    config,
    updateConfig,
    uploadFiles,
    loadServerFiles,
    isLoading,
    dataReady,
    runAnalysis,
    currentSemester
  } = useData();

  // Local state for form
  const [localConfig, setLocalConfig] = useState({
    min_inad: 6,
    min_pax: 5000,
    min_density: 0.10,
    high_priority_multiplier: 1.5,
    threshold_method: 'median'
  });

  // Data source mode
  const [dataSource, setDataSource] = useState('upload'); // 'upload' or 'server'
  const [inadFile, setInadFile] = useState(null);
  const [bazlFile, setBazlFile] = useState(null);
  const [inadPath, setInadPath] = useState('');
  const [bazlPath, setBazlPath] = useState('');
  const [message, setMessage] = useState(null);

  // Sync with context config
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const t = {
    pageTitle: translations.configurationTitle || 'Configuration',
    pageSubtitle: translations.configurationSubtitle || 'Adjust analysis parameters and data sources',
    dataSource: translations.dataSource || 'Data Source',
    uploadFiles: translations.uploadFiles || 'Upload Files',
    useServerFiles: translations.useServerFiles || 'Use Server Files',
    inadFile: translations.inadFile || 'INAD-Tabelle File',
    bazlFile: translations.bazlFile || 'BAZL-Daten File',
    inadPath: translations.inadPath || 'INAD-Tabelle Path',
    bazlPath: translations.bazlPath || 'BAZL-Daten Path',
    loadData: translations.loadData || 'Load Data',
    analysisParameters: translations.analysisParameters || 'Analysis Parameters',
    minInad: translations.minInad || 'Minimum INAD Cases',
    minInadDesc: translations.minInadDesc || 'Minimum number of INAD cases for a route to be considered',
    minPax: translations.minPax || 'Minimum Passengers',
    minPaxDesc: translations.minPaxDesc || 'Minimum passengers for reliable density calculation',
    minDensity: translations.minDensity || 'Minimum Density',
    minDensityDesc: translations.minDensityDesc || 'Absolute minimum density threshold (per mille)',
    multiplier: translations.multiplier || 'High Priority Multiplier',
    multiplierDesc: translations.multiplierDesc || 'Multiplier applied to threshold for high priority classification',
    thresholdMethod: translations.thresholdMethod || 'Threshold Method',
    thresholdMethodDesc: translations.thresholdMethodDesc || 'Statistical method for calculating density threshold',
    median: translations.median || 'Median',
    trimmedMean: translations.trimmedMean || 'Trimmed Mean',
    mean: translations.mean || 'Mean',
    saveConfig: translations.saveConfig || 'Save Configuration',
    resetDefaults: translations.resetDefaults || 'Reset to Defaults',
    dataStatus: translations.dataStatus || 'Data Status',
    dataLoaded: translations.dataLoaded || 'Data loaded and ready',
    noDataLoaded: translations.noDataLoaded || 'No data loaded',
  };

  const handleFileUpload = async () => {
    if (!inadFile || !bazlFile) {
      setMessage({ type: 'error', text: 'Please select both files' });
      return;
    }

    try {
      await uploadFiles(inadFile, bazlFile);
      setMessage({ type: 'success', text: 'Files uploaded successfully' });
      // Run analysis for current semester
      if (currentSemester) {
        await runAnalysis(currentSemester);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleServerLoad = async () => {
    if (!inadPath || !bazlPath) {
      setMessage({ type: 'error', text: 'Please enter both file paths' });
      return;
    }

    try {
      await loadServerFiles(inadPath, bazlPath);
      setMessage({ type: 'success', text: 'Server files loaded successfully' });
      // Run analysis for current semester
      if (currentSemester) {
        await runAnalysis(currentSemester);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleSaveConfig = async () => {
    try {
      await updateConfig(localConfig);
      setMessage({ type: 'success', text: 'Configuration saved' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleResetDefaults = () => {
    setLocalConfig({
      min_inad: 6,
      min_pax: 5000,
      min_density: 0.10,
      high_priority_multiplier: 1.5,
      threshold_method: 'median'
    });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">{t.pageTitle}</h1>
        <p className="page-subtitle">{t.pageSubtitle}</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div style={{
          background: message.type === 'error' ? 'var(--color-danger-light)' : 'var(--color-success-light)',
          color: message.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            &times;
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Data Source Section */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <FileSpreadsheet size={24} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ margin: 0 }}>{t.dataSource}</h3>
          </div>

          {/* Data Source Toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              className={`btn ${dataSource === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDataSource('upload')}
            >
              <Upload size={16} />
              {t.uploadFiles}
            </button>
            <button
              className={`btn ${dataSource === 'server' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDataSource('server')}
            >
              <Server size={16} />
              {t.useServerFiles}
            </button>
          </div>

          {dataSource === 'upload' ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  {t.inadFile}
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xlsm,.xls"
                  onChange={(e) => setInadFile(e.target.files[0])}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  {t.bazlFile}
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xlsm,.xls"
                  onChange={(e) => setBazlFile(e.target.files[0])}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleFileUpload}
                disabled={isLoading}
              >
                <Upload size={16} />
                {isLoading ? 'Loading...' : t.loadData}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  {t.inadPath}
                </label>
                <input
                  type="text"
                  value={inadPath}
                  onChange={(e) => setInadPath(e.target.value)}
                  placeholder="/path/to/INAD-Tabelle.xlsx"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  {t.bazlPath}
                </label>
                <input
                  type="text"
                  value={bazlPath}
                  onChange={(e) => setBazlPath(e.target.value)}
                  placeholder="/path/to/BAZL-Daten.xlsx"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleServerLoad}
                disabled={isLoading}
              >
                <Server size={16} />
                {isLoading ? 'Loading...' : t.loadData}
              </button>
            </div>
          )}

          {/* Data Status */}
          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: dataReady ? 'var(--color-success-light)' : 'var(--bg-tertiary)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: dataReady ? 'var(--color-success)' : 'var(--text-muted)'
            }} />
            <span style={{ fontSize: '0.875rem' }}>
              {dataReady ? t.dataLoaded : t.noDataLoaded}
            </span>
          </div>
        </div>

        {/* Analysis Parameters Section */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Settings size={24} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ margin: 0 }}>{t.analysisParameters}</h3>
          </div>

          {/* Min INAD */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 500 }}>{t.minInad}</span>
              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{localConfig.min_inad}</span>
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={localConfig.min_inad}
              onChange={(e) => setLocalConfig({ ...localConfig, min_inad: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t.minInadDesc}
            </p>
          </div>

          {/* Min PAX */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 500 }}>{t.minPax}</span>
              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{localConfig.min_pax.toLocaleString()}</span>
            </label>
            <input
              type="range"
              min="1000"
              max="20000"
              step="1000"
              value={localConfig.min_pax}
              onChange={(e) => setLocalConfig({ ...localConfig, min_pax: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t.minPaxDesc}
            </p>
          </div>

          {/* Threshold Method */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              {t.thresholdMethod}
            </label>
            <select
              value={localConfig.threshold_method}
              onChange={(e) => setLocalConfig({ ...localConfig, threshold_method: e.target.value })}
              className="semester-select"
            >
              <option value="median">{t.median}</option>
              <option value="trimmed_mean">{t.trimmedMean}</option>
              <option value="mean">{t.mean}</option>
            </select>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t.thresholdMethodDesc}
            </p>
          </div>

          {/* High Priority Multiplier */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 500 }}>{t.multiplier}</span>
              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{localConfig.high_priority_multiplier.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={localConfig.high_priority_multiplier}
              onChange={(e) => setLocalConfig({ ...localConfig, high_priority_multiplier: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t.multiplierDesc}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={handleSaveConfig} disabled={isLoading}>
              <Save size={16} />
              {t.saveConfig}
            </button>
            <button className="btn btn-secondary" onClick={handleResetDefaults}>
              <RefreshCw size={16} />
              {t.resetDefaults}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuration;
