import apiClient from './client';

export const fetchNews = async (token, date = null, isStarred = null) => {
  const params = {};
  if (date) params.date = date;
  if (isStarred !== null) params.is_starred = isStarred;
  
  const response = await apiClient.get('/news', {
    headers: {
      'X-Dashboard-Token': token
    },
    params
  });
  return response.data;
};

export const triggerCollection = async (targetDate = null) => {
  const params = targetDate ? { target_date: targetDate } : {};
  const response = await apiClient.post('/news/collect', null, { params });
  return response.data;
};

export const toggleStar = async (newsId, token) => {
  const response = await apiClient.put(`/news/star/${newsId}`, null, {
    headers: {
      'X-Dashboard-Token': token
    }
  });
  return response.data;
};

export const checkCollectionStatus = async (token, date) => {
  const response = await apiClient.get('/news/collect/status', {
    headers: {
      'X-Dashboard-Token': token
    },
    params: { date }
  });
  return response.data;
};

export const checkDbStatus = async (token) => {
  const response = await apiClient.get('/news/db-check', {
    headers: {
      'X-Dashboard-Token': token
    }
  });
  return response.data;
};

export const importCSV = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post('/news/import-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'X-Dashboard-Token': token
    }
  });
  return response.data;
};





