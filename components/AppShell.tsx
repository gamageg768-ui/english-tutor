'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';

type View = 'situations' | 'history' | 'corrections' | 'grammar' | 'mcq' | 'create' | 'chat' | 'dashboard' | 'vocabulary' | 'flashcards' | 'dictionary' | 'writing' | 'idioms' | 'listening' | 'pronunciation' | 'daily-challenge' | 'reading' | 'debate' | 'error-correction' | 'sentence-builder' | 'collocations' | 'pdf-library';
type NavCategory = 'practice' | 'skills' | 'review' | 'tools';

const NAV_CATEGORIES: { key: NavCategory; label: string; icon: string }[] = [
  { key: 'practice', label: 'Practice', icon: '🎯' },
  { key: 'skills',   label: 'Skills',   icon: '📝' },
  { key: 'review',   label: 'Review',   icon: '📊' },
  { key: 'tools',    label: 'Tools',    icon: '🛠️' },
];

const NAV_ITEMS: Record<NavCategory, { view: View; label: string; icon: string }[]> = {
  practice: [
    { view: 'situations',       label: 'Situations',      icon: '💬' },
    { view: 'daily-challenge',  label: 'Daily Challenge', icon: '🏆' },
    { view: 'mcq',              label: 'MCQ Quiz',        icon: '✅' },
    { view: 'debate',           label: 'Debate',          icon: '⚔️' },
    { view: 'error-correction', label: 'Error Hunt',      icon: '🔍' },
  ],
  skills: [
    { view: 'reading',          label: 'Reading',     icon: '📖' },
    { view: 'writing',          label: 'Writing Lab', icon: '✍️' },
    { view: 'listening',        label: 'Listening',   icon: '🎧' },
    { view: 'pronunciation',    label: 'Speaking',    icon: '🗣️' },
    { view: 'sentence-builder', label: 'Sentences',   icon: '🧱' },
  ],
  review: [
    { view: 'dashboard',   label: 'Dashboard',   icon: '📊' },
    { view: 'history',     label: 'History',     icon: '📋' },
    { view: 'corrections', label: 'Corrections', icon: '✏️' },
    { view: 'grammar',     label: 'Grammar',     icon: '📚' },
  ],
  tools: [
    { view: 'vocabulary',   label: 'Vocabulary',   icon: '📖' },
    { view: 'flashcards',   label: 'Flashcards',   icon: '🃏' },
    { view: 'dictionary',   label: 'Dictionary',   icon: '🔤' },
    { view: 'idioms',       label: 'Idioms',       icon: '💡' },
    { view: 'collocations', label: 'Collocations', icon: '🔗' },
    { view: 'pdf-library',  label: 'PDF Library',  icon: '📚' },
  ],
};

function getCategoryForView(view: View): NavCategory {
  for (const [cat, items] of Object.entries(NAV_ITEMS)) {
    if (items.some(i => i.view === view)) return cat as NavCategory;
  }
  return 'practice';
}

interface AppShellProps {
  children: (props: {
    currentView: View;
    selectedSituationId: string | number | null;
    theme: 'dark' | 'light';
    onViewChange: (view: View, situationId?: string | number) => void;
    onBack: () => void;
  }) => React.ReactNode;
  stats?: { total_conversations: number; total_corrections: number; unique_situations: number; total_situations: number } | null;
  onRefreshStats?: () => void;
}

export default function AppShell({ children, stats, onRefreshStats }: AppShellProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [currentView, setCurrentView]               = useState<View>('situations');
  const [selectedSituationId, setSelectedSituationId] = useState<string | number | null>(null);
  const [activeCategory, setActiveCategory]         = useState<NavCategory>('practice');
  const [theme, setTheme]                           = useState<'dark' | 'light'>('dark');
  const [showInstallPrompt, setShowInstallPrompt]   = useState(false);
  const [canScrollLeft, setCanScrollLeft]           = useState(false);
  const [canScrollRight, setCanScrollRight]         = useState(false);

  // Single ref — mounted on the ONE scroll container that is visible
  const navScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (saved) setTheme(saved);
    if (!window.matchMedia('(display-mode: standalone)').matches) setShowInstallPrompt(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('light-theme', theme === 'light');
  }, [theme]);

  const checkScroll = useCallback(() => {
    const el = navScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => { el.removeEventListener('scroll', checkScroll); window.removeEventListener('resize', checkScroll); };
  }, [activeCategory, checkScroll]);

  const handleViewChange = (view: View, situationId?: string | number) => {
    setCurrentView(view);
    setSelectedSituationId(situationId ?? null);
    setActiveCategory(getCategoryForView(view));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onRefreshStats?.();
  };

  const handleBack = () => {
    setCurrentView('situations');
    setSelectedSituationId(null);
    onRefreshStats?.();
  };

  const handleLogout = () => { logout(); router.push('/login'); };

  const showNav = currentView !== 'chat' && currentView !== 'create';
  const d = theme === 'dark';

  // Sub-nav items shared by desktop row and mobile scroll strip
  const subNavItems = (
    <>
      {NAV_ITEMS[activeCategory].map(item => (
        <button
          key={item.view}
          onClick={() => handleViewChange(item.view)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
            currentView === item.view
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
              : d ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <span>{item.icon}</span><span>{item.label}</span>
        </button>
      ))}
      {activeCategory === 'tools' && showInstallPrompt && (
        <button
          onClick={() => alert('To install:\n1. Click browser menu (⋮)\n2. Select "Install app" or "Add to Home Screen"')}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap bg-gradient-to-r from-green-500 to-emerald-600 text-white"
        >📱 Install</button>
      )}
    </>
  );

  return (
    <div className={`min-h-screen ${d ? 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900' : 'bg-[#f2f2f7]'}`}>

      {/* ══ STICKY HEADER ════════════════════════════════════════ */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${d ? 'bg-slate-900/85 border-white/10' : 'bg-white/92 border-gray-200'}`}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">

          {/* Top bar */}
          <div className="flex items-center gap-3 h-14">
            <div className="flex-1 min-w-0">
              <span className="text-lg sm:text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 leading-none">
                English Tutor
              </span>
              {currentView === 'situations' && (
                <p className={`text-[11px] mt-0.5 hidden sm:block ${d ? 'text-white/40' : 'text-gray-400'}`}>
                  💬 {stats?.total_conversations ?? 0} chats &nbsp;·&nbsp;
                  ✏️ {stats?.total_corrections ?? 0} fixes &nbsp;·&nbsp;
                  🎯 {stats?.unique_situations ?? 0}/{stats?.total_situations ?? 500} situations
                </p>
              )}
            </div>
            <button
              onClick={() => setTheme(d ? 'light' : 'dark')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-colors ${d ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'}`}
              aria-label="Toggle theme"
            >{d ? '☀️' : '🌙'}</button>
            <button
              onClick={handleLogout}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-colors ${d ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
              aria-label="Logout"
            >⏻</button>
          </div>

          {/* ── Nav row (desktop only: categories + items in one line) ── */}
          {showNav && (
            <div className={`hidden sm:flex items-center gap-3 border-t py-2 ${d ? 'border-white/8' : 'border-gray-100'}`}>
              {/* Category pills */}
              <div className="flex gap-1 shrink-0">
                {NAV_CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeCategory === cat.key
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : d ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{cat.icon}</span><span>{cat.label}</span>
                  </button>
                ))}
              </div>
              <div className={`w-px h-5 shrink-0 ${d ? 'bg-white/15' : 'bg-gray-200'}`} />
              {/* Scrollable sub-items */}
              <div className="relative flex-1 min-w-0 overflow-hidden">
                {canScrollLeft  && <div className={`pointer-events-none absolute left-0 inset-y-0 w-8 z-10 ${d ? 'bg-gradient-to-r from-slate-900/90 to-transparent' : 'bg-gradient-to-r from-white to-transparent'}`}/>}
                {canScrollRight && <div className={`pointer-events-none absolute right-0 inset-y-0 w-8 z-10 ${d ? 'bg-gradient-to-l from-slate-900/90 to-transparent' : 'bg-gradient-to-l from-white to-transparent'}`}/>}
                <div ref={navScrollRef} className="flex gap-1 overflow-x-auto no-scrollbar">
                  {subNavItems}
                </div>
              </div>
            </div>
          )}

          {/* ── Sub-nav strip (mobile only: items only, categories in bottom bar) ── */}
          {showNav && (
            <div className={`sm:hidden border-t ${d ? 'border-white/8' : 'border-gray-100'} relative overflow-hidden`}>
              {canScrollLeft  && <div className={`pointer-events-none absolute left-0 inset-y-0 w-6 z-10 ${d ? 'bg-gradient-to-r from-slate-900 to-transparent' : 'bg-gradient-to-r from-white to-transparent'}`}/>}
              {canScrollRight && <div className={`pointer-events-none absolute right-0 inset-y-0 w-6 z-10 ${d ? 'bg-gradient-to-l from-slate-900 to-transparent' : 'bg-gradient-to-l from-white to-transparent'}`}/>}
              <div className="flex gap-1 overflow-x-auto no-scrollbar px-1 py-2">
                {subNavItems}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ══ PAGE CONTENT ═════════════════════════════════════════ */}
      <main className={showNav ? 'pb-20 sm:pb-10' : 'pb-8'}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 sm:py-6 page-enter">
          {children({ currentView, selectedSituationId, theme, onViewChange: handleViewChange, onBack: handleBack })}
        </div>
      </main>

      {/* ══ MOBILE BOTTOM TAB BAR ════════════════════════════════ */}
      {showNav && (
        <nav
          className={`sm:hidden fixed bottom-0 inset-x-0 z-40 flex border-t backdrop-blur-xl ${d ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-gray-200'}`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {NAV_CATEGORIES.map(cat => {
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[52px] ${
                  active ? (d ? 'text-purple-400' : 'text-blue-600') : (d ? 'text-white/35' : 'text-gray-400')
                }`}
              >
                <span className="text-[22px] leading-none">{cat.icon}</span>
                <span className={`text-[10px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>{cat.label}</span>
                {active && <span className={`mt-0.5 w-4 h-0.5 rounded-full ${d ? 'bg-purple-400' : 'bg-blue-600'}`}/>}
              </button>
            );
          })}
        </nav>
      )}

      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${d ? 'bg-purple-600/10' : 'bg-sky-200/50'}`}/>
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl ${d ? 'bg-blue-600/10' : 'bg-indigo-200/50'}`}/>
      </div>
    </div>
  );
}
