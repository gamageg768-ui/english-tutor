'use client';

import { useState } from 'react';
import { generateMCQ, getMCQHint, generateMCQExplanation } from '@/lib/api-client';

interface MCQQuestion { question: string; options: string[]; correct_answer: string; explanation?: string; topic?: string; }
interface Props { theme: 'dark' | 'light'; onBack: () => void; }

const TOPICS = ['Grammar', 'Vocabulary', 'Idioms', 'Phrasal Verbs', 'Business English', 'Academic English', 'Everyday English'];
const LEVELS = ['A1','A2','B1','B2','C1','C2'];

export default function MCQPractice({ theme, onBack }: Props) {
  const [topic, setTopic] = useState('Grammar');
  const [level, setLevel] = useState('B1');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setQuestions([]); setCurrent(0); setSelected(null); setShowAnswer(false); setScore(0); setDone(false); setHint(null); setExplanation(null);
    try {
      const res = await generateMCQ(topic, level, count) as { success: boolean; mcq_data: { questions: MCQQuestion[] } };
      setQuestions(res.mcq_data?.questions || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const q = questions[current];

  const handleSelect = async (opt: string) => {
    if (showAnswer) return;
    setSelected(opt); setShowAnswer(true);
    if (opt === q.correct_answer) setScore(s => s + 1);
    else {
      try {
        const res = await generateMCQExplanation(q.question, opt, q.correct_answer, topic) as { explanation: string };
        setExplanation(res.explanation);
      } catch { /* ignore */ }
    }
  };

  const next = () => {
    if (current < questions.length - 1) { setCurrent(c => c + 1); setSelected(null); setShowAnswer(false); setHint(null); setExplanation(null); }
    else setDone(true);
  };

  const getHint = async () => {
    setHintLoading(true);
    try {
      const res = await getMCQHint(q.question, q.options, topic) as { hint: string };
      setHint(res.hint);
    } catch { /* ignore */ }
    finally { setHintLoading(false); }
  };

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;
  const inputCls = `w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white'}`;

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-4xl mx-auto">
        <div className={`${card} text-center`}>
          <div className="text-7xl mb-6">{pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '💪'}</div>
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-purple-400 mb-4">Quiz Complete!</h2>
          <p className={`text-6xl font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{pct}%</p>
          <p className={`text-xl mb-8 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>{score} out of {questions.length} correct</p>
          <div className="flex gap-4 justify-center">
            <button onClick={generate} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold transition-all transform hover:scale-105">Try Again</button>
            <button onClick={onBack} className={`px-8 py-4 rounded-2xl font-bold border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20'}`}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className={card}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">MCQ Quiz</h2>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20'}`}>← Back</button>
        </div>

        {questions.length === 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Topic</label>
                <select value={topic} onChange={e => setTopic(e.target.value)} className={inputCls}>{TOPICS.map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}</select>
              </div>
              <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Level</label>
                <select value={level} onChange={e => setLevel(e.target.value)} className={inputCls}>{LEVELS.map(l => <option key={l} value={l} className="bg-slate-800">{l}</option>)}</select>
              </div>
              <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Questions</label>
                <select value={count} onChange={e => setCount(Number(e.target.value))} className={inputCls}>
                  {[5,10,15,20].map(n => <option key={n} value={n} className="bg-slate-800">{n} questions</option>)}
                </select>
              </div>
            </div>
            <button onClick={generate} disabled={loading} className="w-full py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold text-lg disabled:opacity-60 transition-all transform hover:scale-[1.02]">
              {loading ? 'Generating Quiz...' : '✅ Start Quiz'}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className={`text-sm font-medium ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>Question {current + 1} of {questions.length}</span>
              <span className={`text-sm font-bold ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Score: {score}/{current + (showAnswer ? 1 : 0)}</span>
            </div>
            <div className={`w-full h-2 rounded-full mb-8 ${theme === 'light' ? 'bg-gray-200' : 'bg-white/20'}`}>
              <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>
            <div className={`p-6 rounded-2xl border mb-6 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/5 border-white/10'}`}>
              <p className={`text-lg font-semibold leading-relaxed ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{q.question}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {q.options.map((opt, i) => {
                const isSelected = selected === opt;
                const isCorrect = showAnswer && opt === q.correct_answer;
                const isWrong = showAnswer && isSelected && opt !== q.correct_answer;
                return (
                  <button key={i} onClick={() => handleSelect(opt)} className={`px-5 py-4 rounded-2xl text-sm font-semibold border-2 text-left transition-all ${isCorrect ? 'bg-green-500/30 border-green-400/50 text-green-200' : isWrong ? 'bg-red-500/30 border-red-400/50 text-red-200' : isSelected ? 'bg-purple-500/30 border-purple-400/50 text-white' : theme === 'light' ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-purple-300' : 'backdrop-blur-sm bg-white/10 border-white/20 text-white/80 hover:bg-white/20'}`}>
                    <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold mr-3 text-center leading-6 ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : 'bg-purple-500/30 text-purple-200'}`}>{String.fromCharCode(65 + i)}</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {!showAnswer && (
              <button onClick={getHint} disabled={hintLoading || !!hint} className={`text-sm px-4 py-2 rounded-xl border transition-all ${theme === 'light' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'backdrop-blur-sm bg-yellow-500/10 text-yellow-200 border-yellow-400/30'} disabled:opacity-60`}>
                {hintLoading ? 'Getting hint...' : hint ? 'Hint shown below' : '💡 Get a Hint'}
              </button>
            )}
            {hint && <div className={`mt-3 p-3 rounded-xl text-sm ${theme === 'light' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : 'backdrop-blur-md bg-yellow-500/10 text-yellow-200 border border-yellow-400/30'}`}>💡 {hint}</div>}
            {explanation && <div className={`mt-3 p-3 rounded-xl text-sm ${theme === 'light' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'backdrop-blur-md bg-blue-500/10 text-blue-200 border border-blue-400/30'}`}>{explanation}</div>}
            {showAnswer && (
              <div className="mt-6">
                {q.explanation && <div className={`p-4 rounded-2xl mb-4 text-sm ${theme === 'light' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'backdrop-blur-md bg-blue-500/10 text-blue-200 border border-blue-400/30'}`}>{q.explanation}</div>}
                <button onClick={next} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold transition-all transform hover:scale-[1.02]">
                  {current < questions.length - 1 ? 'Next Question →' : 'See Results'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
