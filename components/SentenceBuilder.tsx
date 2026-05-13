'use client';

import { useState } from 'react';
import { generateSentenceExercises, checkSentence } from '@/lib/api-client';

interface SentenceExercise { type: string; scrambled_words?: string[]; sentence_with_blanks?: string; original?: string; instruction?: string; sentences_to_combine?: string[]; correct_sentence: string; hint: string; grammar_point: string; explanation?: string; }
interface Props { theme: 'dark' | 'light'; onBack: () => void; }
const LEVELS = ['A1','A2','B1','B2','C1','C2'];
const TYPES = ['scramble','fill_blank','transform','combine'];
const GRAMMAR = ['Present Perfect','Past Simple','Conditionals','Passive Voice','Relative Clauses','Modal Verbs'];

export default function SentenceBuilder({ theme, onBack }: Props) {
  const [level, setLevel] = useState('B1');
  const [exerciseType, setExerciseType] = useState('scramble');
  const [grammarFocus, setGrammarFocus] = useState('Present Perfect');
  const [count, setCount] = useState(5);
  const [exercises, setExercises] = useState<SentenceExercise[]>([]);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState('');
  const [dragWords, setDragWords] = useState<string[]>([]);
  const [result, setResult] = useState<{ correct: boolean; score: number; feedback: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const load = async () => {
    setLoading(true); setExercises([]); setCurrent(0); setInput(''); setResult(null); setShowHint(false);
    try {
      const res = await generateSentenceExercises(level, exerciseType, grammarFocus, count) as { data: { exercises: SentenceExercise[] } };
      const exs = res.data?.exercises || [];
      setExercises(exs);
      if (exs[0]?.scrambled_words) setDragWords([...exs[0].scrambled_words]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const ex = exercises[current];

  const check = async () => {
    if (!ex) return;
    const answer = exerciseType === 'scramble' ? dragWords.join(' ') : input;
    setCheckLoading(true); setResult(null);
    try {
      const res = await checkSentence(answer, ex.correct_sentence, exerciseType, level) as { correct: boolean; score: number; feedback: string };
      setResult(res);
    } catch { /* ignore */ }
    finally { setCheckLoading(false); }
  };

  const next = () => {
    const nx = current + 1;
    setCurrent(nx); setInput(''); setResult(null); setShowHint(false);
    if (exercises[nx]?.scrambled_words) setDragWords([...exercises[nx].scrambled_words!]);
  };

  const moveWord = (word: string, fromPool: boolean) => {
    if (fromPool) {
      setDragWords(d => d.filter(w => w !== word));
      setInput(i => i ? `${i} ${word}` : word);
    } else {
      setInput(i => i.split(' ').filter(w => w !== word).join(' '));
      setDragWords(d => [...d, word]);
    }
  };

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;
  const selectCls = `w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white'}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className={card}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Sentence Builder</h2>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20'}`}>← Back</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Level</label><select value={level} onChange={e => setLevel(e.target.value)} className={selectCls}>{LEVELS.map(l => <option key={l} value={l} className="bg-slate-800">{l}</option>)}</select></div>
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Type</label><select value={exerciseType} onChange={e => setExerciseType(e.target.value)} className={selectCls}>{TYPES.map(t => <option key={t} value={t} className="bg-slate-800 capitalize">{t.replace('_',' ')}</option>)}</select></div>
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Grammar</label><select value={grammarFocus} onChange={e => setGrammarFocus(e.target.value)} className={selectCls}>{GRAMMAR.map(g => <option key={g} value={g} className="bg-slate-800">{g}</option>)}</select></div>
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Count</label><select value={count} onChange={e => setCount(Number(e.target.value))} className={selectCls}>{[5,10].map(n => <option key={n} value={n} className="bg-slate-800">{n}</option>)}</select></div>
        </div>
        <button onClick={load} disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all transform hover:scale-[1.02]">
          {loading ? 'Generating...' : '🧱 Start Exercises'}
        </button>
      </div>

      {ex && (
        <div className={card}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className={`text-xs font-bold ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>{ex.type?.toUpperCase()} • {ex.grammar_point}</p>
              <h3 className={`text-lg font-bold mt-1 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Exercise {current + 1} of {exercises.length}</h3>
            </div>
            <div className={`w-full max-w-xs h-2 rounded-full ml-4 ${theme === 'light' ? 'bg-gray-200' : 'bg-white/20'}`}>
              <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all" style={{ width: `${((current + 1) / exercises.length) * 100}%` }} />
            </div>
          </div>

          <div className={`p-5 rounded-2xl mb-6 ${theme === 'light' ? 'bg-gray-50 border border-gray-200' : 'backdrop-blur-md bg-white/5 border border-white/10'}`}>
            {ex.instruction && <p className={`text-sm font-semibold mb-3 ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>{ex.instruction}</p>}
            {ex.sentence_with_blanks && <p className={`text-lg ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{ex.sentence_with_blanks}</p>}
            {ex.original && <p className={`text-lg ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{ex.original}</p>}
            {ex.sentences_to_combine && <div className="space-y-1">{ex.sentences_to_combine.map((s, i) => <p key={i} className={`text-lg ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{s}</p>)}</div>}
            {ex.scrambled_words && <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-white/60'}`}>Rearrange these words to form a correct sentence</p>}
          </div>

          {exerciseType === 'scramble' ? (
            <div>
              <div className="mb-3">
                <p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>YOUR SENTENCE:</p>
                <div className={`min-h-12 p-3 rounded-2xl border-2 border-dashed flex flex-wrap gap-2 ${theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-white/30 bg-white/5'}`}>
                  {input.split(' ').filter(Boolean).map((w, i) => (
                    <button key={i} onClick={() => moveWord(w, false)} className="px-3 py-1.5 bg-blue-500/30 text-blue-200 rounded-xl text-sm font-medium border border-blue-400/30 hover:bg-blue-500/40">{w}</button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>WORD POOL:</p>
                <div className="flex flex-wrap gap-2">
                  {dragWords.map((w, i) => (
                    <button key={i} onClick={() => moveWord(w, true)} className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' : 'backdrop-blur-sm bg-white/10 border-white/20 text-white/80 hover:bg-white/20'}`}>{w}</button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()} placeholder="Type your answer..." className={`w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all mb-4 ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800 placeholder-gray-400' : 'backdrop-blur-md bg-white/10 border-white/20 text-white placeholder-white/50'}`} />
          )}

          <div className="flex gap-3 mb-4">
            <button onClick={check} disabled={checkLoading || (!input.trim() && dragWords.length === ex.scrambled_words?.length)} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all">
              {checkLoading ? 'Checking...' : '✓ Check'}
            </button>
            <button onClick={() => setShowHint(h => !h)} className={`px-4 py-3 rounded-2xl text-sm font-medium border transition-all ${theme === 'light' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'backdrop-blur-sm bg-yellow-500/10 text-yellow-200 border-yellow-400/30'}`}>
              💡 Hint
            </button>
          </div>

          {showHint && <div className={`p-3 rounded-2xl text-sm mb-4 ${theme === 'light' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' : 'backdrop-blur-md bg-yellow-500/10 border border-yellow-400/30 text-yellow-200'}`}>{ex.hint}</div>}

          {result && (
            <div className={`p-4 rounded-2xl mb-4 ${result.correct ? theme === 'light' ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-400/30' : theme === 'light' ? 'bg-red-50 border border-red-200' : 'bg-red-500/10 border border-red-400/30'}`}>
              <p className={`font-bold ${result.correct ? theme === 'light' ? 'text-green-800' : 'text-green-200' : theme === 'light' ? 'text-red-800' : 'text-red-200'}`}>{result.correct ? '✅ Correct!' : '❌ Not quite'}</p>
              <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-700' : 'text-white/80'}`}>{result.feedback}</p>
              {!result.correct && <p className={`text-sm mt-2 font-medium ${theme === 'light' ? 'text-green-700' : 'text-green-300'}`}>Correct: "{ex.correct_sentence}"</p>}
            </div>
          )}

          {result && current < exercises.length - 1 && (
            <button onClick={next} className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold transition-all">Next →</button>
          )}
          {result && current === exercises.length - 1 && (
            <div className={`text-center py-6 rounded-2xl ${theme === 'light' ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-400/30'}`}>
              <p className={`text-xl font-bold ${theme === 'light' ? 'text-green-800' : 'text-green-200'}`}>🎉 All exercises complete!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
