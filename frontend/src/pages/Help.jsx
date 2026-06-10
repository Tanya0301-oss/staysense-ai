import React from 'react';
import { 
  BookOpen, 
  Smile, 
  Meh, 
  Frown, 
  Tag, 
  Layers, 
  FileText,
  Play,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function Help({ setTab, setPreloadedText }) {
  const exampleReviews = [
    "The room was exceptionally clean, and the host left a lovely welcome basket of local fresh fruits!",
    "Breakfast was slightly late and the options were a bit limited, but the overall stay was quiet and peaceful.",
    "Very noisy during the night because of local traffic, and the bathroom door didn't lock properly. Quite disappointing.",
    "Excellent value for money. The location was right next to the hiking trail entrance which made it super convenient.",
    "The host was incredibly friendly, suggesting the best local eating spots and even guiding us around the organic farm."
  ];

  const handleTryExamples = () => {
    setPreloadedText(exampleReviews.join('\n'));
    setTab('analyzer');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Documentation</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Help & Documentation</h1>
        <p className="mt-2 text-slate-500 text-sm md:text-base leading-relaxed">
          Learn how to use the Guest Review Intelligence Tool to automate classification, analyze guest sentiments, and generate professional responses.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Areas */}
        <div className="md:col-span-2 space-y-8">
          {/* Section: How to Use */}
          <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <BookOpen size={16} className="text-slate-500" />
              <span>How to Use the Tool</span>
            </h2>
            <ol className="text-xs text-slate-600 space-y-3 list-decimal list-inside leading-relaxed">
              <li>
                Navigate to the <span className="font-semibold text-slate-800">Review Analyzer</span> page using the sidebar.
              </li>
              <li>
                Paste your review text into the input textarea. If processing multiple reviews, ensure there is <span className="font-semibold text-slate-800">one review per line</span>.
              </li>
              <li>
                Click the <span className="font-semibold text-slate-800">Analyze Reviews</span> button.
              </li>
              <li>
                Review the classified output in the results table. You can copy individual management responses or export all results as a CSV spreadsheet.
              </li>
            </ol>
          </section>

          {/* Section: Batch Processing */}
          <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Layers size={16} className="text-slate-500" />
              <span>Batch Processing Guidelines</span>
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our AI service processes up to <span className="font-semibold text-slate-800">50 reviews per request</span> using controlled concurrency on the backend to prevent timeouts and rate-limiting.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-md">
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Example Textarea Input Layout:</span>
              <pre className="text-[10px] text-slate-700 font-mono leading-normal whitespace-pre-wrap">
{`The host was extremely friendly and helped us carry luggage.
The breakfast options were limited and cold.
Perfect location near the waterfall.`}
              </pre>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Note: Empty lines and lines shorter than 5 characters are automatically filtered out during validation.
            </p>
          </section>

          {/* Section: Realistic Examples */}
          <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText size={16} className="text-slate-500" />
                <span>Example Test Reviews</span>
              </h2>
              <button 
                onClick={handleTryExamples}
                className="flex items-center gap-1 text-[10px] font-semibold text-slate-900 hover:text-slate-700 hover:underline transition-all"
              >
                <span>Load in Analyzer</span>
                <ArrowRight size={10} />
              </button>
            </div>
            <div className="space-y-2">
              {exampleReviews.map((ex, i) => (
                <div key={i} className="p-2.5 bg-slate-50/50 border border-slate-100 rounded text-xs text-slate-600 italic">
                  "{ex}"
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Reference Sheets */}
        <div className="space-y-6">
          {/* Sentiment Reference */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sentiments</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                  <Smile size={14} />
                </span>
                <div>
                  <span className="block text-xs font-semibold text-slate-700">Positive</span>
                  <span className="block text-[10px] text-slate-400">Praise or high satisfaction</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-amber-50 text-amber-600 border border-amber-100/50">
                  <Meh size={14} />
                </span>
                <div>
                  <span className="block text-xs font-semibold text-slate-700">Neutral</span>
                  <span className="block text-[10px] text-slate-400">Mixed or factual remarks</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-rose-50 text-rose-600 border border-rose-100">
                  <Frown size={14} />
                </span>
                <div>
                  <span className="block text-xs font-semibold text-slate-700">Negative</span>
                  <span className="block text-[10px] text-slate-400">Complaints or dissatisfaction</span>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Reference */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Themes</h3>
            <div className="space-y-2">
              {[
                { name: 'Food', desc: 'Meals, breakfast quality, dining options' },
                { name: 'Host', desc: 'Staff helpfulness, check-in, hospitality' },
                { name: 'Location', desc: 'Scenery, transport ease, local trails' },
                { name: 'Cleanliness', desc: 'Room hygiene, towels, bathroom mold' },
                { name: 'Value', desc: 'Pricing, fairness, worth of stay' },
                { name: 'Experience', desc: 'General vibe, noise, activities' }
              ].map((t, idx) => (
                <div key={idx} className="pb-2 last:pb-0 last:border-0 border-b border-slate-100 flex items-start gap-2">
                  <Tag size={12} className="text-slate-400 mt-1 shrink-0" />
                  <div>
                    <span className="block text-xs font-semibold text-slate-700">{t.name}</span>
                    <span className="block text-[10px] text-slate-400 leading-normal">{t.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
