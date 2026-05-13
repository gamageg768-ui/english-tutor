'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import AppShell from '@/components/AppShell';
import SituationList from '@/components/SituationList';
import ChatInterface from '@/components/ChatInterface';
import CreateSituation from '@/components/CreateSituation';
import ConversationHistory from '@/components/ConversationHistory';
import CorrectionsReview from '@/components/CorrectionsReview';
import GrammarLessons from '@/components/GrammarLessons';
import MCQPractice from '@/components/MCQPractice';
import ProgressDashboard from '@/components/ProgressDashboard';
import VocabularyBuilder from '@/components/VocabularyBuilder';
import FlashcardReview from '@/components/FlashcardReview';
import DictionaryLookup from '@/components/DictionaryLookup';
import WritingLab from '@/components/WritingLab';
import IdiomsExplorer from '@/components/IdiomsExplorer';
import ListeningPractice from '@/components/ListeningPractice';
import PronunciationPractice from '@/components/PronunciationPractice';
import DailyChallenge from '@/components/DailyChallenge';
import ReadingComprehension from '@/components/ReadingComprehension';
import DebatePractice from '@/components/DebatePractice';
import ErrorCorrectionPractice from '@/components/ErrorCorrectionPractice';
import SentenceBuilder from '@/components/SentenceBuilder';
import CollocationsPractice from '@/components/CollocationsPractice';
import PDFLibrary from '@/components/PDFLibrary';
import { fetchSituations, getStats } from '@/lib/api-client';

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

type Stats = { total_conversations: number; total_corrections: number; unique_situations: number; total_situations: number } | null;

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [situations, setSituations] = useState<Situation[]>([]);
  const [situationsLoading, setSituationsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSituations();
      loadStats();
    }
  }, [isAuthenticated]);

  const loadSituations = async () => {
    try {
      const res = await fetchSituations() as { success: boolean; situations: Situation[] };
      setSituations(res.situations || []);
    } catch { /* ignore */ }
    finally { setSituationsLoading(false); }
  };

  const loadStats = async () => {
    try {
      const res = await getStats() as { success: boolean; stats: Stats };
      setStats(res.stats);
    } catch { /* ignore */ }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mb-4" />
          <p className="text-white/70 text-lg">Loading...</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-6 px-5 py-2 rounded-xl bg-white/10 text-white/60 text-sm hover:bg-white/20 transition-colors"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell stats={stats} onRefreshStats={loadStats}>
      {({ currentView, selectedSituationId, theme, onViewChange, onBack }) => {
        const selectedSituation = situations.find(s => String(s.id) === String(selectedSituationId)) ?? null;

        const commonProps = { theme, onBack };

        if (currentView === 'chat') {
          if (!selectedSituation) return (
            <div className="text-center py-20">
              <p className={`text-lg ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>Situation not found.</p>
              <button onClick={onBack} className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold">Go Back</button>
            </div>
          );
          return <ChatInterface situation={selectedSituation} theme={theme} onBack={onBack} />;
        }

        if (currentView === 'create') {
          return (
            <CreateSituation
              theme={theme}
              onBack={onBack}
              onSituationCreated={(s) => {
                setSituations(prev => [s, ...prev]);
                onViewChange('chat', s.id);
              }}
            />
          );
        }

        if (currentView === 'situations') {
          return situationsLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400" />
              <p className={`mt-4 ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>Loading situations...</p>
            </div>
          ) : (
            <SituationList
              situations={situations}
              theme={theme}
              onSelectSituation={(s) => onViewChange('chat', s.id)}
              onCreateCustom={() => onViewChange('create')}
            />
          );
        }

        const viewMap: Record<string, React.ReactNode> = {
          history: <ConversationHistory {...commonProps} />,
          corrections: <CorrectionsReview {...commonProps} />,
          grammar: <GrammarLessons {...commonProps} />,
          mcq: <MCQPractice {...commonProps} />,
          dashboard: <ProgressDashboard {...commonProps} />,
          vocabulary: <VocabularyBuilder {...commonProps} />,
          flashcards: <FlashcardReview {...commonProps} />,
          dictionary: <DictionaryLookup {...commonProps} />,
          writing: <WritingLab {...commonProps} />,
          idioms: <IdiomsExplorer {...commonProps} />,
          listening: <ListeningPractice {...commonProps} />,
          pronunciation: <PronunciationPractice {...commonProps} />,
          'daily-challenge': <DailyChallenge {...commonProps} />,
          reading: <ReadingComprehension {...commonProps} />,
          debate: <DebatePractice {...commonProps} />,
          'error-correction': <ErrorCorrectionPractice {...commonProps} />,
          'sentence-builder': <SentenceBuilder {...commonProps} />,
          collocations: <CollocationsPractice {...commonProps} />,
          'pdf-library': <PDFLibrary {...commonProps} />,
        };

        return viewMap[currentView] ?? (
          <div className="text-center py-20">
            <p className={`text-lg ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>This view is coming soon!</p>
            <button onClick={onBack} className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold">Go Back</button>
          </div>
        );
      }}
    </AppShell>
  );
}
