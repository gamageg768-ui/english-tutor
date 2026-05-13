'use client';

import { useState, useEffect } from 'react';
import { getConversations, getConversation } from '@/lib/api-client';

interface Conv { id: number; situation_id: number; situation_title: string; created_at: string; completed: boolean; message_count?: number; }
interface Props { theme: 'dark' | 'light'; onBack: () => void; }

export default function ConversationHistory({ theme, onBack }: Props) {
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [selected, setSelected] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getConversations() as { success: boolean; conversations: Conv[] };
        setConversations(res.conversations || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const loadDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await getConversation(id) as { success: boolean; conversation: unknown };
      setSelected(res.conversation);
    } catch { /* ignore */ }
    finally { setDetailLoading(false); }
  };

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;

  if (loading) return (
    <div className="max-w-5xl mx-auto text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400" />
      <p className={`mt-4 text-lg ${theme === 'light' ? 'text-gray-600' : 'text-white'}`}>Loading history...</p>
    </div>
  );

  const conv = selected as { situation_title?: string; created_at?: string; completed?: boolean; messages?: { role: string; content: string; corrections?: { wrong: string; correct: string; reason: string }[] }[]; corrections?: unknown[] } | null;

  if (conv) return (
    <div className="max-w-4xl mx-auto">
      <div className={card}>
        <button onClick={() => setSelected(null)} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-medium border transition-all mb-6 ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>← Back to History</button>
        <h2 className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{conv.situation_title}</h2>
        <p className={`text-sm mb-6 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>{conv.created_at ? new Date(conv.created_at).toLocaleString() : ''} • {conv.completed ? '✅ Completed' : '⏸ In Progress'}</p>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {(conv.messages || []).map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${m.role === 'user' ? theme === 'light' ? 'bg-blue-500 text-white' : 'bg-purple-500/30 text-white border border-purple-400/30' : theme === 'light' ? 'bg-gray-100 text-gray-800 border border-gray-200' : 'bg-white/15 text-white border border-white/20'}`}>
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.corrections && m.corrections.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-yellow-400/30">
                    {m.corrections.map((c, j) => <div key={j} className="text-xs mt-1"><span className="line-through text-red-300">{c.wrong}</span> → <span className="text-green-300">{c.correct}</span></div>)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className={card}>
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Conversation History</h2>
            <p className={`mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>{conversations.length} conversations recorded</p>
          </div>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>← Back</button>
        </div>

        {conversations.length === 0 ? (
          <div className={`text-center py-16 rounded-3xl border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/5 border-white/10'}`}>
            <div className="text-7xl mb-6">📋</div>
            <h3 className={`text-2xl font-bold mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>No conversations yet</h3>
            <p className={theme === 'light' ? 'text-gray-500' : 'text-white/70'}>Start practicing to see your conversation history here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map(c => (
              <div key={c.id} onClick={() => loadDetail(c.id)} className={`rounded-2xl p-5 border cursor-pointer transition-all hover:shadow-lg ${theme === 'light' ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/20'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-bold text-lg ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{c.situation_title}</h3>
                    <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>{new Date(c.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${c.completed ? 'bg-green-500/30 text-green-300 border border-green-400/30' : 'bg-yellow-500/30 text-yellow-300 border border-yellow-400/30'}`}>{c.completed ? '✅ Complete' : '⏸ Ongoing'}</span>
                    {detailLoading && <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-purple-400" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
