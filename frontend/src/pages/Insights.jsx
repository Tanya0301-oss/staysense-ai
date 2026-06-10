import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Smile, 
  Meh, 
  Frown,
  Inbox,
  Sparkles,
  Loader2,
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  AreaChart,
  Area,
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
    return () => {
      active = false;
    };
  }, [reviewsData]); // reload trends when active reviews update

  const validReviews = reviewsData.filter(r => !r.error);

  const totalCount = validReviews.length;
  const positiveCount = validReviews.filter(r => r.sentiment === 'Positive').length;
  const neutralCount  = validReviews.filter(r => r.sentiment === 'Neutral').length;
  const negativeCount = validReviews.filter(r => r.sentiment === 'Negative').length;

  const positivePct = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 0;
  const neutralPct  = totalCount > 0 ? Math.round((neutralCount  / totalCount) * 100) : 0;
  const negativePct = totalCount > 0 ? Math.round((negativeCount / totalCount) * 100) : 0;

  const sentimentData = [
    { name: 'Positive', value: positiveCount, color: '#10b981' },
    { name: 'Neutral',  value: neutralCount,  color: '#f59e0b' },
    { name: 'Negative', value: negativeCount, color: '#f43f5e' }
  ].filter(item => item.value > 0);

  const themes = ['Food', 'Host', 'Location', 'Cleanliness', 'Value', 'Experience'];
  const themeCounts = themes.reduce((acc, theme) => {
    acc[theme] = validReviews.filter(r => r.theme === theme).length;
    return acc;
  }, {});
  const themeData = themes.map(theme => ({
    name: theme,
    count: themeCounts[theme]
  })).filter(item => item.count > 0);

  const digest = generateReviewDigest(reviewsData);
  const clusters = getReviewClusters(validReviews);

  const getTrendDirection = () => {
    if (trends.length < 2) return null;
    const latest = trends[trends.length - 1];
    const previous = trends[trends.length - 2];
    const diff = latest.positivePct - previous.positivePct;
    if (diff > 3) {
      return { label: 'Improving', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse' };
    } else if (diff < -3) {
      return { label: 'Declining', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    } else {
      return { label: 'Stable', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };
  const trendDir = getTrendDirection();

  return (
    <div className="space-y-8 animate-fade-in text-gray-900">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Trishul Eco-Homestays</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Review Intelligence Dashboard</h1>
        <p className="mt-2 text-gray-700 max-w-2xl text-sm md:text-base leading-relaxed">
          Aggregated analytics and AI-generated insights from your homestay reviews.
        </p>
      </div>

      {/* ── CURRENT SESSION SECTION ───────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-amber-500" size={16} />
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Current Session Insights</h2>
        </div>

        {totalCount === 0 ? (
          <div className="border border-gray-200 border-dashed rounded-lg bg-white p-10 text-center shadow-sm">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 mb-3 text-gray-400">
              <BarChart3 size={18} />
            </div>
            <h3 className="text-xs font-bold text-gray-800">No session analytics available</h3>
            <p className="text-[11px] text-gray-600 max-w-sm mx-auto mt-1.5 leading-relaxed">
              Please analyze some reviews first using the Review Analyzer. Once classified, charts and distribution metrics will automatically populate here in real-time.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Reviews */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Total Reviews</span>
                  <span className="p-1.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                    <BarChart3 size={14} />
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 tracking-tight">{totalCount}</div>
                <div className="mt-1 text-[10px] text-gray-600 font-semibold">Valid classifications</div>
              </div>

              {/* Positive % */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Positive</span>
                  <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Smile size={14} />
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 tracking-tight">
                  {positivePct}<span className="text-lg font-semibold text-gray-500">%</span>
                </div>
                <div className="mt-1 text-[10px] text-gray-600 font-semibold">{positiveCount} of {totalCount} reviews</div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${positivePct}%` }} />
                </div>
              </div>

              {/* Neutral % */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Neutral</span>
                  <span className="p-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                    <Meh size={14} />
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 tracking-tight">
                  {neutralPct}<span className="text-lg font-semibold text-gray-500">%</span>
                </div>
                <div className="mt-1 text-[10px] text-gray-600 font-semibold">{neutralCount} of {totalCount} reviews</div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${neutralPct}%` }} />
                </div>
              </div>

              {/* Negative % */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Negative</span>
                  <span className="p-1.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                    <Frown size={14} />
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 tracking-tight">
                  {negativePct}<span className="text-lg font-semibold text-gray-500">%</span>
                </div>
                <div className="mt-1 text-[10px] text-gray-600 font-semibold">{negativeCount} of {totalCount} reviews</div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: `${negativePct}%` }} />
                </div>
              </div>
            </div>

            {/* AI Review Digest */}
            {digest && (
              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-3">AI Review Digest</h2>
                <div className="bg-white rounded-lg border border-amber-300 shadow-sm overflow-hidden">
                  <div className="flex gap-4 p-5 items-start">
                    <div className="p-2 bg-amber-400 rounded-md shrink-0 mt-0.5">
                      <Sparkles size={16} className="text-gray-900" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        AI-Generated Summary · {totalCount} reviews analyzed
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed font-normal">
                        "{digest}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Review Clusters */}
            {clusters.length > 0 && (
              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-3">Review Clusters</h2>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                  <p className="text-[11px] text-gray-600 font-semibold mb-4">Thematic groupings detected across your reviews</p>
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
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── HISTORICAL TRENDS SECTION ─────────────────────── */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-[#FFB703]" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#111111]">Historical Trends</h2>
          </div>
          {trendDir && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-[#333333]">Sentiment Progression:</span>
              <span className={`px-2 py-0.5 rounded-full font-extrabold border text-[10px] uppercase tracking-wider ${trendDir.color}`}>
                {trendDir.label}
              </span>
            </div>
          )}
        </div>

        {loadingTrends ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center flex flex-col items-center justify-center gap-2 shadow-sm">
            <Loader2 className="animate-spin text-[#FFB703]" size={24} />
            <span className="text-xs text-gray-600 font-semibold">Loading trends from MongoDB...</span>
          </div>
        ) : trendsError ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center flex flex-col items-center justify-center gap-2 shadow-sm text-rose-700">
            <AlertCircle size={24} />
            <span className="text-xs font-semibold">{trendsError}</span>
          </div>
        ) : trends.length === 0 ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-lg p-12 text-center shadow-sm">
            <Calendar className="mx-auto text-gray-400 mb-2" size={24} />
            <h3 className="text-xs font-bold text-gray-800">More review history is needed to generate trends.</h3>
            <p className="text-[11px] text-[#333333] max-w-sm mx-auto mt-1.5 leading-relaxed">
              Once you save 2 or more review analysis sessions in the database, historical trends will populate here dynamically.
            </p>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col">
            <div className="border-b border-gray-100 pb-3 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-[#111111]">Historical Sentiment Progression</h3>
                <p className="text-[10px] text-[#333333] mt-0.5 font-medium">Comparison across the latest {trends.length} sessions</p>
              </div>
              <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {trends.length} Sessions
              </span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#333333', fontSize: 10, fontWeight: 600 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    allowDecimals={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fill: '#333333', fontSize: 10, fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      fontSize: '11px',
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                    formatter={(value) => `${value}%`}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle" 
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: '#333333' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="positivePct" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    activeDot={{ r: 6 }} 
                    name="Positive %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="neutralPct" 
                    stroke="#FFB703" 
                    strokeWidth={2} 
                    activeDot={{ r: 4 }} 
                    name="Neutral %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="negativePct" 
                    stroke="#f43f5e" 
                    strokeWidth={2} 
                    activeDot={{ r: 4 }} 
                    name="Negative %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
