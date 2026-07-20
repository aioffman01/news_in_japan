import apiClient from './client';

export const login = async (password) => {
  const response = await apiClient.post('/auth/login', { password });
  return response.data;
};
