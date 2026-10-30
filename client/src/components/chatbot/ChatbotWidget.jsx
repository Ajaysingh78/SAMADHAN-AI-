import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';

export function ChatbotWidget() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('samadhan_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [
      {
        id: 'welcome-1',
        sender: 'bot',
        text: isAuthenticated
          ? `Namaste **${user?.fullName || user?.username || 'Officer'}**! 🛡️\n\nI am your **SamadhanX Copilot**. How can I help you today?\n* Enter any Case ID (e.g. \`CMP-2026-PGRC-0010\`) for an instant operational dossier\n* Ask for **overdue cases** across your bureau scope\n* Review **cross-bureau match alerts** and potential overlaps`
          : `Namaste! 🙏 Welcome to **AICTE Samadhan Sahayak**.\n\nI can help you:\n* 🔍 **Track your complaint status** (type e.g. \`CMP-2026-PGRC-0010\`)\n* 💰 Check **AICTE Fee Refund Directives** & deduction limits\n* 🛡️ Access **Anti-Ragging** emergency guidelines\n* 📜 Understand rules on **Certificate Retention**`,
        suggestions: isAuthenticated
          ? ['Show Overdue Cases', 'Check Match Intelligence', 'Track CMP-2026-PGRC-0010', 'Show Bureau Workload']
          : ['Track CMP-2026-PGRC-0010', 'AICTE Fee Refund Rules', 'Anti-Ragging Guidelines', 'How to File a Complaint?'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync messages to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem('samadhan_chat_history', JSON.stringify(messages));
    } catch {
      // Ignore quota errors
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isThinking]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isThinking) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await apiClient.post('/chatbot/query', {
        message: query,
        history: messages.slice(-6).map(m => ({ role: m.sender, content: m.text }))
      });

      if (response?.success && response?.data) {
        const { answer, suggestions, intent, metadata } = response.data;
        const botMsg = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: answer,
          suggestions: Array.isArray(suggestions) ? suggestions : [],
          intent,
          metadata,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error(response?.error?.message || 'Failed to receive response');
      }
    } catch (err) {
      console.warn('[ChatbotWidget] Query error:', err);
      const errorMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `⚠️ **Notice:** Could not connect to assistant service. Please verify your connection or try again shortly.`,
        suggestions: isAuthenticated
          ? ['Show Overdue Cases', 'Track CMP-2026-PGRC-0010']
          : ['Track CMP-2026-PGRC-0010', 'AICTE Fee Refund Rules'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearChat = () => {
    const freshWelcome = {
      id: `welcome-${Date.now()}`,
      sender: 'bot',
      text: isAuthenticated
        ? `Chat cleared. Ready for your next query, **${user?.fullName || 'Officer'}**!`
        : `Chat cleared. How can AICTE Samadhan Sahayak assist you today?`,
      suggestions: isAuthenticated
        ? ['Show Overdue Cases', 'Check Match Intelligence', 'Track CMP-2026-PGRC-0010']
        : ['Track CMP-2026-PGRC-0010', 'AICTE Fee Refund Rules', 'Anti-Ragging Guidelines'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([freshWelcome]);
  };

  /**
   * Lightweight Markdown-like renderer for bot responses
   */
  const renderFormattedText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Headings (###)
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-semibold text-slate-900 text-sm mt-2 mb-1 flex items-center gap-1.5">
            {line.replace('### ', '')}
          </h4>
        );
      }

      // Bullet points (* or -)
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const content = line.substring(2);
        return (
          <div key={idx} className="flex items-start gap-1.5 my-0.5 text-xs text-slate-700 leading-relaxed">
            <span className="text-primary-600 font-bold">•</span>
            <span>{parseInlineFormatting(content)}</span>
          </div>
        );
      }

      // Standard text or empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className="text-xs text-slate-700 leading-relaxed my-0.5">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  /**
   * Parse inline bold (**bold**), code (`code`), and clickable Case IDs
   */
  const parseInlineFormatting = (str) => {
    const parts = [];
    // Regex splits by `code` or **bold** or Case ID
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|CMP-\d{4}-[A-Za-z0-9]+-\d{2,6})/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }

      const token = match[0];
      if (token.startsWith('`') && token.endsWith('`')) {
        const val = token.slice(1, -1);
        const isCaseId = /^CMP-\d{4}/i.test(val);
        parts.push(
          <button
            key={match.index}
            type="button"
            onClick={() => {
              if (isCaseId && isAuthenticated) {
                // Navigate to complaint detail if logged in
                navigate(`/app/complaints?search=${encodeURIComponent(val)}`);
              } else if (isCaseId) {
                handleSend(`Track ${val}`);
              }
            }}
            title={isCaseId && isAuthenticated ? 'Click to search this case' : 'Click to query'}
            className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 hover:bg-primary-50 text-primary-700 border border-slate-200 px-1 py-0.5 rounded transition-colors"
          >
            {val}
            {isCaseId && isAuthenticated && <ExternalLink className="w-2.5 h-2.5 text-primary-500" />}
          </button>
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-semibold text-slate-900">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (/^CMP-\d{4}/i.test(token)) {
        parts.push(
          <button
            key={match.index}
            type="button"
            onClick={() => handleSend(`Track ${token}`)}
            className="font-mono font-medium text-primary-600 underline hover:text-primary-800"
          >
            {token}
          </button>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 select-none font-sans print:hidden">
      {/* 1. Chat Window */}
      {isOpen && (
        <div className="flex flex-col w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-primary-900 to-slate-800 text-white px-4 py-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-primary-600/40 border border-white/20 flex items-center justify-center text-white backdrop-blur-sm shadow-inner">
                  <Bot className="w-5 h-5 text-amber-400" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight text-white">Samadhan Sahayak</h3>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                    AI 2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1">
                  {isAuthenticated ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Officer Copilot ({user?.role?.replace('_', ' ') || 'Authorized'})</span>
                    </>
                  ) : (
                    <span>AICTE Citizen Grievance Assistant</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize assistant"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end gap-1.5 max-w-[88%]">
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-lg bg-primary-100 text-primary-800 flex items-center justify-center shrink-0 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-primary-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    ) : (
                      renderFormattedText(msg.text)
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mb-1">
                      <UserIcon className="w-3.5 h-3.5 text-slate-200" />
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>

                {/* Suggestions Chips (Attached to latest bot messages) */}
                {msg.sender === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-7 max-w-[90%]">
                    {msg.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleSend(sug)}
                        className="text-[11px] bg-white hover:bg-primary-50 text-primary-700 hover:text-primary-800 border border-primary-200/80 hover:border-primary-300 font-medium px-2.5 py-1 rounded-full transition-all shadow-xs active:scale-95 text-left"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <div className="w-6 h-6 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-2 rounded-2xl rounded-bl-none shadow-xs">
                  <span className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isAuthenticated
                    ? "Enter Case ID (e.g. CMP-2026-PGRC-0010) or ask..."
                    : "Track Case ID or ask AICTE norms..."
                }
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isThinking}
                className="p-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 text-white rounded-xl transition-all shadow-sm active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>Zero-Hallucination Deterministic Engine</span>
              <span>Gov-Grade AI</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-primary-600 via-primary-700 to-slate-900 text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20"
        aria-label="Toggle AICTE Samadhan Sahayak Assistant"
      >
        <span className="relative flex items-center justify-center">
          {isOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <>
              <MessageSquare className="w-5 h-5 text-amber-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            </>
          )}
        </span>
        <span className="font-semibold text-xs tracking-tight">
          {isOpen ? 'Close Sahayak' : isAuthenticated ? 'AI Copilot' : 'Samadhan Sahayak'}
        </span>
      </button>
    </div>
  );
}

export default ChatbotWidget;
