import { useState, useEffect, useCallback } from 'react';
import { fetchNews, triggerCollection, toggleStar, checkCollectionStatus, checkDbStatus } from '../../../api/news';
import { fetchBuildVersion } from '../../../api/client';

export const useNews = (token, onLogout) => {
  const getYesterdayDateString = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getYesterdayDateString());
  const [articles, setArticles] = useState([]);
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [collectionLimit, setCollectionLimit] = useState(10);
  const [dbCollectedCount, setDbCollectedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadErrorDetails, setLoadErrorDetails] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [collectMessage, setCollectMessage] = useState('');
  const [collectErrorDetails, setCollectErrorDetails] = useState('');
  const [buildVersion, setBuildVersion] = useState('로딩 중...');

  const isAlreadyCollected = dbCollectedCount >= collectionLimit;

  // DB diagnostic states
  const [dbChecking, setDbChecking] = useState(false);
  const [dbStatus, setDbStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const [dbMessage, setDbMessage] = useState('');
  const [dbErrorDetails, setDbErrorDetails] = useState('');

  const handleCheckDb = async () => {
    setDbChecking(true);
    setDbStatus('idle');
    setDbMessage('시스템 구성요소 상태 진단 중...');
    setDbErrorDetails('');
    try {
      const res = await checkDbStatus(token);
      if (res.status === 'ok') {
        setDbStatus('success');
        setDbMessage(res.message);
      } else {
        setDbStatus('error');
        setDbMessage(res.message);
        setDbErrorDetails(res.stack_trace || res.error_detail || '상세 에러 내역이 없습니다.');
      }
    } catch (err) {
      console.error(err);
      setDbStatus('error');
      setDbMessage('진단 API 호출 도중 통신 오류가 발생했습니다.');
      setDbErrorDetails(err.response?.data?.detail || err.message || err.toString());
    } finally {
      setDbChecking(false);
    }
  };



  const loadNews = useCallback(async () => {
    setLoading(true);
    setError('');
    setLoadErrorDetails('');
    try {
      const data = await fetchNews(token, date, onlyStarred ? true : null);
      setArticles(data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        onLogout();
      } else {
        setError('뉴스를 가져오는데 실패했습니다.');
        // Detailed error payload capture
        const detailMsg = err.response?.data?.detail 
          ? (typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail))
          : '';
        const rawErr = err.response?.data ? JSON.stringify(err.response.data) : '';
        setLoadErrorDetails(detailMsg || rawErr || err.message || err.toString());
      }
    } finally {
      setLoading(false);
    }
  }, [token, date, onlyStarred, onLogout]);

  const loadStatus = useCallback(async () => {
    if (!date) return;
    try {
      const statusData = await checkCollectionStatus(token, date);
      setDbCollectedCount(statusData.collected_count || 0);
      
      // Load build version dynamically from server
      try {
        const verData = await fetchBuildVersion(token);
        if (verData && verData.version) {
          setBuildVersion(verData.version);
        }
      } catch (verErr) {
        console.error('Failed to fetch build version:', verErr);
      }
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
    setCollectErrorDetails('');
    try {
      const token = localStorage.getItem('dashboard_token');
      const apiBaseUrl = import.meta.env.VITE_API_URL || `${window.location.origin}/api/v1`;
      const targetQuery = `?limit=${collectionLimit}` + (date ? `&target_date=${date}` : '');
      
      const response = await fetch(`${apiBaseUrl}/news/collect${targetQuery}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dashboard-Token': token
        }
      });

      if (!response.ok) {
        let errorDetail = 'API request failed';
        try {
          const errData = await response.json();
          errorDetail = errData.detail || JSON.stringify(errData);
        } catch (_) {
          errorDetail = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorDetail);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        
        for (const part of parts) {
          const lines = part.split('\n');
          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(cleanLine.slice(6).trim());
                if (data.status === 'error') {
                  setCollectMessage('오류가 발생하여 중단되었습니다.');
                  setCollectErrorDetails(data.stack_trace || data.message || '뉴스 수집 처리 중 내부 오류가 발생했습니다.');
                } else if (data.message) {
                  setCollectMessage(data.message);
                }
              } catch (e) {
                console.error("SSE parsing single line failed:", e, cleanLine);
              }
            }
          }
        }
      }
      
      loadStatus();
      loadNews();
    } catch (err) {
      console.error(err);
      setCollectMessage('수집 트리거 작업 중 에러가 발생했습니다.');
      setCollectErrorDetails(err.message || err.toString());
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
    collectErrorDetails,
    loadErrorDetails,
    handleCollect,
    handleToggleStar,
    dbChecking,
    dbStatus,
    dbMessage,
    dbErrorDetails,
    buildVersion,
    handleCheckDb,
    refresh: loadNews
  };
};

export default useNews;



