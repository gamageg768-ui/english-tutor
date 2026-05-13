'use client';

import { useState, useRef } from 'react';
import { getListeningExercise } from '@/lib/api-client';

interface Props { theme: 'dark' | 'light'; onBack: () => void; }
const LEVELS = ['A1','A2','B1','B2','C1','C2'];
const TOPICS = ['Daily Life','Travel','Business','Science','History','Culture','Environment','Sports'];

export default function ListeningPractice({ theme, onBack }: Props) {
  const [level, setLevel] = useState('B1');
  const [topic, setTopic] = useState('Daily Life');
  const [exercise, setExercise] = useState<{ title: string; passage: string; questions: { question: string; options: string[]; correct_answer: string; explanation: string }[]; key_vocabulary: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null);

  const load = async () => {
    setLoading(true); setExercise(null); setAnswers({}); setSubmitted(false);
    try {
      const res = await getListeningExercise(level, topic) as { exercise: typeof exercise };
      setExercise(res.exercise);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const play = () => {
    if (!exercise || !synthRef.current) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(exercise.passage);
    utt.rate = 0.85; utt.lang = 'en-US';
    const eng = synthRef.current.getVoices().find(v => v.lang.startsWith('en-'));
    if (eng) utt.voice = eng;
    utt.onstart = () => setIsPlaying(true);
    utt.onend = () => setIsPlaying(false);
    synthRef.current.speak(utt);
  };

  const stop = () => { synthRef.current?.cancel(); setIsPlaying(false); };
  const score = submitted && exercise ? exercise.questions.filter((q, i) => answers[i] === q.correct_answer).length : 0;

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;
  const selectCls = `w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white'}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className={card}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Listening Practice</h2>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20'}`}>← Back</button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Level</label><select value={level} onChange={e => setLevel(e.target.value)} className={selectCls}>{LEVELS.map(l => <option key={l} value={l} className="bg-slate-800">{l}</option>)}</select></div>
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Topic</label><select value={topic} onChange={e => setTopic(e.target.value)} className={selectCls}>{TOPICS.map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}</select></div>
        </div>
        <button onClick={load} disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all transform hover:scale-[1.02]">
          {loading ? 'Generating exercise...' : '🎧 Get Listening Exercise'}
        </button>
      </div>

      {exercise && (
        <>
          <div className={card}>
            <h3 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{exercise.title}</h3>
            <div className="flex gap-3 mb-4">
              <button onClick={isPlaying ? stop : play} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${isPlaying ? 'bg-red-500/30 text-red-200 border-2 border-red-400/40' : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'}`}>
                {isPlaying ? '⏹ Stop' : '▶️ Play Audio'}
              </button>
              <span className={`text-sm self-center ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>Listen first, then answer the questions</span>
            </div>
            {exercise.key_vocabulary.length > 0 && (
              <div className={`rounded-2xl p-4 ${theme === 'light' ? 'bg-blue-50 border border-blue-200' : 'backdrop-blur-md bg-blue-500/10 border border-blue-400/30'}`}>
                <p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-blue-800' : 'text-blue-300'}`}>KEY VOCABULARY:</p>
                <div className="flex flex-wrap gap-2">{exercise.key_vocabulary.map(v => <span key={v} className={`px-3 py-1 rounded-full text-sm ${theme === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-200'}`}>{v}</span>)}</div>
              </div>
            )}
          </div>

          <div className={card}>
            <h3 className={`text-xl font-bold mb-6 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Questions</h3>
            {submitted && <div className={`mb-6 p-4 rounded-2xl text-center font-bold ${score >= exercise.questions.length * 0.7 ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'}`}>Score: {score}/{exercise.questions.length}</div>}
            <div className="space-y-6">
              {exercise.questions.map((q, i) => (
                <div key={i} className={`p-5 rounded-2xl border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/10 border-white/20'}`}>
                  <p className={`font-semibold mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{i+1}. {q.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, j) => {
                      const isSel = answers[i] === opt;
                      const isCorrect = submitted && opt === q.correct_answer;
                      const isWrong = submitted && isSel && opt !== q.correct_answer;
                      return (
                        <button key={j} onClick={() => !submitted && setAnswers(a => ({ ...a, [i]: opt }))} className={`px-4 py-3 rounded-2xl text-sm font-medium border-2 text-left transition-all ${isCorrect ? 'bg-green-500/30 border-green-400/50 text-green-200' : isWrong ? 'bg-red-500/30 border-red-400/50 text-red-200' : isSel ? 'bg-purple-500/30 border-purple-400/50 text-white' : theme === 'light' ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' : 'backdrop-blur-sm bg-white/10 border-white/20 text-white/80 hover:bg-white/20'}`}>{opt}</button>
                      );
                    })}
                  </div>
                  {submitted && <p className={`mt-2 text-sm ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>{q.explanation}</p>}
                </div>
              ))}
            </div>
            {!submitted && <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < exercise.questions.length} className="mt-6 w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all transform hover:scale-[1.02]">Submit Answers</button>}
          </div>
        </>
      )}
    </div>
  );
}
