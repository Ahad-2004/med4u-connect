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