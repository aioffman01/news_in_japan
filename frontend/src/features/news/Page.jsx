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
    handleCheckDb,
    buildVersion,
    csvUploading,
    csvMessage,
    csvErrors,
    handleUploadCSV
  } = useNews(token, onLogout);


  // Initialize year and month local selections
  const initialDate = date ? new Date(date) : new Date();
  const [selectedYear, setSelectedYear] = React.useState(initialDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = React.useState((initialDate.getMonth() + 1).toString().padStart(2, '0'));
  
  // Track active sub-mode for radio selection: 'auto-collect' | 'csv-import'
  const [activeSubMode, setActiveSubMode] = React.useState('auto-collect');

  // Track active main navigation tab: 'view' | 'manage'
  const [activeMainTab, setActiveMainTab] = React.useState('view');

  // Track selected CSV file for upload button action
  const [selectedCSVFile, setSelectedCSVFile] = React.useState(null);

  // Clear selected file when upload finishes
  React.useEffect(() => {
    if (csvMessage && !csvUploading && csvMessage.includes('완료')) {
      setSelectedCSVFile(null);
    }
  }, [csvMessage, csvUploading]);



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
    backgroundColor: '#ffffff',
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
    gridTemplateColumns: '1fr',
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
              {/* Top-Level Main Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `3px solid ${theme.colors.borderColor}`,
          marginBottom: '30px',
          gap: '15px'
        }}>
          <button
            onClick={() => setActiveMainTab('view')}
            style={{
              padding: '14px 28px',
              backgroundColor: 'transparent',
              color: activeMainTab === 'view' ? theme.colors.primary : theme.colors.textMuted,
              border: 'none',
              borderBottom: activeMainTab === 'view' ? `4px solid ${theme.colors.primary}` : '4px solid transparent',
              fontWeight: '800',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-3px'
            }}
          >
            🔍 뉴스 조회
          </button>
          <button
            onClick={() => setActiveMainTab('manage')}
            style={{
              padding: '14px 28px',
              backgroundColor: 'transparent',
              color: activeMainTab === 'manage' ? theme.colors.primary : theme.colors.textMuted,
              border: 'none',
              borderBottom: activeMainTab === 'manage' ? `4px solid ${theme.colors.primary}` : '4px solid transparent',
              fontWeight: '800',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-3px'
            }}
          >
            ⚙️ 수집 및 등록
          </button>
        </div>

        {/* 1. NEWS SEARCH & VIEW TAB CONTENT */}
        {activeMainTab === 'view' && (
          <>
            {/* View Sub-Tabs: Today's News vs Starred */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <button
                onClick={() => setOnlyStarred(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: theme.radius.sm,
                  backgroundColor: !onlyStarred ? theme.colors.primaryLight : '#ffffff',
                  color: !onlyStarred ? theme.colors.primary : theme.colors.textMuted,
                  border: `1px solid ${!onlyStarred ? theme.colors.primary : theme.colors.borderColor}`,
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                📰 오늘의 뉴스
              </button>
              <button
                onClick={() => setOnlyStarred(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: theme.radius.sm,
                  backgroundColor: onlyStarred ? theme.colors.primaryLight : '#ffffff',
                  color: onlyStarred ? theme.colors.primary : theme.colors.textMuted,
                  border: `1px solid ${onlyStarred ? theme.colors.primary : theme.colors.borderColor}`,
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                ★ 주요 뉴스 (이달)
              </button>
            </div>

            {/* Filter controls based on Starred selection */}
            <div style={controlsStyle}>
              {!onlyStarred ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: '600', color: theme.colors.textMain }}>조회 날짜 선택:</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    style={dateInputStyle}
                  />
                </div>
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
          </>
        )}

        {/* 2. MANAGEMENT: COLLECT & REGISTER TAB CONTENT */}
        {activeMainTab === 'manage' && (
          <div style={controlsStyle}>
            <div style={{ width: '100%' }}>
              {/* Radio Button Mode Selector */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px', 
                marginBottom: '15px', 
                paddingBottom: '15px', 
                borderBottom: `1px solid ${theme.colors.borderColor}` 
              }}>
                <span style={{ fontWeight: '700', color: theme.colors.textMain, fontSize: '14px' }}>🛠️ 뉴스 추가 모드:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: theme.colors.textMain, fontWeight: '600' }}>
                  <input
                    type="radio"
                    name="news-add-mode"
                    value="auto-collect"
                    checked={activeSubMode === 'auto-collect'}
                    onChange={() => setActiveSubMode('auto-collect')}
                    style={{ accentColor: theme.colors.primary, transform: 'scale(1.15)', cursor: 'pointer' }}
                  />
                  ⚡ 자동 뉴스 수집 (RSS)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: theme.colors.textMain, fontWeight: '600' }}>
                  <input
                    type="radio"
                    name="news-add-mode"
                    value="csv-import"
                    checked={activeSubMode === 'csv-import'}
                    onChange={() => setActiveSubMode('csv-import')}
                    style={{ accentColor: theme.colors.primary, transform: 'scale(1.15)', cursor: 'pointer' }}
                  />
                  📂 CSV 뉴스 등록
                </label>
              </div>

              {/* Dynamic Controls Content */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap', width: '100%' }}>
                {activeSubMode === 'auto-collect' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '600', color: theme.colors.textMain }}>수집 일자:</span>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        style={dateInputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '600', color: theme.colors.textMain }}>수집 제한:</span>
                      <select
                        value={collectionLimit}
                        onChange={(e) => setCollectionLimit(parseInt(e.target.value, 10))}
                        style={{
                          ...dateInputStyle,
                          cursor: 'pointer',
                        }}
                      >
                        {[10, 15, 20, 30, 40, 50].map((num) => (
                          <option key={num} value={num}>{num}개</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleCollect}
                      disabled={collecting || isAlreadyCollected}
                      style={{ ...collectButtonStyle, height: '42px', display: 'inline-flex', alignItems: 'center' }}
                      onMouseOver={(e) => {
                        if (!isAlreadyCollected) e.target.style.opacity = '0.9';
                      }}
                      onMouseOut={(e) => {
                        if (!isAlreadyCollected) e.target.style.opacity = '1';
                      }}
                    >
                      {collecting ? '수집 중...' : isAlreadyCollected ? '수집 완료' : '새 뉴스 수집 트리거'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '600', color: theme.colors.textMain }}>CSV 파일 등록:</span>
                    <input
                      type="file"
                      accept=".csv"
                      id="csv-file-selector"
                      disabled={csvUploading}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedCSVFile(e.target.files[0]);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="csv-file-selector"
                      style={{
                        padding: '10px 15px',
                        borderRadius: theme.radius.sm,
                        border: `1px solid ${theme.colors.borderColor}`,
                        fontSize: '14px',
                        color: theme.colors.textMain,
                        backgroundColor: '#ffffff',
                        cursor: csvUploading ? 'default' : 'pointer',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '42px',
                        boxSizing: 'border-box'
                      }}
                    >
                      📁 CSV 파일 선택
                    </label>
                    <button
                      disabled={!selectedCSVFile || csvUploading}
                      onClick={() => {
                        if (selectedCSVFile) {
                          handleUploadCSV(selectedCSVFile);
                        }
                      }}
                      style={{
                        ...collectButtonStyle,
                        backgroundColor: (!selectedCSVFile || csvUploading) ? '#B0BEC5' : '#2E7D32',
                        cursor: (!selectedCSVFile || csvUploading) ? 'not-allowed' : 'pointer',
                        height: '42px',
                        boxSizing: 'border-box',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                      onMouseOver={(e) => {
                        if (selectedCSVFile && !csvUploading) e.target.style.opacity = '0.9';
                      }}
                      onMouseOut={(e) => {
                        if (selectedCSVFile && !csvUploading) e.target.style.opacity = '1';
                      }}
                    >
                      {csvUploading ? '등록 중...' : '뉴스 등록'}
                    </button>
                  </div>
                )}
                <div>
                  <button
                    onClick={handleCheckDb}
                    disabled={dbChecking}
                    style={{
                      ...collectButtonStyle,
                      backgroundColor: theme.colors.primary,
                      cursor: 'pointer',
                      height: '42px',
                      boxSizing: 'border-box',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                    onMouseOver={(e) => e.target.style.opacity = '0.9'}
                    onMouseOut={(e) => e.target.style.opacity = '1'}
                  >
                    {dbChecking ? '진단 중...' : '⚙️ 시스템 진단'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}





        {/* CSV Import Notification Area */}
        {!onlyStarred && (selectedCSVFile || csvMessage) && (
          <div style={{
            marginBottom: '20px',
            padding: '12px 18px',
            backgroundColor: '#F5F5F5',
            border: `1px solid ${theme.colors.borderColor}`,
            borderRadius: theme.radius.sm,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: theme.colors.textMain,
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              {selectedCSVFile && (
                <span style={{ color: '#2E7D32', fontWeight: '700', marginRight: '15px' }}>
                  📁 대기 파일: {selectedCSVFile.name} ({Math.round(selectedCSVFile.size / 1024)} KB)
                </span>
              )}
              {csvMessage && (
                <span style={{ 
                  color: csvMessage.includes('오류') ? '#C62828' : theme.colors.primary, 
                  fontWeight: '600'
                }}>
                  {csvUploading ? '⏳ 처리 중: ' : '🔔 알림: '} {csvMessage}
                </span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: theme.colors.textMuted }}>
              * 필수 항목: 기사제목, 요약, 출처, 원본 link, 발행일
            </div>
          </div>
        )}

        {/* CSV Import Detailed Line Errors */}
        {!onlyStarred && csvErrors && csvErrors.length > 0 && (
          <div style={{
            marginBottom: '20px',
            padding: '20px',
            borderRadius: theme.radius.md,
            backgroundColor: '#FFEBEE',
            border: '1px solid #E57373',
            color: '#C62828',
            boxShadow: theme.shadows.sm
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '15px', marginBottom: '12px' }}>
              <span>⚠️</span>
              <span>CSV 뉴스 등록 과정 중 일부 라인에서 에러가 발생했습니다 (정상 라인은 기등록 완료):</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.7', fontWeight: '500' }}>
              {csvErrors.map((errItem, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{errItem}</li>
              ))}
            </ul>
          </div>
        )}



        {/* Database Diagnostic Status Card */}
        {dbStatus !== 'idle' && (
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            borderRadius: theme.radius.md,
            backgroundColor: dbStatus === 'success' ? '#E8F5E9' : (dbStatus === 'partial_error' ? '#FFF9C4' : '#FFEBEE'),
            border: `1px solid ${dbStatus === 'success' ? '#81C784' : (dbStatus === 'partial_error' ? '#FFF59D' : '#E57373')}`,
            color: dbStatus === 'success' ? '#2E7D32' : (dbStatus === 'partial_error' ? '#F57F17' : '#C62828'),
            boxShadow: theme.shadows.sm,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '16px', marginBottom: dbErrorDetails ? '15px' : '0px' }}>
              <span>{dbStatus === 'success' ? '✅' : (dbStatus === 'partial_error' ? '⚠️' : '❌')}</span>
              <span style={{ whiteSpace: 'pre-line' }}>{dbMessage}</span>
            </div>
            
            {dbErrorDetails && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: dbStatus === 'partial_error' ? '#F57F17' : '#B71C1C' }}>
                  🔧 상세 진단 로그 및 스택 트레이스:
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
            {articles.map((article) => {
              // Extract local calendar date without UTC timezone offset
              const getLocalDateString = (d) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              };

              const todayObj = new Date();
              const todayStr = getLocalDateString(todayObj);

              const yesterdayObj = new Date();
              yesterdayObj.setDate(yesterdayObj.getDate() - 1);
              const yesterdayStr = getLocalDateString(yesterdayObj);

              // Parse article date to compare local YYYY-MM-DD
              const articleDateStr = getLocalDateString(new Date(article.published_at));

              const isTodayNews = articleDateStr === todayStr;
              const isYesterdayNews = articleDateStr === yesterdayStr;

              // Apply distinct highlight styles depending on calendar date
              let highlightedCardStyle = cardStyle;
              if (isTodayNews) {
                highlightedCardStyle = {
                  ...cardStyle,
                  backgroundColor: theme.colors.primaryLight,
                  border: `2px solid ${theme.colors.primary}`,
                };
              } else if (isYesterdayNews) {
                highlightedCardStyle = {
                  ...cardStyle,
                  backgroundColor: '#FFF3E0',
                  border: `2px solid ${theme.colors.accent}`,
                };
              }

              const hasHighlight = isTodayNews || isYesterdayNews;

              return (
                <div
                  key={article.id}
                  style={highlightedCardStyle}
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

                  {/* Today News Highlight Badge */}
                  {isTodayNews && (
                    <div style={{
                      position: 'absolute',
                      top: '15px',
                      left: '20px',
                      backgroundColor: theme.colors.primary,
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: theme.radius.sm,
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '0.5px',
                      boxShadow: theme.shadows.sm,
                    }}>
                      📢 HOT (오늘)
                    </div>
                  )}

                  {/* Yesterday News Highlight Badge */}
                  {isYesterdayNews && (
                    <div style={{
                      position: 'absolute',
                      top: '15px',
                      left: '20px',
                      backgroundColor: theme.colors.accent,
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: theme.radius.sm,
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '0.5px',
                      boxShadow: theme.shadows.sm,
                    }}>
                      🔥 HOT (어제)
                    </div>
                  )}

                  <div style={{ marginTop: hasHighlight ? '25px' : '0px' }}>
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
              );
            })}
          </div>
        )}
      </main>
      
      {/* Footer Version Info */}
      <footer style={{
        textAlign: 'center',
        padding: '20px',
        marginTop: '40px',
        borderTop: `1px solid ${theme.colors.borderColor}`,
        fontSize: '12px',
        color: theme.colors.textMuted
      }}>
        <span>NewsInJapan Dashboard | Build Version: {buildVersion}</span>
      </footer>
    </div>
  );
};

export default NewsDashboardPage;

