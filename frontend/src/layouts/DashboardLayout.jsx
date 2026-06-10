import React, { useState } from 'react';
import { 
  FileText, 
  BarChart3, 
  HelpCircle, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';

export default function DashboardLayout({ children, currentPage, setCurrentPage }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      id: 'help',
      name: 'Help Center',
      icon: HelpCircle,
      description: 'Documentation & guide'
    }
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-slate-200">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2">
          <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200/50">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 text-sm tracking-tight block">Trishul Eco-Homestays</span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Review Intel</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-slate-800' : 'text-slate-400'} />
                <div>
                  <span className="block">{item.name}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 border border-slate-300/40">
              ST
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Staff Member</p>
              <p className="text-[10px] text-slate-500">Internal Tool Access</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex flex-col w-full max-w-xs bg-white border-r border-slate-200 h-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200/50">
                  <Sparkles size={18} />
                </div>
                <div>
                  <span className="font-semibold text-slate-800 text-sm block">Trishul Eco-Homestays</span>
                  <span className="text-[10px] text-slate-500 font-medium">Review Intel</span>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 py-6 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-slate-800' : 'text-slate-400'} />
                    <span className="block font-semibold">{item.name}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 border border-slate-300/40">
                  ST
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Staff Member</p>
                  <p className="text-[10px] text-slate-500 font-medium">Internal Tool Access</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main viewport */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex items-center justify-between px-6 h-16 bg-white border-b border-slate-200 md:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200/50">
              <Sparkles size={16} />
            </div>
            <span className="font-semibold text-slate-800 text-sm">Trishul Eco-Homestays</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Content viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
