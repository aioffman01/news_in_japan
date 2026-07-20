import React from 'react';
import useNews from './hooks/useNews';
import theme from '../../core/theme';

export const NewsDashboardPage = ({ token, onLogout }) => {
  const {
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
    handleCheckDb
  } = useNews(token, onLogout);

  // Initialize year and month local selections
  const initialDate = date ? new Date(date) : new Date();
  const [selectedYear, setSelectedYear] = React.useState(initialDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = React.useState((initialDate.getMonth() + 1).toString().padStart(2, '0'));

  // Update selected year and month when hook date changes
  React.useEffect(() => {
    if (date) {
      const d = new Date(date);
      setSelectedYear(d.getFullYear().toString());
      setSelectedMonth((d.getMonth() + 1).toString().padStart(2, '0'));
    }
  }, [date]);

  const handleMonthConfirm = () => {
    // Set date query parameter to the first day of that target year and month
    setDate(`${selectedYear}-${selectedMonth}-01`);
  };

  const dashboardStyle = {
    minHeight: '100vh',
    backgroundColor: theme.colors.bgApp,
    fontFamily: "'Outfit', 'Inter', sans-serif",
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle = {
    backgroundColor: theme.colors.bgSidebar,
    color: '#ffffff',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: theme.shadows.md,
  };

  const logoutButtonStyle = {
    backgroundColor: 'transparent',
    color: theme.colors.textSidebar,
    border: `1px solid ${theme.colors.textSidebar}`,
    borderRadius: theme.radius.sm,
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s',
  };

  const contentStyle = {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
    flex: 1,
  };

  const controlsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    backgroundColor: theme.colors.bgCard,
    padding: '20px',
    borderRadius: theme.radius.md,
    boxShadow: theme.shadows.sm,
    border: `1px solid ${theme.colors.borderColor}`,
    flexWrap: 'wrap',
    gap: '15px'
  };

  const dateInputStyle = {
    padding: '10px 15px',
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.borderColor}`,
    fontSize: '15px',
    color: theme.colors.textMain,
    outline: 'none',
  };

  const collectButtonStyle = {
    padding: '10px 20px',
    backgroundColor: isAlreadyCollected ? '#888888' : theme.colors.accent,
    color: '#ffffff',
    border: 'none',
    borderRadius: theme.radius.sm,
    fontWeight: '600',
    cursor: isAlreadyCollected ? 'default' : 'pointer',
    boxShadow: theme.shadows.sm,
    transition: 'opacity 0.2s, background-color 0.2s',
  };

  const starFilterButtonStyle = {
    padding: '10px 20px',
    backgroundColor: onlyStarred ? theme.colors.accent : 'transparent',
    color: onlyStarred ? '#ffffff' : theme.colors.textMain,
    border: `1px solid ${theme.colors.borderColor}`,
    borderRadius: theme.radius.sm,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '25px',
  };

  const cardStyle = {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    padding: '25px',
    boxShadow: theme.shadows.md,
    border: `1px solid ${theme.colors.borderColor}`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative',
  };

  const cardTitleStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: theme.colors.textMain,
    marginBottom: '10px',
    lineHeight: '1.4',
    paddingRight: '30px', // Prevent overlap with star button
  };

  const cardJaTitleStyle = {
    fontSize: '13px',
    color: theme.colors.textMuted,
    marginBottom: '15px',
    fontStyle: 'italic',
  };

  const cardSummaryStyle = {
    fontSize: '14px',
    color: theme.colors.textMain,
    lineHeight: '1.6',
    marginBottom: '20px',
    flex: 1,
  };

  const metaStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: theme.colors.textMuted,
    borderTop: `1px solid ${theme.colors.borderColor}`,
    paddingTop: '15px',
  };

  const linkStyle = {
    color: theme.colors.primary,
    textDecoration: 'none',
    fontWeight: '600',
  };

  const getStarIconButtonStyle = (isStarred) => ({
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: isStarred ? '#FFD700' : '#CCCCCC',
    outline: 'none',
    transition: 'transform 0.2s, color 0.2s',
  });


  return (
    <div style={dashboardStyle}>
      <header style={headerStyle}>
        <h2 style={{ margin: 0, fontWeight: '700' }}>NewsInJapan 건축 뉴스 대시보드</h2>
        <button
          onClick={onLogout}
          style={logoutButtonStyle}
          onMouseOver={(e) => {
            e.target.style.color = theme.colors.textSidebarActive;
            e.target.style.borderColor = theme.colors.textSidebarActive;
          }}
          onMouseOut={(e) => {
            e.target.style.color = theme.colors.textSidebar;
            e.target.style.borderColor = theme.colors.textSidebar;
          }}
        >
          로그아웃
        </button>
      </header>


      <main style={contentStyle}>
        {/* Category Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `2px solid ${theme.colors.borderColor}`,
          marginBottom: '30px',
          gap: '10px'
        }}>
          <button
            onClick={() => setOnlyStarred(false)}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: !onlyStarred ? theme.colors.primary : theme.colors.textMuted,
              border: 'none',
              borderBottom: !onlyStarred ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
              fontWeight: '700',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            📰 오늘의 뉴스
          </button>
          <button
            onClick={() => setOnlyStarred(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: onlyStarred ? theme.colors.primary : theme.colors.textMuted,
              border: 'none',
              borderBottom: onlyStarred ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
              fontWeight: '700',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            ★ 주요 뉴스 (이달)
          </button>
        </div>

        <div style={controlsStyle}>
          {!onlyStarred ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: '600', color: theme.colors.textMain }}>발행일 조회:</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    style={dateInputStyle}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: '600', color: theme.colors.textMain }}>수집 기사 수:</span>
                  <select
                    value={collectionLimit}
                    onChange={(e) => setCollectionLimit(parseInt(e.target.value, 10))}
                    style={{
                      ...dateInputStyle,
                      cursor: 'pointer',
                    }}
                  >
                    {[10, 15, 20, 30, 40, 50].map((num) => (
                      <option key={num} value={num}>
                        {num}개
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={handleCollect}
                  disabled={collecting || isAlreadyCollected}
                  style={collectButtonStyle}
                  onMouseOver={(e) => {
                    if (!isAlreadyCollected) e.target.style.opacity = '0.9';
                  }}
                  onMouseOut={(e) => {
                    if (!isAlreadyCollected) e.target.style.opacity = '1';
                  }}
                >
                  {collecting 
                    ? '수집 중...' 
                    : isAlreadyCollected 
                      ? '수집 완료' 
                      : '새 뉴스 수집 트리거'}
                </button>
                <button
                  onClick={handleCheckDb}
                  disabled={dbChecking}
                  style={{
                    ...collectButtonStyle,
                    backgroundColor: theme.colors.primary,
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => e.target.style.opacity = '0.9'}
                  onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                  {dbChecking ? '진단 중...' : '🔌 DB 연결 진단'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: '600', color: theme.colors.textMain }}>조회 년월:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={dateInputStyle}
                >
                  {['2024', '2025', '2026'].map((yr) => (
                    <option key={yr} value={yr}>{yr}년</option>
                  ))}
                </select>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={dateInputStyle}
                >
                  {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((mon) => (
                    <option key={mon} value={mon}>{parseInt(mon, 10)}월</option>
                  ))}
                </select>
                <button
                  onClick={handleMonthConfirm}
                  style={{
                    ...collectButtonStyle,
                    backgroundColor: theme.colors.primary,
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => e.target.style.opacity = '0.9'}
                  onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                  조회
                </button>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '14px', color: theme.colors.textMuted, fontWeight: '500' }}>
                ✨ {selectedYear}년 {parseInt(selectedMonth, 10)}월의 주요 뉴스 모아보기
              </div>
            </div>
          )}
        </div>

        {/* Database Diagnostic Status Card */}
        {dbStatus !== 'idle' && (
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            borderRadius: theme.radius.md,
            backgroundColor: dbStatus === 'success' ? '#E8F5E9' : '#FFEBEE',
            border: `1px solid ${dbStatus === 'success' ? '#81C784' : '#E57373'}`,
            color: dbStatus === 'success' ? '#2E7D32' : '#C62828',
            boxShadow: theme.shadows.sm,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '16px', marginBottom: dbErrorDetails ? '15px' : '0px' }}>
              <span>{dbStatus === 'success' ? '✅' : '❌'}</span>
              <span>{dbMessage}</span>
            </div>
            
            {dbStatus === 'error' && dbErrorDetails && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#B71C1C' }}>
                  🔧 상세 오류 로그 (디버깅 정보):
                </div>
                <pre style={{
                  backgroundColor: '#1E1E1E',
                  color: '#FF5252',
                  padding: '15px',
                  borderRadius: theme.radius.sm,
                  overflowX: 'auto',
                  fontSize: '13px',
                  fontFamily: "'Courier New', Courier, monospace",
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  margin: 0,
                  maxHeight: '300px',
                  border: '1px solid #333'
                }}>
                  {dbErrorDetails}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* News Collection Diagnostic Error Card */}
        {!collecting && collectErrorDetails && (
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            borderRadius: theme.radius.md,
            backgroundColor: '#FFEBEE',
            border: '1px solid #E57373',
            color: '#C62828',
            boxShadow: theme.shadows.sm,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '16px', marginBottom: '15px' }}>
              <span>⚠️</span>
              <span>뉴스 수집 과정에서 오류가 감지되었습니다.</span>
            </div>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#B71C1C' }}>
                🔧 뉴스 수집 실패 상세 오류 로그:
              </div>
              <pre style={{
                backgroundColor: '#1E1E1E',
                color: '#FF5252',
                padding: '15px',
                borderRadius: theme.radius.sm,
                overflowX: 'auto',
                fontSize: '13px',
                fontFamily: "'Courier New', Courier, monospace",
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                margin: 0,
                maxHeight: '300px',
                border: '1px solid #333'
              }}>
                {collectErrorDetails}
              </pre>
            </div>
          </div>
        )}



        {collecting ? (
          <div style={{
            textAlign: 'center',
            padding: '80px',
            backgroundColor: theme.colors.bgCard,
            border: `1px dashed ${theme.colors.primary}`,
            borderRadius: theme.radius.md,
            color: theme.colors.textMain,
            boxShadow: theme.shadows.sm,
          }}>
            <div style={{ fontSize: '24px', marginBottom: '15px' }}>🔄</div>
            <div style={{ fontWeight: '600', fontSize: '18px', color: theme.colors.primary, marginBottom: '10px' }}>
              뉴스 수집 진행 중...
            </div>
            <div style={{ fontSize: '15px', color: theme.colors.textMuted }}>
              {collectMessage || '서버에서 기사를 파싱하는 중입니다.'}
            </div>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: theme.colors.textMuted }}>
            뉴스를 로드하는 중입니다...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '50px', color: theme.colors.accent }}>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>{error}</div>
            {loadErrorDetails && (
              <div style={{ marginTop: '20px', maxWidth: '800px', margin: '20px auto 0 auto', textAlign: 'left' }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#B71C1C' }}>
                  🔧 API 로드 실패 상세 오류 로그 (디버그 정보):
                </div>
                <pre style={{
                  backgroundColor: '#1E1E1E',
                  color: '#FF5252',
                  padding: '15px',
                  borderRadius: theme.radius.sm,
                  overflowX: 'auto',
                  fontSize: '13px',
                  fontFamily: "'Courier New', Courier, monospace",
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  margin: 0,
                  maxHeight: '300px',
                  border: '1px solid #333'
                }}>
                  {loadErrorDetails}
                </pre>
              </div>
            )}
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: theme.colors.textMuted }}>
            {onlyStarred 
              ? `${date ? date.substring(0, 7) : ''}월에 등록된 주요 기사가 없습니다.` 
              : `선택한 날짜(${date})에 수집된 건축 관련 뉴스가 없습니다. 우측 상단 수집기를 구동해 보세요.`}
          </div>

        ) : (

          <div style={gridStyle}>
            {articles.map((article) => (
              <div
                key={article.id}
                style={cardStyle}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.08)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = theme.shadows.md;
                }}
              >
                <button
                  onClick={() => handleToggleStar(article.id)}
                  style={getStarIconButtonStyle(article.is_starred)}
                >
                  {article.is_starred ? '★' : '☆'}
                </button>


                <div>
                  <div style={cardTitleStyle}>{article.title_ko}</div>
                  <div style={cardJaTitleStyle}>{article.title_ja}</div>
                  <p style={cardSummaryStyle}>{article.summary_ko}</p>
                </div>
                <div style={metaStyle}>
                  <span>{article.publisher} | {new Date(article.published_at).toLocaleDateString()}</span>
                  <a
                    href={article.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkStyle}
                  >
                    원문 보기 ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NewsDashboardPage;

