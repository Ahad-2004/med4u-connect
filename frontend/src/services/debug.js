/**
 * Simple HTTP debug logger to capture request/response
 * Place this in your frontend to log all API calls
 */

// Add this to frontend/src/services/api.js or create a standalone file

export const enableDebugLogging = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const [resource, config] = args;
    
    console.group(`📤 API Request: ${config?.method || 'GET'} ${resource}`);
    console.log('URL:', resource);
    console.log('Method:', config?.method || 'GET');
    console.log('Headers:', config?.headers);
    console.log('Body:', config?.body ? (typeof config.body === 'string' ? JSON.parse(config.body) : config.body) : 'none');
    console.groupEnd();
    
    try {
      const response = await originalFetch.apply(this, args);
      
      console.group(`📥 API Response: ${response.status} ${response.statusText}`);
      console.log('Status:', response.status);
      console.log('Headers:', {
        'content-type': response.headers.get('content-type'),
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials')
      });
      
      // Clone response to log body without consuming it
      const cloned = response.clone();
      const text = await cloned.text();
      try {
        console.log('Body:', JSON.parse(text));
      } catch {
        console.log('Body (raw):', text.substring(0, 500)); // First 500 chars
      }
      console.groupEnd();
      
      return response;
    } catch (err) {
      console.error('❌ Fetch Error:', err.message);
      throw err;
    }
  };
};

// Usage in your App.jsx or main.jsx:
// import { enableDebugLogging } from './services/api'
// enableDebugLogging()
