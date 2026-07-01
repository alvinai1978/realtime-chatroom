'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Bot, Gamepad2, Loader2, MessageCircle, Send, ShieldCheck, Sparkles, Trophy, UserRound, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type Message = {
  id: number;
  room: string;
  user_name: string;
  content: string;
  is_ai: boolean;
  reply_to_message_id?: number | null;
  game_slot?: number | null;
  event_key?: string | null;
  event_type?: string | null;
  created_at: string;
};

type OnlineUser = {
  key: string;
  name: string;
  onlineAt?: string;
};

type UserScore = {
  user_name: string;
  total_score: number;
  updated_at?: string;
};

type ConfettiPiece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotate: number;
  hue: number;
  shape: 'square' | 'circle';
};

type JarvisQuestion = {
  question: string;
  answers: string[];
  displayAnswer: string;
};

const ROOM_NAME = 'main-room';
const JARVIS_NAME = 'Jarvis';
const GAME_INTERVAL_MS = 120000;
const GAME_ANSWER_DELAY_MS = 60000;
const TRIVIA_INTERVAL_MS = 300000;

const jarvisQuestions: JarvisQuestion[] = [
  {
    question: '🎮 Jarvis Game: Ano ang kulay ng langit kapag maaraw?',
    answers: ['asul', 'blue'],
    displayAnswer: 'asul / blue'
  },
  {
    question: '🎮 Jarvis Game: Ilang araw meron sa isang linggo?',
    answers: ['7', 'pito', 'seven'],
    displayAnswer: '7 / pito'
  },
  {
    question: '🎮 Jarvis Game: Ano ang kabaliktaran ng malamig?',
    answers: ['mainit', 'hot'],
    displayAnswer: 'mainit'
  },
  {
    question: '🎮 Jarvis Game: Anong hayop ang tumatahol?',
    answers: ['aso', 'dog'],
    displayAnswer: 'aso / dog'
  },
  {
    question: '🎮 Jarvis Game: Ilang daliri meron sa isang kamay?',
    answers: ['5', 'lima', 'five'],
    displayAnswer: '5 / lima'
  },
  {
    question: '🎮 Jarvis Game: Ano ang ginagamit natin para magsulat?',
    answers: ['lapis', 'pencil', 'ballpen', 'pen'],
    displayAnswer: 'lapis o ballpen'
  },
  {
    question: '🎮 Jarvis Game: Ano ang tawag sa bahay ng ibon?',
    answers: ['pugad', 'nest'],
    displayAnswer: 'pugad / nest'
  },
  {
    question: '🎮 Jarvis Game: Kung may 2 mansanas ka at binigyan ka pa ng 1, ilan na lahat?',
    answers: ['3', 'tatlo', 'three'],
    displayAnswer: '3 / tatlo'
  },
  {
    question: '🎮 Jarvis Game: Ano ang unang buwan ng taon?',
    answers: ['enero', 'january'],
    displayAnswer: 'Enero / January'
  },
  {
    question: '🎮 Jarvis Game: Anong gamit ang ginagamit para makita ang oras?',
    answers: ['orasan', 'relo', 'clock', 'watch'],
    displayAnswer: 'orasan / relo'
  }
];

const jarvisTrivia = [
  '🧠 Jarvis Trivia: Alam mo ba? Ang honey ay isa sa mga pagkain na hindi madaling mapanis kapag tama ang storage.',
  '🧠 Jarvis Trivia: Ang octopus ay may tatlong puso.',
  '🧠 Jarvis Trivia: Ang araw ay bituin, hindi planeta.',
  '🧠 Jarvis Trivia: Mas mabilis kumalat ang tunog sa tubig kaysa sa hangin.',
  '🧠 Jarvis Trivia: Ang mga langgam ay kayang magbuhat ng mas mabigat kaysa sa sarili nilang timbang.',
  '🧠 Jarvis Trivia: Ang keyboard layout na QWERTY ay ginawa noon pa para sa typewriters.',
  '🧠 Jarvis Trivia: Ang banana ay berry sa botanical classification, pero ang strawberry ay hindi tunay na berry.',
  '🧠 Jarvis Trivia: Ang buwan ay unti-unting lumalayo sa Earth taon-taon.'
];

const RESERVED_NAMES = new Set(['jarvis', 'system', 'guest', 'admin', 'administrator', 'moderator']);

function cleanName(name: string) {
  return name.trim().replace(/\s+/g, ' ').slice(0, 40) || 'Guest';
}

function sanitizeParticipantName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s._-]/gu, '')
    .slice(0, 24);
}

function stripNumberSuffix(name: string) {
  return name.replace(/\s+\d+$/, '').trim() || name.trim();
}

function isReservedName(name: string) {
  return RESERVED_NAMES.has(name.toLowerCase());
}

function makeUniqueParticipantName(baseName: string, takenNames: Set<string>, currentName = '') {
  const rootName = stripNumberSuffix(baseName);
  const currentLower = currentName.toLowerCase();
  let candidate = rootName;
  let counter = 1;

  while (takenNames.has(candidate.toLowerCase()) && candidate.toLowerCase() !== currentLower) {
    candidate = `${rootName} ${counter}`;
    counter += 1;
  }

  return candidate;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getUserHue(name: string) {
  let hash = 0;

  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }

  return Math.abs(hash) % 360;
}

function getUserAccentStyle(name: string): CSSProperties {
  if (name === JARVIS_NAME) {
    return {
      '--user-color': '#7c3aed',
      '--user-soft': '#f3e8ff'
    } as CSSProperties;
  }

  if (name === 'System') {
    return {
      '--user-color': '#ea580c',
      '--user-soft': '#ffedd5'
    } as CSSProperties;
  }

  const hue = getUserHue(name || 'Guest');

  return {
    '--user-color': `hsl(${hue} 72% 42%)`,
    '--user-soft': `hsl(${hue} 82% 93%)`
  } as CSSProperties;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getErrorText(error: unknown) {
  if (error instanceof Error) return error.message;

  try {
    if (typeof error === 'object' && error !== null) {
      const possibleError = error as { code?: string; message?: string; details?: string; hint?: string };
      return [possibleError.code, possibleError.message, possibleError.details, possibleError.hint]
        .filter(Boolean)
        .join(' | ');
    }

    return String(error);
  } catch {
    return 'Unknown error';
  }
}

function isDuplicateError(error: unknown) {
  const text = getErrorText(error).toLowerCase();
  return text.includes('23505') || text.includes('duplicate key') || text.includes('unique constraint');
}

function isMissingNewColumnError(error: unknown) {
  const text = getErrorText(error).toLowerCase();
  return (
    text.includes('event_type') ||
    text.includes('event_key') ||
    text.includes('game_slot') ||
    text.includes('reply_to_message_id') ||
    text.includes('schema cache') ||
    text.includes('column')
  );
}

function isMissingScoreboardError(error: unknown) {
  const text = getErrorText(error).toLowerCase();
  return (
    text.includes('user_scores') ||
    text.includes('score_events') ||
    text.includes('award_score_once') ||
    text.includes('function') ||
    text.includes('schema cache')
  );
}

function sortScores(scores: UserScore[]) {
  return [...scores].sort((a, b) => {
    const scoreDiff = Number(b.total_score || 0) - Number(a.total_score || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return a.user_name.localeCompare(b.user_name);
  });
}

function toReadableError(error: unknown, fallback = 'Unknown error') {
  const text = getErrorText(error);
  return new Error(text || fallback);
}

function getQuestionBySlot(slot?: number | null) {
  if (slot === null || slot === undefined) return null;
  return jarvisQuestions[Math.abs(slot) % jarvisQuestions.length];
}

function messageMatchesAnswer(message: string, question: JarvisQuestion) {
  const normalizedMessage = normalizeText(message);
  return question.answers.some((answer) => {
    const normalizedAnswer = normalizeText(answer);
    if (!normalizedAnswer) return false;

    if (/^\d+$/.test(normalizedAnswer)) {
      return normalizedMessage.split(' ').includes(normalizedAnswer);
    }

    return normalizedMessage.includes(normalizedAnswer);
  });
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [myName, setMyName] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [selectedSender, setSelectedSender] = useState('');
  const [nameError, setNameError] = useState('');
  const [nameNotice, setNameNotice] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [statusText, setStatusText] = useState('Jarvis is online');
  const [scores, setScores] = useState<UserScore[]>([]);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [celebrationText, setCelebrationText] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const currentPresenceKeyRef = useRef('');
  const messagesRef = useRef<Message[]>([]);
  const previousTopScoreRef = useRef<UserScore | null>(null);
  const celebrationTimerRef = useRef<number | null>(null);

  const onlineCount = onlineUsers.length;
  const senderName = myName;

  const topScore = useMemo(() => sortScores(scores)[0] || null, [scores]);

  const scoreMap = useMemo(() => {
    const map = new Map<string, number>();
    scores.forEach((score) => map.set(score.user_name, Number(score.total_score || 0)));
    return map;
  }, [scores]);

  function getTakenParticipantNames(currentName = myName) {
    const takenNames = new Set<string>();

    onlineUsers.forEach((user) => {
      if (!user.name || user.name === JARVIS_NAME || user.name === 'System') return;
      if (user.key === currentPresenceKeyRef.current) return;
      if (currentName && user.name.toLowerCase() === currentName.toLowerCase()) return;
      takenNames.add(user.name.toLowerCase());
    });

    return takenNames;
  }

  function registerParticipantName(rawName = nameDraft) {
    setNameError('');
    setNameNotice('');

    const cleanedName = sanitizeParticipantName(rawName);

    if (!cleanedName || cleanedName.length < 2) {
      setNameError('Maglagay ng valid name na at least 2 characters.');
      return '';
    }

    const baseName = stripNumberSuffix(cleanedName);

    if (isReservedName(baseName)) {
      setNameError('Reserved ang name na iyan. Gumamit ng totoong participant name.');
      return '';
    }

    const uniqueName = makeUniqueParticipantName(baseName, getTakenParticipantNames(), myName);

    setMyName(uniqueName);
    setNameDraft(uniqueName);
    setSelectedSender(uniqueName);
    localStorage.setItem('chat_user_name', uniqueName);

    if (uniqueName !== cleanedName) {
      setNameNotice(`May kaparehong name, kaya ginawa nating: ${uniqueName}`);
    } else {
      setNameNotice('Name confirmed. Pwede ka nang mag-chat.');
    }

    return uniqueName;
  }

  function triggerTopScoreCelebration(score: UserScore) {
    const pieces: ConfettiPiece[] = Array.from({ length: 80 }, (_, index) => ({
      id: Date.now() + index,
      left: Math.random() * 100,
      delay: Math.random() * 0.75,
      duration: 2.5 + Math.random() * 1.4,
      size: 7 + Math.random() * 8,
      rotate: Math.random() * 360,
      hue: getUserHue(score.user_name) + Math.floor(Math.random() * 80) - 40,
      shape: Math.random() > 0.55 ? 'circle' : 'square'
    }));

    setCelebrationText(`🏆 ${score.user_name} is the TOP SCORE! ${score.total_score} pts`);
    setConfettiPieces(pieces);

    if (celebrationTimerRef.current) {
      window.clearTimeout(celebrationTimerRef.current);
    }

    celebrationTimerRef.current = window.setTimeout(() => {
      setConfettiPieces([]);
      setCelebrationText('');
      celebrationTimerRef.current = null;
    }, 4500);
  }

  useEffect(() => {
    if (!topScore) return;

    const previousTopScore = previousTopScoreRef.current;
    previousTopScoreRef.current = { ...topScore };

    if (!previousTopScore) return;

    const hasNewLeader = previousTopScore.user_name !== topScore.user_name;
    const hasHigherTopScore = Number(topScore.total_score || 0) > Number(previousTopScore.total_score || 0);

    if (hasNewLeader || hasHigherTopScore) {
      triggerTopScoreCelebration(topScore);
    }
  }, [topScore?.user_name, topScore?.total_score]);

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);
    };
  }, []);

  const userList = useMemo(() => {
    const map = new Map<string, OnlineUser>();

    onlineUsers.forEach((user) => {
      if (user.name && user.name !== JARVIS_NAME) map.set(user.name, user);
    });

    if (myName) {
      map.set(myName, { key: 'me', name: myName, onlineAt: new Date().toISOString() });
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [onlineUsers, myName]);

  const recentMessagesForJarvis = useMemo(
    () =>
      messages.slice(-8).map((message) => ({
        user_name: message.user_name,
        content: message.content,
        is_ai: message.is_ai
      })),
    [messages]
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  async function loadScores() {
    const { data, error } = await supabase
      .from('user_scores')
      .select('user_name,total_score,updated_at')
      .order('total_score', { ascending: false })
      .limit(100);

    if (!error && data) {
      setScores(sortScores(data as UserScore[]));
      return;
    }

    if (error && !isMissingScoreboardError(error)) {
      console.warn('Could not load scoreboard:', getErrorText(error));
    }
  }

  useEffect(() => {
    loadScores();

    const scoreChannel = supabase
      .channel(`scores:${ROOM_NAME}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_scores' }, (payload) => {
        const changedScore = (payload.new || payload.old) as UserScore | undefined;
        if (!changedScore?.user_name) return;

        setScores((current) => {
          const withoutChanged = current.filter((score) => score.user_name !== changedScore.user_name);
          if (payload.eventType === 'DELETE') return withoutChanged;
          return sortScores([...withoutChanged, changedScore]).slice(0, 100);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(scoreChannel);
    };
  }, []);

  useEffect(() => {
    const savedName = sanitizeParticipantName(localStorage.getItem('chat_user_name') || '');

    if (savedName && !isReservedName(stripNumberSuffix(savedName))) {
      setMyName(savedName);
      setNameDraft(savedName);
      setSelectedSender(savedName);
    }
  }, []);

  useEffect(() => {
    if (!myName || !channelRef.current) return;

    channelRef.current.track({
      user_name: myName,
      online_at: new Date().toISOString()
    });
  }, [myName]);

  useEffect(() => {
    if (!myName || !currentPresenceKeyRef.current) return;

    const duplicateOnlineUser = onlineUsers.find(
      (user) =>
        user.key !== currentPresenceKeyRef.current &&
        user.name.toLowerCase() === myName.toLowerCase()
    );

    if (!duplicateOnlineUser) return;

    const uniqueName = makeUniqueParticipantName(myName, getTakenParticipantNames(''));

    if (uniqueName !== myName) {
      setMyName(uniqueName);
      setNameDraft(uniqueName);
      setSelectedSender(uniqueName);
      setNameNotice(`May kaparehong online user, kaya ginawa nating: ${uniqueName}`);
      localStorage.setItem('chat_user_name', uniqueName);
    }
  }, [onlineUsers, myName]);

  useEffect(() => {
    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room', ROOM_NAME)
        .order('created_at', { ascending: true })
        .limit(180);

      if (!error && data) setMessages(data as Message[]);
    }

    loadMessages();

    const presenceKey = crypto.randomUUID();
    currentPresenceKeyRef.current = presenceKey;
    const channel = supabase
      .channel(`room:${ROOM_NAME}`, {
        config: {
          presence: { key: presenceKey }
        }
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room=eq.${ROOM_NAME}` },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((current) => {
            if (current.some((message) => message.id === newMessage.id)) return current;
            return [...current, newMessage].slice(-180);
          });
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, Array<Record<string, unknown>>>;
        const users: OnlineUser[] = Object.entries(state).map(([key, presences]) => {
          const firstPresence = Array.isArray(presences) ? presences[0] : undefined;
          return {
            key,
            name: String(firstPresence?.user_name || 'Guest'),
            onlineAt: String(firstPresence?.online_at || '')
          };
        });

        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, (payload) => {
        const joinPayload = payload as { key: string; newPresences?: Array<Record<string, unknown>> };
        const joinedUsers = Array.isArray(joinPayload.newPresences) ? joinPayload.newPresences : [];

        joinedUsers.forEach((presence) => {
          const name = cleanName(String(presence.user_name || 'Guest'));
          postJoinMessages(joinPayload.key, name);
        });
      })
      .on('presence', { event: 'leave' }, (payload) => {
        const leavePayload = payload as { key: string; leftPresences?: Array<Record<string, unknown>> };
        const leftUsers = Array.isArray(leavePayload.leftPresences) ? leavePayload.leftPresences : [];

        leftUsers.forEach((presence) => {
          const name = cleanName(String(presence.user_name || 'Guest'));
          postLeaveMessage(leavePayload.key, name);
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      currentPresenceKeyRef.current = '';
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      postJarvisGameQuestion();
      checkGameAnswerTimeout();
      postJarvisTrivia();
    }, 10000);

    window.setTimeout(() => {
      postJarvisGameQuestion();
      checkGameAnswerTimeout();
      postJarvisTrivia();
    }, 1200);

    return () => window.clearInterval(timer);
  }, []);

  async function insertMessage(
    content: string,
    isAi = false,
    sender = senderName,
    options?: { replyToMessageId?: number; gameSlot?: number; eventKey?: string; eventType?: string }
  ) {
    const basePayload = {
      room: ROOM_NAME,
      user_name: sender || 'Guest',
      content,
      is_ai: isAi
    };

    const fullPayload = {
      ...basePayload,
      reply_to_message_id: options?.replyToMessageId ?? null,
      game_slot: options?.gameSlot ?? null,
      event_key: options?.eventKey ?? null,
      event_type: options?.eventType ?? null
    };

    const { data, error } = await supabase.from('messages').insert(fullPayload).select('*').single();

    if (!error && data) return data as Message;

    // Duplicate event errors are expected when many browsers are open.
    // Important: check this before the missing-column fallback, because duplicate
    // errors can mention event_key/reply_to_message_id in the error text.
    if (error && isDuplicateError(error)) {
      throw toReadableError(error, 'Duplicate event skipped.');
    }

    // If the user has not run the new Supabase SQL yet, older tables may not have
    // event_type/event_key/game_slot/reply_to_message_id. Fall back to the original
    // message columns so the app will not crash while the database is being repaired.
    if (error && isMissingNewColumnError(error)) {
      console.warn('Supabase table needs repair.sql. Using legacy insert for now:', getErrorText(error));
      const legacyResult = await supabase.from('messages').insert(basePayload).select('*').single();

      if (!legacyResult.error && legacyResult.data) return legacyResult.data as Message;
      throw toReadableError(legacyResult.error, 'Supabase legacy insert failed.');
    }

    throw toReadableError(error, 'Supabase insert failed.');
  }

  async function insertUniqueEvent(
    content: string,
    sender: string,
    eventKey: string,
    eventType: string,
    options?: { isAi?: boolean; replyToMessageId?: number; gameSlot?: number }
  ) {
    try {
      return await insertMessage(content, options?.isAi ?? sender !== 'System', sender, {
        eventKey,
        eventType,
        replyToMessageId: options?.replyToMessageId,
        gameSlot: options?.gameSlot
      });
    } catch (error) {
      // Duplicate event errors are expected when multiple users/browsers are open.
      // We avoid console.error here because Next.js dev overlay shows it as a red error.
      if (!isDuplicateError(error)) {
        console.warn('Jarvis event was skipped:', getErrorText(error));
      }
      return null;
    }
  }

  async function awardScoreOnce(userName: string, gameSlot?: number | null) {
    const safeName = cleanName(userName);
    if (!safeName || safeName === JARVIS_NAME || safeName === 'System') return false;

    try {
      const { data, error } = await supabase.rpc('award_score_once', {
        p_event_key: `score-game-${gameSlot ?? 'unknown'}`,
        p_user_name: safeName,
        p_points: 1
      });

      if (error) {
        if (!isMissingScoreboardError(error)) {
          console.warn('Could not update scoreboard:', getErrorText(error));
        } else {
          console.warn('Scoreboard needs supabase/repair.sql:', getErrorText(error));
        }
        return false;
      }

      if (data) {
        setScores((current) => {
          const existing = current.find((score) => score.user_name === safeName);
          const withoutUser = current.filter((score) => score.user_name !== safeName);
          const updatedScore: UserScore = {
            user_name: safeName,
            total_score: Number(existing?.total_score || 0) + 1,
            updated_at: new Date().toISOString()
          };
          return sortScores([...withoutUser, updatedScore]).slice(0, 100);
        });

        await loadScores();
        return true;
      }

      await loadScores();
      return false;
    } catch (error) {
      console.warn('Scoreboard update skipped:', getErrorText(error));
      return false;
    }
  }

  async function postJoinMessages(presenceKey: string, name: string) {
    await insertUniqueEvent(`🟢 ${name} joined the chat.`, 'System', `join-${presenceKey}`, 'presence_join', {
      isAi: true
    });

    await insertUniqueEvent(`Welcome, ${name}! 👋 Ako si Jarvis. Enjoy sa chatroom!`, JARVIS_NAME, `welcome-${presenceKey}`, 'welcome', {
      isAi: true
    });
  }

  async function postLeaveMessage(presenceKey: string, name: string) {
    await insertUniqueEvent(`🔴 ${name} left the chat.`, 'System', `left-${presenceKey}`, 'presence_leave', {
      isAi: true
    });
  }

  async function askJarvis(message: string, replyToMessageId?: number, activeSender = senderName) {
    if (!message.trim()) return;

    setStatusText('Jarvis is typing...');

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          room: ROOM_NAME,
          userName: activeSender,
          history: recentMessagesForJarvis
        })
      });

      const responseText = await response.text();
      let data: { reply?: string; error?: string; details?: string; model?: string; baseUrl?: string } = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { error: responseText || 'Invalid AI response.' };
      }

      if (!response.ok) {
        const readableDetails = [data.error, data.details].filter(Boolean).join(' | ');
        throw new Error(readableDetails || `AI request failed with status ${response.status}.`);
      }

      await insertMessage(data.reply || 'Sorry, wala akong nakuha na reply.', true, JARVIS_NAME, { replyToMessageId, eventType: 'ai_reply' });
      setStatusText('Jarvis replied');
    } catch (error) {
      try {
        await insertMessage(
          `System error: ${getErrorText(error) || 'Hindi nakasagot si Jarvis.'}`,
          true,
          'System',
          { eventType: 'system_error' }
        );
      } catch (systemError) {
        console.warn('Could not save Jarvis system error:', getErrorText(systemError));
      }
      setStatusText('Jarvis has an error');
    } finally {
      window.setTimeout(() => setStatusText('Jarvis is online'), 1500);
    }
  }

  function findLatestOpenGameQuestion() {
    const currentMessages = messagesRef.current;

    return [...currentMessages].reverse().find((message) => {
      const isGameQuestion =
        message.user_name === JARVIS_NAME &&
        (message.event_type === 'game_question' || message.content.startsWith('🎮 Jarvis Game:')) &&
        message.game_slot !== null &&
        message.game_slot !== undefined;

      if (!isGameQuestion) return false;

      const alreadyAnswered = currentMessages.some(
        (reply) =>
          reply.reply_to_message_id === message.id &&
          reply.user_name === JARVIS_NAME &&
          (reply.event_type === 'game_answer' || reply.event_type === 'game_winner')
      );

      return !alreadyAnswered;
    });
  }

  async function postJarvisGameQuestion() {
    const slot = Math.floor(Date.now() / GAME_INTERVAL_MS);
    const savedSlot = Number(localStorage.getItem('jarvis_last_game_slot') || '0');
    if (savedSlot >= slot) return;

    const currentMessages = messagesRef.current;
    const lastGame = [...currentMessages]
      .reverse()
      .find((message) => message.user_name === JARVIS_NAME && message.content.startsWith('🎮 Jarvis Game:'));

    if (lastGame && Date.now() - new Date(lastGame.created_at).getTime() < GAME_INTERVAL_MS - 5000) return;

    const question = jarvisQuestions[slot % jarvisQuestions.length];

    await insertUniqueEvent(question.question, JARVIS_NAME, `game-question-${slot}`, 'game_question', {
      isAi: true,
      gameSlot: slot
    });

    localStorage.setItem('jarvis_last_game_slot', String(slot));
  }

  async function checkGameAnswerTimeout() {
    const gameMessage = findLatestOpenGameQuestion();
    if (!gameMessage) return;

    const question = getQuestionBySlot(gameMessage.game_slot);
    if (!question) return;

    const askedAt = new Date(gameMessage.created_at).getTime();
    if (Date.now() - askedAt < GAME_ANSWER_DELAY_MS) return;

    const gameSlot = gameMessage.game_slot ?? 0;
    const currentMessages = messagesRef.current;
    const correctGuess = currentMessages.find((message) => {
      const messageTime = new Date(message.created_at).getTime();
      return (
        !message.is_ai &&
        messageTime > askedAt &&
        messageTime <= askedAt + GAME_ANSWER_DELAY_MS &&
        messageMatchesAnswer(message.content, question)
      );
    });

    if (correctGuess) {
      const winnerMessage = await insertUniqueEvent(
        `Tama, ${correctGuess.user_name}! 🎉 +1 score! Ang sagot ay: ${question.displayAnswer}.`,
        JARVIS_NAME,
        `game-winner-${gameSlot}`,
        'game_winner',
        { isAi: true, replyToMessageId: gameMessage.id }
      );

      if (winnerMessage) {
        await awardScoreOnce(correctGuess.user_name, gameSlot);
      }

      return;
    }

    await insertUniqueEvent(
      `⏰ Time's up! Walang naka-hula. Ang tamang sagot ay: ${question.displayAnswer}.`,
      JARVIS_NAME,
      `game-answer-${gameSlot}`,
      'game_answer',
      { isAi: true, replyToMessageId: gameMessage.id }
    );
  }

  async function tryCongratulateGameWinner(rawMessage: string, activeSender: string) {
    const gameMessage = findLatestOpenGameQuestion();
    if (!gameMessage) return false;

    const question = getQuestionBySlot(gameMessage.game_slot);
    if (!question) return false;

    const askedAt = new Date(gameMessage.created_at).getTime();
    if (Date.now() - askedAt > GAME_ANSWER_DELAY_MS) return false;
    if (!messageMatchesAnswer(rawMessage, question)) return false;

    const gameSlot = gameMessage.game_slot ?? 0;
    const winnerMessage = await insertUniqueEvent(
      `Tama, ${activeSender}! 🎉 +1 score! Ang sagot ay: ${question.displayAnswer}.`,
      JARVIS_NAME,
      `game-winner-${gameSlot}`,
      'game_winner',
      { isAi: true, replyToMessageId: gameMessage.id }
    );

    if (winnerMessage) {
      await awardScoreOnce(activeSender, gameSlot);
    }

    return true;
  }

  async function postJarvisTrivia() {
    const slot = Math.floor(Date.now() / TRIVIA_INTERVAL_MS);
    const savedSlot = Number(localStorage.getItem('jarvis_last_trivia_slot') || '0');
    if (savedSlot >= slot) return;

    const currentMessages = messagesRef.current;
    const lastTrivia = [...currentMessages]
      .reverse()
      .find((message) => message.user_name === JARVIS_NAME && message.content.startsWith('🧠 Jarvis Trivia:'));

    if (lastTrivia && Date.now() - new Date(lastTrivia.created_at).getTime() < TRIVIA_INTERVAL_MS - 5000) return;

    const trivia = jarvisTrivia[slot % jarvisTrivia.length];
    await insertUniqueEvent(trivia, JARVIS_NAME, `trivia-${slot}`, 'trivia', { isAi: true });
    localStorage.setItem('jarvis_last_trivia_slot', String(slot));
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rawMessage = input.trim();
    if (!rawMessage || isSending) return;

    if (!myName) {
      setNameError('Maglagay muna ng participant name bago mag-chat.');
      return;
    }

    const activeSender = cleanName(myName);
    setIsSending(true);
    setInput('');

    let userMessage: Message | null = null;
    let answeredGame = false;

    try {
      // Save the user's message first, then release the composer immediately.
      // Jarvis replies in the background so users can keep typing while AI is thinking.
      userMessage = await insertMessage(rawMessage, false, activeSender, { eventType: 'user_message' });
      answeredGame = await tryCongratulateGameWinner(rawMessage, activeSender);
    } catch (error) {
      try {
        await insertMessage(
          `System error: ${getErrorText(error) || 'Hindi na-send ang message.'}`,
          true,
          'System',
          { eventType: 'system_error' }
        );
      } catch (systemError) {
        console.warn('Could not save send error:', getErrorText(systemError));
      }
    } finally {
      setIsSending(false);
    }

    if (userMessage && !answeredGame) {
      void askJarvis(rawMessage, userMessage.id, activeSender);
    }
  }

  function saveName() {
    registerParticipantName(nameDraft);
  }

  function selectSender(name: string) {
    setSelectedSender(name);
  }

  return (
    <main className="messenger-shell">
      {confettiPieces.length > 0 ? (
        <div className="confetti-layer" aria-live="polite" aria-label="Top score celebration">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className={`confetti-piece ${piece.shape}`}
              style={
                {
                  '--left': `${piece.left}%`,
                  '--delay': `${piece.delay}s`,
                  '--duration': `${piece.duration}s`,
                  '--size': `${piece.size}px`,
                  '--rotate': `${piece.rotate}deg`,
                  '--confetti-color': `hsl(${piece.hue} 82% 55%)`
                } as CSSProperties
              }
            />
          ))}
          <div className="top-score-toast">{celebrationText}</div>
        </div>
      ) : null}
      <aside className="sidebar">
        <div className="brand-card">
          <div className="jarvis-avatar"><Bot size={24} /></div>
          <div>
            <p className="small-label">AI Assistant</p>
            <h1>{JARVIS_NAME}</h1>
            <span>{statusText}</span>
          </div>
        </div>

        <div className="name-card">
          <label htmlFor="name">Your display name</label>
          <div className="name-row">
            <input
              id="name"
              value={nameDraft}
              onChange={(event) => {
                setNameDraft(event.target.value);
                setNameError('');
                setNameNotice('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') saveName();
              }}
              maxLength={24}
              placeholder="Enter your name first"
            />
            <button type="button" onClick={saveName}>Join</button>
          </div>
          {nameError ? <p className="name-feedback error">{nameError}</p> : null}
          {nameNotice ? <p className="name-feedback success">{nameNotice}</p> : null}
        </div>

        <div className="list-header">
          <span><Users size={16} /> Users</span>
          <strong>{onlineCount} online</strong>
        </div>

        <div className="user-list" role="listbox" aria-label="Chat users">
          {userList.map((user) => {
            const userAccentStyle = getUserAccentStyle(user.name);

            return (
              <button
                key={user.key + user.name}
                type="button"
                className={`user-item ${selectedSender === user.name ? 'active' : ''}`}
                style={userAccentStyle}
                onClick={() => selectSender(user.name)}
              >
                <span className="user-avatar"><UserRound size={16} /></span>
                <span>
                  <strong className="name-color">{user.name}</strong>
                  <small>{selectedSender === user.name ? 'Selected participant' : 'Click to highlight'} · Score: {scoreMap.get(user.name) || 0}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="rules-card">
          <strong><ShieldCheck size={16} /> Anti-dummy rules & actions</strong>
          <ul>
            <li>Name is required before sending messages.</li>
            <li>Duplicate names auto-add 1, 2, 3, and so on.</li>
            <li>Reserved names like Jarvis, System, Guest, and Admin are blocked.</li>
            <li>Join/left activity is logged in the chat for visibility.</li>
          </ul>
        </div>

        <div className="side-note">
          <Gamepad2 size={16} /> Jarvis posts games every 2 minutes, reveals answers after 1 minute, and shares trivia every 5 minutes.
        </div>
      </aside>

      <section className="chat-panel">
        <header className="chat-topbar">
          <div className="chat-title">
            <div className="chat-icon"><MessageCircle size={22} /></div>
            <div>
              <h2>Realtime Chatroom</h2>
              <p><Sparkles size={14} /> Messenger-style chat with Supabase Realtime + NVIDIA AI</p>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="leaderboard-card" style={topScore ? getUserAccentStyle(topScore.user_name) : undefined}>
              <Trophy size={17} />
              <span>ALL TIME TOP SCORE</span>
              <strong className={topScore ? 'name-color' : ''}>
                {topScore ? `${topScore.user_name} - ${topScore.total_score}` : 'No score yet'}
              </strong>
            </div>
            <div className="sender-pill">Logged in as: <strong>{senderName || 'Name required'}</strong></div>
          </div>
        </header>

        <div className="messages" aria-live="polite">
          {!myName ? (
            <div className="name-gate">
              <ShieldCheck size={44} />
              <h3>Enter your name first</h3>
              <p>Kailangan muna ng participant name bago makapag-type para iwas dummy account.</p>
              <div className="gate-form">
                <input
                  value={nameDraft}
                  onChange={(event) => {
                    setNameDraft(event.target.value);
                    setNameError('');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveName();
                  }}
                  maxLength={24}
                  placeholder="Example: Juan Dela Cruz"
                />
                <button type="button" onClick={saveName}>Join chat</button>
              </div>
              {nameError ? <p className="name-feedback error">{nameError}</p> : null}
              {nameNotice ? <p className="name-feedback success">{nameNotice}</p> : null}
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <Bot size={42} />
              <h3>Start the conversation</h3>
              <p>Mag-message ka lang. Hindi na kailangan ng /ai — automatic nang sasagot si Jarvis.</p>
            </div>
          ) : (
            messages.map((message) => {
              const isJarvis = message.user_name === JARVIS_NAME;
              const isSystem = message.user_name === 'System';
              const isOwn = !message.is_ai && message.user_name === senderName;
              const messageAccentStyle = getUserAccentStyle(message.user_name);

              return (
                <article
                  key={message.id}
                  className={`message-row ${isOwn ? 'own' : ''} ${message.is_ai ? 'ai' : ''} ${isSystem ? 'system' : ''}`}
                  style={messageAccentStyle}
                >
                  {!isOwn ? (
                    <div className={`bubble-avatar ${isJarvis ? 'jarvis' : ''} ${isSystem ? 'system-avatar' : ''}`}>
                      {isJarvis ? <Bot size={17} /> : isSystem ? '!' : initials(message.user_name)}
                    </div>
                  ) : null}

                  <div className="bubble-group">
                    <div className="message-meta">
                      <span className="name-color">{message.user_name}</span>
                      <time>{formatTime(message.created_at)}</time>
                    </div>
                    <div className="bubble">{message.content}</div>
                  </div>
                </article>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="composer">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={myName ? 'Type a message... Jarvis will join the conversation' : 'Enter your name first to unlock chat'}
            disabled={!myName}
          />
          <button type="submit" disabled={!myName || !input.trim() || isSending}>
            {isSending ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
