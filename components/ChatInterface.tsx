'use client';

import { useState, useEffect, useRef } from 'react';
import { sendMessage, saveConversation } from '@/lib/api-client';

interface Correction { wrong: string; correct: string; full_sentence?: string; reason: string; }
interface Message {
  id: string;
  role: 'user' | 'tutor';
  content: string;
  corrections?: Correction[];
  encouragement?: string;
}
interface Situation {
  id: number | string;
  title: string;
  domain: string;
  module: string;
  level: string;
  role: string;
  context?: string;
  description?: string;
}

interface Props {
  situation: Situation;
  theme: 'dark' | 'light';
  onBack: () => void;
}

export default function ChatInterface({ situation, theme, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [goalProgress, setGoalProgress] = useState<'in_progress' | 'advancing' | 'complete'>('in_progress');
  const [allCorrections, setAllCorrections] = useState<Correction[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.9);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<unknown>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    const ctx = situation.context || situation.description || '';
    setMessages([{
      id: `system-${Date.now()}`,
      role: 'tutor',
      content: `**Situation: ${situation.title}**\n\n${ctx}\n\nYou are speaking with: **${situation.role}**\n\nLevel: **${situation.level}**\n\nStart the conversation!`,
    }]);
    if (typeof window !== 'undefined') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        setVoiceSupported(true);
        const r = new SR();
        r.continuous = false; r.interimResults = false; r.lang = 'en-US';
        r.onresult = (ev: SpeechRecognitionEvent) => { setInput(ev.results[0][0].transcript); setIsListening(false); };
        r.onerror = () => setIsListening(false);
        r.onend = () => setIsListening(false);
        recognitionRef.current = r;
      }
      if ('speechSynthesis' in window) synthRef.current = window.speechSynthesis;
    }
    return () => { synthRef.current?.cancel(); };
  }, [situation]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const speakText = (text: string) => {
    if (!synthRef.current || !voiceOutput) return;
    synthRef.current.cancel();
    const clean = text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/\n+/g, '. ').replace(/[#_`]/g, '');
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = speechRate; utt.lang = 'en-US';
    const voices = synthRef.current.getVoices();
    const eng = voices.find(v => v.lang.startsWith('en-'));
    if (eng) utt.voice = eng;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utt);
  };

  const toggleVoiceInput = () => {
    const r = recognitionRef.current as InstanceType<typeof SpeechRecognition> | null;
    if (!r) return;
    if (isListening) { r.stop(); setIsListening(false); }
    else { try { r.start(); setIsListening(true); } catch { setIsListening(false); } }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setIsLoading(true);
    try {
      const history = newMsgs
        .filter(m => m.role === 'user' || m.role === 'tutor')
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
      const res = await sendMessage(situation.id, input, history) as { reply: string; corrections: Correction[]; encouragement: string; goal_progress: 'in_progress' | 'advancing' | 'complete' };
      const tutorMsg: Message = { id: `tutor-${Date.now()}`, role: 'tutor', content: res.reply, corrections: res.corrections, encouragement: res.encouragement };
      setMessages(prev => [...prev, tutorMsg]);
      setGoalProgress(res.goal_progress);
      if (voiceOutput) setTimeout(() => speakText(res.reply), 100);
      if (res.corrections?.length) setAllCorrections(prev => [...prev, ...res.corrections]);
    } catch {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'tutor', content: 'Sorry, there was an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    if (messages.length > 1) {
      try {
        await saveConversation({
          situation_id: situation.id,
          situation_title: situation.title,
          messages: messages.map(m => ({ role: m.role, content: m.content, corrections: m.corrections })),
          corrections: allCorrections,
          completed: goalProgress === 'complete' || messages.length >= 6,
        });
      } catch { /* ignore */ }
    }
    onBack();
  };

  const progressColor = goalProgress === 'complete' ? 'from-green-400 to-emerald-500' : goalProgress === 'advancing' ? 'from-yellow-400 to-orange-500' : 'from-blue-400 to-purple-500';
  const progressWidth = goalProgress === 'complete' ? '100%' : goalProgress === 'advancing' ? '66%' : '33%';

  const cardCls = `max-w-4xl mx-auto rounded-3xl shadow-2xl border overflow-hidden ${
    theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'
  }`;

  return (
    <div className={cardCls}>
      <div className={`p-4 sm:p-5 border-b ${
        theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border-white/20'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <button onClick={handleBack} className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl font-bold text-sm sm:text-base transition-all border shadow-lg transform hover:scale-105 ${
              theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' : 'backdrop-blur-md bg-white/20 hover:bg-white/30 text-white border-white/30'
            }`}>
              <span className="text-xl">←</span><span>Back</span>
            </button>
            <div>
              <h2 className={`text-lg sm:text-xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{situation.title}</h2>
              <p className={`text-xs sm:text-sm ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>
                {situation.domain} • {situation.module} • Level {situation.level}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border ${
              theme === 'light' ? 'bg-gray-100 border-gray-200' : 'backdrop-blur-md bg-white/10 border-white/20'
            }`}>
              <button
                onClick={() => { setVoiceOutput(v => !v); if (voiceOutput) synthRef.current?.cancel(); }}
                className={`px-3 py-1 rounded-lg transition-colors text-sm font-medium ${
                  voiceOutput ? 'bg-green-500/40 text-green-600 border border-green-400/30' : theme === 'light' ? 'bg-gray-200 text-gray-600' : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                }`}
              >
                {voiceOutput ? '🔊 ON' : '🔇 OFF'}
              </button>
              {voiceOutput && (
                <>
                  {isSpeaking && <button onClick={() => { synthRef.current?.cancel(); setIsSpeaking(false); }} className="px-2 py-1 bg-red-500/40 text-red-200 rounded-lg text-xs animate-pulse">⏹</button>}
                  <div className="flex items-center gap-1">
                    <span className="text-xs">🐢</span>
                    <input type="range" min="0.5" max="1.5" step="0.1" value={speechRate} onChange={(e) => setSpeechRate(parseFloat(e.target.value))} className="w-16 h-1 accent-purple-400" />
                    <span className="text-xs">🐰</span>
                  </div>
                </>
              )}
            </div>
            <button onClick={handleBack} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
              theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' : 'backdrop-blur-md bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}>Reset</button>
          </div>
        </div>
        <div className={`mt-3 h-2.5 rounded-full overflow-hidden border ${theme === 'light' ? 'bg-gray-200 border-gray-300' : 'backdrop-blur-sm bg-white/10 border-white/10'}`}>
          <div className={`h-full bg-gradient-to-r ${progressColor} transition-all duration-500 rounded-full`} style={{ width: progressWidth }} />
        </div>
      </div>

      <div className={`h-[60vh] sm:h-[520px] overflow-y-auto p-4 sm:p-5 space-y-4 ${theme === 'light' ? 'bg-gray-50' : 'backdrop-blur-sm bg-white/5'}`}>
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 sm:p-4 text-sm sm:text-base ${
              msg.role === 'user'
                ? theme === 'light' ? 'bg-blue-500 text-white' : 'bg-purple-500/30 text-white border border-purple-400/30'
                : theme === 'light' ? 'bg-white border border-gray-200 text-gray-800 shadow' : 'bg-white/15 text-white border border-white/20'
            }`}>
              <div className="flex items-start gap-2">
                <div className="flex-1 whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                {msg.role === 'tutor' && typeof window !== 'undefined' && 'speechSynthesis' in window && (
                  <button onClick={() => speakText(msg.content)} disabled={isSpeaking} className={`flex-shrink-0 p-1.5 rounded-lg transition-colors disabled:opacity-50 ${theme === 'light' ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                    {isSpeaking ? '🔊' : '▶️'}
                  </button>
                )}
              </div>
              {msg.corrections && msg.corrections.length > 0 && (
                <div className="mt-3 p-3 backdrop-blur-md bg-yellow-500/20 border border-yellow-400/30 rounded-xl space-y-3">
                  <h4 className="text-sm font-semibold text-yellow-200">✏️ Corrections</h4>
                  {msg.corrections.map((c, i) => (
                    <div key={i} className={`text-sm ${i > 0 ? 'border-t border-yellow-400/20 pt-3' : ''}`}>
                      <div className="flex items-start gap-2 mb-1">
                        <span className="text-red-400 shrink-0">✗</span>
                        <span className="text-red-300 line-through">{c.wrong}</span>
                      </div>
                      <div className="flex items-start gap-2 mb-1">
                        <span className="text-green-400 shrink-0">✓</span>
                        <span className="text-green-300 font-semibold">{c.correct}</span>
                      </div>
                      {c.full_sentence && (
                        <div className="flex items-start gap-2 mb-1">
                          <span className="text-indigo-300 shrink-0">📝</span>
                          <span className="text-indigo-200 italic">&ldquo;{c.full_sentence}&rdquo;</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 mt-1">
                        <span className="text-white/40 shrink-0">💡</span>
                        <span className="text-white/60 text-xs leading-relaxed">{c.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {msg.encouragement && (
                <div className="mt-3 p-3 backdrop-blur-md bg-green-500/20 border border-green-400/30 rounded-xl">
                  <p className="text-sm text-green-200">💡 {msg.encouragement}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`rounded-2xl p-4 border ${theme === 'light' ? 'bg-white border-gray-200 shadow' : 'backdrop-blur-md bg-white/15 border-white/20'}`}>
              <div className="flex space-x-2">
                {[0, 0.2, 0.4].map((d, i) => <div key={i} className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`border-t p-3 sm:p-4 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-md bg-white/5 border-white/20'}`}>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isListening ? 'Listening...' : 'Type your message or use voice input...'}
            disabled={isLoading || isListening}
            className={`w-full sm:flex-1 px-4 sm:px-5 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:opacity-50 transition-all ${
              theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white placeholder-white/50'
            }`}
          />
          {voiceSupported && (
            <button
              onClick={toggleVoiceInput}
              disabled={isLoading}
              className={`w-full sm:w-auto px-4 py-3 rounded-2xl transition-all font-medium ${
                isListening ? 'bg-red-500/40 text-red-200 border-2 border-red-400/40 animate-pulse' : 'backdrop-blur-md bg-green-500/20 text-green-200 hover:bg-green-500/30 border-2 border-green-400/30'
              } disabled:opacity-40`}
            >
              {isListening ? '⏹' : '🎤'}
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-medium hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            Send
          </button>
        </div>
        <p className={`text-xs mt-2 ${theme === 'light' ? 'text-gray-400' : 'text-white/50'}`}>Press Enter to send</p>
      </div>
    </div>
  );
}
