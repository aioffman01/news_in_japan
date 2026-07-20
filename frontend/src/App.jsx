import React, { useState } from 'react';
import AuthPage from './features/auth/Page';
import NewsDashboardPage from './features/news/Page';

function App() {
  const [token, setToken] = useState(localStorage.getItem('dashboard_token') || '');

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('dashboard_token');
    setToken('');
  };

  return (
    <div className="App">
      {token ? (
        <NewsDashboardPage token={token} onLogout={handleLogout} />
      ) : (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
