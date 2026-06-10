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
  Minus
} from 'lucide-react';
import { getAlertsApi, getWeeklySummaryApi } from '../services/api';

export default function DashboardLayout({ children, currentPage, setCurrentPage }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);

  const [alerts, setAlerts] = useState([]);
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const [readAlertIds, setReadAlertIds] = useState(() => {
    try {
      const saved = localStorage.getItem('readAlertIds');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

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
    // Poll alerts every 30 seconds to keep them dynamic
    const timer = setInterval(fetchAlerts, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const getAlertKey = (alert) => `${alert.id}_${alert.createdAt}`;

  const unreadAlertsCount = alerts.filter(a => !readAlertIds.includes(getAlertKey(a))).length;

  const handleMarkAllAsRead = () => {
    const keysToAdd = alerts.map(getAlertKey);
    const updated = Array.from(new Set([...readAlertIds, ...keysToAdd]));
    setReadAlertIds(updated);
    localStorage.setItem('readAlertIds', JSON.stringify(updated));
  };

  const handleMarkAsRead = (alert) => {
    const key = getAlertKey(alert);
    if (!readAlertIds.includes(key)) {
      const updated = [...readAlertIds, key];
      setReadAlertIds(updated);
      localStorage.setItem('readAlertIds', JSON.stringify(updated));
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
          className={isActive ? 'text-gray-900' : 'text-gray-500'}
        />
        <span>{item.name}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-[#FAF9F6] overflow-hidden font-sans">

      {/* ── Sidebar (Desktop) ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col md:w-60 bg-white border-r border-slate-200">

        {/* Logo / Brand */}
        <div className="h-14 flex items-center px-5 border-b border-slate-100 gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-[#FFB703] rounded flex items-center justify-center shrink-0 shadow-sm border border-amber-500/20">
            <span className="text-gray-900 font-black text-xs">S</span>
          </div>
          <div>
            <span className="font-bold text-[#111111] text-sm tracking-tight block leading-tight">StaySense AI</span>
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
              <p className="text-xs font-semibold text-[#111111] truncate">Staff Member</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Drawer ─────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer */}
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
                  <p className="text-xs font-semibold text-[#111111]">Staff Member</p>
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
              <span className="text-gray-400">/</span>
              <span className="text-xs text-gray-600 font-medium">
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
                className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Notifications"
              >
                <Bell size={17} />
                {/* Notification count badge */}
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
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden animate-fade-in">
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <span className="text-xs font-bold text-[#111111]">Notifications</span>
                      <div className="flex items-center gap-2">
                        {unreadAlertsCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-[9px] text-[#FFB703] hover:text-amber-600 font-extrabold uppercase tracking-wider bg-transparent border-0 cursor-pointer"
                          >
                            Mark All Read
                          </button>
                        )}
                        <span className="text-[9px] font-bold text-gray-600 px-2 py-0.5 rounded-full bg-gray-200">
                          {unreadAlertsCount} Unread
                        </span>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {alerts.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-600 font-medium">
                          No warnings or alerts. System healthy.
                        </div>
                      ) : (
                        alerts.map((alert) => {
                          const key = getAlertKey(alert);
                          const isRead = readAlertIds.includes(key);
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
                              className={`p-3 border-l-4 transition-colors flex justify-between gap-3 ${
                                isRead 
                                  ? 'border-l-gray-300 bg-[#FAF9F6] opacity-75' 
                                  : alert.severity === 'High' 
                                    ? 'border-l-rose-500 bg-white' 
                                    : alert.severity === 'Medium' 
                                      ? 'border-l-[#FFB703] bg-white' 
                                      : 'border-l-blue-500 bg-white'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase tracking-wider shrink-0 ${severityLabel}`}>
                                    {alert.severity}
                                  </span>
                                  {!isRead && (
                                    <span className="w-1.5 h-1.5 bg-[#FFB703] rounded-full shrink-0 animate-pulse" />
                                  )}
                                </div>
                                <span className={`text-xs block text-[#111111] leading-tight ${isRead ? 'font-medium' : 'font-extrabold'}`}>{alert.title}</span>
                                <p className="text-[11px] text-[#333333] leading-normal mt-0.5">{alert.description}</p>
                                <span className="text-[9px] text-gray-600 block mt-1 font-semibold">
                                  {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="shrink-0 flex items-start pt-1">
                                {!isRead ? (
                                  <button
                                    onClick={() => handleMarkAsRead(alert)}
                                    className="p-1 rounded-full text-gray-400 hover:text-[#FFB703] hover:bg-gray-100 transition-colors"
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
            <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md p-6 overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#FFB703] rounded-md">
                    <CalendarDays size={15} className="text-gray-900" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">Weekly Management Summary</h2>
                </div>
                <button
                  onClick={() => setShowWeeklySummary(false)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {loadingSummary ? (
                <div className="py-12 text-center text-sm text-gray-600 flex flex-col items-center justify-center gap-2">
                  <Clock className="animate-spin text-amber-500" size={24} />
                  <span>Calculating MongoDB history summary...</span>
                </div>
              ) : summaryError ? (
                <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold text-center">
                  {summaryError}
                </div>
              ) : weeklySummary ? (
                <div className="space-y-4">
                  {/* Overall Health Banner */}
                  <div className={`p-4 rounded-lg border flex items-center justify-between bg-white border-slate-200`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-gray-600">Weekly Performance</span>
                      <span className={`text-sm font-extrabold ${
                        weeklySummary.overallHealth === 'Excellent' ? 'text-emerald-700' :
                        weeklySummary.overallHealth === 'Good' ? 'text-[#FFB703]' :
                        weeklySummary.overallHealth === 'Average' ? 'text-orange-600' :
                        'text-rose-700'
                      }`}>{weeklySummary.overallHealth} Health</span>
                    </div>
                    <div className="text-2xl font-black text-[#111111]">{weeklySummary.positivePct}% <span className="text-xs font-bold text-gray-600">Pos</span></div>
                  </div>

                  {/* Trend Comparison Banner */}
                  {weeklySummary.trendInfo && weeklySummary.trendInfo.previousPositivePct !== null && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-600 block">Trend Comparison</span>
                        <div className="mt-0.5 text-[#333333] font-medium">
                          Prev Session Positive Rate: <span className="font-bold text-[#111111]">{weeklySummary.trendInfo.previousPositivePct}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {weeklySummary.trendInfo.trend === 'Trend Up' && (
                          <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded font-bold shrink-0">
                            <TrendingUp size={14} />
                            <span>{weeklySummary.trendInfo.change}</span>
                          </div>
                        )}
                        {weeklySummary.trendInfo.trend === 'Trend Down' && (
                          <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 px-2 py-1 rounded font-bold shrink-0">
                            <TrendingDown size={14} />
                            <span>{weeklySummary.trendInfo.change}</span>
                          </div>
                        )}
                        {weeklySummary.trendInfo.trend === 'Stable' && (
                          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded font-bold shrink-0">
                            <Minus size={14} />
                            <span>Stable</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats Breakdown */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[9px] font-bold uppercase text-gray-600 block">Analyzed</span>
                      <span className="text-lg font-bold text-[#111111]">{weeklySummary.totalReviews}</span>
                      <span className="text-[9px] text-[#333333] block font-semibold">reviews</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[9px] font-bold uppercase text-gray-600 block">Neutral</span>
                      <span className="text-lg font-bold text-[#111111]">{weeklySummary.neutralPct}%</span>
                      <span className="text-[9px] text-[#333333] block font-semibold">ratio</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[9px] font-bold uppercase text-gray-600 block">Negative</span>
                      <span className="text-lg font-bold text-[#111111]">{weeklySummary.negativePct}%</span>
                      <span className="text-[9px] text-[#333333] block font-semibold">ratio</span>
                    </div>
                  </div>

                  {/* Theme Analysis Details */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                      <span className="font-bold text-[#333333]">Top Theme</span>
                      <span className="font-bold text-[#111111] bg-slate-100 px-2 py-0.5 rounded">{weeklySummary.topTheme}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                      <span className="font-bold text-[#333333]">Most Appreciated</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">{weeklySummary.mostAppreciatedCategory}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1">
                      <span className="font-bold text-[#333333]">Most Common Complaint</span>
                      <span className={`font-bold px-2 py-0.5 rounded ${weeklySummary.mostCommonComplaint === 'None' ? 'text-gray-900 bg-slate-100' : 'text-rose-800 bg-rose-50 border border-rose-100'}`}>
                        {weeklySummary.mostCommonComplaint}
                      </span>
                    </div>
                  </div>

                  {weeklySummary.isFallback && (
                    <p className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 text-center font-medium leading-relaxed">
                      Note: Currently displaying fallback all-time metrics because no reviews were analyzed during the past 7 days.
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
