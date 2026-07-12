import { useState } from 'react';
import {
  Play,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Inbox,
  Trash2,
  FileSpreadsheet,
  CornerDownRight
} from 'lucide-react';
import { analyzeReviewsApi } from '../services/api';
import { getRiskScore, getPriorityScore, getReviewClusters } from '../services/helpers';
import { useAuth } from '../context/AuthContext';

export default function ReviewAnalyzer({ reviewsData, setReviewsData, inputText, setInputText }) {
  const { user, openLoginModal } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedThemeFilter, setSelectedThemeFilter] = useState(null);

  const parseReviews = (text) => {
    return text
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  const handleAnalyze = async () => {
    if (!user) {
      openLoginModal();
      return;
    }
    const reviews = parseReviews(inputText);
    if (reviews.length === 0) {
      setError('Please enter at least one review to analyze.');
      setErrorDetails(null);
      return;
    }
    const tooShort = reviews.filter((r) => r.length < 5);
    if (tooShort.length > 0) {
      setError(`All reviews must be at least 5 characters. Offending review: "${tooShort[0].slice(0, 30)}..."`);
      setErrorDetails(null);
      return;
    }
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
        setInputText('');
        setSelectedThemeFilter(null);
      } else {
        throw new Error('Invalid response format received from backend.');
      }
    } catch (err) {
      const userMessage = getUserFriendlyErrorMessage(err);
      const isRetryable = err.isRetryable || err.code === 'TIMEOUT_ERROR' || err.code === 'NETWORK_ERROR';
      setError(userMessage);
      setErrorDetails({ code: err.code || 'UNKNOWN', isRetryable, originalError: err.message });
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

  const handleClearInput = () => { setInputText(''); setError(null); };

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
      r.review.replace(/"/g, '""'), r.sentiment, r.theme, getRiskScore(r), getPriorityScore(r), r.response.replace(/"/g, '""')
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => `"${e.join('","')}"`)].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trishul_reviews_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getPriorityBadgeClass = (score) => {
    if (score === 'High Priority') return 'bg-rose-50 text-rose-700 border-rose-200/50';
    if (score === 'Medium Priority') return 'bg-amber-50 text-amber-700 border-amber-200/50';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const filteredReviews = selectedThemeFilter
    ? reviewsData.filter(r => r.theme === selectedThemeFilter)
    : reviewsData;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">Guest Review Analysis</h1>
        <p className="mt-1.5 text-[#374151] max-w-2xl text-sm md:text-base leading-relaxed">

        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
              Enter Guest Reviews
            </label>
          </div>

          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Paste guest reviews here...\n\nExample:\nThe host was very welcoming and helpful.\nThe room was clean and comfortable.`}
              disabled={isLoading}
              rows={5}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:border-gray-400 focus:ring-0 text-sm placeholder:text-gray-500 font-normal resize-y transition-colors disabled:opacity-50 text-gray-900"
            />
            {inputText && (
              <button
                onClick={handleClearInput}
                disabled={isLoading}
                className="absolute right-3 top-3 p-1.5 rounded bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-gray-800 transition-colors"
                title="Clear input"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="space-y-2">
              <div className="p-3 bg-rose-50 border border-rose-200/50 rounded-md flex items-start gap-2.5 text-rose-800 text-xs font-medium">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-600" />
                <div className="flex-1 leading-normal">{error}</div>
              </div>
              {errorDetails?.isRetryable && (
                <div className="p-2 bg-amber-50 border border-amber-200/50 rounded-md text-amber-800 text-xs font-medium flex items-start gap-2">
                  <span className="mt-0.5">💡</span>
                  <span>You can try clicking Analyze Reviews again.</span>
                </div>
              )}
              {errorDetails?.code && (
                <div className="text-[10px] text-gray-600 font-mono px-3 py-1.5 bg-gray-50 border border-gray-200 rounded">
                  Error Code: {errorDetails.code}
                </div>
              )}
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="text-[11px] text-gray-700 font-medium">
              {inputText ? `${parseReviews(inputText).length} review(s) detected` : ''}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !inputText.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-md text-xs font-bold shadow-sm disabled:opacity-40 disabled:hover:bg-amber-400 transition-all select-none border border-amber-500/30"
            >
              {isLoading ? (
                <><Loader2 size={14} className="animate-spin" /><span>Processing AI Analysis...</span></>
              ) : (
                <><Play size={12} className="fill-current" /><span>Analyze Reviews</span></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-md font-bold text-[#111827]">
              Analysis Results ({reviewsData.length} Reviews)
              {selectedThemeFilter && (
                <span className="ml-1 text-gray-700 font-normal">(filtered: {filteredReviews.length} shown)</span>
              )}
            </h2>
          </div>
          {reviewsData.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-400 rounded text-[11px] font-semibold text-gray-700 hover:text-gray-900 transition-all shadow-sm"
              >
                {copiedAll ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedAll ? 'Copied All' : 'Copy All'}</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-400 rounded text-[11px] font-semibold text-gray-700 hover:text-gray-900 transition-all shadow-sm"
              >
                <FileSpreadsheet size={12} />
                <span>Export CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme Cluster Chips */}
        {!isLoading && reviewsData.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-2.5">
              Review Clusters
            </div>
            <div className="flex flex-wrap gap-2">
              {getReviewClusters(reviewsData).map((cluster) => {
                const isActive = selectedThemeFilter === cluster.theme;
                return (
                  <button
                    key={cluster.theme}
                    onClick={() => setSelectedThemeFilter(isActive ? null : cluster.theme)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded border text-[11px] font-semibold transition-all ${isActive
                        ? 'bg-amber-400 border-amber-500 text-gray-900 shadow-sm'
                        : cluster.colorClass
                      }`}
                  >
                    <span>{cluster.name}</span>
                    <span className={`px-1.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-amber-600/20 text-gray-900' : 'bg-white/60 text-gray-700'
                      }`}>
                      {cluster.count}
                    </span>
                  </button>
                );
              })}
              {selectedThemeFilter && (
                <button
                  onClick={() => setSelectedThemeFilter(null)}
                  className="text-gray-600 hover:text-gray-900 text-xs font-semibold px-2"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        )}

        {/* Skeleton Loading */}
        {isLoading && (
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded-sm w-32 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded-sm w-20 animate-pulse" />
            </div>
            <div className="divide-y divide-gray-100 p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="pt-4 first:pt-0 space-y-3">
                  <div className="h-4 bg-gray-100 rounded-sm w-3/4 animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-gray-100 rounded-full w-16 animate-pulse" />
                    <div className="h-5 bg-gray-100 rounded-full w-20 animate-pulse" />
                  </div>
                  <div className="h-4 bg-gray-50 rounded-sm w-5/6 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table & States */}
        {!isLoading && (
          reviewsData.length === 0 ? (
            <div className="border border-gray-200 border-dashed rounded-lg bg-white p-12 text-center shadow-sm">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 mb-3 text-gray-400">
                <Inbox size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-800">No reviews analyzed yet</h3>
              <p className="text-xs text-gray-600 max-w-xs mx-auto mt-1.5 leading-relaxed">
                Paste one or more reviews in the field above to run classification, extract tags, and draft response suggestions.
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold select-none">
                      <th className="px-4 py-3.5 font-bold w-1/3">Guest Review</th>
                      <th className="px-4 py-3.5 font-bold w-20">Sentiment</th>
                      <th className="px-4 py-3.5 font-bold w-24">Theme</th>
                      <th className="px-4 py-3.5 font-bold w-24">Risk Score</th>
                      <th className="px-4 py-3.5 font-bold w-24">Priority</th>
                      <th className="px-4 py-3.5 font-bold">Suggested Management Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredReviews.map((row, index) => (
                      <tr
                        key={index}
                        className={`hover:bg-amber-50/30 transition-colors ${row.error ? 'bg-rose-50/20' : ''}`}
                      >
                        <td className="px-4 py-4 text-gray-900 align-top leading-relaxed whitespace-pre-wrap font-normal">
                          {row.review}
                          {row.error && (
                            <span className="block mt-1 text-[10px] font-semibold text-rose-600">
                              Error: {row.error}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 align-top whitespace-nowrap">
                          {row.error ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-rose-50 text-rose-700 border-rose-200/50">
                              Failed
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getSentimentBadgeClass(row.sentiment)}`}>
                              {row.sentiment}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 align-top whitespace-nowrap">
                          {row.error ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded bg-gray-100 text-gray-800 border border-gray-200/70 font-semibold">
                              {row.theme}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 align-top whitespace-nowrap">
                          {row.error ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getRiskBadgeClass(getRiskScore(row))}`}>
                              {getRiskScore(row)}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 align-top whitespace-nowrap">
                          {row.error ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getPriorityBadgeClass(getPriorityScore(row))}`}>
                              {getPriorityScore(row)}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 align-top text-gray-800 leading-relaxed font-normal">
                          {row.error ? (
                            <span className="text-gray-600">Classification failed. Check API key status.</span>
                          ) : (
                            <div className="group relative flex gap-2 items-start justify-between">
                              <div className="flex gap-1.5 items-start">
                                <CornerDownRight size={13} className="text-gray-400 mt-1 shrink-0" />
                                <span className="italic">"{row.response}"</span>
                              </div>
                              <button
                                onClick={() => handleCopyResponse(row.response, index)}
                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 ml-2 p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all duration-150 shrink-0"
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
    </div>
  );
}
