'use client';

import { useState } from 'react';
import { generateErrorCorrection, checkErrorCorrections } from '@/lib/api-client';

interface PlantedError { wrong: string; correct: string; type: string; explanation: string; }
interface Exercise { passage_with_errors: string; correct_passage: string; error_count: number; errors: PlantedError[]; topic: string; level: string; }
interface Props { theme: 'dark' | 'light'; onBack: () => void; }
const LEVELS = ['A1','A2','B1','B2','C1','C2'];
const TOPICS = ['General','Business','Travel','Academic','Technology','Daily Life'];

export default function ErrorCorrectionPractice({ theme, onBack }: Props) {
  const [level, setLevel] = useState('B1');
  const [topic, setTopic] = useState('General');
  const [errorCount, setErrorCount] = useState(5);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [userText, setUserText] = useState('');
  const [result, setResult] = useState<{ found: number; total: number; score: number; correct_fixes: PlantedError[]; missed_errors: PlantedError[]; feedback: string } | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userCorrections, setUserCorrections] = useState<{ wrong: string; correct: string }[]>([{ wrong: '', correct: '' }]);

  const load = async () => {
    setLoading(true); setExercise(null); setResult(null); setShowAnswer(false); setUserText(''); setUserCorrections([{ wrong: '', correct: '' }]);
    try {
      const res = await generateErrorCorrection(level, topic, errorCount) as { exercise: Exercise };
      setExercise(res.exercise);
      setUserText(res.exercise.passage_with_errors);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const check = async () => {
    if (!exercise) return;
    const nonEmpty = userCorrections.filter(c => c.wrong.trim() && c.correct.trim());
    setCheckLoading(true);
    try {
      const res = await checkErrorCorrections(nonEmpty, exercise.errors) as typeof result;
      setResult(res);
    } catch { /* ignore */ }
    finally { setCheckLoading(false); }
  };

  const addRow = () => setUserCorrections(c => [...c, { wrong: '', correct: '' }]);
  const updateRow = (i: number, field: 'wrong' | 'correct', val: string) => setUserCorrections(c => c.map((r, j) => j === i ? { ...r, [field]: val } : r));
  const removeRow = (i: number) => setUserCorrections(c => c.filter((_, j) => j !== i));

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;
  const selectCls = `w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white'}`;
  const inputCls = `px-3 py-2 rounded-xl border focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white'}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className={card}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Error Hunt</h2>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20'}`}>← Back</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Level</label><select value={level} onChange={e => setLevel(e.target.value)} className={selectCls}>{LEVELS.map(l => <option key={l} value={l} className="bg-slate-800">{l}</option>)}</select></div>
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Topic</label><select value={topic} onChange={e => setTopic(e.target.value)} className={selectCls}>{TOPICS.map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}</select></div>
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Errors to find</label><select value={errorCount} onChange={e => setErrorCount(Number(e.target.value))} className={selectCls}>{[3,5,7,10].map(n => <option key={n} value={n} className="bg-slate-800">{n} errors</option>)}</select></div>
        </div>
        <button onClick={load} disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all transform hover:scale-[1.02]">
          {loading ? 'Generating...' : '🔍 Start Error Hunt'}
        </button>
      </div>

      {exercise && (
        <>
          <div className={card}>
            <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Find {exercise.error_count} Errors</h3>
            <p className={`text-sm mb-4 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>Read the passage carefully and identify grammar/spelling mistakes</p>
            <div className={`p-6 rounded-2xl leading-loose text-base border mb-6 ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/5 border-white/10 text-white/90'}`}>
              {exercise.passage_with_errors}
            </div>

            <h4 className={`font-bold mb-3 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Your Corrections:</h4>
            <div className="space-y-3 mb-4">
              {userCorrections.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={row.wrong} onChange={e => updateRow(i, 'wrong', e.target.value)} placeholder="Wrong word/phrase" className={`flex-1 ${inputCls}`} />
                  <span className={theme === 'light' ? 'text-gray-500' : 'text-white/60'}>→</span>
                  <input value={row.correct} onChange={e => updateRow(i, 'correct', e.target.value)} placeholder="Correct version" className={`flex-1 ${inputCls}`} />
                  {userCorrections.length > 1 && <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-500 px-2">×</button>}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={addRow} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${theme === 'light' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'backdrop-blur-sm bg-white/10 text-white/80 border-white/20 hover:bg-white/20'}`}>+ Add Row</button>
              <button onClick={check} disabled={checkLoading} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all">
                {checkLoading ? 'Checking...' : '✓ Check My Answers'}
              </button>
              <button onClick={() => setShowAnswer(s => !s)} className={`px-4 py-3 rounded-2xl text-sm font-medium border transition-all ${theme === 'light' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'backdrop-blur-sm bg-yellow-500/10 text-yellow-200 border-yellow-400/30'}`}>
                {showAnswer ? 'Hide' : 'Answer'}
              </button>
            </div>
            {showAnswer && (
              <div className={`mt-4 p-4 rounded-2xl border-l-4 border-green-400 ${theme === 'light' ? 'bg-green-50' : 'bg-green-500/10'}`}>
                <p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-green-800' : 'text-green-300'}`}>CORRECT PASSAGE:</p>
                <p className={`leading-loose ${theme === 'light' ? 'text-green-800' : 'text-green-200'}`}>{exercise.correct_passage}</p>
              </div>
            )}
          </div>

          {result && (
            <div className={card}>
              <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Results: {result.found}/{result.total} errors found ({result.score}%)</h3>
              <p className={`mb-6 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>{result.feedback}</p>
              {result.correct_fixes?.length > 0 && (
                <div className={`p-4 rounded-2xl mb-4 ${theme === 'light' ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-400/30'}`}>
                  <p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-green-800' : 'text-green-300'}`}>CORRECTLY FOUND ({result.correct_fixes.length}):</p>
                  {result.correct_fixes.map((e, i) => <div key={i} className={`text-sm mb-1 ${theme === 'light' ? 'text-green-700' : 'text-green-200'}`}>✓ <span className="line-through opacity-70">{e.wrong}</span> → <strong>{e.correct}</strong></div>)}
                </div>
              )}
              {result.missed_errors?.length > 0 && (
                <div className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-red-50 border border-red-200' : 'bg-red-500/10 border border-red-400/30'}`}>
                  <p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-red-800' : 'text-red-300'}`}>MISSED ({result.missed_errors.length}):</p>
                  {result.missed_errors.map((e, i) => <div key={i} className={`text-sm mb-2 ${theme === 'light' ? 'text-red-700' : 'text-red-200'}`}>✗ <span className="line-through">{e.wrong}</span> → <strong>{e.correct}</strong><br/><span className="text-xs opacity-70">{e.explanation}</span></div>)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
