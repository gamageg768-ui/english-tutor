'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface PDFEntry {
  filename: string;
  title: string;
  description: string;
  category: string;
  pages: number | null;
  uploaded: string;
  available: boolean;
  url: string;
}

interface ChatMsg { role: 'user' | 'assistant'; content: string; }

interface Props { theme: 'dark' | 'light'; onBack: () => void; }

const CATEGORY_COLORS: Record<string, string> = {
  Grammar:    'from-blue-500 to-indigo-600',
  Vocabulary: 'from-emerald-500 to-teal-600',
  Speaking:   'from-orange-500 to-red-500',
  Writing:    'from-purple-500 to-pink-600',
  General:    'from-gray-500 to-slate-600',
};

const SUGGESTED: string[] = [
  'Explain the main topics covered in this document.',
  'What are the key grammar rules I should remember?',
  'Give me 3 practice sentences using what I just read.',
  'What is the difference between active and passive voice?',
];

/* ─────────────────────────── Full-screen viewer ────────────────────────── */
function PDFViewer({ pdf, theme, onClose }: { pdf: PDFEntry; theme: 'dark' | 'light'; onClose: () => void }) {
  const d = theme === 'dark';
  const [aiOpen, setAiOpen]     = useState(false);
  const [mobileTab, setMobileTab] = useState<'pdf' | 'ai'>('pdf');
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: `Hi! I'm your AI study assistant for **"${pdf.title}"**. Ask me anything about this material — grammar rules, examples, explanations, or practice sentences!` },
  ]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const chatBottomRef           = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLTextAreaElement>(null);

  function authHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async (question: string) => {
    if (!question.trim() || thinking) return;
    const userMsg: ChatMsg = { role: 'user', content: question.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    // Switch to AI tab on mobile when sending
    setMobileTab('ai');

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/pdfs/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ question: question.trim(), pdfTitle: pdf.title, pdfDescription: pdf.description, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer || 'Sorry, no response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, thinking, pdf]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  /* ── shared AI panel content ── */
  const aiPanel = (
    <div className={`flex flex-col h-full ${d ? 'bg-slate-900/95' : 'bg-white'}`}>
      {/* Panel header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b shrink-0 ${d ? 'border-white/10' : 'border-gray-200'}`}>
        <span className="text-lg">🤖</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${d ? 'text-white' : 'text-gray-800'}`}>AI Assistant</p>
          <p className={`text-xs truncate ${d ? 'text-white/40' : 'text-gray-400'}`}>{pdf.title}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs shrink-0 mt-0.5 mr-2">🤖</div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-sm'
                : d ? 'bg-white/10 text-white/90 rounded-bl-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs shrink-0 mt-0.5 mr-2">🤖</div>
            <div className={`rounded-2xl rounded-bl-sm px-4 py-3 ${d ? 'bg-white/10' : 'bg-gray-100'}`}>
              <div className="flex gap-1">
                <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${d ? 'bg-white/50' : 'bg-gray-400'}`} style={{ animationDelay: '0ms' }} />
                <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${d ? 'bg-white/50' : 'bg-gray-400'}`} style={{ animationDelay: '150ms' }} />
                <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${d ? 'bg-white/50' : 'bg-gray-400'}`} style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className={`px-4 pb-2 border-t ${d ? 'border-white/10' : 'border-gray-100'}`}>
          <p className={`text-xs py-2 ${d ? 'text-white/40' : 'text-gray-400'}`}>Try asking:</p>
          <div className="flex flex-col gap-1.5">
            {SUGGESTED.map((q, i) => (
              <button key={i} onClick={() => send(q)} className={`text-left text-xs px-3 py-2 rounded-xl transition-colors ${d ? 'bg-white/8 text-white/70 hover:bg-white/15' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className={`px-3 py-3 border-t shrink-0 ${d ? 'border-white/10' : 'border-gray-200'}`}>
        <div className={`flex gap-2 items-end rounded-2xl border px-3 py-2 ${d ? 'bg-white/8 border-white/15' : 'bg-gray-50 border-gray-200'}`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything about this PDF…"
            rows={1}
            className={`flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed max-h-28 ${d ? 'text-white placeholder-white/40' : 'text-gray-800 placeholder-gray-400'}`}
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || thinking}
            className="w-8 h-8 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
          >
            ↑
          </button>
        </div>
        <p className={`text-center text-[10px] mt-1.5 ${d ? 'text-white/25' : 'text-gray-300'}`}>Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${d ? 'bg-slate-950' : 'bg-gray-50'}`}>

      {/* ── Top bar ── */}
      <div className={`flex items-center gap-2 px-3 sm:px-4 h-12 border-b shrink-0 ${d ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200'}`}>
        <button
          onClick={onClose}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${d ? 'border-white/15 text-white/70 hover:bg-white/10' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
        >
          ← Library
        </button>
        <div className="flex-1 min-w-0 px-2">
          <p className={`font-bold text-sm truncate ${d ? 'text-white' : 'text-gray-800'}`}>{pdf.title}</p>
        </div>
        {/* Mobile tab switcher */}
        <div className={`flex sm:hidden rounded-xl overflow-hidden border text-xs font-semibold ${d ? 'border-white/15' : 'border-gray-200'}`}>
          {(['pdf', 'ai'] as const).map(tab => (
            <button key={tab} onClick={() => setMobileTab(tab)} className={`px-3 py-1.5 transition-colors ${mobileTab === tab ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : d ? 'bg-white/5 text-white/60' : 'bg-white text-gray-500'}`}>
              {tab === 'pdf' ? '📄 PDF' : '🤖 AI'}
            </button>
          ))}
        </div>
        {/* Desktop: AI toggle + download */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => setAiOpen(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors ${
              aiOpen
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent'
                : d ? 'border-white/15 text-white/70 hover:bg-white/10' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            🤖 AI Assistant
          </button>
          {pdf.available && (
            <a href={pdf.url} download className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-transparent">
              ⬇ Download
            </a>
          )}
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* PDF panel — hidden on mobile when AI tab active */}
        <div className={`${mobileTab === 'ai' ? 'hidden' : 'flex'} sm:flex flex-col ${aiOpen ? 'sm:flex-[3]' : 'sm:flex-1'} transition-all duration-300 overflow-hidden`}>
          {pdf.available ? (
            <iframe
              src={`${pdf.url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
              className="w-full h-full"
              title={pdf.title}
              style={{ border: 'none' }}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="text-6xl">📄</div>
              <p className={`text-lg font-semibold ${d ? 'text-white' : 'text-gray-800'}`}>File not available</p>
              <p className={`text-sm ${d ? 'text-white/50' : 'text-gray-500'}`}>Place <code>{pdf.filename}</code> in <code>public/pdfs/</code></p>
            </div>
          )}
        </div>

        {/* Divider — desktop only */}
        {aiOpen && (
          <div className={`hidden sm:block w-px shrink-0 ${d ? 'bg-white/10' : 'bg-gray-200'}`} />
        )}

        {/* AI panel — desktop always when aiOpen; mobile when ai tab */}
        {(aiOpen || mobileTab === 'ai') && (
          <div className={`${mobileTab === 'pdf' ? 'hidden' : 'flex'} sm:flex flex-col sm:w-[380px] sm:shrink-0 overflow-hidden`}>
            {aiPanel}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Library grid ───────────────────────────────── */
export default function PDFLibrary({ theme, onBack }: Props) {
  const [pdfs, setPdfs]               = useState<PDFEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [viewing, setViewing]         = useState<PDFEntry | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [showUpload, setShowUpload]   = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc]   = useState('');
  const [uploadCat, setUploadCat]     = useState('General');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError]             = useState('');
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const d = theme === 'dark';
  const card = `rounded-3xl shadow-xl border ${d ? 'backdrop-blur-xl bg-white/10 border-white/20' : 'bg-white border-gray-200'}`;

  function authHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  const loadPDFs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pdfs', { headers: authHeaders() });
      const data = await res.json();
      setPdfs(data.pdfs || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPDFs(); }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('title', uploadTitle || selectedFile.name.replace(/\.pdf$/i, '').replace(/_/g, ' '));
      fd.append('description', uploadDesc);
      fd.append('category', uploadCat);
      const res = await fetch('/api/pdfs/upload', { method: 'POST', headers: authHeaders(), body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');
      setShowUpload(false); setSelectedFile(null); setUploadTitle(''); setUploadDesc(''); setUploadCat('General');
      loadPDFs();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm('Remove this PDF from the library?')) return;
    try {
      await fetch('/api/pdfs', { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ filename }) });
      loadPDFs();
    } catch { /* ignore */ }
  };

  /* Full-screen viewer overlay */
  if (viewing) return <PDFViewer pdf={viewing} theme={theme} onClose={() => setViewing(null)} />;

  return (
    <div className="max-w-6xl mx-auto">
      <div className={`${card} p-6 sm:p-8`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">PDF Library</h2>
            <p className={`mt-1 ${d ? 'text-white/70' : 'text-gray-500'}`}>{pdfs.length} study material{pdfs.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowUpload(s => !s)} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
              + Upload PDF
            </button>
            <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border text-sm ${d ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
              ← Back
            </button>
          </div>
        </div>

        {/* Upload panel */}
        {showUpload && (
          <div className={`mb-8 rounded-2xl p-5 border ${d ? 'bg-white/5 border-white/15' : 'bg-blue-50 border-blue-200'}`}>
            <h3 className={`font-bold mb-4 ${d ? 'text-white' : 'text-gray-800'}`}>Upload New PDF</h3>
            <div className="space-y-3">
              <div onClick={() => fileInputRef.current?.click()} className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${d ? 'border-white/20 hover:border-purple-400 text-white/60' : 'border-gray-300 hover:border-blue-400 text-gray-500'}`}>
                {selectedFile ? <p className={`font-medium ${d ? 'text-white' : 'text-gray-800'}`}>📄 {selectedFile.name}</p> : <><p className="text-3xl mb-2">📤</p><p className="text-sm">Click to choose a PDF file</p></>}
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              <input type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Title (optional)" className={`w-full px-4 py-2.5 rounded-xl border text-sm ${d ? 'bg-white/10 border-white/20 text-white placeholder-white/40' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`} />
              <input type="text" value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} placeholder="Description (optional)" className={`w-full px-4 py-2.5 rounded-xl border text-sm ${d ? 'bg-white/10 border-white/20 text-white placeholder-white/40' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`} />
              <select value={uploadCat} onChange={e => setUploadCat(e.target.value)} className={`w-full px-4 py-2.5 rounded-xl border text-sm ${d ? 'bg-slate-800 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-800'}`}>
                {['General', 'Grammar', 'Vocabulary', 'Speaking', 'Writing'].map(c => <option key={c}>{c}</option>)}
              </select>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button onClick={handleUpload} disabled={!selectedFile || uploading} className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white disabled:opacity-50">
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
                <button onClick={() => { setShowUpload(false); setSelectedFile(null); setError(''); }} className={`px-5 py-2.5 rounded-xl font-semibold text-sm border ${d ? 'border-white/20 text-white/70 hover:bg-white/10' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-400" />
            <p className={`mt-4 ${d ? 'text-white/70' : 'text-gray-500'}`}>Loading library…</p>
          </div>
        ) : pdfs.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl border ${d ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
            <div className="text-6xl mb-4">📚</div>
            <p className={`text-xl font-bold mb-2 ${d ? 'text-white' : 'text-gray-800'}`}>No PDFs yet</p>
            <p className={`text-sm ${d ? 'text-white/60' : 'text-gray-500'}`}>Upload study materials using the button above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pdfs.map(pdf => {
              const gradient = CATEGORY_COLORS[pdf.category] || CATEGORY_COLORS.General;
              return (
                <div key={pdf.filename} className={`group relative flex flex-col rounded-2xl border overflow-hidden transition-all hover:scale-[1.01] ${d ? 'bg-white/8 border-white/15 hover:bg-white/12' : 'bg-gray-50 border-gray-200 hover:bg-white hover:shadow-md'}`}>
                  <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${gradient} shadow-md`}>📄</div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {pdf.available && <a href={pdf.url} download className={`p-1.5 rounded-lg text-xs ${d ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`} title="Download">⬇</a>}
                        <button onClick={() => handleDelete(pdf.filename)} className="p-1.5 rounded-lg text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30" title="Remove">✕</button>
                      </div>
                    </div>
                    <h3 className={`font-bold text-sm leading-snug mb-1.5 line-clamp-2 ${d ? 'text-white' : 'text-gray-800'}`}>{pdf.title}</h3>
                    {pdf.description && <p className={`text-xs line-clamp-2 mb-3 ${d ? 'text-white/60' : 'text-gray-500'}`}>{pdf.description}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-gradient-to-r ${gradient} text-white`}>{pdf.category}</span>
                      {pdf.pages && <span className={`text-xs ${d ? 'text-white/40' : 'text-gray-400'}`}>{pdf.pages} pages</span>}
                      {!pdf.available && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-medium">File missing</span>}
                    </div>
                  </div>
                  <div className={`px-5 py-3 border-t ${d ? 'border-white/10' : 'border-gray-100'}`}>
                    <button
                      onClick={() => setViewing(pdf)}
                      className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors ${pdf.available ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : d ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                      {pdf.available ? '📖 Open & Study' : 'Add File to public/pdfs/'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
