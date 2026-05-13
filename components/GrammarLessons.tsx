'use client';

import { useState } from 'react';
import { generateGrammarPractice, checkWriting } from '@/lib/api-client';

interface Props { theme: 'dark' | 'light'; onBack: () => void; }

const TOPICS = ['Present Perfect', 'Conditionals', 'Passive Voice', 'Modal Verbs', 'Articles', 'Prepositions', 'Relative Clauses', 'Reported Speech'];
const LEVELS = ['A1','A2','B1','B2','C1','C2'];

export default function GrammarLessons({ theme, onBack }: Props) {
  const [tab, setTab] = useState<'practice' | 'check'>('practice');
  const [topic, setTopic] = useState('Present Perfect');
  const [level, setLevel] = useState('B1');
  const [practiceType, setPracticeType] = useState('fill_blank');
  const [exercise, setExercise] = useState<Record<string,unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [checkResult, setCheckResult] = useState<Record<string,unknown> | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const generate = async () => {
    setLoading(true); setExercise(null); setSubmitted(false); setUserAnswers({});
    try { setExercise(await generateGrammarPractice(topic, level, practiceType) as Record<string,unknown>); } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const checkText = async () => {
    if (!text.trim()) return;
    setCheckLoading(true); setCheckResult(null);
    try { setCheckResult(await checkWriting(text) as Record<string,unknown>); } catch { /* ignore */ }
    finally { setCheckLoading(false); }
  };

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;
  const inputCls = `w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white placeholder-white/50'}`;

  const ex = exercise as { questions?: { question: string; correct_answer: string; options?: string[]; explanation?: string }[]; grammar_rule?: string; examples?: string[] } | null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className={card}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Grammar Practice</h2>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20'}`}>← Back</button>
        </div>

        <div className="flex gap-3 mb-8">
          {(['practice','check'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 rounded-2xl font-bold transition-all capitalize ${tab === t ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : theme === 'light' ? 'bg-gray-100 text-gray-600' : 'backdrop-blur-md bg-white/10 text-white/80 border border-white/20'}`}>{t === 'check' ? 'Check Writing' : 'Practice'}</button>
          ))}
        </div>

        {tab === 'practice' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Topic</label>
                <select value={topic} onChange={e => setTopic(e.target.value)} className={inputCls}>
                  {TOPICS.map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Level</label>
                <select value={level} onChange={e => setLevel(e.target.value)} className={inputCls}>
                  {LEVELS.map(l => <option key={l} value={l} className="bg-slate-800">{l}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Type</label>
                <select value={practiceType} onChange={e => setPracticeType(e.target.value)} className={inputCls}>
                  <option value="fill_blank" className="bg-slate-800">Fill in the Blank</option>
                  <option value="mcq" className="bg-slate-800">Multiple Choice</option>
                  <option value="transformation" className="bg-slate-800">Transformation</option>
                </select>
              </div>
            </div>
            <button onClick={generate} disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold hover:shadow-lg disabled:opacity-60 transition-all transform hover:scale-[1.02] mb-8">
              {loading ? 'Generating...' : '📚 Generate Exercise'}
            </button>

            {ex && (
              <div className={`rounded-2xl p-6 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/5 border-white/10'}`}>
                {ex.grammar_rule && <div className={`mb-6 p-4 rounded-2xl border-l-4 border-blue-400 ${theme === 'light' ? 'bg-blue-50' : 'bg-blue-500/10'}`}><p className={`font-semibold ${theme === 'light' ? 'text-blue-800' : 'text-blue-200'}`}>{ex.grammar_rule}</p></div>}
                <div className="space-y-6">
                  {(ex.questions || []).map((q, i) => (
                    <div key={i} className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-white border border-gray-200' : 'backdrop-blur-sm bg-white/5 border border-white/10'}`}>
                      <p className={`font-medium mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{i + 1}. {q.question}</p>
                      {q.options ? (
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, j) => {
                            const isSelected = userAnswers[i] === opt;
                            const isCorrect = submitted && opt === q.correct_answer;
                            const isWrong = submitted && isSelected && opt !== q.correct_answer;
                            return (
                              <button key={j} onClick={() => !submitted && setUserAnswers(a => ({ ...a, [i]: opt }))} className={`px-4 py-3 rounded-2xl text-sm font-medium border-2 transition-all text-left ${isCorrect ? 'bg-green-500/30 border-green-400/50 text-green-200' : isWrong ? 'bg-red-500/30 border-red-400/50 text-red-200' : isSelected ? 'bg-purple-500/30 border-purple-400/50 text-white' : theme === 'light' ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' : 'backdrop-blur-sm bg-white/10 border-white/20 text-white/80 hover:bg-white/20'}`}>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <input type="text" value={userAnswers[i] || ''} onChange={e => !submitted && setUserAnswers(a => ({ ...a, [i]: e.target.value }))} placeholder="Your answer..." className={inputCls} />
                      )}
                      {submitted && <p className={`mt-2 text-sm ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>{q.explanation}</p>}
                    </div>
                  ))}
                </div>
                {!submitted && <button onClick={() => setSubmitted(true)} className="mt-6 w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold transition-all transform hover:scale-[1.02]">Check Answers</button>}
              </div>
            )}
          </div>
        )}

        {tab === 'check' && (
          <div>
            <div className="mb-4">
              <label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Paste your text to check grammar</label>
              <textarea value={text} onChange={e => setText(e.target.value)} rows={8} placeholder="Paste or type your English text here..." className={`${inputCls} resize-none`} />
            </div>
            <button onClick={checkText} disabled={checkLoading || !text.trim()} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all transform hover:scale-[1.02] mb-6">
              {checkLoading ? 'Checking...' : '🔍 Check Grammar'}
            </button>
            {checkResult && (
              <div className="space-y-4">
                {((checkResult as Record<string, { original: string; corrected: string; explanation: string }[]>).corrections || []).map((c, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${theme === 'light' ? 'bg-yellow-50 border-yellow-200' : 'backdrop-blur-md bg-yellow-500/10 border-yellow-400/30'}`}>
                    <div className={`text-sm ${theme === 'light' ? 'text-red-600' : 'text-red-300'}`}><span className="line-through">{c.original}</span></div>
                    <div className={`text-sm font-semibold ${theme === 'light' ? 'text-green-700' : 'text-green-300'}`}>→ {c.corrected}</div>
                    <p className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>{c.explanation}</p>
                  </div>
                ))}
                {(checkResult as Record<string, string>).improved_text && (
                  <div className={`p-4 rounded-2xl border-l-4 border-green-400 ${theme === 'light' ? 'bg-green-50' : 'bg-green-500/10'}`}>
                    <p className={`text-xs font-semibold mb-2 ${theme === 'light' ? 'text-green-800' : 'text-green-300'}`}>Improved Version:</p>
                    <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-white/90'}`}>{(checkResult as Record<string, string>).improved_text}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
