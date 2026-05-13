'use client';

import { useState } from 'react';
import { generateCustomSituation, saveCustomSituation } from '@/lib/api-client';

interface Situation { id: number | string; title: string; domain: string; module: string; level: string; role: string; context?: string; description?: string; is_custom?: boolean; }
interface Props { theme: 'dark' | 'light'; onBack: () => void; onSituationCreated: (s: Situation) => void; }

export default function CreateSituation({ theme, onBack, onSituationCreated }: Props) {
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('B1');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<Situation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) { setError('Please enter a description'); return; }
    setLoading(true); setError(null);
    try {
      const res = await generateCustomSituation(description, level) as { success: boolean; situation: Situation; error?: string };
      if (!res.success || !res.situation) {
        setError(res.error || 'AI returned no result. Please try again.');
      } else {
        setGenerated(res.situation);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error. Please check your connection and try again.');
    }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!generated) return;
    setLoading(true); setError(null);
    try {
      const res = await saveCustomSituation(generated) as { success: boolean; situation: Situation };
      onSituationCreated(res.situation);
    } catch { setError('Failed to save.'); setLoading(false); }
  };

  const card = `rounded-3xl shadow-2xl border p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;
  const inputCls = `w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800 placeholder-gray-400' : 'backdrop-blur-md bg-white/10 border-white/20 text-white placeholder-white/50'}`;

  if (generated) return (
    <div className="max-w-4xl mx-auto">
      <div className={card}>
        <button onClick={() => { setGenerated(null); setDescription(''); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-medium border transition-all mb-6 ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>← Create Another</button>
        <div className={`rounded-3xl p-6 mb-6 border-2 ${theme === 'light' ? 'bg-green-50 border-green-200' : 'backdrop-blur-md bg-gradient-to-br from-green-500/20 to-blue-500/20 border-green-400/30'}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{generated.title}</h2>
              <div className="flex gap-2 mt-3">
                <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold rounded-full">{generated.level}</span>
                <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold rounded-full">Custom</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`rounded-2xl p-4 ${theme === 'light' ? 'bg-white border border-gray-200' : 'backdrop-blur-sm bg-white/10 border border-white/20'}`}>
              <p className={`text-xs font-semibold mb-1 ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>Domain</p>
              <p className={`font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{generated.domain}</p>
            </div>
            <div className={`rounded-2xl p-4 ${theme === 'light' ? 'bg-white border border-gray-200' : 'backdrop-blur-sm bg-white/10 border border-white/20'}`}>
              <p className={`text-xs font-semibold mb-1 ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>Role</p>
              <p className={`font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{generated.role}</p>
            </div>
          </div>
          <div className={`rounded-2xl p-4 ${theme === 'light' ? 'bg-white border border-gray-200' : 'backdrop-blur-sm bg-white/10 border border-white/20'}`}>
            <p className={`text-xs font-semibold mb-2 ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>Context</p>
            <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-white/90'}`}>{generated.context || generated.description}</p>
          </div>
        </div>
        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-2xl text-red-200 text-sm">{error}</div>}
        <div className="flex gap-4">
          <button onClick={handleSave} disabled={loading} className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-bold hover:shadow-lg disabled:opacity-60 transition-all transform hover:scale-105">
            {loading ? 'Saving...' : '✅ Save & Start Practice'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className={card}>
        <button onClick={onBack} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-medium border transition-all mb-8 ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>← Back</button>
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 mb-3">Create Custom Situation</h2>
          <p className={`${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>Describe any scenario and AI will create a practice situation for you</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-semibold mb-3 ${theme === 'light' ? 'text-gray-700' : 'text-white/80'}`}>Describe your situation</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g., I want to practice negotiating a salary raise with my manager, or ordering food at a fancy restaurant in London..."
              rows={5}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div>
            <label className={`block text-sm font-semibold mb-3 ${theme === 'light' ? 'text-gray-700' : 'text-white/80'}`}>Your English Level</label>
            <div className="grid grid-cols-6 gap-3">
              {['A1','A2','B1','B2','C1','C2'].map(l => (
                <button key={l} onClick={() => setLevel(l)} className={`py-3 rounded-2xl font-bold transition-all ${level === l ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : theme === 'light' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'backdrop-blur-md bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'}`}>{l}</button>
              ))}
            </div>
          </div>

          {error && <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-2xl text-red-200 text-sm">{error}</div>}

          <button onClick={handleGenerate} disabled={loading || !description.trim()} className="w-full py-5 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white rounded-3xl font-bold text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]">
            {loading ? '✨ Generating with AI...' : '✨ Generate Situation with AI'}
          </button>

          <div className={`rounded-3xl p-6 border-l-4 border-blue-400 ${theme === 'light' ? 'bg-blue-50' : 'backdrop-blur-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20'}`}>
            <h3 className="font-bold text-blue-300 mb-3">💡 Example Situations:</h3>
            <ul className={`space-y-2 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-white/90'}`}>
              {['Asking for directions in a foreign city','Having a job interview at a tech company','Discussing a project deadline with a difficult client','Returning a faulty product to a store'].map(ex => (
                <li key={ex} className="flex items-start gap-2">
                  <span className="text-blue-300">•</span>
                  <button onClick={() => setDescription(ex)} className="text-left hover:text-blue-300 transition-colors">{ex}</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
