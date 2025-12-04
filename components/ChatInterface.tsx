import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles, Loader2, StopCircle } from 'lucide-react';
import { FileData, Message } from '../types';
import { generateResponse } from '../services/geminiService';

interface ChatInterfaceProps {
  files: FileData[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ files }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isGenerating) return;

    if (files.length === 0) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        text: "Please upload at least one document (Source) in the sidebar to start the conversation.",
        timestamp: Date.now()
      }]);
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    const modelMessageId = crypto.randomUUID();
    // Optimistic model message
    setMessages((prev) => [...prev, {
      id: modelMessageId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isThinking: true
    }]);

    try {
      await generateResponse(userMessage.text, files, (partialText) => {
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === modelMessageId 
              ? { ...msg, text: partialText, isThinking: false } 
              : msg
          )
        );
      });
    } catch (error: any) {
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === modelMessageId 
            ? { ...msg, text: `Error: ${error.message || 'Something went wrong.'}`, isThinking: false } 
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center opacity-80">
             <div className="w-20 h-20 bg-notebook-teal/10 rounded-full flex items-center justify-center mb-6">
                <Sparkles size={40} className="text-notebook-teal" />
             </div>
             <h3 className="text-xl font-semibold text-slate-300 mb-2">Welcome to your Notebook</h3>
             <p className="max-w-md text-slate-400">
               Upload your documents on the left, then ask questions here. 
               The AI will analyze your sources and provide answers with citations.
             </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm
                ${message.role === 'user' 
                  ? 'bg-gradient-to-br from-notebook-orange to-notebook-orangeDark text-white rounded-br-none' 
                  : 'bg-notebook-surface border border-notebook-border text-slate-200 rounded-bl-none'
                }
              `}
            >
              {message.isThinking ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm font-medium">Thinking...</span>
                </div>
              ) : (
                <div className={`prose prose-sm md:prose-base max-w-none break-words prose-invert`}>
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-notebook-bg/80 backdrop-blur-sm border-t border-notebook-border">
        <div className="relative shadow-lg rounded-2xl bg-notebook-surface border border-notebook-border transition-all focus-within:ring-2 focus-within:ring-notebook-teal/50 focus-within:border-notebook-teal">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={files.length > 0 ? "Ask a question about your sources..." : "Upload files to start chatting..."}
            className="w-full max-h-40 min-h-[60px] py-4 pl-5 pr-14 rounded-2xl resize-none outline-none text-slate-200 placeholder:text-slate-500 bg-transparent"
            disabled={isGenerating && false}
            rows={1}
            style={{ minHeight: '60px' }}
          />
          <div className="absolute right-2 bottom-2.5">
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isGenerating}
              className={`
                p-2.5 rounded-xl flex items-center justify-center transition-all duration-200
                ${!input.trim() || isGenerating
                  ? 'bg-notebook-item text-slate-500 cursor-not-allowed'
                  : 'bg-notebook-teal text-black hover:bg-notebook-tealDark hover:text-white shadow-sm hover:shadow-md transform hover:-translate-y-0.5'
                }
              `}
            >
               {isGenerating ? <div className="animate-pulse"><StopCircle size={20} /></div> : <Send size={20} />}
            </button>
          </div>
        </div>
        <div className="text-center mt-3 text-xs text-slate-500">
          AI can make mistakes. Please double-check responses against your source documents.
        </div>
      </div>
    </div>
  );
};