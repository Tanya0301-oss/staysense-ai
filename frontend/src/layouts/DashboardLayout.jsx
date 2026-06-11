import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BarChart3, 
  HelpCircle, 
  Menu, 
  X,
  Clock,
  Bell,
  CalendarDays,
  Check,
  TrendingUp,
  TrendingDown,
  Minus,
  Smile,
  Frown,
  Activity
} from 'lucide-react';
import { getAlertsApi, getWeeklySummaryApi, markAlertsReadApi } from '../services/api';

export default function DashboardLayout({ children, currentPage, setCurrentPage }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);

  const [alerts, setAlerts] = useState([]);
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  useEffect(() => {
    let active = true;
    async function fetchAlerts() {
      try {
        const res = await getAlertsApi();
        if (res.success && active) {
          setAlerts(res.data || []);
        }
      } catch (err) {
        console.error("Failed to load alerts:", err);
      }
    }
    fetchAlerts();
    // Poll alerts every 30 seconds
    const timer = setInterval(fetchAlerts, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // Since read state is now persisted in MongoDB via the backend,
  // we use the `read` flag returned by the server for each alert.
  const unreadAlertsCount = alerts.filter(a => !a.read).length;

  const handleMarkAllAsRead = async () => {
    const unreadIds = alerts.filter(a => !a.read).map(a => a.id);
    if (unreadIds.length === 0) return;
    // Optimistically update UI
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    try {
      await markAlertsReadApi(unreadIds);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      // Re-fetch to sync state
      try {
        const res = await getAlertsApi();
        if (res.success) setAlerts(res.data || []);
      } catch (_) {}
    }
  };

  const handleMarkAsRead = async (alert) => {
    if (alert.read) return;
    // Optimistically update UI
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, read: true } : a));
    try {
      await markAlertsReadApi([alert.id]);
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
      try {
        const res = await getAlertsApi();
        if (res.success) setAlerts(res.data || []);
      } catch (_) {}
    }
  };

  const handleOpenWeeklySummary = async () => {
    setShowWeeklySummary(true);
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const res = await getWeeklySummaryApi();
      if (res.success) {
        setWeeklySummary(res.data);
      } else {
        throw new Error(res.message || "Failed to load summary");
      }
    } catch (err) {
      console.error(err);
      setSummaryError("Failed to fetch weekly management summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const navigationItems = [
    {
      id: 'analyzer',
      name: 'Review Analyzer',
      icon: FileText,
      description: 'Analyze & classify reviews'
    },
    {
      id: 'insights',
      name: 'Insights',
      icon: BarChart3,
      description: 'Analytics & statistics'
    },
    {
      id: 'history',
      name: 'History',
      icon: Clock,
      description: 'Past analysis sessions'
    },
    {
      id: 'help',
      name: 'Help Center',
      icon: HelpCircle,
      description: 'Documentation & guide'
    }
  ];

  const NavItem = ({ item, onClick }) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;
    return (
      <button
        key={item.id}
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm font-medium transition-all ${
          isActive
            ? 'bg-amber-400 text-gray-900 shadow-sm font-semibold'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <Icon
          size={17}
          className={isActive ? 'text-gray-900' : 'text-gray-600'}
        />
        <span>{item.name}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: '#FAF7F2' }}>

      {/* ── Sidebar (Desktop) ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col md:w-60 bg-white border-r border-slate-200">

        {/* Logo / Brand */}
        <div className="h-14 flex items-center px-5 border-b border-slate-100 gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-[#FFB703] rounded flex items-center justify-center shrink-0 shadow-sm border border-amber-500/20">
            <span className="text-gray-900 font-black text-xs">S</span>
          </div>
          <div>
            <span className="font-bold text-[#111827] text-sm tracking-tight block leading-tight">StaySense AI</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              onClick={() => setCurrentPage(item.id)}
            />
          ))}
        </nav>

        {/* Staff Footer */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFB703] flex items-center justify-center text-xs font-bold text-gray-900 border border-amber-500/30 shrink-0 shadow-sm">
              ST
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#111827] truncate">Staff Member</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Drawer ─────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 bg-white h-full shadow-xl">
            <div className="h-14 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-amber-400 rounded flex items-center justify-center">
                  <span className="text-gray-900 font-black text-xs">S</span>
                </div>
                <span className="font-bold text-slate-900 text-sm">StaySense AI</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
              {navigationItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                />
              ))}
            </nav>

            <div className="p-4 border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFB703] flex items-center justify-center text-xs font-bold text-gray-900 shadow-sm">
                  ST
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#111827]">Staff Member</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Top Header Bar ────────────────────────────────────────────── */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 md:px-6 shrink-0">
          {/* Left: Mobile menu button + page context */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors md:hidden"
            >
              <Menu size={19} />
            </button>
            <div className="flex items-center gap-2.5 md:hidden">
              <div className="w-6 h-6 bg-amber-400 rounded flex items-center justify-center">
                <span className="text-gray-900 font-black text-[10px]">S</span>
              </div>
              <span className="font-bold text-slate-900 text-sm">StaySense AI</span>
            </div>
            {/* Desktop: Current page label */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">
                {navigationItems.find(n => n.id === currentPage)?.name || 'Dashboard'}
              </span>
              <span className="text-gray-500">/</span>
              <span className="text-xs text-gray-700 font-medium">
                {navigationItems.find(n => n.id === currentPage)?.description}
              </span>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsAlertPanelOpen(!isAlertPanelOpen)}
                className="relative p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Notifications"
              >
                <Bell size={17} />
                {unreadAlertsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] flex items-center justify-center bg-rose-600 text-white text-[8px] font-bold rounded-full px-1 border border-white">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>

              {isAlertPanelOpen && (
                <>
                  {/* Click outside backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsAlertPanelOpen(false)} />
                  <div className="absolute right-0 mt-2 w-84 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in" style={{ width: '22rem' }}>
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-2">
                        <Bell size={14} className="text-[#FFB703]" />
                        <span className="text-xs font-bold text-[#111827]">Notifications</span>
                        {unreadAlertsCount > 0 && (
                          <span className="text-[9px] font-bold text-white bg-rose-600 px-1.5 py-0.5 rounded-full">
                            {unreadAlertsCount}
                          </span>
                        )}
                      </div>
                      {unreadAlertsCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] text-[#FFB703] hover:text-amber-600 font-bold transition-colors flex items-center gap-1"
                        >
                          <Check size={10} />
                          Mark All Read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {alerts.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell size={20} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-xs font-semibold text-gray-700">No alerts at this time</p>
                          <p className="text-[10px] text-gray-600 mt-0.5">System is healthy</p>
                        </div>
                      ) : (
                        alerts.map((alert) => {
                          const isRead = alert.read;
                          let severityLabel = 'bg-gray-100 text-gray-700';
                          if (alert.severity === 'High') {
                            severityLabel = 'bg-rose-100 text-rose-800';
                          } else if (alert.severity === 'Medium') {
                            severityLabel = 'bg-amber-100 text-amber-800';
                          } else if (alert.severity === 'Low') {
                            severityLabel = 'bg-blue-100 text-blue-800';
                          }
                          return (
                            <div 
                              key={alert.id} 
                              className={`p-3.5 border-l-[3px] transition-colors flex justify-between gap-3 ${
                                isRead 
                                  ? 'border-l-gray-200 bg-slate-50/50 opacity-70' 
                                  : alert.severity === 'High' 
                                    ? 'border-l-rose-500 bg-white' 
                                    : alert.severity === 'Medium' 
                                      ? 'border-l-[#FFB703] bg-white' 
                                      : 'border-l-blue-500 bg-white'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${severityLabel}`}>
                                    {alert.severity}
                                  </span>
                                  {!isRead && (
                                    <span className="w-1.5 h-1.5 bg-[#FFB703] rounded-full shrink-0 animate-pulse" />
                                  )}
                                </div>
                                <span className={`text-xs block text-[#111827] leading-tight ${isRead ? 'font-medium' : 'font-bold'}`}>{alert.title}</span>
                                <p className="text-[11px] text-[#374151] leading-normal mt-0.5">{alert.description}</p>
                                <span className="text-[9px] text-gray-600 block mt-1 font-medium">
                                  {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="shrink-0 flex items-start pt-0.5">
                                {!isRead ? (
                                  <button
                                    onClick={() => handleMarkAsRead(alert)}
                                    className="p-1 rounded-full text-gray-500 hover:text-[#FFB703] hover:bg-amber-50 transition-colors"
                                    title="Mark as read"
                                  >
                                    <Check size={14} />
                                  </button>
                                ) : (
                                  <span className="p-1 text-emerald-600" title="Read">
                                    <Check size={14} className="stroke-[3]" />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Weekly Summary Button */}
            <button
              onClick={handleOpenWeeklySummary}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#FFB703] hover:bg-[#ffa700] text-gray-900 rounded-md text-xs font-bold transition-colors border border-amber-500/30 shadow-sm"
            >
              <CalendarDays size={13} />
              <span>Weekly Summary</span>
            </button>
          </div>
        </header>

        {/* ── Weekly Summary Modal ──────────────────────────────────────── */}
        {showWeeklySummary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-900/40"
              onClick={() => setShowWeeklySummary(false)}
            />
            <div className="relative bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#FFB703] rounded-md">
                    <CalendarDays size={15} className="text-gray-900" />
                  </div>
                  <h2 className="text-sm font-bold text-[#111827]">Weekly Management Summary</h2>
                </div>
                <button
                  onClick={() => setShowWeeklySummary(false)}
                  className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {loadingSummary ? (
                <div className="py-12 text-center text-sm text-gray-700 flex flex-col items-center justify-center gap-2">
                  <Clock className="animate-spin text-amber-500" size={24} />
                  <span>Calculating from MongoDB history...</span>
                </div>
              ) : summaryError ? (
                <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold text-center">
                  {summaryError}
                </div>
              ) : weeklySummary ? (
                <div className="space-y-4">

                  {/* Overall Health Score Banner */}
                  <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${
                    weeklySummary.overallHealth === 'Excellent' ? 'bg-emerald-50 border-emerald-300' :
                    weeklySummary.overallHealth === 'Good' ? 'bg-amber-50 border-[#FFB703]' :
                    weeklySummary.overallHealth === 'Average' ? 'bg-orange-50 border-orange-300' :
                    'bg-rose-50 border-rose-300'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-gray-700 mb-0.5">Overall Health Score</span>
                      <span className={`text-xl font-black ${
                        weeklySummary.overallHealth === 'Excellent' ? 'text-emerald-700' :
                        weeklySummary.overallHealth === 'Good' ? 'text-amber-700' :
                        weeklySummary.overallHealth === 'Average' ? 'text-orange-700' :
                        'text-rose-700'
                      }`}>{weeklySummary.overallHealth}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-[#111827]">{weeklySummary.positivePct}<span className="text-base font-bold text-gray-600">%</span></div>
                      <div className="text-[10px] text-gray-700 font-semibold">Positive Rate</div>
                    </div>
                  </div>

                  {/* Weekly Overview - Sentiment Breakdown */}
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-2">Weekly Overview · {weeklySummary.totalReviews} Reviews Analyzed</h3>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                        <Smile size={14} className="mx-auto text-emerald-600 mb-1" />
                        <div className="text-lg font-black text-emerald-700">{weeklySummary.positivePct}%</div>
                        <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">Positive</div>
                      </div>
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                        <Activity size={14} className="mx-auto text-amber-600 mb-1" />
                        <div className="text-lg font-black text-amber-700">{weeklySummary.neutralPct}%</div>
                        <div className="text-[9px] font-bold text-amber-700 uppercase tracking-wide">Neutral</div>
                      </div>
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-center">
                        <Frown size={14} className="mx-auto text-rose-600 mb-1" />
                        <div className="text-lg font-black text-rose-700">{weeklySummary.negativePct}%</div>
                        <div className="text-[9px] font-bold text-rose-700 uppercase tracking-wide">Negative</div>
                      </div>
                    </div>
                  </div>

                  {/* Strength & Concern Analysis */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 mb-1.5">✦ Strength Analysis</div>
                      <div className="text-xs font-bold text-[#111827]">Top Positive Theme</div>
                      <div className="mt-1 text-sm font-black text-emerald-700">{weeklySummary.mostAppreciatedCategory || weeklySummary.topTheme}</div>
                    </div>
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-rose-700 mb-1.5">⚠ Concern Analysis</div>
                      <div className="text-xs font-bold text-[#111827]">Top Negative Theme</div>
                      <div className={`mt-1 text-sm font-black ${weeklySummary.mostCommonComplaint === 'None' ? 'text-gray-500' : 'text-rose-700'}`}>
                        {weeklySummary.mostCommonComplaint === 'None' ? 'No issues found' : weeklySummary.mostCommonComplaint}
                      </div>
                    </div>
                  </div>

                  {/* Trend Comparison */}
                  {weeklySummary.trendInfo && weeklySummary.trendInfo.previousPositivePct !== null && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-2">Trend Comparison vs Previous Session</div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-700 font-medium">Previous Positive:</span>
                            <span className="font-bold text-[#111827]">{weeklySummary.trendInfo.previousPositivePct}%</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-700 font-medium">Current Positive:</span>
                            <span className="font-bold text-[#111827]">{weeklySummary.trendInfo.currentPositivePct}%</span>
                          </div>
                        </div>
                        <div>
                          {weeklySummary.trendInfo.trend === 'Trend Up' && (
                            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-700 px-3 py-2 rounded-lg font-bold">
                              <TrendingUp size={16} />
                              <div className="text-center">
                                <div className="text-sm font-black">{weeklySummary.trendInfo.change}%</div>
                                <div className="text-[9px] uppercase tracking-wide">Improving</div>
                              </div>
                            </div>
                          )}
                          {weeklySummary.trendInfo.trend === 'Trend Down' && (
                            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 text-rose-700 px-3 py-2 rounded-lg font-bold">
                              <TrendingDown size={16} />
                              <div className="text-center">
                                <div className="text-sm font-black">{weeklySummary.trendInfo.change}%</div>
                                <div className="text-[9px] uppercase tracking-wide">Declining</div>
                              </div>
                            </div>
                          )}
                          {weeklySummary.trendInfo.trend === 'Stable' && (
                            <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg font-bold">
                              <Minus size={16} />
                              <div className="text-center">
                                <div className="text-sm font-black">0%</div>
                                <div className="text-[9px] uppercase tracking-wide">Stable</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {weeklySummary.isFallback && (
                    <p className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-center font-medium leading-relaxed">
                      Note: Showing all-time metrics — no reviews analyzed in the past 7 days.
                    </p>
                  )}
                </div>
              ) : null}

              <button
                onClick={() => setShowWeeklySummary(false)}
                className="mt-5 w-full px-4 py-2.5 bg-[#FFB703] hover:bg-[#ffa700] text-gray-900 rounded-md text-xs font-bold transition-colors border border-amber-500/20"
              >
                Close Report
              </button>
            </div>
          </div>
        )}

        {/* ── Page Content ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
