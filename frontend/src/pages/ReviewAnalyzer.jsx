import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Loader2, 
  Download, 
  Copy, 
  Check, 
  AlertCircle, 
  Inbox, 
  Trash2,
  FileSpreadsheet,
  CornerDownRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { analyzeReviewsApi, getHistoryApi, deleteSessionApi } from '../services/api';
import { getRiskScore, getPriorityScore, getReviewClusters } from '../services/helpers';

export default function ReviewAnalyzer({ reviewsData, setReviewsData, inputText, setInputText }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  
  // Theme filter state
  const [selectedThemeFilter, setSelectedThemeFilter] = useState(null);

  // History states
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [expandedSessions, setExpandedSessions] = useState({});

  // Fetch history list
  const fetchHistory = async (page = 1) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await getHistoryApi(page, 5); // 5 history runs per page
      if (response.success) {
        setHistoryData(response.sessions || []);
        setHistoryPage(response.page || 1);
        setHistoryTotalPages(response.totalPages || 1);
      } else {
        setHistoryError('Invalid history data format received.');
      }
    } catch (err) {
      setHistoryError(err.message || 'Failed to load analysis history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load history on mount
  useEffect(() => {
    fetchHistory(historyPage);
  }, [historyPage]);

  // Split input into lines
  const parseReviews = (text) => {
    return text
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  const handleAnalyze = async () => {
    const reviews = parseReviews(inputText);
    
    if (reviews.length === 0) {
      setError('Please enter at least one review to analyze.');
      setErrorDetails(null);
      return;
    }

    // Individual review length validation (backend enforces min 5 chars)
    const tooShort = reviews.filter((r) => r.length < 5);
    if (tooShort.length > 0) {
      setError(`All reviews must be at least 5 characters. Offending review: "${tooShort[0].slice(0, 30)}..."`);
      setErrorDetails(null);
      return;
    }

    // Batch limit validation (backend enforces max 50 reviews)
    if (reviews.length > 50) {
      setError('A maximum of 50 reviews can be analyzed in a single request.');
      setErrorDetails(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorDetails(null);

    try {
      const response = await analyzeReviewsApi(reviews);
      if (response.success && response.data) {
        setReviewsData((prev) => [...response.data, ...prev]);
        setInputText(''); // Clear input on success
        setSelectedThemeFilter(null); // Reset filters
        fetchHistory(1); // Refresh history and show the latest session on page 1
      } else {
        throw new Error('Invalid response format received from backend.');
      }
    } catch (err) {
      const userMessage = getUserFriendlyErrorMessage(err);
      const isRetryable = err.isRetryable || err.code === 'TIMEOUT_ERROR' || err.code === 'NETWORK_ERROR';
      
      setError(userMessage);
      setErrorDetails({
        code: err.code || 'UNKNOWN',
        isRetryable,
        originalError: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUserFriendlyErrorMessage = (err) => {
    switch (err.code) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the backend. Is the API server running on port 3000? Check your VITE_API_URL setting.';
      case 'TIMEOUT_ERROR':
        return 'Request timed out. The service took too long to respond. Try with fewer reviews or try again.';
      case 'INVALID_RESPONSE':
        return 'The backend returned an unexpected response format. The API may be misconfigured.';
      case 'RATE_LIMIT':
        return 'Too many requests. Please wait a moment before analyzing more reviews.';
      case 'LLM_INVALID_JSON':
      case 'LLM_INVALID_CLASSIFICATION':
        return 'The AI service returned invalid classification data. This is a server-side issue. Please try again.';
      case 'REVIEW_TOO_SHORT':
      case 'BATCH_TOO_LARGE':
      case 'EMPTY_INPUT':
        return err.message || 'Invalid request format.';
      default:
        return err.message || 'An unexpected error occurred while communicating with the AI service.';
    }
  };

  const handleClearInput = () => {
    setInputText('');
    setError(null);
  };

  const handleCopyResponse = (responseTxt, index) => {
    navigator.clipboard.writeText(responseTxt);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    if (reviewsData.length === 0) return;
    const formatted = reviewsData.map(r => 
      `Review: ${r.review}\nSentiment: ${r.sentiment}\nTheme: ${r.theme}\nRisk: ${getRiskScore(r)}\nPriority: ${getPriorityScore(r)}\nResponse: ${r.response}\n---`
    ).join('\n\n');
    
    navigator.clipboard.writeText(formatted);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportCSV = () => {
    if (reviewsData.length === 0) return;
    
    const headers = ['Review', 'Sentiment', 'Theme', 'Risk Score', 'Priority Score', 'Suggested Response'];
    const rows = reviewsData.map((r) => [
      r.review.replace(/"/g, '""'),
      r.sentiment,
      r.theme,
      getRiskScore(r),
      getPriorityScore(r),
      r.response.replace(/"/g, '""')
    ]);

    const csvContent = 
      'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => `"${e.join('","')}"`)].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trishul_reviews_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSession = async (requestId) => {
    if (!window.confirm('Are you sure you want to permanently delete this analysis session?')) return;
    try {
      const response = await deleteSessionApi(requestId);
      if (response.success) {
        fetchHistory(historyPage);
      }
    } catch (err) {
      alert(`Failed to delete session: ${err.message}`);
    }
  };

  const handleLoadSession = (session) => {
    if (session.reviews && session.reviews.length > 0) {
      setReviewsData(session.reviews);
      setSelectedThemeFilter(null);
    }
  };

  const getSentimentBadgeClass = (sentiment) => {
    const s = sentiment?.toLowerCase();
    if (s === 'positive') return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
    if (s === 'negative') return 'bg-rose-50 text-rose-700 border-rose-200/50';
    return 'bg-amber-50 text-amber-700 border-amber-200/50';
  };

  const getRiskBadgeClass = (score) => {
    if (score === 'High Risk') return 'bg-rose-50 text-rose-700 border-rose-200/50';
    if (score === 'Medium Risk') return 'bg-amber-50 text-amber-700 border-amber-200/50';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const getPriorityBadgeClass = (score) => {
    if (score === 'High Priority') return 'bg-rose-50 text-rose-700 border-rose-200/50';
    if (score === 'Medium Priority') return 'bg-amber-50 text-amber-700 border-amber-200/50';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  // Filter reviews by selected theme cluster
  const filteredReviews = selectedThemeFilter
    ? reviewsData.filter(r => r.theme === selectedThemeFilter)
    : reviewsData;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trishul Eco-Homestays</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Guest Review Intelligence Tool</h1>
        <p className="mt-2 text-slate-500 max-w-2xl text-sm md:text-base leading-relaxed">
          Analyze guest reviews using AI-powered sentiment and theme classification. Provide structured data and instant response drafting for your team.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Enter Guest Reviews
            </label>
            <div className="text-[11px] text-slate-400 font-medium">
              Supports single or batch analysis (one review per line)
            </div>
          </div>
          
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste guest reviews here...&#10;One review per line for batch analysis."
              disabled={isLoading}
              rows={5}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-slate-400 focus:ring-0 text-sm placeholder:text-slate-400 font-normal resize-y transition-colors disabled:opacity-50 text-slate-800"
            />
            {inputText && (
              <button
                onClick={handleClearInput}
                disabled={isLoading}
                className="absolute right-3 top-3 p-1.5 rounded bg-white border border-slate-200 shadow-xs text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear input"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* Validation/Error Display */}
          {error && (
            <div className="space-y-2">
              <div className="p-3 bg-rose-50 border border-rose-200/50 rounded-md flex items-start gap-2.5 text-rose-800 text-xs font-medium">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-600" />
                <div className="flex-1 leading-normal">{error}</div>
              </div>
              {errorDetails?.isRetryable && (
                <div className="p-2 bg-amber-50 border border-amber-200/50 rounded-md text-amber-700 text-xs font-medium flex items-start gap-2">
                  <span className="mt-0.5">💡</span>
                  <span>You can try clicking Analyze Reviews again.</span>
                </div>
              )}
              {errorDetails?.code && (
                <div className="text-[10px] text-slate-400 font-mono px-3 py-1.5 bg-slate-50 border border-slate-200 rounded">
                  Error Code: {errorDetails.code}
                </div>
              )}
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="text-[11px] text-slate-400 font-medium">
              {inputText ? `${parseReviews(inputText).length} review(s) detected` : 'Ready to analyze'}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !inputText.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs disabled:opacity-40 disabled:hover:bg-slate-900 transition-all select-none"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing AI Analysis...</span>
                </>
              ) : (
                <>
                  <Play size={12} className="fill-current" />
                  <span>Analyze Reviews</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-md font-bold text-slate-800">
              Analysis Results ({reviewsData.length})
              {selectedThemeFilter && (
                <span className="ml-1 text-slate-400 font-normal">
                  (filtered: {filteredReviews.length} shown)
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400">Reviews analyzed during this session</p>
          </div>
          {reviewsData.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded text-[11px] font-semibold text-slate-600 hover:text-slate-800 transition-all shadow-xs"
              >
                {copiedAll ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedAll ? 'Copied All' : 'Copy All'}</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded text-[11px] font-semibold text-slate-600 hover:text-slate-800 transition-all shadow-xs"
              >
                <FileSpreadsheet size={12} />
                <span>Export CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* Feature 3: Review Clustering Chips */}
        {!isLoading && reviewsData.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
              Theme Clusters (Click to Filter Table)
            </div>
            <div className="flex flex-wrap gap-2">
              {getReviewClusters(reviewsData).map((cluster) => {
                const isActive = selectedThemeFilter === cluster.theme;
                return (
                  <button
                    key={cluster.theme}
                    onClick={() => setSelectedThemeFilter(isActive ? null : cluster.theme)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded border text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : cluster.colorClass
                    }`}
                  >
                    <span>{cluster.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-semibold ${
                      isActive ? 'bg-slate-700 text-white' : 'bg-slate-200/60 text-slate-700'
                    }`}>
                      {cluster.count}
                    </span>
                  </button>
                );
              })}
              {selectedThemeFilter && (
                <button
                  onClick={() => setSelectedThemeFilter(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        )}

        {/* Skeleton Loading State */}
        {isLoading && (
          <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="h-4 bg-slate-200 rounded-sm w-32 animate-pulse" />
              <div className="h-4 bg-slate-200 rounded-sm w-20 animate-pulse" />
            </div>
            <div className="divide-y divide-slate-100 p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="pt-4 first:pt-0 space-y-3">
                  <div className="h-4 bg-slate-100 rounded-sm w-3/4 animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-slate-100 rounded-full w-16 animate-pulse" />
                    <div className="h-5 bg-slate-100 rounded-full w-20 animate-pulse" />
                  </div>
                  <div className="h-4 bg-slate-50 rounded-sm w-5/6 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table & Table States */}
        {!isLoading && (
          reviewsData.length === 0 ? (
            /* Empty State */
            <div className="border border-slate-200 border-dashed rounded-lg bg-white p-12 text-center shadow-xs">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200/50 mb-3 text-slate-400">
                <Inbox size={20} />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">No reviews analyzed yet</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1.5 leading-relaxed">
                Paste one or more reviews in the field above to run classification, extract tags, and draft response suggestions.
              </p>
            </div>
          ) : (
            /* Results Table */
            <div className="border border-slate-200 rounded-lg bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold select-none">
                      <th className="px-4 py-3.5 font-medium w-1/3">Guest Review</th>
                      <th className="px-4 py-3.5 font-medium w-20">Sentiment</th>
                      <th className="px-4 py-3.5 font-medium w-24">Theme</th>
                      <th className="px-4 py-3.5 font-medium w-24">Risk Score</th>
                      <th className="px-4 py-3.5 font-medium w-24">Priority Score</th>
                      <th className="px-4 py-3.5 font-medium">Suggested Management Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReviews.map((row, index) => (
                      <tr 
                        key={index} 
                        className={`hover:bg-slate-50/70 transition-colors ${row.error ? 'bg-rose-50/20' : ''}`}
                      >
                        {/* Review Column */}
                        <td className="px-4 py-3.5 text-slate-700 align-top leading-relaxed whitespace-pre-wrap font-normal">
                          {row.review}
                          {row.error && (
                            <span className="block mt-1 text-[10px] font-semibold text-rose-600">
                              Error: {row.error}
                            </span>
                          )}
                        </td>

                        {/* Sentiment Column */}
                        <td className="px-4 py-3.5 align-top whitespace-nowrap">
                          {row.error ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-rose-50 text-rose-700 border-rose-200/50">
                              Failed
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getSentimentBadgeClass(row.sentiment)}`}>
                              {row.sentiment}
                            </span>
                          )}
                        </td>

                        {/* Theme Column */}
                        <td className="px-4 py-3.5 align-top whitespace-nowrap">
                          {row.error ? (
                            <span className="text-slate-300">—</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/40 font-medium">
                              {row.theme}
                            </span>
                          )}
                        </td>

                        {/* Feature 4: Risk Score Column */}
                        <td className="px-4 py-3.5 align-top whitespace-nowrap">
                          {row.error ? (
                            <span className="text-slate-300">—</span>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRiskBadgeClass(getRiskScore(row))}`}>
                              {getRiskScore(row)}
                            </span>
                          )}
                        </td>

                        {/* Feature 5: Priority Score Column */}
                        <td className="px-4 py-3.5 align-top whitespace-nowrap">
                          {row.error ? (
                            <span className="text-slate-300">—</span>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPriorityBadgeClass(getPriorityScore(row))}`}>
                              {getPriorityScore(row)}
                            </span>
                          )}
                        </td>

                        {/* Response Column */}
                        <td className="px-4 py-3.5 align-top text-slate-600 leading-relaxed font-normal">
                          {row.error ? (
                            <span className="text-slate-400">Classification failed. Check API key status.</span>
                          ) : (
                            <div className="group relative flex gap-2 items-start justify-between">
                              <div className="flex gap-1.5 items-start">
                                <CornerDownRight size={13} className="text-slate-300 mt-1 shrink-0" />
                                <span className="italic">"{row.response}"</span>
                              </div>
                              <button
                                onClick={() => handleCopyResponse(row.response, index)}
                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 ml-2 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all duration-150 shrink-0"
                                title="Copy response to clipboard"
                              >
                                {copiedIndex === index ? (
                                  <Check size={13} className="text-emerald-600" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {/* Feature 1: Recent Analysis History Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Recent Analysis History</h3>
            <p className="text-[10px] text-slate-400">Past review sessions stored in MongoDB Atlas</p>
          </div>
          <button 
            onClick={() => fetchHistory(historyPage)}
            disabled={historyLoading}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-50"
            title="Refresh history"
          >
            <Loader2 size={13} className={historyLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {historyLoading && historyData.length === 0 ? (
          /* History Loading State */
          <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin text-slate-400" />
            <span className="text-xs">Loading database records...</span>
          </div>
        ) : historyError ? (
          /* History Error State */
          <div className="p-8 text-center text-rose-600 flex flex-col items-center justify-center gap-2">
            <AlertCircle size={20} />
            <span className="text-xs font-semibold">{historyError}</span>
            <button 
              onClick={() => fetchHistory(historyPage)} 
              className="mt-2 text-xs text-slate-800 underline font-semibold"
            >
              Retry connection
            </button>
          </div>
        ) : historyData.length === 0 ? (
          /* History Empty State */
          <div className="p-10 text-center text-slate-400">
            <Inbox size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs">No analysis history found in the database.</p>
          </div>
        ) : (
          /* History List Table */
          <div className="divide-y divide-slate-100 text-xs">
            {historyData.map((session) => {
              const isExpanded = !!expandedSessions[session.requestId];
              
              // Calculate sentiment breakdown for the summary row
              let posCount = 0, neuCount = 0, negCount = 0;
              if (session.reviews && Array.isArray(session.reviews)) {
                session.reviews.forEach(r => {
                  if (r.sentiment === 'Positive') posCount++;
                  else if (r.sentiment === 'Neutral') neuCount++;
                  else if (r.sentiment === 'Negative') negCount++;
                });
              }

              return (
                <div key={session.requestId} className="transition-colors hover:bg-slate-50/20">
                  {/* Summary Row */}
                  <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-slate-800">
                          {new Date(session.createdAt).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                          ID: {session.requestId.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {session.reviewCount} reviews ({session.successCount} analyzed, {session.failedCount || 0} failed)
                      </div>
                    </div>

                    {/* Sentiment Breakdown */}
                    <div className="flex items-center gap-1.5 select-none">
                      {posCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-100/50">
                          {posCount} Positive
                        </span>
                      )}
                      {neuCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-50 text-amber-700 border-amber-100/50">
                          {neuCount} Neutral
                        </span>
                      )}
                      {negCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-rose-50 text-rose-700 border-rose-100/50">
                          {negCount} Negative
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoadSession(session)}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded font-semibold text-slate-700 shadow-xs hover:text-slate-900 transition-colors"
                      >
                        Load to Workspace
                      </button>
                      <button
                        onClick={() => {
                          setExpandedSessions(prev => ({ ...prev, [session.requestId]: !isExpanded }));
                        }}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded font-semibold text-slate-700 shadow-xs hover:text-slate-900 flex items-center gap-1 transition-colors"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.requestId)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete from history"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Details */}
                  {isExpanded && (
                    <div className="bg-slate-50/70 p-4 border-t border-slate-100 space-y-3">
                      <div className="font-semibold text-slate-600 mb-1.5">Session Review Details:</div>
                      {(!session.reviews || session.reviews.length === 0) ? (
                        <div className="text-slate-400 italic text-center py-2 bg-white rounded border border-slate-100">No review details available.</div>
                      ) : (
                        <div className="overflow-x-auto border border-slate-200 rounded bg-white">
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold select-none">
                                <th className="px-3 py-2 w-2/5">Review</th>
                                <th className="px-3 py-2 w-16">Sentiment</th>
                                <th className="px-3 py-2 w-20">Theme</th>
                                <th className="px-3 py-2 w-20">Risk</th>
                                <th className="px-3 py-2 w-20">Priority</th>
                                <th className="px-3 py-2">Suggested Response</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {session.reviews.map((r, i) => (
                                <tr key={i} className="hover:bg-slate-50/50">
                                  <td className="px-3 py-2 leading-relaxed whitespace-pre-wrap">{r.review}</td>
                                  <td className="px-3 py-2">
                                    <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold border ${getSentimentBadgeClass(r.sentiment)}`}>
                                      {r.sentiment}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200/40">
                                      {r.theme}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold border ${getRiskBadgeClass(getRiskScore(r))}`}>
                                      {getRiskScore(r)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold border ${getPriorityBadgeClass(getPriorityScore(r))}`}>
                                      {getPriorityScore(r)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-slate-600 italic">"{r.response}"</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* History Pagination Footer */}
            {historyTotalPages > 1 && (
              <div className="p-3 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
                <button
                  onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                  disabled={historyPage === 1}
                  className="px-2 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold"
                >
                  Previous
                </button>
                <span className="text-slate-400 font-medium">
                  Page {historyPage} of {historyTotalPages}
                </span>
                <button
                  onClick={() => setHistoryPage(prev => Math.min(historyTotalPages, prev + 1))}
                  disabled={historyPage === historyTotalPages}
                  className="px-2 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
