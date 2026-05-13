'use client';

import { useState, useRef } from 'react';
import { getPronunciationExercise } from '@/lib/api-client';

interface Exercise { type: string; text: string; ipa: string; tips: string; common_mistakes: string; focus_sound: string; }
interface Props { theme: 'dark' | 'light'; onBack: () => void; }

export default function PronunciationPractice({ theme, onBack }: Props) {
  const [difficulty, setDifficulty] = useState('intermediate');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const [transcript, setTranscript] = useState('');

  const load = async () => {
    setLoading(true); setExercises([]); setCurrent(0); setTranscript('');
    try {
      const res = await getPronunciationExercise(difficulty) as { exercises: Exercise[] | Exercise };
      const exArr = Array.isArray(res.exercises) ? res.exercises : [res.exercises];
      setExercises(exArr.filter(Boolean));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const speak = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.8; utt.lang = 'en-US';
    const eng = synthRef.current.getVoices().find(v => v.lang.startsWith('en-'));
    if (eng) utt.voice = eng;
    utt.onstart = () => setIsPlaying(true);
    utt.onend = () => setIsPlaying(false);
    synthRef.current.speak(utt);
  };

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported in your browser'); return; }
    const r = new SR();
    r.lang = 'en-US'; r.continuous = false; r.interimResults = false;
    r.onresult = (ev: SpeechRecognitionEvent) => { setTranscript(ev.results[0][0].transcript); setIsRecording(false); };
    r.onerror = () => setIsRecording(false);
    r.onend = () => setIsRecording(false);
    recognitionRef.current = r;
    r.start(); setIsRecording(true); setTranscript('');
  };

  const stopRecording = () => { recognitionRef.current?.stop(); setIsRecording(false); };

  const ex = exercises[current];
  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className={card}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Speaking Practice</h2>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20'}`}>← Back</button>
        </div>
        <div className="mb-6">
          <label className={`block text-sm font-semibold mb-3 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Difficulty</label>
          <div className="flex gap-3">
            {['beginner','intermediate','advanced'].map(d => (
              <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-3 rounded-2xl font-bold capitalize transition-all ${difficulty === d ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : theme === 'light' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'backdrop-blur-md bg-white/10 text-white/80 border border-white/20'}`}>{d}</button>
            ))}
          </div>
        </div>
        <button onClick={load} disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all transform hover:scale-[1.02]">
          {loading ? 'Generating...' : '🗣️ Get Pronunciation Exercises'}
        </button>
      </div>

      {exercises.length > 0 && ex && (
        <div className={card}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Exercise {current + 1} of {exercises.length}</h3>
            <div className="flex gap-2">
              {exercises.map((_, i) => <button key={i} onClick={() => { setCurrent(i); setTranscript(''); }} className={`w-8 h-8 rounded-full font-bold text-sm transition-all ${i === current ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-white/80'}`}>{i+1}</button>)}
            </div>
          </div>

          <div className={`rounded-2xl p-6 mb-6 ${theme === 'light' ? 'bg-gray-50 border border-gray-200' : 'backdrop-blur-md bg-white/5 border border-white/10'}`}>
            <p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>{ex.type?.toUpperCase()} • Focus: {ex.focus_sound}</p>
            <p className={`text-3xl font-bold mb-2 text-center ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{ex.text}</p>
            {ex.ipa && <p className={`text-center text-lg ${theme === 'light' ? 'text-purple-600' : 'text-purple-300'}`}>{ex.ipa}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {ex.tips && <div className={`rounded-2xl p-4 ${theme === 'light' ? 'bg-blue-50 border border-blue-200' : 'backdrop-blur-md bg-blue-500/10 border border-blue-400/30'}`}><p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-blue-800' : 'text-blue-300'}`}>TIPS:</p><p className={`text-sm ${theme === 'light' ? 'text-blue-700' : 'text-blue-200'}`}>{ex.tips}</p></div>}
            {ex.common_mistakes && <div className={`rounded-2xl p-4 ${theme === 'light' ? 'bg-red-50 border border-red-200' : 'backdrop-blur-md bg-red-500/10 border border-red-400/30'}`}><p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-red-800' : 'text-red-300'}`}>COMMON MISTAKES:</p><p className={`text-sm ${theme === 'light' ? 'text-red-700' : 'text-red-200'}`}>{ex.common_mistakes}</p></div>}
          </div>

          <div className="flex gap-3 mb-4">
            <button onClick={() => speak(ex.text)} disabled={isPlaying} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all disabled:opacity-60 ${isPlaying ? 'bg-purple-500/30 text-purple-200' : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'}`}>
              {isPlaying ? '🔊 Playing...' : '▶️ Hear Pronunciation'}
            </button>
            <button onClick={isRecording ? stopRecording : startRecording} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${isRecording ? 'bg-red-500/30 text-red-200 border-2 border-red-400/40 animate-pulse' : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'}`}>
              {isRecording ? '⏹ Stop' : '🎤 Practice'}
            </button>
          </div>

          {transcript && (
            <div className={`rounded-2xl p-4 ${theme === 'light' ? 'bg-green-50 border border-green-200' : 'backdrop-blur-md bg-green-500/10 border border-green-400/30'}`}>
              <p className={`text-xs font-bold mb-1 ${theme === 'light' ? 'text-green-800' : 'text-green-300'}`}>YOU SAID:</p>
              <p className={`text-lg ${theme === 'light' ? 'text-green-700' : 'text-green-200'}`}>"{transcript}"</p>
            </div>
          )}

          {current < exercises.length - 1 && (
            <button onClick={() => { setCurrent(c => c + 1); setTranscript(''); }} className="mt-4 w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold transition-all">Next Exercise →</button>
          )}
        </div>
      )}
    </div>
  );
}
