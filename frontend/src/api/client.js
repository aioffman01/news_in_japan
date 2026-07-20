import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api/v1`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API call failed:', error.response || error.message);
    // Auto-logout and alert when API returns 401 Unauthorized
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('dashboard_token');
      alert('세션이 만료되었거나 올바르지 않은 접근입니다. 다시 로그인 해주세요.');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default apiClient;

