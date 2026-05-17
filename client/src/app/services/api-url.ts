export const API_BASE_URL =
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  window.location.port === '4200'
    ? 'http://localhost:5001/api'
    : '/api';
