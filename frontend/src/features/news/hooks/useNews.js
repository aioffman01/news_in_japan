import { useState, useEffect, useCallback } from 'react';
import { fetchNews, triggerCollection, toggleStar, checkCollectionStatus, checkDbStatus } from '../../../api/news';

export const useNews = (token, onLogout) => {
  const getYesterdayDateString = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getYesterdayDateString());
  const [articles, setArticles] = useState([]);
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [isAlreadyCollected, setIsAlreadyCollected] = useState(false);
  const [collectionLimit, setCollectionLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [collectMessage, setCollectMessage] = useState('');

  // DB diagnostic states
  const [dbChecking, setDbChecking] = useState(false);
  const [dbStatus, setDbStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const [dbMessage, setDbMessage] = useState('');
  const [dbErrorDetails, setDbErrorDetails] = useState('');

  const handleCheckDb = async () => {
    setDbChecking(true);
    setDbStatus('idle');
    setDbMessage('DB 연결 상태 확인 중...');
    setDbErrorDetails('');
    try {
      const res = await checkDbStatus(token);
      if (res.status === 'ok') {
        setDbStatus('success');
        setDbMessage(res.message);
      } else {
        setDbStatus('error');
        setDbMessage(res.message);
        setDbErrorDetails(res.stack_trace || res.error_detail || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error(err);
      setDbStatus('error');
      setDbMessage('API 호출 도중 오류가 발생했습니다.');
      setDbErrorDetails(err.response?.data?.detail || err.message || err.toString());
    } finally {
      setDbChecking(false);
    }
  };


  const loadNews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchNews(token, date, onlyStarred ? true : null);
      setArticles(data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        onLogout();
      } else {
        setError('뉴스를 가져오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, date, onlyStarred, onLogout]);

  const loadStatus = useCallback(async () => {
    if (!date) return;
    try {
      const statusData = await checkCollectionStatus(token, date);
      setIsAlreadyCollected(statusData.is_collected);
    } catch (err) {
      console.error('Failed to check collection status:', err);
    }
  }, [token, date]);

  useEffect(() => {
    loadNews();
    loadStatus();
  }, [loadNews, loadStatus]);

  const handleCollect = async () => {
    setCollecting(true);
    setCollectMessage('수집 준비 중...');
    try {
      const token = localStorage.getItem('dashboard_token');
      const apiBaseUrl = import.meta.env.VITE_API_URL || '/api/v1';
      const targetQuery = `?limit=${collectionLimit}` + (date ? `&target_date=${date}` : '');
      
      const response = await fetch(`${apiBaseUrl}/news/collect${targetQuery}`, {
        method: 'POST',
        headers: {
          'X-Dashboard-Token': token
        }
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.message) {
                setCollectMessage(data.message);
              }
            } catch (e) {
              // Ignore parse errors on partial chunks
            }
          }
        }
      }
      
      setIsAlreadyCollected(true);
      loadNews();
    } catch (err) {
      console.error(err);
      setCollectMessage('수집 트리거 작업 중 에러가 발생했습니다.');
    } finally {
      setCollecting(false);
    }
  };

  const handleToggleStar = async (newsId) => {
    try {
      const updatedArticle = await toggleStar(newsId, token);
      
      // Local state update: either update target article, or filter out if we are in onlyStarred mode
      if (onlyStarred) {
        setArticles(articles.filter(item => item.id !== newsId));
      } else {
        setArticles(articles.map(item => item.id === newsId ? { ...item, is_starred: updatedArticle.is_starred } : item));

      }
    } catch (err) {
      console.error('Failed to toggle star state:', err);
    }
  };

  return {
    date,
    setDate,
    articles,
    onlyStarred,
    setOnlyStarred,
    isAlreadyCollected,
    collectionLimit,
    setCollectionLimit,
    loading,
    error,
    collecting,
    collectMessage,
    handleCollect,
    handleToggleStar,
    dbChecking,
    dbStatus,
    dbMessage,
    dbErrorDetails,
    handleCheckDb,
    refresh: loadNews
  };
};

export default useNews;



