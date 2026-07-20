import { useState } from 'react';
import { login as loginApi } from '../../../api/auth';

export const useAuth = (onLoginSuccess) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginApi(password);
      localStorage.setItem('dashboard_token', data.token);
      onLoginSuccess(data.token);
    } catch (err) {
      setError('비밀번호가 올바르지 않습니다. 다시 입력해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    password,
    setPassword,
    error,
    loading,
    handleLogin
  };
};

export default useAuth;
