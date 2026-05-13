'use client';

import { useState, useEffect } from 'react';
import { getAnalytics, getGoals, getAIRecommendations, getWeeklyReport } from '@/lib/api-client';

interface Props { theme: 'dark' | 'light'; onBack: () => void; }

export default function ProgressDashboard({ theme, onBack }: Props) {
  const [analytics, setAnalytics] = useState<Record<string,unknown> | null>(null);
  const [goals, setGoals] = useState<Record<string,unknown> | null>(null);
  const [recommendations, setRecommendations] = useState<Record<string,unknown> | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<Record<string,unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [tab, setTab] = useState<'overview' | 'insights' | 'report'>('overview');

  useEffect(() => {
    (async () => {
      try {
        const [a, g] = await Promise.all([getAnalytics(), getGoals()]);
        setAnalytics(a as Record<string,unknown>);
        setGoals(g as Record<string,unknown>);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const loadRecommendations = async () => {
    if (recommendations) return;
    setAiLoading(true);
    try { setRecommendations(await getAIRecommendations() as Record<string,unknown>); } catch { /* ignore */ } finally { setAiLoading(false); }
  };

  const loadReport = async () => {
    if (weeklyReport) return;
    setReportLoading(true);
    try { setWeeklyReport(await getWeeklyReport() as Record<string,unknown>); } catch { /* ignore */ } finally { setReportLoading(false); }
  };

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;
  const statCard = `rounded-2xl p-4 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/10 border-white/20'}`;

  const overview = (analytics as { overview?: Record<string,unknown> })?.overview || {};

  if (loading) return (
    <div className="max-w-6xl mx-auto text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400" />
      <p className={`mt-4 text-lg ${theme === 'light' ? 'text-gray-600' : 'text-white'}`}>Loading dashboard...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className={card}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Progress Dashboard</h2>
            <p className={`mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>Track your learning journey</p>
          </div>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>← Back</button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(['overview','insights','report'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); if (t === 'insights') loadRecommendations(); if (t === 'report') loadReport(); }} className={`px-4 py-2.5 rounded-2xl font-bold transition-all capitalize ${tab === t ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : theme === 'light' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'backdrop-blur-md bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'}`}>{t}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Conversations', value: overview.total_conversations as number || 0, icon: '💬' },
                { label: 'Corrections', value: overview.total_corrections as number || 0, icon: '✏️' },
                { label: 'Vocabulary', value: overview.vocabulary_count as number || 0, icon: '📖' },
                { label: 'Streak', value: `${overview.current_streak as number || 0}d`, icon: '🔥' },
              ].map(({ label, value, icon }) => (
                <div key={label} className={statCard}>
                  <p className="text-2xl mb-2">{icon}</p>
                  <p className={`text-xs font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>{label}</p>
                  <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{value}</p>
                </div>
              ))}
            </div>
            {goals && (
              <div className={`rounded-2xl p-6 border ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'backdrop-blur-md bg-blue-500/10 border-blue-400/30'}`}>
                <h3 className={`font-bold text-lg mb-4 ${theme === 'light' ? 'text-blue-800' : 'text-blue-200'}`}>Daily Goals</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Conversations', current: (goals as Record<string, Record<string,number>>).daily?.conversations_done || 0, target: (goals as Record<string, Record<string,number>>).daily?.conversations_goal || 3 },
                    { label: 'MCQ Correct', current: (goals as Record<string, Record<string,number>>).daily?.mcq_correct_done || 0, target: (goals as Record<string, Record<string,number>>).daily?.mcq_correct_goal || 10 },
                  ].map(({ label, current, target }) => {
                    const pct = Math.min(100, Math.round((current / target) * 100));
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={theme === 'light' ? 'text-gray-700' : 'text-white/80'}>{label}</span>
                          <span className={`font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{current}/{target}</span>
                        </div>
                        <div className={`h-3 rounded-full ${theme === 'light' ? 'bg-blue-200' : 'bg-white/20'}`}>
                          <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'insights' && (
          <div>
            {aiLoading ? (
              <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-400" /><p className={`mt-4 ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>Generating AI insights...</p></div>
            ) : recommendations ? (
              (() => {
                const rec = ((recommendations as Record<string,unknown>).recommendations ?? recommendations) as Record<string,unknown>;
                const focusAreas = (rec.focus_areas as string[] | undefined) ?? [];
                const activities = (rec.recommended_activities as Array<{activity:string;reason:string;priority:string}> | undefined) ?? [];
                const weeklyGoals = (rec.weekly_goals as Array<{goal:string;metric:string}> | undefined) ?? [];
                return (
                  <div className="space-y-6">
                    {Boolean(rec.motivation) && (
                      <div className={`rounded-2xl p-5 border-l-4 border-yellow-400 ${theme === 'light' ? 'bg-yellow-50' : 'backdrop-blur-md bg-yellow-500/10'}`}>
                        <p className={`font-semibold mb-1 ${theme === 'light' ? 'text-yellow-800' : 'text-yellow-300'}`}>Motivation</p>
                        <p className={theme === 'light' ? 'text-gray-700' : 'text-white/90'}>{rec.motivation as string}</p>
                      </div>
                    )}
                    {Boolean(rec.strength) && (
                      <div className={`rounded-2xl p-5 border-l-4 border-green-400 ${theme === 'light' ? 'bg-green-50' : 'backdrop-blur-md bg-green-500/10'}`}>
                        <p className={`font-semibold mb-1 ${theme === 'light' ? 'text-green-800' : 'text-green-300'}`}>Your Strength</p>
                        <p className={theme === 'light' ? 'text-gray-700' : 'text-white/90'}>{rec.strength as string}</p>
                      </div>
                    )}
                    {focusAreas.length > 0 && (
                      <div>
                        <p className={`font-bold mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Focus Areas</p>
                        <div className="flex flex-wrap gap-2">
                          {focusAreas.map((area, i) => (
                            <span key={i} className={`px-3 py-1.5 rounded-full text-sm font-medium ${theme === 'light' ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-200 border border-purple-400/30'}`}>{area}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {activities.length > 0 && (
                      <div>
                        <p className={`font-bold mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Recommended Activities</p>
                        <div className="space-y-3">
                          {activities.map((a, i) => (
                            <div key={i} className={`rounded-2xl p-4 border-l-4 border-purple-400 ${theme === 'light' ? 'bg-purple-50' : 'backdrop-blur-md bg-purple-500/10'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{a.activity}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${a.priority === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>{a.priority}</span>
                              </div>
                              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>{a.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {weeklyGoals.length > 0 && (
                      <div>
                        <p className={`font-bold mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Weekly Goals</p>
                        <div className="space-y-2">
                          {weeklyGoals.map((g, i) => (
                            <div key={i} className={`rounded-xl p-3 flex justify-between items-center ${theme === 'light' ? 'bg-blue-50 border border-blue-100' : 'bg-blue-500/10 border border-blue-400/20'}`}>
                              <span className={theme === 'light' ? 'text-gray-700' : 'text-white/90'}>{g.goal}</span>
                              <span className={`text-sm font-medium ${theme === 'light' ? 'text-blue-600' : 'text-blue-300'}`}>{g.metric}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {Boolean(rec.next_step) && (
                      <div className={`rounded-2xl p-5 border-l-4 border-blue-400 ${theme === 'light' ? 'bg-blue-50' : 'backdrop-blur-md bg-blue-500/10'}`}>
                        <p className={`font-semibold mb-1 ${theme === 'light' ? 'text-blue-800' : 'text-blue-300'}`}>Next Step</p>
                        <p className={theme === 'light' ? 'text-gray-700' : 'text-white/90'}>{rec.next_step as string}</p>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-12">
                <p className={`mb-6 ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>Get personalized AI recommendations based on your progress</p>
                <button onClick={loadRecommendations} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold">Get AI Insights</button>
              </div>
            )}
          </div>
        )}

        {tab === 'report' && (
          <div>
            {reportLoading ? (
              <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-400" /><p className={`mt-4 ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>Generating report...</p></div>
            ) : weeklyReport ? (
              <div className={`rounded-2xl p-6 ${theme === 'light' ? 'bg-gray-50 border border-gray-200' : 'backdrop-blur-md bg-white/5 border border-white/10'}`}>
                <pre className={`whitespace-pre-wrap text-sm leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-white/90'}`}>{JSON.stringify(weeklyReport, null, 2)}</pre>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className={`mb-6 ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>Generate your weekly learning report</p>
                <button onClick={loadReport} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold">Generate Report</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
