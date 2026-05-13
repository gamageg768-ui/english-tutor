'use client';

import { useState, useMemo } from 'react';

interface Situation {
  id: number | string;
  title: string;
  domain: string;
  module: string;
  level: string;
  role: string;
  context?: string;
  description?: string;
  is_custom?: boolean;
}

interface Props {
  situations: Situation[];
  theme: 'dark' | 'light';
  onSelectSituation: (s: Situation) => void;
  onCreateCustom: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: 'from-emerald-400 to-green-500',
  A2: 'from-teal-400 to-cyan-500',
  B1: 'from-blue-400 to-blue-600',
  B2: 'from-indigo-400 to-indigo-600',
  C1: 'from-violet-500 to-purple-600',
  C2: 'from-pink-500 to-rose-600',
};

const DOMAIN_ICONS: Record<string, string> = {
  Academic: '🎓',
  Business: '💼',
  Medical: '🏥',
  Travel: '✈️',
  Social: '👥',
  Legal: '⚖️',
  Technology: '💻',
  Finance: '💰',
  Education: '📚',
  Customer: '🛎️',
};

export default function SituationList({ situations, theme, onSelectSituation, onCreateCustom }: Props) {
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const domains = useMemo(() => {
    const map = new Map<string, number>();
    situations.forEach(s => map.set(s.domain, (map.get(s.domain) || 0) + 1));
    return Array.from(map.entries()).sort();
  }, [situations]);

  const filtered = useMemo(() => situations.filter(s => {
    const matchDomain = !selectedDomain || s.domain === selectedDomain;
    const matchLevel = !selectedLevel || s.level === selectedLevel;
    const matchSearch = !searchTerm ||
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.context || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.module.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDomain && matchLevel && matchSearch;
  }), [situations, selectedDomain, selectedLevel, searchTerm]);

  const selectCls = `w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${
    theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white'
  }`;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Create custom CTA */}
      <div className="mb-6 text-center">
        <button
          onClick={onCreateCustom}
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white rounded-3xl font-bold text-base shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
        >
          <span className="text-xl">✨</span>
          Create Custom Situation with AI
        </button>
        <p className={`text-xs mt-2 font-medium ${theme === 'light' ? 'text-gray-400' : 'text-white/50'}`}>
          Describe any scenario and AI will build it for you
        </p>
      </div>

      {/* Filters */}
      <div className={`rounded-3xl shadow-xl border p-5 mb-6 ${
        theme === 'light' ? 'bg-white border-gray-100' : 'backdrop-blur-xl bg-white/10 border-white/20'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${theme === 'light' ? 'text-gray-400' : 'text-white/50'}`}>Search</label>
            <input
              type="text"
              placeholder="Search by title, topic, module…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={selectCls}
            />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${theme === 'light' ? 'text-gray-400' : 'text-white/50'}`}>Domain</label>
            <select value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)} className={selectCls}>
              <option value="" className="bg-slate-800">All Domains</option>
              {domains.map(([d, c]) => <option key={d} value={d} className="bg-slate-800">{d} ({c})</option>)}
            </select>
          </div>
          <div>
            <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${theme === 'light' ? 'text-gray-400' : 'text-white/50'}`}>Level</label>
            <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className={selectCls}>
              <option value="" className="bg-slate-800">All Levels</option>
              {['A1','A2','B1','B2','C1','C2'].map(l => <option key={l} value={l} className="bg-slate-800">{l}</option>)}
            </select>
          </div>
        </div>
        <div className={`mt-3 flex items-center gap-2 text-sm ${theme === 'light' ? 'text-gray-400' : 'text-white/50'}`}>
          <span className={`font-bold text-base ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{filtered.length}</span>
          <span>of {situations.length} situations</span>
          {(selectedDomain || selectedLevel || searchTerm) && (
            <button
              onClick={() => { setSelectedDomain(''); setSelectedLevel(''); setSearchTerm(''); }}
              className={`ml-auto text-xs px-3 py-1 rounded-xl font-medium transition-colors ${
                theme === 'light' ? 'text-blue-600 hover:bg-blue-50' : 'text-purple-300 hover:bg-white/10'
              }`}
            >
              Clear filters ×
            </button>
          )}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => {
          const levelGradient = LEVEL_COLORS[s.level] ?? 'from-blue-400 to-purple-600';
          const domainIcon = Object.entries(DOMAIN_ICONS).find(([k]) => s.domain.includes(k))?.[1] ?? '💬';

          return (
            <div
              key={s.id}
              onClick={() => onSelectSituation(s)}
              className={`group flex flex-col rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                s.is_custom
                  ? `border-emerald-400/40 ${theme === 'light' ? 'bg-emerald-50 hover:bg-emerald-50/80' : 'bg-emerald-500/10 hover:bg-emerald-500/15'}`
                  : theme === 'light'
                    ? 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-lg'
                    : 'backdrop-blur-xl bg-white/10 border-white/15 hover:bg-white/15 hover:border-white/25'
              }`}
            >
              {/* Card top strip with level color */}
              <div className={`h-1 rounded-t-2xl bg-gradient-to-r ${levelGradient}`} />

              <div className="p-5 flex flex-col flex-1 gap-3">
                {/* Level badge + domain icon + id */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${levelGradient}`}>
                      {s.level}
                    </span>
                    {s.is_custom && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600">
                        Custom
                      </span>
                    )}
                    <span className="text-sm">{domainIcon}</span>
                  </div>
                  <span className={`text-xs font-medium ${theme === 'light' ? 'text-gray-300' : 'text-white/30'}`}>#{s.id}</span>
                </div>

                {/* Title */}
                <h3 className={`text-base font-bold leading-snug line-clamp-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                  {s.title}
                </h3>

                {/* Context */}
                <p className={`text-sm leading-relaxed line-clamp-2 flex-1 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>
                  {s.context || s.description}
                </p>

                {/* Footer: module + role */}
                <div className={`flex items-center justify-between pt-3 border-t ${
                  theme === 'light' ? 'border-gray-100' : 'border-white/10'
                }`}>
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                    theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-white/70'
                  }`}>{s.module}</span>
                  <span className={`text-xs font-medium ${theme === 'light' ? 'text-gray-400' : 'text-white/50'}`}>
                    with <span className={`font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-white/80'}`}>{s.role}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className={`text-center py-16 rounded-3xl border ${
          theme === 'light' ? 'bg-white border-gray-100' : 'backdrop-blur-xl bg-white/10 border-white/20'
        }`}>
          <div className="text-5xl mb-4">🔍</div>
          <p className={`text-lg font-semibold mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>No situations found</p>
          <p className={`text-sm mb-6 ${theme === 'light' ? 'text-gray-400' : 'text-white/50'}`}>Try adjusting your filters</p>
          <button
            onClick={() => { setSelectedDomain(''); setSelectedLevel(''); setSearchTerm(''); }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:opacity-90 transition-opacity"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
