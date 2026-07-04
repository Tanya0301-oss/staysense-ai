import React, { useState, useEffect } from 'react';
import {
  Loader2,
  AlertCircle,
  Inbox,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { getHistoryApi, deleteSessionApi } from '../services/api';
import { getRiskScore, getPriorityScore } from '../services/helpers';

export default function HistoryPage({ onLoadSession }) {
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [expandedSessions, setExpandedSessions] = useState({});

  const fetchHistory = async (page = 1) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await getHistoryApi(page, 5);
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

  useEffect(() => {
    fetchHistory(historyPage);
  }, [historyPage]);

  const handleDeleteSession = async (requestId) => {
    if (!window.confirm('Are you sure you want to permanently delete this analysis session?')) return;
    try {
      const response = await deleteSessionApi(requestId);
      if (response.success) fetchHistory(historyPage);
    } catch (err) {
      alert(`Failed to delete session: ${err.message}`);
    }
  };

  const handleLoadSession = (session) => {
    if (session.reviews && session.reviews.length > 0) onLoadSession(session);
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">Analysis History</h1>
        <p className="mt-1.5 text-[#374151] max-w-2xl text-sm md:text-base leading-relaxed">

        </p>
      </div>

      {/* History Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">

        {/* Card Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock size={15} className="text-gray-600" />
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Analysis Sessions</h3>
              <p className="text-[10px] text-gray-700 font-medium mt-0.5">All stored review classification runs from MongoDB</p>
            </div>
          </div>
          <button
            onClick={() => fetchHistory(historyPage)}
            disabled={historyLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 hover:border-gray-400 bg-white text-xs font-semibold text-gray-700 hover:text-gray-900 transition-all disabled:opacity-50 shadow-sm"
            title="Refresh history"
          >
            <RefreshCw size={12} className={historyLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Loading State */}
        {historyLoading && historyData.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 size={22} className="animate-spin text-gray-400" />
            <span className="text-xs text-gray-700 font-semibold">Loading database records...</span>
          </div>

          /* Error State */
        ) : historyError ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-200">
              <AlertCircle size={18} className="text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">{historyError}</p>
              <button
                onClick={() => fetchHistory(historyPage)}
                className="text-xs text-amber-700 underline font-bold hover:text-amber-900"
              >
                Retry connection
              </button>
            </div>
          </div>

          /* Empty State */
        ) : historyData.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 mb-3 text-gray-400">
              <Inbox size={20} />
            </div>
            <p className="text-sm font-bold text-gray-800">No analysis history found</p>
            <p className="text-xs text-gray-600 font-medium mt-1">Analyze some reviews to populate history.</p>
          </div>

          /* History List */
        ) : (
          <div className="divide-y divide-gray-100 text-xs">
            {historyData.map((session) => {
              const isExpanded = !!expandedSessions[session.requestId];
              let posCount = 0, neuCount = 0, negCount = 0;
              if (session.reviews && Array.isArray(session.reviews)) {
                session.reviews.forEach((r) => {
                  if (r.sentiment === 'Positive') posCount++;
                  else if (r.sentiment === 'Neutral') neuCount++;
                  else if (r.sentiment === 'Negative') negCount++;
                });
              }

              return (
                <div key={session.requestId} className="transition-colors hover:bg-gray-50/70">
                  {/* Summary Row */}
                  <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-gray-900">
                          {new Date(session.createdAt).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 border border-gray-200">
                          #{session.requestId.slice(0, 8)}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-600 font-semibold">
                        {session.reviewCount} reviews · {session.successCount} analyzed
                        {session.failedCount > 0 && ` · ${session.failedCount} failed`}
                      </div>
                    </div>

                    {/* Sentiment Badges */}
                    <div className="flex items-center gap-1.5 select-none">
                      {posCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200/70">
                          {posCount} Positive
                        </span>
                      )}
                      {neuCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200/70">
                          {neuCount} Neutral
                        </span>
                      )}
                      {negCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-200/70">
                          {negCount} Negative
                        </span>
                      )}
                    </div>

                    {/* Row Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoadSession(session)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-md font-bold text-gray-900 shadow-sm transition-colors"
                      >
                        <ExternalLink size={11} />
                        Load to Workspace
                      </button>
                      <button
                        onClick={() => setExpandedSessions(prev => ({ ...prev, [session.requestId]: !isExpanded }))}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 hover:border-gray-400 rounded-md font-semibold text-gray-700 shadow-sm hover:text-gray-900 transition-colors"
                      >
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.requestId)}
                        className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-md transition-colors border border-transparent hover:border-rose-100"
                        title="Delete session"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Details */}
                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-100 px-5 py-4 space-y-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-3">
                        Session Review Details
                      </div>
                      {!session.reviews || session.reviews.length === 0 ? (
                        <div className="text-gray-600 font-medium italic text-center py-4 bg-white rounded-lg border border-gray-100">
                          No review details available.
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold select-none">
                                <th className="px-4 py-3 w-2/5">Review</th>
                                <th className="px-4 py-3 w-20">Sentiment</th>
                                <th className="px-4 py-3 w-20">Theme</th>
                                <th className="px-4 py-3 w-24">Risk</th>
                                <th className="px-4 py-3 w-24">Priority</th>
                                <th className="px-4 py-3">Suggested Response</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {session.reviews.map((r, i) => (
                                <tr key={i} className="hover:bg-amber-50/20 transition-colors">
                                  <td className="px-4 py-3 leading-relaxed whitespace-pre-wrap text-gray-900">{r.review}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${getSentimentBadgeClass(r.sentiment)}`}>
                                      {r.sentiment}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200/70 font-semibold">
                                      {r.theme}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${getRiskBadgeClass(getRiskScore(r))}`}>
                                      {getRiskScore(r)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${getPriorityBadgeClass(getPriorityScore(r))}`}>
                                      {getPriorityScore(r)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-800 italic leading-relaxed">"{r.response}"</td>
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

            {/* Pagination */}
            {historyTotalPages > 1 && (
              <div className="px-5 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                <button
                  onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                  disabled={historyPage === 1}
                  className="px-3 py-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 font-semibold text-gray-700 text-xs transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-[11px] text-gray-700 font-semibold">
                  Page {historyPage} of {historyTotalPages}
                </span>
                <button
                  onClick={() => setHistoryPage(prev => Math.min(historyTotalPages, prev + 1))}
                  disabled={historyPage === historyTotalPages}
                  className="px-3 py-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 font-semibold text-gray-700 text-xs transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
