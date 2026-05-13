'use client';

import { useState } from 'react';
import { generateDebateTopic, submitDebateArgument, concludeDebate } from '@/lib/api-client';

interface Exchange { role: 'user' | 'opponent'; content: string; evaluation?: { argument_strength: number; language_quality: number; corrections?: { original: string; corrected: string }[] } }
interface DebateTopic { topic: string; your_position: string; background: string; key_points: string[]; useful_phrases: string[] }
interface Props { theme: 'dark' | 'light'; onBack: () => void; }
const LEVELS = ['A2','B1','B2','C1'];
const CATS = ['Technology','Environment','Society','Education','Health','Politics','Economics'];

export default function DebatePractice({ theme, onBack }: Props) {
  const [level, setLevel] = useState('B1');
  const [category, setCategory] = useState('Technology');
  const [topic, setTopic] = useState<DebateTopic | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [argLoading, setArgLoading] = useState(false);
  const [conclusion, setConclusion] = useState<Record<string,unknown> | null>(null);
  const [concLoading, setConcLoading] = useState(false);

  const generateTopic = async () => {
    setLoading(true); setTopic(null); setExchanges([]); setConclusion(null);
    try {
      const res = await generateDebateTopic(level, category) as { debate: DebateTopic };
      setTopic(res.debate);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const submit = async () => {
    if (!input.trim() || !topic) return;
    const arg = input;
    setInput('');
    const userEx: Exchange = { role: 'user', content: arg };
    const newExch = [...exchanges, userEx];
    setExchanges(newExch);
    setArgLoading(true);
    try {
      const res = await submitDebateArgument(topic.topic, topic.your_position, arg, newExch.map(e => ({ role: e.role, content: e.content })), level) as { opponent_response: string; evaluation: Exchange['evaluation'] };
      setExchanges(prev => [
        ...prev.map((e, i) => i === prev.length - 1 ? { ...e, evaluation: res.evaluation } : e),
        { role: 'opponent', content: res.opponent_response }
      ]);
    } catch { /* ignore */ }
    finally { setArgLoading(false); }
  };

  const conclude = async () => {
    if (!topic) return;
    setConcLoading(true);
    try {
      const res = await concludeDebate(topic.topic, topic.your_position, exchanges.map(e => ({ role: e.role, content: e.content })), level) as Record<string,unknown>;
      setConclusion(res);
    } catch { /* ignore */ }
    finally { setConcLoading(false); }
  };

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;
  const selectCls = `w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white'}`;

  const conc = conclusion as { overall_score?: number; strengths?: string[]; improvements?: string[]; summary?: string } | null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className={card}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Debate Practice</h2>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20'}`}>← Back</button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Level</label><select value={level} onChange={e => setLevel(e.target.value)} className={selectCls}>{LEVELS.map(l => <option key={l} value={l} className="bg-slate-800">{l}</option>)}</select></div>
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Category</label><select value={category} onChange={e => setCategory(e.target.value)} className={selectCls}>{CATS.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}</select></div>
        </div>
        <button onClick={generateTopic} disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all transform hover:scale-[1.02]">
          {loading ? 'Generating topic...' : '⚔️ Start Debate'}
        </button>
      </div>

      {topic && (
        <>
          <div className={card}>
            <div className={`rounded-2xl p-5 mb-4 border-l-4 border-blue-400 ${theme === 'light' ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
              <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-blue-900' : 'text-blue-200'}`}>{topic.topic}</h3>
              <p className={`text-sm font-bold mb-2 ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>Your position: {topic.your_position?.toUpperCase()}</p>
              <p className={`text-sm ${theme === 'light' ? 'text-blue-800' : 'text-white/80'}`}>{topic.background}</p>
            </div>
            {topic.key_points?.length > 0 && (
              <div className={`rounded-2xl p-4 mb-4 ${theme === 'light' ? 'bg-green-50 border border-green-200' : 'backdrop-blur-md bg-green-500/10 border border-green-400/30'}`}>
                <p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-green-800' : 'text-green-300'}`}>KEY POINTS TO USE:</p>
                {topic.key_points.map((p, i) => <p key={i} className={`text-sm ${theme === 'light' ? 'text-green-700' : 'text-green-200'}`}>• {p}</p>)}
              </div>
            )}
            {topic.useful_phrases?.length > 0 && (
              <div className={`rounded-2xl p-4 ${theme === 'light' ? 'bg-purple-50 border border-purple-200' : 'backdrop-blur-md bg-purple-500/10 border border-purple-400/30'}`}>
                <p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-purple-800' : 'text-purple-300'}`}>USEFUL PHRASES:</p>
                <div className="flex flex-wrap gap-2">{topic.useful_phrases.map((p, i) => <span key={i} className={`px-3 py-1 rounded-full text-xs ${theme === 'light' ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-200'}`}>"{p}"</span>)}</div>
              </div>
            )}
          </div>

          <div className={card}>
            <h3 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Debate Exchange</h3>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {exchanges.map((ex, i) => (
                <div key={i} className={`flex ${ex.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${ex.role === 'user' ? theme === 'light' ? 'bg-blue-500 text-white' : 'bg-purple-500/30 text-white border border-purple-400/30' : theme === 'light' ? 'bg-gray-100 text-gray-800 border border-gray-200' : 'bg-white/15 text-white border border-white/20'}`}>
                    <p className="text-xs font-bold mb-1 opacity-70">{ex.role === 'user' ? 'You' : 'Opponent'}</p>
                    <p className="text-sm leading-relaxed">{ex.content}</p>
                    {ex.evaluation && (
                      <div className="mt-2 pt-2 border-t border-white/20 text-xs">
                        <span className="text-yellow-300">Argument: {ex.evaluation.argument_strength}/10</span>
                        <span className="ml-3 text-blue-300">Language: {ex.evaluation.language_quality}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {argLoading && <div className="flex justify-start"><div className="rounded-2xl p-3 bg-white/15 border border-white/20"><div className="flex gap-1">{[0,0.2,0.4].map((d,i)=><div key={i} className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay:`${d}s`}}/>)}</div></div></div>}
            </div>
            {!conclusion && (
              <div className="flex gap-3">
                <textarea value={input} onChange={e => setInput(e.target.value)} rows={3} placeholder="Make your argument..." className={`flex-1 px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white'}`} />
                <div className="flex flex-col gap-2">
                  <button onClick={submit} disabled={argLoading || !input.trim()} className="px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all">Send</button>
                  {exchanges.length >= 4 && <button onClick={conclude} disabled={concLoading} className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all text-sm">Conclude</button>}
                </div>
              </div>
            )}
          </div>

          {conc && (
            <div className={card}>
              <h3 className={`text-2xl font-bold mb-6 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Debate Results</h3>
              {conc.overall_score !== undefined && <div className="text-center mb-6"><p className={`text-6xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{conc.overall_score}<span className="text-3xl">/10</span></p><p className={theme === 'light' ? 'text-gray-500' : 'text-white/60'}>Overall Score</p></div>}
              {conc.summary && <div className={`p-4 rounded-2xl mb-4 ${theme === 'light' ? 'bg-blue-50 border border-blue-200' : 'backdrop-blur-md bg-blue-500/10 border border-blue-400/30'}`}><p className={theme === 'light' ? 'text-blue-800' : 'text-blue-200'}>{conc.summary}</p></div>}
              {conc.strengths && (conc.strengths as string[]).length > 0 && <div className={`p-4 rounded-2xl mb-4 ${theme === 'light' ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-400/30'}`}><p className={`font-bold text-xs mb-2 ${theme === 'light' ? 'text-green-800' : 'text-green-300'}`}>STRENGTHS:</p>{(conc.strengths as string[]).map((s,i)=><p key={i} className={`text-sm ${theme === 'light' ? 'text-green-700' : 'text-green-200'}`}>✓ {s}</p>)}</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
