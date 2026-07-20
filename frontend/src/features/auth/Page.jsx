import React from 'react';
import useAuth from './hooks/useAuth';
import theme from '../../core/theme';

export const AuthPage = ({ onLoginSuccess }) => {
  const { password, setPassword, error, loading, handleLogin } = useAuth(onLoginSuccess);

  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: theme.colors.bgApp,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  };

  const cardStyle = {
    backgroundColor: theme.colors.bgCard,
    padding: '40px',
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadows.lg,
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
    border: `1px solid ${theme.colors.borderColor}`,
  };

  const titleStyle = {
    color: theme.colors.textMain,
    fontSize: '24px',
    marginBottom: '10px',
    fontWeight: '700',
  };

  const subtitleStyle = {
    color: theme.colors.textMuted,
    fontSize: '14px',
    marginBottom: '30px',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    borderRadius: theme.radius.md,
    border: `1.5px solid ${theme.colors.borderColor}`,
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '15px',
    transition: 'border-color 0.2s',
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: theme.colors.primary,
    color: '#ffffff',
    border: 'none',
    borderRadius: theme.radius.md,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };

  const errorStyle = {
    color: theme.colors.accent,
    fontSize: '13px',
    marginTop: '10px',
    textAlign: 'left',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>일본 건축 뉴스 수집기</h1>
        <p style={subtitleStyle}>뉴스 대시보드에 접속하려면 비밀번호를 입력하세요.</p>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="비밀번호 입력 (기본: news1234)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? '인증 중...' : '접속하기'}
          </button>
          {error && <p style={errorStyle}>{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
