import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Trash2, 
  BrainCircuit, 
  Bot, 
  User,
  Compass,
  AlertCircle
} from 'lucide-react';
import Card from '../components/Card';

// Clean, custom React Markdown Parser helper
const MarkdownContent = ({ content }) => {
  const parseMarkdown = (text) => {
    if (!text) return [];
    
    // Split by blocks: code blocks or regular text
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, i) => {
      // Code Block
      if (part.startsWith('```')) {
        const lines = part.split('\n');
        const language = lines[0].replace('```', '').trim() || 'code';
        const code = lines.slice(1, -1).join('\n');
        return (
          <pre key={i} className="my-3 p-4 bg-zinc-950 rounded-lg border border-zinc-850 text-xs text-indigo-300 font-mono overflow-x-auto">
            <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-2 pb-1 border-b border-zinc-900">
              <span>{language}</span>
            </div>
            <code>{code}</code>
          </pre>
        );
      }
      
      // Line break splits
      const lines = part.split('\n');
      return lines.map((line, j) => {
        let trimmed = line.trim();
        
        // Headers
        if (trimmed.startsWith('### ')) {
          return <h4 key={`${i}-${j}`} className="text-sm font-bold text-zinc-100 mt-4 mb-2">{trimmed.substring(4)}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={`${i}-${j}`} className="text-base font-semibold text-zinc-100 mt-4 mb-2">{trimmed.substring(3)}</h3>;
        }
        if (trimmed.startsWith('# ')) {
          return <h2 key={`${i}-${j}`} className="text-lg font-bold text-zinc-100 mt-4 mb-2">{trimmed.substring(2)}</h2>;
        }

        // Unordered Lists
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <ul key={`${i}-${j}`} className="list-disc pl-5 my-1 text-zinc-300 text-sm">
              <li>{parseInlineMarkdown(trimmed.substring(2))}</li>
            </ul>
          );
        }

        // Ordered Lists
        if (/^\d+\.\s/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\.\s(.*)/);
          return (
            <ol key={`${i}-${j}`} className="list-decimal pl-5 my-1 text-zinc-300 text-sm">
              <li value={match[1]}>{parseInlineMarkdown(match[2])}</li>
            </ol>
          );
        }

        // Normal paragraph with potential inline tags
        if (trimmed === '') {
          return <div key={`${i}-${j}`} className="h-2" />;
        }
        
        return <p key={`${i}-${j}`} className="text-sm text-zinc-300 my-1 leading-relaxed">{parseInlineMarkdown(line)}</p>;
      });
    });
  };

  const parseInlineMarkdown = (lineText) => {
    // Bold: **text** or __text__
    const parts = lineText.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, k) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={k} className="font-semibold text-zinc-100">{part.slice(2, -2)}</strong>;
      }
      // Inline Code: `code`
      const inlineCodeParts = part.split(/(`.*?`)/g);
      return inlineCodeParts.map((subPart, m) => {
        if (subPart.startsWith('`') && subPart.endsWith('`')) {
          return <code key={`${k}-${m}`} className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-indigo-400 font-mono">{subPart.slice(1, -1)}</code>;
        }
        return subPart;
      });
    });
  };

  return <div className="space-y-1">{parseMarkdown(content)}</div>;
};

const Chatbot = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSessionId = searchParams.get('session');
  
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);

  // Load chat sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch session messages when active ID changes
  useEffect(() => {
    if (activeSessionId) {
      fetchSessionMessages(activeSessionId);
    } else {
      setActiveSession(null);
    }
  }, [activeSessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isSending]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const res = await api.get('/chat/sessions');
      if (res.data.success) {
        setSessions(res.data.sessions);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const fetchSessionMessages = async (id) => {
    try {
      const res = await api.get(`/chat/sessions/${id}`);
      if (res.data.success) {
        setActiveSession(res.data.session);
      }
    } catch (err) {
      console.error('Error fetching session messages:', err);
      // Remove stale session searchParam
      setSearchParams({});
    }
  };

  const handleCreateSession = async () => {
    try {
      const res = await api.post('/chat/sessions', { title: 'New Guidance Chat' });
      if (res.data.success) {
        setSessions([res.data.session, ...sessions]);
        setSearchParams({ session: res.data.session._id });
        setSidebarOpen(false);
      }
    } catch (err) {
      console.error('Error creating session:', err);
    }
  };

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Delete this conversation?')) return;

    try {
      const res = await api.delete(`/chat/sessions/${id}`);
      if (res.data.success) {
        setSessions(sessions.filter(s => s._id !== id));
        if (activeSessionId === id) {
          setSearchParams({});
        }
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending || !activeSessionId) return;

    const messageToSend = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    // Append message to UI temporarily
    setActiveSession(prev => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content: messageToSend, timestamp: new Date() }]
    }));

    try {
      const res = await api.post(`/chat/sessions/${activeSessionId}/message`, { message: messageToSend });
      if (res.data.success) {
        setActiveSession(res.data.session);
        // Refresh sidebar names (since title updates on first message)
        fetchSessions();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setActiveSession(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          { role: 'assistant', content: '⚠️ Sorry, there was an issue communicating with the AI. Please verify your connection and try again.', timestamp: new Date() }
        ]
      }));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden relative bg-zinc-950">
      
      {/* Sidebar: Chat History */}
      <div
        className={`fixed inset-y-16 left-0 z-40 w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col transform transition-transform duration-300 md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="font-semibold text-zinc-400 text-xs tracking-wider uppercase">Conversations</span>
          <button
            onClick={handleCreateSession}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-100 bg-zinc-905 border border-zinc-800 hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Sidebar Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-zinc-600 italic text-center py-8">No chats created yet</p>
          ) : (
            sessions.map((s) => {
              const active = s._id === activeSessionId;
              return (
                <div
                  key={s._id}
                  onClick={() => {
                    setSearchParams({ session: s._id });
                    setSidebarOpen(false);
                  }}
                  className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${
                    active 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className={`h-4 w-4 shrink-0 ${active ? 'text-indigo-400' : 'text-zinc-500'}`} />
                    <span className="text-xs font-medium truncate">{s.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, s._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-zinc-200 transition-all cursor-pointer"
                    title="Delete Chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Active Context Box */}
        {user?.profile?.careerGoal && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/10">
            <div className="flex gap-2 items-start text-zinc-500">
              <BrainCircuit className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Active Profile Context</p>
                <p className="text-xs text-zinc-300 mt-1 font-semibold truncate max-w-[200px]" title={user.profile.careerGoal}>
                  {user.profile.careerGoal}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {user.profile.skills?.length || 0} skills injected
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col bg-zinc-950 relative overflow-hidden">
        {/* Toggle mobile sidebar */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex md:hidden items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 bg-zinc-900 border border-zinc-850"
          >
            <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
            <span>Chat Menu</span>
          </button>
          {activeSession && (
            <span className="text-xs text-zinc-400 font-medium truncate max-w-[180px]">{activeSession.title}</span>
          )}
        </div>

        {activeSession ? (
          <>
            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto py-6 space-y-0">
              {activeSession.messages.filter(m => m.role !== 'system').map((msg, index) => {
                const isBot = msg.role === 'assistant';
                return (
                  <div 
                    key={index} 
                    className={`w-full py-6 border-b border-zinc-900/60 ${
                      isBot ? 'bg-zinc-900/30' : 'bg-transparent'
                    }`}
                  >
                    <div className="max-w-3xl mx-auto px-4 flex gap-4">
                      {/* Avatar */}
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isBot 
                          ? 'bg-zinc-900 border-zinc-800 text-indigo-400' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}>
                        {isBot ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                      </div>

                      {/* Chat Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                            {isBot ? 'Compass AI' : 'You'}
                          </span>
                          <span className="text-[9px] text-zinc-650 font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-zinc-200 mt-2">
                          <MarkdownContent content={msg.content} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bot typing effect */}
              {isSending && (
                <div className="w-full py-6 bg-zinc-900/30 border-b border-zinc-900/60">
                  <div className="max-w-3xl mx-auto px-4 flex gap-4">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-zinc-900 border border-zinc-800 text-indigo-400 shrink-0">
                      <Bot className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 flex items-center gap-1.5 py-2">
                      <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-900">
              <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
                <div className="relative flex items-center bg-zinc-900 border border-zinc-800 focus-within:border-zinc-700 rounded-lg py-1 px-1">
                  <input
                    type="text"
                    required
                    disabled={isSending}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="w-full bg-transparent border-0 focus:ring-0 text-zinc-100 text-sm py-2 px-3 focus:outline-none placeholder:text-zinc-600 pr-12"
                    placeholder="Ask for interview prep, skill resources, or career switches..."
                  />
                  <button
                    type="submit"
                    disabled={isSending || !inputMessage.trim()}
                    className="absolute right-2 p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          /* Onboarding Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
            <Compass className="h-12 w-12 text-zinc-700 mb-4" />
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">AI Career Advisor</h2>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Consult Career Compass AI for interactive guidance. We inject your active profile background (skills, goal, and degree) so the counselor delivers custom action-plans.
            </p>
            {sessions.length > 0 ? (
              <p className="text-xs text-zinc-600 italic">Select an existing conversation from the side menu or create a new session above.</p>
            ) : (
              <button
                onClick={handleCreateSession}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-zinc-50 hover:text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Initialize Advising Session</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
