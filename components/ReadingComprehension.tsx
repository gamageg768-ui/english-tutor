'use client';

import { useState } from 'react';
import { getReadingExercise, checkReadingAnswer } from '@/lib/api-client';

interface Props { theme: 'dark' | 'light'; onBack: () => void; }
const LEVELS = ['A1','A2','B1','B2','C1','C2'];
const TOPICS = ['Technology','History','Science','Culture','Environment','Business','Health','Literature'];
const TYPES = ['narrative','expository','argumentative','descriptive'];

export default function ReadingComprehension({ theme, onBack }: Props) {
  const [level, setLevel] = useState('B1');
  const [topic, setTopic] = useState('Technology');
  const [passageType, setPassageType] = useState('expository');
  const [exercise, setExercise] = useState<{ title: string; passage: string; questions: { type: string; question: string; options?: string[]; correct_answer: string; explanation: string }[]; vocabulary: { word: string; definition: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [shortFeedback, setShortFeedback] = useState<Record<number, string>>({});

  const load = async () => {
    setLoading(true); setExercise(null); setAnswers({}); setSubmitted(false); setShortFeedback({});
    try {
      const res = await getReadingExercise(level, topic, passageType) as { exercise: typeof exercise };
      setExercise(res.exercise);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const checkShort = async (i: number, q: { question: string; correct_answer: string }) => {
    if (!exercise || !answers[i]) return;
    try {
      const res = await checkReadingAnswer(exercise.passage, q.question, answers[i], level) as { feedback: string };
      setShortFeedback(f => ({ ...f, [i]: res.feedback }));
    } catch { /* ignore */ }
  };

  const score = submitted && exercise ? exercise.questions.filter((q, i) => q.type !== 'short_answer' && answers[i] === q.correct_answer).length : 0;
  const mcqCount = exercise?.questions.filter(q => q.type !== 'short_answer').length || 0;

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;
  const selectCls = `w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white'}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className={card}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Reading Comprehension</h2>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20'}`}>← Back</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Level</label><select value={level} onChange={e => setLevel(e.target.value)} className={selectCls}>{LEVELS.map(l => <option key={l} value={l} className="bg-slate-800">{l}</option>)}</select></div>
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Topic</label><select value={topic} onChange={e => setTopic(e.target.value)} className={selectCls}>{TOPICS.map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}</select></div>
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Type</label><select value={passageType} onChange={e => setPassageType(e.target.value)} className={selectCls}>{TYPES.map(t => <option key={t} value={t} className="bg-slate-800 capitalize">{t}</option>)}</select></div>
        </div>
        <button onClick={load} disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all transform hover:scale-[1.02]">
          {loading ? 'Generating passage...' : '📖 Get Reading Exercise'}
        </button>
      </div>

      {exercise && (
        <>
          <div className={card}>
            <h3 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{exercise.title}</h3>
            <div className={`p-6 rounded-2xl mb-6 leading-loose text-base ${theme === 'light' ? 'bg-gray-50 border border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/5 border border-white/10 text-white/90'}`}>
              {exercise.passage}
            </div>
            {exercise.vocabulary.length > 0 && (
              <div>
                <p className={`text-xs font-bold mb-3 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>KEY VOCABULARY:</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.vocabulary.map(v => (
                    <div key={v.word} className={`px-3 py-2 rounded-xl text-sm border ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'backdrop-blur-sm bg-blue-500/10 border-blue-400/30'}`}>
                      <span className={`font-bold ${theme === 'light' ? 'text-blue-800' : 'text-blue-200'}`}>{v.word}</span>
                      <span className={` — ${theme === 'light' ? 'text-blue-600' : 'text-blue-300'}`}>{v.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={card}>
            <h3 className={`text-xl font-bold mb-6 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Questions</h3>
            {submitted && mcqCount > 0 && <div className={`mb-6 p-4 rounded-2xl text-center font-bold ${score >= mcqCount * 0.7 ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'}`}>Score: {score}/{mcqCount} MCQ correct</div>}
            <div className="space-y-6">
              {exercise.questions.map((q, i) => (
                <div key={i} className={`p-5 rounded-2xl border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/10 border-white/20'}`}>
                  <p className={`font-semibold mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{i+1}. {q.question}</p>
                  {q.options ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, j) => {
                        const isSel = answers[i] === opt;
                        const isCorrect = submitted && opt === q.correct_answer;
                        const isWrong = submitted && isSel && opt !== q.correct_answer;
                        return <button key={j} onClick={() => !submitted && setAnswers(a => ({ ...a, [i]: opt }))} className={`px-4 py-3 rounded-2xl text-sm font-medium border-2 text-left transition-all ${isCorrect ? 'bg-green-500/30 border-green-400/50 text-green-200' : isWrong ? 'bg-red-500/30 border-red-400/50 text-red-200' : isSel ? 'bg-purple-500/30 border-purple-400/50 text-white' : theme === 'light' ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' : 'backdrop-blur-sm bg-white/10 border-white/20 text-white/80 hover:bg-white/20'}`}>{opt}</button>;
                      })}
                    </div>
                  ) : (
                    <div>
                      <textarea value={answers[i] || ''} onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))} rows={3} placeholder="Your answer..." className={`w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white'}`} />
                      {!shortFeedback[i] && <button onClick={() => checkShort(i, q)} disabled={!answers[i]} className="mt-2 px-4 py-2 bg-blue-500/20 text-blue-200 rounded-xl text-sm border border-blue-400/30 disabled:opacity-50">Check Answer</button>}
                      {shortFeedback[i] && <p className={`mt-2 text-sm p-3 rounded-xl ${theme === 'light' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-blue-500/10 text-blue-200 border border-blue-400/30'}`}>{shortFeedback[i]}</p>}
                    </div>
                  )}
                  {submitted && q.explanation && <p className={`mt-2 text-sm ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>{q.explanation}</p>}
                </div>
              ))}
            </div>
            {!submitted && <button onClick={() => setSubmitted(true)} className="mt-6 w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold transition-all transform hover:scale-[1.02]">Submit Answers</button>}
          </div>
        </>
      )}
    </div>
  );
}
