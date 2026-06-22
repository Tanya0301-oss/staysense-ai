import React, { useState } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import ReviewAnalyzer from './pages/ReviewAnalyzer';
import Insights from './pages/Insights';
import History from './pages/History';
import Help from './pages/Help';
import Auth from './pages/Auth';
import Showcase from './pages/Showcase';
import './App.css';

function App() {
  // Auth gate — no backend needed; just tracks whether user clicked "Log In / Create Account"
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [currentPage, setCurrentPage] = useState('analyzer');
  const [reviewsData, setReviewsData] = useState([]);
  const [inputText, setInputText] = useState('');

  // ── Auth screen ───────────────────────────────────────────
  // If the user hasn't "logged in" yet, render the auth page outside the layout
  if (!isAuthenticated) {
    return (
      <Auth onAuthSuccess={() => setIsAuthenticated(true)} />
    );
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
      case 'showcase':
        return <Showcase />;
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
