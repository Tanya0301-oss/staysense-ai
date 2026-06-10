import React, { useState } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import ReviewAnalyzer from './pages/ReviewAnalyzer';
import Insights from './pages/Insights';
import Help from './pages/Help';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('analyzer');
  const [reviewsData, setReviewsData] = useState([]);
  const [inputText, setInputText] = useState('');

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
