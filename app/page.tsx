'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type Message = {
  id: number;
  room: string;
  user_name: string;
  content: string;
  is_ai: boolean;
  created_at: string;
};

const ROOM_NAME = 'main-room';

function randomGuestName() {
  return `Guest-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const aiHint = useMemo(() => input.trim().toLowerCase().startsWith('/ai'), [input]);

  useEffect(() => {
    const savedName = localStorage.getItem('chat_user_name') || randomGuestName();
    setUserName(savedName);
    localStorage.setItem('chat_user_name', savedName);
  }, []);

  useEffect(() => {
    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room', ROOM_NAME)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) setMessages(data as Message[]);
    }

    loadMessages();

    const channel = supabase
      .channel(`room:${ROOM_NAME}`, {
        config: {
          presence: { key: crypto.randomUUID() }
        }
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room=eq.${ROOM_NAME}` },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((current) => {
            if (current.some((message) => message.id === newMessage.id)) return current;
            return [...current, newMessage].slice(-100);
          });
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length || 1);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function insertMessage(content: string, isAi = false, senderName = userName) {
    const { error } = await supabase.from('messages').insert({
      room: ROOM_NAME,
      user_name: senderName || 'Guest',
      content,
      is_ai: isAi
    });

    if (error) throw error;
  }

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rawMessage = input.trim();
    if (!rawMessage || isSending) return;

    setIsSending(true);
    setInput('');

    try {
      await insertMessage(rawMessage, false, userName);

      if (rawMessage.toLowerCase().startsWith('/ai')) {
        const question = rawMessage.replace(/^\/ai/i, '').trim() || rawMessage;
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: question, room: ROOM_NAME, userName })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'AI request failed.');

        await insertMessage(data.reply, true, 'NVIDIA AI');
      }
    } catch (error) {
      await insertMessage(
        `System error: ${error instanceof Error ? error.message : 'Hindi na-send ang message.'}`,
        true,
        'System'
      );
    } finally {
      setIsSending(false);
    }
  }

  function saveName() {
    const cleanName = userName.trim().slice(0, 40) || randomGuestName();
    setUserName(cleanName);
    localStorage.setItem('chat_user_name', cleanName);
  }

  return (
    <main className="page-shell">
      <section className="chat-card">
        <header className="chat-header">
          <div>
            <div className="eyebrow"><Sparkles size={16} /> Vercel + Supabase + NVIDIA AI</div>
            <h1>Realtime Chatroom</h1>
            <p>Type normal chat, or use <strong>/ai your question</strong> para sumagot ang NVIDIA AI.</p>
          </div>
          <div className="online-pill"><Users size={16} /> {onlineCount} online</div>
        </header>

        <div className="profile-row">
          <label htmlFor="name">Display name</label>
          <input
            id="name"
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            onBlur={saveName}
            maxLength={40}
            placeholder="Your name"
          />
          <button type="button" onClick={saveName}>Save</button>
        </div>

        <div className="messages" aria-live="polite">
          {messages.length === 0 ? (
            <div className="empty-state">
              <Bot size={36} />
              <p>Wala pang message. Ikaw ang unang mag-chat.</p>
            </div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={`message ${message.is_ai ? 'ai-message' : ''} ${message.user_name === userName ? 'own-message' : ''}`}
              >
                <div className="message-meta">
                  <span>{message.is_ai ? <Bot size={14} /> : null}{message.user_name}</span>
                  <time>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                </div>
                <p>{message.content}</p>
              </article>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="composer">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Message... try /ai gumawa ng caption para sa laundry POS"
            disabled={isSending}
          />
          <button type="submit" disabled={!input.trim() || isSending} className={aiHint ? 'ai-send' : ''}>
            {isSending ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
