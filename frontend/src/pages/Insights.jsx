import React from 'react';
import { 
  BarChart3, 
  Smile, 
  Meh, 
  Frown, 
  HelpCircle,
  Inbox,
  Sparkles
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { generateReviewDigest } from '../services/helpers';

export default function Insights({ reviewsData }) {
  // Filter out failed review requests
  const validReviews = reviewsData.filter(r => !r.error);

  const totalCount = validReviews.length;
  const positiveCount = validReviews.filter(r => r.sentiment === 'Positive').length;
  const neutralCount = validReviews.filter(r => r.sentiment === 'Neutral').length;
  const negativeCount = validReviews.filter(r => r.sentiment === 'Negative').length;

  // Sentiment Distribution Data
  const sentimentData = [
    { name: 'Positive', value: positiveCount, color: '#10b981' }, // Emerald-500
    { name: 'Neutral', value: neutralCount, color: '#f59e0b' }, // Amber-500
    { name: 'Negative', value: negativeCount, color: '#f43f5e' } // Rose-500
  ].filter(item => item.value > 0); // only show items with count > 0

  // Theme Distribution Data
  const themes = ['Food', 'Host', 'Location', 'Cleanliness', 'Value', 'Experience'];
  const themeCounts = themes.reduce((acc, theme) => {
    acc[theme] = validReviews.filter(r => r.theme === theme).length;
    return acc;
  }, {});

  const themeData = themes.map(theme => ({
    name: theme,
    count: themeCounts[theme]
  })).filter(item => item.count > 0); // only show themes that have count > 0

  // Generate the AI digest summary
  const digest = generateReviewDigest(reviewsData);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trishul Eco-Homestays</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Analytics & Insights</h1>
        <p className="mt-2 text-slate-500 max-w-2xl text-sm md:text-base leading-relaxed">
          Aggregated statistics and frequency reports generated from your analyzed reviews in the current session.
        </p>
      </div>

      {totalCount === 0 ? (
        /* Empty State */
        <div className="border border-slate-200 border-dashed rounded-lg bg-white p-16 text-center shadow-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200/50 mb-3 text-slate-400">
            <BarChart3 size={20} />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">No session analytics available</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
            Please analyze some reviews first using the Review Analyzer. Once classified, charts and distribution metrics will automatically populate here in real-time.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card: Total */}
            <div className="bg-white p-4 md:p-6 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Analyzed</span>
                <span className="p-1 rounded bg-slate-50 text-slate-500 border border-slate-100">
                  <BarChart3 size={14} />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{totalCount}</span>
                <span className="block text-[10px] text-slate-400 font-medium mt-1">Valid classifications</span>
              </div>
            </div>

            {/* Card: Positive */}
            <div className="bg-white p-4 md:p-6 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Positive Feedback</span>
                <span className="p-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                  <Smile size={14} />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{positiveCount}</span>
                <span className="block text-[10px] text-slate-400 font-medium mt-1">
                  {((positiveCount / totalCount) * 100).toFixed(0)}% of total reviews
                </span>
              </div>
            </div>

            {/* Card: Neutral */}
            <div className="bg-white p-4 md:p-6 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Neutral Feedback</span>
                <span className="p-1 rounded bg-amber-50 text-amber-600 border border-amber-100/50">
                  <Meh size={14} />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{neutralCount}</span>
                <span className="block text-[10px] text-slate-400 font-medium mt-1">
                  {((neutralCount / totalCount) * 100).toFixed(0)}% of total reviews
                </span>
              </div>
            </div>

            {/* Card: Negative */}
            <div className="bg-white p-4 md:p-6 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">Negative Feedback</span>
                <span className="p-1 rounded bg-rose-50 text-rose-600 border border-rose-100/50">
                  <Frown size={14} />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{negativeCount}</span>
                <span className="block text-[10px] text-slate-400 font-medium mt-1">
                  {((negativeCount / totalCount) * 100).toFixed(0)}% of total reviews
                </span>
              </div>
            </div>
          </div>

          {/* Feature 2: AI Review Digest */}
          {digest && (
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex gap-3.5 items-start hover:border-slate-300 transition-colors">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded border border-amber-200/50 shrink-0">
                <Sparkles size={15} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI Review Digest</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-normal italic">
                  "{digest}"
                </p>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart: Sentiment Pie */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs lg:col-span-5 flex flex-col">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sentiment Distribution</h3>
                <p className="text-[10px] text-slate-400">Ratio of positive, neutral, and negative reviews</p>
              </div>
              <div className="h-64 mt-4 flex-1 flex items-center justify-center">
                {sentimentData.length === 0 ? (
                  <div className="text-slate-400 text-xs">No chart data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          fontSize: '11px',
                          backgroundColor: '#ffffff',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '10px', fontWeight: 500 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart: Theme Bar */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs lg:col-span-7 flex flex-col">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Primary Theme Frequencies</h3>
                <p className="text-[10px] text-slate-400">Count of reviews classified per category</p>
              </div>
              <div className="h-64 mt-4 flex-1">
                {themeData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    No themes classified yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={themeData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        allowDecimals={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
                      />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ 
                          fontSize: '11px',
                          backgroundColor: '#ffffff',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="#475569" // Slate-600
                        radius={[4, 4, 0, 0]}
                        barSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
