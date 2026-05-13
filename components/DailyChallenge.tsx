'use client';

import { useState, useEffect } from 'react';
import { getDailyChallenge, completeDailyChallenge } from '@/lib/api-client';

interface Challenge { challenge_date: string; challenge_type: string; title: string; description: string; completed: boolean; score: number; streak: number; content?: Record<string,unknown>; }
interface Props { theme: 'dark' | 'light'; onBack: () => void; }

export default function DailyChallenge({ theme, onBack }: Props) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await getDailyChallenge() as { challenge: Challenge };
        setChallenge(res.challenge);
        if (res.challenge?.completed) { setCompleted(true); setScore(res.challenge.score); }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const complete = async (s: number) => {
    if (!challenge) return;
    try {
      await completeDailyChallenge(challenge.challenge_type, s);
      setCompleted(true); setScore(s);
      setChallenge(prev => prev ? { ...prev, completed: true, score: s } : prev);
    } catch { /* ignore */ }
  };

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;

  if (loading) return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400" />
      <p className={`mt-4 text-lg ${theme === 'light' ? 'text-gray-600' : 'text-white'}`}>Loading challenge...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className={card}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">Daily Challenge</h2>
            {challenge?.streak !== undefined && challenge.streak > 0 && (
              <p className={`mt-1 font-semibold ${theme === 'light' ? 'text-orange-600' : 'text-orange-300'}`}>🔥 {challenge.streak} day streak!</p>
            )}
          </div>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20'}`}>← Back</button>
        </div>

        {challenge ? (
          <div>
            <div className={`rounded-2xl p-6 mb-6 border-l-4 border-yellow-400 ${theme === 'light' ? 'bg-yellow-50' : 'backdrop-blur-md bg-yellow-500/10'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-bold mb-1 uppercase ${theme === 'light' ? 'text-yellow-700' : 'text-yellow-300'}`}>{challenge.challenge_type?.replace(/_/g,' ')}</p>
                  <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{challenge.title}</h3>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${challenge.completed ? 'bg-green-500/30 text-green-300 border border-green-400/30' : 'bg-blue-500/30 text-blue-300 border border-blue-400/30'}`}>{challenge.completed ? '✅ Done' : '🎯 Active'}</span>
              </div>
              <p className={`leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-white/90'}`}>{challenge.description}</p>
            </div>

            {completed ? (
              <div className={`text-center py-10 rounded-2xl border ${theme === 'light' ? 'bg-green-50 border-green-200' : 'backdrop-blur-md bg-green-500/10 border-green-400/30'}`}>
                <div className="text-6xl mb-4">🏆</div>
                <h3 className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-green-800' : 'text-green-200'}`}>Challenge Complete!</h3>
                <p className={`text-4xl font-bold ${theme === 'light' ? 'text-green-700' : 'text-green-300'}`}>{score} points</p>
                <p className={`mt-2 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>Come back tomorrow for a new challenge!</p>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Your Response</label>
                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    rows={6}
                    placeholder="Write your response to the challenge here..."
                    className={`w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all resize-none ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800 placeholder-gray-400' : 'backdrop-blur-md bg-white/10 border-white/20 text-white placeholder-white/50'}`}
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => complete(answer.length > 50 ? 100 : Math.max(50, answer.length * 2))} disabled={!answer.trim()} className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-bold disabled:opacity-60 transition-all transform hover:scale-[1.02]">
                    🎯 Submit Challenge
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-7xl mb-4">📅</div>
            <p className={`text-xl ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>No challenge available today. Check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
}
