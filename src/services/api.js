/**
 * CASA Dashboard API Service
 * Handles all communication with the FastAPI backend
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Check API health status
 */
export const checkHealth = async () => {
  const response = await fetch(`${API_URL}/`);
  return response.json();
};

/**
 * Get current data loading status
 */
export const getStatus = async () => {
  const response = await fetch(`${API_URL}/api/status`);
  return response.json();
};

/**
 * Upload INAD and BAZL data files
 * @param {File} inadFile - INAD-Tabelle Excel file
 * @param {File} bazlFile - BAZL-Daten Excel file
 */
export const uploadFiles = async (inadFile, bazlFile) => {
  const formData = new FormData();
  formData.append('inad_file', inadFile);
  formData.append('bazl_file', bazlFile);

  const response = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
};

/**
 * Load data files from server paths
 * @param {string} inadPath - Path to INAD-Tabelle file
 * @param {string} bazlPath - Path to BAZL-Daten file
 */
export const loadServerFiles = async (inadPath, bazlPath) => {
  const params = new URLSearchParams({
    inad_path: inadPath,
    bazl_path: bazlPath,
  });

  const response = await fetch(`${API_URL}/api/load-server-files?${params}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to load server files');
  }

  return response.json();
};

/**
 * Get available semesters from loaded data
 */
export const getSemesters = async () => {
  const response = await fetch(`${API_URL}/api/semesters`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get semesters');
  }

  return response.json();
};

/**
 * Run analysis for a specific semester
 * @param {string} semester - Semester identifier (e.g., "2024-H2")
 */
export const analyzeSemester = async (semester) => {
  const response = await fetch(`${API_URL}/api/analyze/${semester}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Analysis failed');
  }

  return response.json();
};

/**
 * Get historic data across multiple semesters
 * @param {string[]} semesters - Array of semester identifiers
 */
export const getHistoricData = async (semesters) => {
  const params = new URLSearchParams({
    semesters: semesters.join(','),
  });

  const response = await fetch(`${API_URL}/api/historic?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get historic data');
  }

  return response.json();
};

/**
 * Detect systemic cases across semesters
 * @param {string[]} semesters - Array of semester identifiers
 */
export const getSystemicCases = async (semesters) => {
  const params = new URLSearchParams({
    semesters: semesters.join(','),
  });

  const response = await fetch(`${API_URL}/api/systemic?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to detect systemic cases');
  }

  return response.json();
};

/**
 * Get current analysis configuration
 */
export const getConfig = async () => {
  const response = await fetch(`${API_URL}/api/config`);
  return response.json();
};

/**
 * Update analysis configuration
 * @param {Object} config - Configuration updates
 */
export const updateConfig = async (config) => {
  const response = await fetch(`${API_URL}/api/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update config');
  }

  return response.json();
};

// Export default API object
const api = {
  checkHealth,
  getStatus,
  uploadFiles,
  loadServerFiles,
  getSemesters,
  analyzeSemester,
  getHistoricData,
  getSystemicCases,
  getConfig,
  updateConfig,
};

export default api;
