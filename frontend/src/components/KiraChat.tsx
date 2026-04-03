import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  time?: string;
}

const getTime = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

export const KiraChat = () => {
  const { activeProjectId } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`http://localhost:8000/chat/${activeProjectId}`);
        if (res.ok) {
          const history = await res.json();
          setMessages(history.reverse().map((h: any) => ({
            id: h.id, role: h.role, content: h.content, time: getTime(),
          })));
        }
      } catch (e) { console.error(e); }
    };
    load();
  }, [activeProjectId]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now(), role: 'user', content: text, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, project_id: activeProjectId }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: data.response, time: getTime() }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: `⚠️ Error: ${e}`, time: getTime() }]);
    } finally { setIsLoading(false); }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await fetch('http://localhost:8000/upload/file', { method: 'POST', body: fd });
      setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: `📁 ${file.name}`, time: getTime() }]);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="kira-chat">
      {/* Background glass */}
      <div className="kira-chat-bg" />

      {/* Messages area */}
      <div className="kira-messages no-drag">
        {messages.map(msg => (
          <div key={msg.id} className={`kira-bubble-wrap ${msg.role === 'user' ? 'kira-bubble-user' : 'kira-bubble-model'}`}>
            {msg.role === 'assistant' && (
              <div className="kira-avatar">
                <div className="kira-avatar-bg" />
              </div>
            )}
            <div className="kira-bubble">
              <div className="kira-bubble-glass" />
              <div className="kira-bubble-content">
                <div className="kira-bubble-title">
                  {msg.role === 'user' ? 'Mensaje de usuario' : 'Mensaje de Modelo'}
                </div>
                <div className="kira-bubble-desc">{msg.content}</div>
              </div>
              {msg.role === 'user' && (
                <div className="kira-custom-icon">
                  <div className="kira-custom-icon-bg" />
                </div>
              )}
            </div>
            <div className="kira-bubble-time">{msg.time}</div>
          </div>
        ))}
        {isLoading && (
          <div className="kira-bubble-wrap kira-bubble-model">
            <div className="kira-avatar"><div className="kira-avatar-bg" /></div>
            <div className="kira-bubble">
              <div className="kira-bubble-glass" />
              <div className="kira-bubble-content">
                <div className="kira-bubble-title">Mensaje de Modelo</div>
                <div className="kira-bubble-desc kira-typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input field */}
      <div className="kira-input-wrap no-drag">
        <div className="kira-input-container">
          {/* Left icons */}
          <div className="kira-input-icons-left">
            <button className="kira-icon-btn" title="Búsqueda global">🌐</button>
            <button className="kira-icon-btn" title="Sugerencias">💡</button>
            <button className="kira-icon-btn" title="Mover">⤢</button>
            <button className="kira-icon-btn" onClick={() => fileInputRef.current?.click()} title="Adjuntar">⊞</button>
          </div>
          {/* Text input */}
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Enviar mensaje..."
            className="kira-input"
            autoFocus
          />
          {/* Right icons */}
          <div className="kira-input-icons-right">
            <button className="kira-icon-btn" title="Micrófono">🎙</button>
            <button
              className="kira-send-btn"
              onClick={() => handleSend()}
              title="Enviar"
            >➤</button>
          </div>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} />
      </div>

      {/* Right contextual sidebar */}
      <div className="kira-right-bar no-drag">
        {['⧉','⌘','📄','📁','📋','{}','<>','/','⊞','▶','⚡','🔍','✦','◧'].map((icon, i) => (
          <button key={i} className="kira-right-icon" title={icon}>{icon}</button>
        ))}
      </div>
    </div>
  );
};
