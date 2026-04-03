import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Volume2, RefreshCw, Copy, Sparkles } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';
import { ModelIndicator } from './ModelIndicator';
import { useChat } from '../context/ChatContext';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export const ChatInterface = () => {
  const { activeProjectId } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load History when Active Project Changes
  useEffect(() => {
      const loadHistory = async () => {
          setIsLoading(true);
          try {
              const res = await fetch(`http://localhost:8000/chat/${activeProjectId}`);
              if (res.ok) {
                  const history = await res.json();
                  const formattedMsgs = history.reverse().map((h: any) => ({
                      id: h.id, 
                      role: h.role, 
                      content: h.content 
                  }));
                  
                  if (formattedMsgs.length === 0) {
                      setMessages([{ 
                        id: Date.now(), 
                        role: 'assistant', 
                        content: `¡Hola! Conectado al proyecto **${activeProjectId}**. ¿En qué trabajamos hoy?` 
                      }]);
                  } else {
                      setMessages(formattedMsgs);
                  }
              }
          } catch (e) {
              console.error(e);
          } finally {
              setIsLoading(false);
          }
      };
      loadHistory();
  }, [activeProjectId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;
    
    const userMsgId = Date.now();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: text }]);
    setInput('');
    setIsLoading(true);

    try {
        const response = await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, project_id: activeProjectId })
        });
        
        if (!response.ok) throw new Error('Error en servidor');
        
        const data = await response.json();
        setMessages(prev => [...prev, { 
            id: Date.now() + 1, 
            role: 'assistant', 
            content: data.response 
        }]);
    } catch (error) {
        setMessages(prev => [...prev, { 
            id: Date.now() + 1, 
            role: 'assistant', 
            content: `⚠️ Error del sistema: ${error}` 
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegenerate = async (msgId: number) => {
    const msgIndex = messages.findIndex(m => m.id === msgId);
    if (msgIndex === -1) return;
    
    let userContent = "";
    for (let i = msgIndex - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
            userContent = messages[i].content;
            break;
        }
    }
    
    if (!userContent) return;

    setMessages(prev => prev.filter(m => m.id !== msgId));
    setIsLoading(true);
    
    try {
        const response = await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userContent, project_id: activeProjectId })
        });
        
        if (!response.ok) throw new Error('Error en servidor');
        
        const data = await response.json();
        setMessages(prev => [...prev, { 
            id: Date.now(), 
            role: 'assistant', 
            content: data.response 
        }]);
    } catch (error) {
        setMessages(prev => [...prev, { 
            id: Date.now(), 
            role: 'assistant', 
            content: `⚠️ Error al regenerar: ${error}` 
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice_command.webm');

      try {
          const response = await fetch('http://localhost:8000/upload/audio', {
              method: 'POST',
              body: formData
          });
          const data = await response.json();
          if (data.text) {
             setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: `🎤 ${data.text}` }]);
          }
          if (data.response) {
             setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: data.response }]);
          }
      } catch (err) {
          console.error(err);
      } finally {
          setIsLoading(false);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      setIsLoading(true);
      try {
           await fetch('http://localhost:8000/upload/file', {
              method: 'POST',
              body: formData
          });
          setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: `📁 Archivo subido: **${file.name}**` }]);
      } catch (err) {
          console.error(err);
      } finally {
          setIsLoading(false);
      }
  };

  const playTTS = async (text: string) => {
      try {
          const response = await fetch('http://localhost:8000/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: text })
          });
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.play();
      } catch (err) {
          console.error("TTS Error", err);
      }
  };

  const copyToClipboard = async (text: string, id: number) => {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-transparent">
      {/* Model Indicator */}
      <ModelIndicator />
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-premium">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
            <div className={`max-w-[85%] relative ${
              msg.role === 'user' 
                ? 'message-user rounded-2xl rounded-tr-md p-4' 
                : 'message-assistant rounded-2xl rounded-tl-md p-4'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-100">
                {msg.content}
              </p>
              
              {msg.role === 'assistant' && (
                  <div className="absolute -bottom-8 left-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button 
                        onClick={() => playTTS(msg.content)} 
                        className="p-2 hover:text-white text-neutral-500 hover:bg-white/[0.05] rounded-lg transition-all duration-200" 
                        title="Leer en voz alta"
                      >
                        <Volume2 size={14} />
                      </button>
                      <button 
                        onClick={() => copyToClipboard(msg.content, msg.id)} 
                        className="p-2 hover:text-white text-neutral-500 hover:bg-white/[0.05] rounded-lg transition-all duration-200" 
                        title="Copiar"
                      >
                        {copiedId === msg.id ? <Sparkles size={14} className="text-accent-400" /> : <Copy size={14} />}
                      </button>
                      <button 
                        onClick={() => handleRegenerate(msg.id)} 
                        className="p-2 hover:text-white text-neutral-500 hover:bg-white/[0.05] rounded-lg transition-all duration-200" 
                        title="Regenerar"
                      >
                        <RefreshCw size={14} />
                      </button>
                  </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start animate-fade-in">
                <div className="message-assistant p-4 rounded-2xl rounded-tl-md flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-sm text-neutral-400">Pensando...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-6 glass-subtle border-t border-white/[0.08]">
        <div className="flex items-center gap-3 input-premium focus-within:border-accent-400/50 focus-within:shadow-glow">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-neutral-500 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all duration-200 group"
                title="Subir archivo"
            >
                <Paperclip size={18} className="group-hover:rotate-12 transition-transform duration-200" />
            </button>

            <AudioRecorder onAudioRecorded={handleAudioUpload} />

            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={`Mensaje para proyecto ${activeProjectId}...`}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-neutral-500 text-sm py-1"
                autoFocus
            />
            
            <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none group"
            >
                <Send size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
        </div>
      </div>
    </div>
  );
};
