import React, { useState } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import ReviewAnalyzer from './pages/ReviewAnalyzer';
import Insights from './pages/Insights';
import History from './pages/History';
import Help from './pages/Help';
import Auth from './pages/Auth';
import { useAuth } from './context/AuthContext';
import './App.css';

/**
 * Full-screen loading spinner shown while the auth check is in flight.
 * Prevents a flash of the login page on refresh when the user is already authenticated.
 */
function AuthLoading() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: 'var(--color-bg)' }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
        style={{ background: '#FBBF24' }}
      >
        <span className="text-gray-900 font-black text-sm">S</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <svg
          className="animate-spin w-4 h-4 text-[#FBBF24]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Checking session…
      </div>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  const [currentPage, setCurrentPage] = useState('analyzer');
  const [reviewsData, setReviewsData] = useState([]);
  const [inputText, setInputText] = useState('');

  // ── Session restore in progress ───────────────────────────
  // Show a loading screen while the /me check is in flight.
  // Prevents flashing the login page when the user is already logged in.
  if (loading) {
    return <AuthLoading />;
  }

  // ── Auth screen ───────────────────────────────────────────
  // User is not authenticated — show the login page only
  if (!user) {
    return <Auth />;
  }

  // Handle loading a session from history
  const handleLoadSessionFromHistory = (session) => {
    if (session.reviews && session.reviews.length > 0) {
      setReviewsData(session.reviews);
      setCurrentPage('analyzer');
    }
  };

  // Page renderer helper
  const renderPage = () => {
    switch (currentPage) {
      case 'analyzer':
        return (
          <ReviewAnalyzer
            reviewsData={reviewsData}
            setReviewsData={setReviewsData}
            inputText={inputText}
            setInputText={setInputText}
          />
        );
      case 'insights':
        return <Insights reviewsData={reviewsData} />;
      case 'history':
        return <History onLoadSession={handleLoadSessionFromHistory} />;
      case 'help':
        return (
          <Help
            setTab={setCurrentPage}
            setPreloadedText={setInputText}
          />
        );
      default:
        return (
          <ReviewAnalyzer
            reviewsData={reviewsData}
            setReviewsData={setReviewsData}
            inputText={inputText}
            setInputText={setInputText}
          />
        );
    }
  };

  return (
    <DashboardLayout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </DashboardLayout>
  );
}

export default App;
