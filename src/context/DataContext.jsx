/**
 * CASA Dashboard Data Context
 * Global state management for analysis data
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

// Create context
const DataContext = createContext(null);

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

  // Get historic data
  const fetchHistoricData = useCallback(async (semesterList = null) => {
    const sems = semesterList || semesters.map(s => s.value);
    if (sems.length === 0) return null;

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
  }, [semesters]);

  // Get systemic cases
  const fetchSystemicCases = useCallback(async (semesterList = null) => {
    const sems = semesterList || semesters.map(s => s.value);
    if (sems.length === 0) return null;

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
  }, [semesters]);

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

  // Change semester
  const changeSemester = useCallback(async (semester) => {
    setCurrentSemester(semester);
    await runAnalysis(semester);
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
