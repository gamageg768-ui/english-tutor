'use client';

import { useState } from 'react';
import { getWritingPrompt, evaluateWriting } from '@/lib/api-client';

interface Props { theme: 'dark' | 'light'; onBack: () => void; }
const LEVELS = ['A1','A2','B1','B2','C1','C2'];
const TOPICS = ['Travel','Technology','Environment','Education','Health','Business','Culture','Society'];

export default function WritingLab({ theme, onBack }: Props) {
  const [level, setLevel] = useState('B1');
  const [topic, setTopic] = useState('Travel');
  const [prompt, setPrompt] = useState<Record<string,unknown> | null>(null);
  const [text, setText] = useState('');
  const [evaluation, setEvaluation] = useState<Record<string,unknown> | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);

  const getPrompt = async () => {
    setPromptLoading(true); setPrompt(null); setEvaluation(null); setText('');
    try { setPrompt(await getWritingPrompt(level, topic) as Record<string,unknown>); } catch { /* ignore */ }
    finally { setPromptLoading(false); }
  };

  const evaluate = async () => {
    if (!text.trim() || !prompt) return;
    setEvalLoading(true); setEvaluation(null);
    try { setEvaluation(await evaluateWriting(text, (prompt as { prompt?: string }).prompt || '', level) as Record<string,unknown>); } catch { /* ignore */ }
    finally { setEvalLoading(false); }
  };

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;
  const selectCls = `w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white'}`;

  const ev = evaluation as { scores?: Record<string, number>; corrections?: { original: string; corrected: string; explanation: string }[]; suggestions?: string[]; strengths?: string[]; improved_version?: string; summary?: string } | null;
  const p = prompt as { title?: string; prompt?: string; tips?: string[]; vocabulary_hints?: string[]; suggested_word_count?: number } | null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className={card}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Writing Lab</h2>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20'}`}>← Back</button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Level</label><select value={level} onChange={e => setLevel(e.target.value)} className={selectCls}>{LEVELS.map(l => <option key={l} value={l} className="bg-slate-800">{l}</option>)}</select></div>
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Topic</label><select value={topic} onChange={e => setTopic(e.target.value)} className={selectCls}>{TOPICS.map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}</select></div>
        </div>
        <button onClick={getPrompt} disabled={promptLoading} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all transform hover:scale-[1.02]">
          {promptLoading ? 'Generating prompt...' : '✍️ Get Writing Prompt'}
        </button>
      </div>

      {p && (
        <div className={card}>
          <div className={`rounded-2xl p-6 border-l-4 border-blue-400 mb-6 ${theme === 'light' ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
            <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-blue-900' : 'text-blue-200'}`}>{p.title}</h3>
            <p className={`leading-relaxed ${theme === 'light' ? 'text-blue-800' : 'text-white/90'}`}>{p.prompt}</p>
            {p.suggested_word_count && <p className={`text-sm mt-2 font-medium ${theme === 'light' ? 'text-blue-600' : 'text-blue-300'}`}>Suggested: ~{p.suggested_word_count} words</p>}
          </div>
          {p.tips && p.tips.length > 0 && (
            <div className={`rounded-2xl p-4 mb-6 ${theme === 'light' ? 'bg-yellow-50 border border-yellow-200' : 'backdrop-blur-md bg-yellow-500/10 border border-yellow-400/30'}`}>
              <p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-yellow-800' : 'text-yellow-300'}`}>TIPS:</p>
              {p.tips.map((t, i) => <p key={i} className={`text-sm ${theme === 'light' ? 'text-yellow-700' : 'text-yellow-200'}`}>• {t}</p>)}
            </div>
          )}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={12}
            placeholder="Write your response here..."
            className={`w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all resize-none mb-4 ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800 placeholder-gray-400' : 'backdrop-blur-md bg-white/10 border-white/20 text-white placeholder-white/50'}`}
          />
          <div className="flex justify-between items-center">
            <span className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>{text.split(/\s+/).filter(Boolean).length} words</span>
            <button onClick={evaluate} disabled={evalLoading || text.length < 20} className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all transform hover:scale-105">
              {evalLoading ? 'Evaluating...' : '📊 Get Feedback'}
            </button>
          </div>
        </div>
      )}

      {ev && (
        <div className={card}>
          <h3 className={`text-2xl font-bold mb-6 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Evaluation Results</h3>
          {ev.scores && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {Object.entries(ev.scores).map(([key, val]) => (
                <div key={key} className={`rounded-2xl p-4 border text-center ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/10 border-white/20'}`}>
                  <p className={`text-xs font-semibold capitalize mb-1 ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>{key.replace('_',' ')}</p>
                  <p className={`text-3xl font-bold ${val >= 8 ? 'text-green-400' : val >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>{val}<span className={`text-sm ${theme === 'light' ? 'text-gray-400' : 'text-white/50'}`}>/10</span></p>
                </div>
              ))}
            </div>
          )}
          {ev.summary && <div className={`p-4 rounded-2xl mb-4 ${theme === 'light' ? 'bg-blue-50 border border-blue-200' : 'backdrop-blur-md bg-blue-500/10 border border-blue-400/30'}`}><p className={theme === 'light' ? 'text-blue-800' : 'text-blue-200'}>{ev.summary}</p></div>}
          {ev.strengths && ev.strengths.length > 0 && (
            <div className={`p-4 rounded-2xl mb-4 ${theme === 'light' ? 'bg-green-50 border border-green-200' : 'backdrop-blur-md bg-green-500/10 border border-green-400/30'}`}>
              <p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-green-800' : 'text-green-300'}`}>STRENGTHS:</p>
              {ev.strengths.map((s, i) => <p key={i} className={`text-sm ${theme === 'light' ? 'text-green-700' : 'text-green-200'}`}>✓ {s}</p>)}
            </div>
          )}
          {ev.suggestions && ev.suggestions.length > 0 && (
            <div className={`p-4 rounded-2xl mb-4 ${theme === 'light' ? 'bg-yellow-50 border border-yellow-200' : 'backdrop-blur-md bg-yellow-500/10 border border-yellow-400/30'}`}>
              <p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-yellow-800' : 'text-yellow-300'}`}>SUGGESTIONS:</p>
              {ev.suggestions.map((s, i) => <p key={i} className={`text-sm ${theme === 'light' ? 'text-yellow-700' : 'text-yellow-200'}`}>• {s}</p>)}
            </div>
          )}
          {ev.improved_version && (
            <div className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-purple-50 border border-purple-200' : 'backdrop-blur-md bg-purple-500/10 border border-purple-400/30'}`}>
              <p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-purple-800' : 'text-purple-300'}`}>IMPROVED VERSION:</p>
              <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-purple-800' : 'text-purple-200'}`}>{ev.improved_version}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
