// API Configuration
const API_CONFIG = {
  development: {
    // In development use the Vite dev server proxy at /api which forwards to the backend
    BASE_URL: import.meta.env.VITE_CONNECT_API_BASE || '/api',
    CLOUDINARY: {
      CLOUD_NAME: 'dnqn5xuyc',
      UPLOAD_PRESET: 'med4u_uploads'
    }
  },
  production: {
    BASE_URL: 'https://med4u.onrender.com/api/connect',
    CLOUDINARY: {
      CLOUD_NAME: 'dnqn5xuyc',
      UPLOAD_PRESET: 'med4u_uploads'
    }
  }
};

const ENV = import.meta.env.MODE || 'development';

export const API_BASE = API_CONFIG[ENV].BASE_URL;
export const CLOUDINARY_CONFIG = API_CONFIG[ENV].CLOUDINARY;

// API Helper function
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    defaultHeaders['Authorization'] = `Bearer ${options.token}`;
    delete options.token;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    },
    credentials: 'include'
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
};

/**
 * Save a condition (create or update) via hospital endpoint
 * @param {string} accessToken - JWT access token from hospital
 * @param {string} patientId - Target patient ID
 * @param {string} action - 'create' or 'update'
 * @param {object} conditionData - { name, description, severity, diagnosedDate, status, medications, notes }
 * @param {string} docId - Optional, required for update
 * @returns {Promise<{success: boolean, id: string, data: object}>}
 */
export const saveCondition = async (accessToken, patientId, action, conditionData, docId = null) => {
  if (!['create', 'update'].includes(action)) {
    throw new Error('Action must be "create" or "update"');
  }
  if (action === 'update' && !docId) {
    throw new Error('docId is required for update action');
  }

  const payload = {
    accessToken,
    patientId,
    action,
    data: conditionData
  };

  if (action === 'update') {
    payload.docId = docId;
  }

  return apiRequest('/hospital-manage-collection', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};