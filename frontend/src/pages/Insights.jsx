import React, { useState, useEffect } from 'react';
import { 
  Inbox,
  Sparkles,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Minus
} from 'lucide-react';
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { generateReviewDigest, getReviewClusters } from '../services/helpers';
import { getTrendsApi } from '../services/api';

export default function Insights({ reviewsData }) {
  const [trends, setTrends] = useState([]);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [trendsError, setTrendsError] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadTrends() {
      try {
        setLoadingTrends(true);
        setTrendsError(null);
        const res = await getTrendsApi();
        if (res.success && active) {
          setTrends(res.data || []);
        } else if (active) {
          throw new Error(res.message || "Failed to load trends");
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setTrendsError("Failed to load historical trend analytics.");
        }
      } finally {
        if (active) {
          setLoadingTrends(false);
        }
      }
    }
    loadTrends();
    return () => { active = false; };
  }, [reviewsData]);

  const validReviews = reviewsData.filter(r => !r.error);
  const digest = generateReviewDigest(reviewsData);
  const clusters = getReviewClusters(validReviews);

  const getTrendSummary = () => {
    if (trends.length < 2) return null;
    const latest = trends[trends.length - 1];
    const oldest = trends[0];
    const diff = latest.positivePct - oldest.positivePct;
    if (diff > 3) {
      return { label: 'Improving', diff: `+${diff}%`, color: 'emerald', icon: TrendingUp };
    } else if (diff < -3) {
      return { label: 'Declining', diff: `${diff}%`, color: 'rose', icon: TrendingDown };
    } else {
      return { label: 'Stable', diff: '0%', color: 'gray', icon: Minus };
    }
  };
  const trendSummary = getTrendSummary();

  return (
    <div className="space-y-8 animate-fade-in text-[#111827]">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">Insights</h1>
        <p className="mt-1.5 text-[#374151] max-w-2xl text-sm md:text-base leading-relaxed">
          Aggregated analytics and AI-generated insights from your homestay reviews.
        </p>
      </div>

      {/* ── SECTION 1: Review Clusters ───────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Review Clusters</h2>
        </div>

        {clusters.length === 0 ? (
          <div className="border border-gray-200 border-dashed rounded-xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 mb-3 text-gray-500">
              <Inbox size={18} />
            </div>
            <h3 className="text-xs font-bold text-gray-800">No clusters yet</h3>
            <p className="text-[11px] text-gray-700 max-w-sm mx-auto mt-1.5 leading-relaxed">
              Analyze some reviews in the Review Analyzer to generate thematic clusters.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-[11px] text-gray-700 font-semibold mb-4">
              Thematic groupings detected across {validReviews.length} analyzed reviews
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {clusters.map((cluster) => (
                <div
                  key={cluster.theme}
                  className={`p-4 rounded-lg border ${cluster.colorClass} transition-colors`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">{cluster.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60 border border-current/20">
                      {cluster.count} {cluster.count === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold opacity-80 uppercase tracking-wide">
                    Dominant: {cluster.dominantSentiment}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 2: AI Review Digest ──────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">AI Review Digest</h2>
        </div>

        {!digest ? (
          <div className="border border-gray-200 border-dashed rounded-xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 mb-3 text-gray-500">
              <Sparkles size={18} />
            </div>
            <h3 className="text-xs font-bold text-gray-800">No digest available</h3>
            <p className="text-[11px] text-gray-700 max-w-sm mx-auto mt-1.5 leading-relaxed">
              Analyze reviews using the Review Analyzer to generate an AI-powered digest.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-amber-300 shadow-sm overflow-hidden">
            <div className="flex gap-4 p-5 items-start">
              <div className="p-2 bg-amber-400 rounded-md shrink-0 mt-0.5">
                <Sparkles size={16} className="text-gray-900" />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  AI-Generated Summary · {validReviews.length} reviews analyzed
                </div>
                <p className="text-sm text-[#374151] leading-relaxed font-normal">
                  "{digest}"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 3: Historical Trend Analytics ────────────────────── */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-[#FFB703]" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#111827]">Historical Trend Analytics</h2>
          </div>
          {trendSummary && (
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold border ${
              trendSummary.color === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
              trendSummary.color === 'rose' ? 'bg-rose-50 border-rose-200 text-rose-700' :
              'bg-gray-100 border-gray-200 text-gray-700'
            }`}>
              <trendSummary.icon size={12} />
              <span>{trendSummary.diff} · {trendSummary.label}</span>
            </div>
          )}
        </div>

        {loadingTrends ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-2 shadow-sm">
            <Loader2 className="animate-spin text-[#FFB703]" size={24} />
            <span className="text-xs text-gray-700 font-semibold">Loading trends from MongoDB...</span>
          </div>
        ) : trendsError ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-2 shadow-sm text-rose-700">
            <AlertCircle size={24} />
            <span className="text-xs font-semibold">{trendsError}</span>
          </div>
        ) : trends.length < 2 ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-xl p-12 text-center shadow-sm">
            <Calendar className="mx-auto text-gray-500 mb-2" size={24} />
            <h3 className="text-xs font-bold text-gray-800">More review history is needed to generate trends.</h3>
            <p className="text-[11px] text-gray-700 max-w-sm mx-auto mt-1.5 leading-relaxed">
              Once you save 2 or more review analysis sessions, historical trends will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Trend Chart */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-100 pb-3 mb-5 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-[#111827]">Sentiment Trend — Last {trends.length} Sessions</h3>
                  <p className="text-[10px] text-gray-700 mt-0.5 font-medium">Positive, Neutral, and Negative % per analysis session</p>
                </div>
                <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {trends.length} Sessions
                </span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#374151', fontSize: 10, fontWeight: 600 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      allowDecimals={false}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fill: '#374151', fontSize: 10, fontWeight: 600 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        fontSize: '11px',
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      }}
                      formatter={(value, name) => [`${value}%`, name]}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle" 
                      iconSize={8}
                      wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="positivePct" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#10b981' }}
                      activeDot={{ r: 6 }} 
                      name="Positive %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="neutralPct" 
                      stroke="#FFB703" 
                      strokeWidth={2} 
                      dot={{ r: 3, fill: '#FFB703' }}
                      activeDot={{ r: 5 }} 
                      name="Neutral %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="negativePct" 
                      stroke="#f43f5e" 
                      strokeWidth={2} 
                      dot={{ r: 3, fill: '#f43f5e' }}
                      activeDot={{ r: 5 }} 
                      name="Negative %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trend Summary Card */}
            {trendSummary && (
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                trendSummary.color === 'emerald' ? 'bg-emerald-50 border-emerald-200' :
                trendSummary.color === 'rose' ? 'bg-rose-50 border-rose-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">Trend Summary</div>
                  <div className={`text-sm font-black ${
                    trendSummary.color === 'emerald' ? 'text-emerald-700' :
                    trendSummary.color === 'rose' ? 'text-rose-700' :
                    'text-gray-700'
                  }`}>
                    Positive Trend {trendSummary.diff}
                  </div>
                  <div className="text-xs text-gray-700 font-medium mt-0.5">
                    Comparing Session 1 ({trends[0]?.positivePct}%) → Session {trends.length} ({trends[trends.length-1]?.positivePct}%)
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${
                  trendSummary.color === 'emerald' ? 'bg-emerald-100' :
                  trendSummary.color === 'rose' ? 'bg-rose-100' :
                  'bg-gray-100'
                }`}>
                  <trendSummary.icon size={24} className={
                    trendSummary.color === 'emerald' ? 'text-emerald-600' :
                    trendSummary.color === 'rose' ? 'text-rose-600' :
                    'text-gray-600'
                  } />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
