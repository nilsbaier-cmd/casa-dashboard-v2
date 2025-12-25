/**
 * CASA Dashboard Data Context
 * Global state management for analysis data
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';

// Create context
const DataContext = createContext(null);

// Helper to detect if we're in static mode (GitHub Pages or no backend configured)
const isStaticMode = () => {
  // Check if we're on GitHub Pages
  if (window.location.hostname.includes('github.io')) return true;
  // Check if no API URL is configured
  if (!process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL === '') return true;
  return false;
};

// Helper to get the base path for static analysis files
const getStaticBasePath = () => `${process.env.PUBLIC_URL || ''}/analysis`;

// Provider component
export const DataProvider = ({ children }) => {
  // Data loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataReady, setDataReady] = useState(false);

  // Available semesters
  const [semesters, setSemesters] = useState([]);

  // Current semester selection
  const [currentSemester, setCurrentSemester] = useState(null);

  // Analysis results
  const [analysisData, setAnalysisData] = useState(null);
  const [historicData, setHistoricData] = useState(null);
  const [systemicCases, setSystemicCases] = useState(null);

  // Configuration
  const [config, setConfig] = useState({
    min_inad: 6,
    min_pax: 5000,
    min_density: 0.10,
    high_priority_multiplier: 1.5,
    threshold_method: 'median',
  });

  // Attempt to load pre-generated static analysis (for GitHub Pages deployments)
  useEffect(() => {
    const loadStaticAnalysis = async () => {
      // Avoid reloading if data is already present
      if (dataReady || semesters.length > 0) return;

      setIsLoading(true);
      setError(null);

      try {
        const basePath = `${process.env.PUBLIC_URL || ''}/analysis`;

        const semestersRes = await fetch(`${basePath}/semesters.json`);
        if (!semestersRes.ok) return;

        const semestersData = await semestersRes.json();
        if (!Array.isArray(semestersData) || semestersData.length === 0) return;

        setSemesters(semestersData);
        setDataReady(true);

        const latest = semestersData[semestersData.length - 1].value;
        setCurrentSemester(latest);

        // Load primary analysis for latest semester
        const analysisRes = await fetch(`${basePath}/analysis_${latest}.json`);
        if (analysisRes.ok) {
          const analysisJson = await analysisRes.json();
          setAnalysisData(analysisJson);
        }

        // Load supporting datasets if available
        const historicRes = await fetch(`${basePath}/historic.json`);
        if (historicRes.ok) {
          setHistoricData(await historicRes.json());
        }

        const systemicRes = await fetch(`${basePath}/systemic.json`);
        if (systemicRes.ok) {
          setSystemicCases(await systemicRes.json());
        }
      } catch (err) {
        console.error('Failed to load static analysis data', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStaticAnalysis();
  }, [dataReady, semesters.length]);

  // Upload files handler
  const uploadFiles = useCallback(async (inadFile, bazlFile) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.uploadFiles(inadFile, bazlFile);
      setSemesters(result.semesters || []);
      setDataReady(true);

      // Auto-select latest semester
      if (result.semesters && result.semesters.length > 0) {
        const latest = result.semesters[result.semesters.length - 1];
        setCurrentSemester(latest.value);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load server files handler
  const loadServerFiles = useCallback(async (inadPath, bazlPath) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.loadServerFiles(inadPath, bazlPath);
      setSemesters(result.semesters || []);
      setDataReady(true);

      // Auto-select latest semester
      if (result.semesters && result.semesters.length > 0) {
        const latest = result.semesters[result.semesters.length - 1];
        setCurrentSemester(latest.value);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run analysis for current semester
  const runAnalysis = useCallback(async (semester = currentSemester) => {
    if (!semester) {
      setError('No semester selected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.analyzeSemester(semester);
      setAnalysisData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSemester]);

  // Get historic data - handles both static and dynamic modes
  const fetchHistoricData = useCallback(async (semesterList = null) => {
    const sems = semesterList || semesters.map(s => s.value);
    if (sems.length === 0) return null;

    // In static mode, load from pre-generated JSON or return cached data
    if (isStaticMode()) {
      // If we already have historic data, return it
      if (historicData) return historicData;

      setIsLoading(true);
      setError(null);
      try {
        const basePath = getStaticBasePath();
        const historicRes = await fetch(`${basePath}/historic.json`);
        if (historicRes.ok) {
          const result = await historicRes.json();
          setHistoricData(result);
          return result;
        }
        return null;
      } catch (err) {
        console.error('Failed to load historic data:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    }

    // Dynamic mode - use API
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.getHistoricData(sems);
      setHistoricData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [semesters, historicData]);

  // Get systemic cases - handles both static and dynamic modes
  const fetchSystemicCases = useCallback(async (semesterList = null) => {
    const sems = semesterList || semesters.map(s => s.value);
    if (sems.length === 0) return null;

    // In static mode, load from pre-generated JSON or return cached data
    if (isStaticMode()) {
      // If we already have systemic cases data, return it
      if (systemicCases) return systemicCases;

      setIsLoading(true);
      setError(null);
      try {
        const basePath = getStaticBasePath();
        const systemicRes = await fetch(`${basePath}/systemic.json`);
        if (systemicRes.ok) {
          const result = await systemicRes.json();
          setSystemicCases(result);
          return result;
        }
        return null;
      } catch (err) {
        console.error('Failed to load systemic cases:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    }

    // Dynamic mode - use API
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.getSystemicCases(sems);
      setSystemicCases(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [semesters, systemicCases]);

  // Update configuration
  const updateConfig = useCallback(async (newConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.updateConfig(newConfig);
      setConfig(result.config);

      // Re-run analysis with new config
      if (currentSemester) {
        await runAnalysis(currentSemester);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSemester, runAnalysis]);

  // Change semester - handles both static and dynamic modes
  const changeSemester = useCallback(async (semester) => {
    setCurrentSemester(semester);

    // In static mode, load from pre-generated JSON files
    if (isStaticMode()) {
      setIsLoading(true);
      setError(null);
      try {
        const basePath = getStaticBasePath();
        const analysisRes = await fetch(`${basePath}/analysis_${semester}.json`);
        if (analysisRes.ok) {
          const analysisJson = await analysisRes.json();
          setAnalysisData(analysisJson);
        } else {
          setError(`Failed to load analysis data for ${semester}`);
        }
      } catch (err) {
        console.error('Failed to load semester data:', err);
        setError('Failed to load semester data');
      } finally {
        setIsLoading(false);
      }
    } else {
      // In dynamic mode, use the API
      await runAnalysis(semester);
    }
  }, [runAnalysis]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const value = {
    // State
    isLoading,
    error,
    dataReady,
    semesters,
    currentSemester,
    analysisData,
    historicData,
    systemicCases,
    config,
    isStaticMode: isStaticMode(), // Expose static mode status to components

    // Actions
    uploadFiles,
    loadServerFiles,
    runAnalysis,
    fetchHistoricData,
    fetchSystemicCases,
    updateConfig,
    changeSemester,
    clearError,
    setCurrentSemester,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook for using the context
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export default DataContext;
