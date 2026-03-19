import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function Chatbot({ results, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'I am your personal stress support assistant. Ask me about today, this week, your work stress pattern, or what your emotional changes may mean in simple English.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const endRef = useRef(null);
  const ipc = typeof window !== 'undefined' && window.require
    ? window.require('electron').ipcRenderer
    : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      try {
        if (ipc) {
          const data = await ipc.invoke('load-results');
          if (active) setAnalysisHistory(Array.isArray(data) ? data.slice(0, 20) : []);
          return;
        }

        const res = await axios.get('/history?limit=20');
        if (active) setAnalysisHistory(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (active) setAnalysisHistory([]);
      }
    };

    loadHistory();
    return () => {
      active = false;
    };
  }, [ipc, results]);

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const history = updated
        .filter((m, i) => i > 0)
        .slice(-10);

      const res = await axios.post('/chat', {
        message: userMsg.content,
        context: results || {},
        history,
        analysis_history: analysisHistory,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply || 'No response.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Communication error — unable to reach neural core.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 flex flex-col animate-fade-up shadow-2xl shadow-primary/10" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
      <div className="bg-surface-base border border-border-subtle rounded-2xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface-raised/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">AI Counselor</span>
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Personal Stress AI</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: '420px' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-bg-base font-medium'
                    : 'bg-surface-raised border border-border-subtle text-text-secondary'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-raised border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-text-muted flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                <span>Thinking through your recent pattern...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-surface-raised/30 border-t border-border-subtle">
          <div className="flex items-center gap-3 bg-surface-base border border-border-subtle rounded-xl px-4 py-2.5 transition-all focus-within:border-primary/50 group">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about stress trends, today, this week, or what to do next..."
              className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted/50 outline-none"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="text-primary disabled:opacity-20 hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
