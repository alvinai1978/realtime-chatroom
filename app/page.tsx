'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Bot, ChevronRight, Eye, Gamepad2, History, KeyRound, Loader2, MessageCircle, Monitor, Play, QrCode, RotateCcw, Send, Settings, ShieldCheck, Sparkles, StopCircle, Trash2, Trophy, UserCog, UserRound, UserX, Users, Volume2, VolumeX } from 'lucide-react';
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
  avatar?: string;
  profileColor?: string;
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

type BingoCellValue = number | 'FREE';

type BingoPatternKey =
  | 'straight_line'
  | 'four_corners'
  | 'letter_x'
  | 'letter_t'
  | 'letter_l'
  | 'letter_h'
  | 'cross'
  | 'diamond'
  | 'picture_frame'
  | 'blackout';

type BingoPattern = {
  key: BingoPatternKey;
  label: string;
  description: string;
};

type ActiveBingoRound = {
  roundId: string;
  patterns: BingoPattern[];
  startedAt: string;
  eligiblePlayers: string[];
  callIntervalMs: number;
  winnerLimit: number;
  prizeLabel: string;
  patternCount: number;
  allowLateJoiners: boolean;
};

type BingoCell = [number, number];
type BingoCardMode = 'random' | 'same' | 'choose';


const ROOM_NAME = 'main-room';
const JARVIS_NAME = 'Jarvis';
const GAME_INTERVAL_MS = 120000;
const GAME_ANSWER_DELAY_MS = 60000;
const TRIVIA_INTERVAL_MS = 300000;
const QUESTION_REPEAT_WINDOW = 20;
const BINGO_CALL_INTERVAL_MS = 8000;
const BINGO_HOST_TICK_MS = 1000;
const BINGO_WIN_SCORE = 50;
const BINGO_DEFAULT_PRIZE = 'Bingo Champion';
const BINGO_SPEED_OPTIONS = [5000, 8000, 10000] as const;
const BINGO_WINNER_LIMIT_OPTIONS = [1, 2, 3] as const;
const BINGO_PATTERN_COUNT_OPTIONS = [1, 2, 3] as const;
const BINGO_CARD_COUNT_OPTIONS = [1, 2, 3, 4] as const;
const BINGO_CARD_MODES: Array<{ key: BingoCardMode; label: string; description: string }> = [
  { key: 'random', label: 'Random cards', description: 'Generate fresh different cards.' },
  { key: 'same', label: 'Same card', description: 'Use the same card layout for every card.' },
  { key: 'choose', label: 'Choose card', description: 'Pick a preferred card family.' }
];
const BINGO_CARD_CHOICES = [
  { key: 'lucky-a', label: 'Lucky Card A' },
  { key: 'lucky-b', label: 'Lucky Card B' },
  { key: 'lucky-c', label: 'Lucky Card C' },
  { key: 'lucky-d', label: 'Lucky Card D' },
  { key: 'star', label: 'Star Card' },
  { key: 'dragon', label: 'Dragon Card' },
  { key: 'rainbow', label: 'Rainbow Card' },
  { key: 'classic', label: 'Classic Card' }
] as const;
const BINGO_COUNTDOWN_SECONDS = 5;
const BINGO_MARK_COLORS = [
  { key: 'blue', label: 'Blue', fill: 'rgba(10, 124, 255, 0.34)', border: 'rgba(10, 124, 255, 0.65)' },
  { key: 'purple', label: 'Purple', fill: 'rgba(124, 58, 237, 0.34)', border: 'rgba(124, 58, 237, 0.65)' },
  { key: 'pink', label: 'Pink', fill: 'rgba(225, 29, 72, 0.32)', border: 'rgba(225, 29, 72, 0.62)' },
  { key: 'green', label: 'Green', fill: 'rgba(5, 150, 105, 0.30)', border: 'rgba(5, 150, 105, 0.60)' },
  { key: 'orange', label: 'Orange', fill: 'rgba(234, 88, 12, 0.32)', border: 'rgba(234, 88, 12, 0.62)' }
] as const;
const USER_PROFILE_AVATARS = ['😀', '😎', '🤖', '🦊', '🐯', '🐼', '🐲', '🦅', '⭐', '🔥', '🎲', '🏆'] as const;
const USER_PROFILE_COLORS = [
  { key: 'sky', label: 'Sky', color: '#0a7cff', soft: '#e0f2fe' },
  { key: 'violet', label: 'Violet', color: '#7c3aed', soft: '#ede9fe' },
  { key: 'rose', label: 'Rose', color: '#e11d48', soft: '#ffe4e6' },
  { key: 'emerald', label: 'Emerald', color: '#059669', soft: '#d1fae5' },
  { key: 'amber', label: 'Amber', color: '#d97706', soft: '#fef3c7' },
  { key: 'slate', label: 'Slate', color: '#334155', soft: '#e2e8f0' }
] as const;
const DEFAULT_SOUND_VOLUMES = { call: 0.8, winner: 0.85, invalid: 0.55, confetti: 0.8, countdown: 0.75 } as const;
type SoundKey = keyof typeof DEFAULT_SOUND_VOLUMES;
const BINGO_COLUMNS = [
  { letter: 'B', min: 1, max: 15 },
  { letter: 'I', min: 16, max: 30 },
  { letter: 'N', min: 31, max: 45 },
  { letter: 'G', min: 46, max: 60 },
  { letter: 'O', min: 61, max: 75 }
] as const;

const BINGO_PATTERN_POOL: BingoPattern[] = [
  { key: 'straight_line', label: 'Straight Line', description: 'Any full horizontal, vertical, or diagonal line.' },
  { key: 'four_corners', label: 'Four Corners', description: 'Top-left, top-right, bottom-left, and bottom-right.' },
  { key: 'letter_x', label: 'Letter X', description: 'Both diagonals crossing through the FREE space.' },
  { key: 'letter_t', label: 'Letter T', description: 'Full top row plus the middle column.' },
  { key: 'letter_l', label: 'Letter L', description: 'Full left column plus the full bottom row.' },
  { key: 'letter_h', label: 'Letter H', description: 'Left column, right column, and the middle row.' },
  { key: 'cross', label: 'Cross / Plus', description: 'Middle row plus middle column.' },
  { key: 'diamond', label: 'Diamond', description: 'Diamond shape around the FREE center.' },
  { key: 'picture_frame', label: 'Picture Frame', description: 'Complete outside border of the card.' },
  { key: 'blackout', label: 'Blackout', description: 'All card squares covered. FREE is automatic.' }
];

const BINGO_PATTERN_MAP = new Map(BINGO_PATTERN_POOL.map((pattern) => [pattern.key, pattern]));


const jarvisQuestions: JarvisQuestion[] = [
  { question: '🎮 Jarvis Game: Ano ang kulay ng langit kapag maaraw?', answers: ['asul', 'blue'], displayAnswer: 'asul / blue' },
  { question: '🎮 Jarvis Game: Ilang araw meron sa isang linggo?', answers: ['7', 'pito', 'seven'], displayAnswer: '7 / pito' },
  { question: '🎮 Jarvis Game: Ano ang kabaliktaran ng malamig?', answers: ['mainit', 'hot'], displayAnswer: 'mainit' },
  { question: '🎮 Jarvis Game: Anong hayop ang tumatahol?', answers: ['aso', 'dog'], displayAnswer: 'aso / dog' },
  { question: '🎮 Jarvis Game: Ilang daliri meron sa isang kamay?', answers: ['5', 'lima', 'five'], displayAnswer: '5 / lima' },
  { question: '🎮 Jarvis Game: Ano ang ginagamit natin para magsulat?', answers: ['lapis', 'pencil', 'ballpen', 'pen'], displayAnswer: 'lapis o ballpen' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa bahay ng ibon?', answers: ['pugad', 'nest'], displayAnswer: 'pugad / nest' },
  { question: '🎮 Jarvis Game: Kung may 2 mansanas ka at binigyan ka pa ng 1, ilan na lahat?', answers: ['3', 'tatlo', 'three'], displayAnswer: '3 / tatlo' },
  { question: '🎮 Jarvis Game: Ano ang unang buwan ng taon?', answers: ['enero', 'january'], displayAnswer: 'Enero / January' },
  { question: '🎮 Jarvis Game: Anong gamit ang ginagamit para makita ang oras?', answers: ['orasan', 'relo', 'clock', 'watch'], displayAnswer: 'orasan / relo' },
  { question: '🎮 Jarvis Game: Ano ang kulay ng hinog na saging?', answers: ['dilaw', 'yellow'], displayAnswer: 'dilaw / yellow' },
  { question: '🎮 Jarvis Game: Ilang buwan meron sa isang taon?', answers: ['12', 'labindalawa', 'twelve'], displayAnswer: '12 / labindalawa' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa anak ng pusa?', answers: ['kuting', 'kitten'], displayAnswer: 'kuting / kitten' },
  { question: '🎮 Jarvis Game: Anong bahagi ng katawan ang ginagamit sa pakikinig?', answers: ['tainga', 'ear', 'ears'], displayAnswer: 'tainga / ears' },
  { question: '🎮 Jarvis Game: Anong planeta ang tinatawag na Red Planet?', answers: ['mars'], displayAnswer: 'Mars' },
  { question: '🎮 Jarvis Game: Ano ang pambansang wika ng Pilipinas?', answers: ['filipino', 'tagalog'], displayAnswer: 'Filipino' },
  { question: '🎮 Jarvis Game: Ilang oras meron sa isang araw?', answers: ['24', 'dalawamput apat', 'twenty four'], displayAnswer: '24 oras' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa malalaking anyong tubig na maalat?', answers: ['dagat', 'sea', 'ocean', 'karagatan'], displayAnswer: 'dagat / karagatan' },
  { question: '🎮 Jarvis Game: Ano ang ginagamit para magputol ng papel?', answers: ['gunting', 'scissors'], displayAnswer: 'gunting / scissors' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa taong nagtuturo sa paaralan?', answers: ['guro', 'teacher'], displayAnswer: 'guro / teacher' },
  { question: '🎮 Jarvis Game: Ano ang pinakamalaking planeta sa solar system?', answers: ['jupiter'], displayAnswer: 'Jupiter' },
  { question: '🎮 Jarvis Game: Ilang letra meron sa salitang ARAW?', answers: ['4', 'apat', 'four'], displayAnswer: '4 / apat' },
  { question: '🎮 Jarvis Game: Ano ang ginagawa ng isda para makahinga sa tubig?', answers: ['hasang', 'gills'], displayAnswer: 'hasang / gills' },
  { question: '🎮 Jarvis Game: Anong kulay ang pinaghalo ng pula at puti?', answers: ['pink', 'rosas'], displayAnswer: 'pink / rosas' },
  { question: '🎮 Jarvis Game: Ilang paa meron ang manok?', answers: ['2', 'dalawa', 'two'], displayAnswer: '2 / dalawa' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa lugar kung saan nag-aaral ang mga bata?', answers: ['paaralan', 'school', 'eskwela'], displayAnswer: 'paaralan / school' },
  { question: '🎮 Jarvis Game: Ano ang ginagamit para uminom ng tubig?', answers: ['baso', 'glass', 'cup'], displayAnswer: 'baso / cup' },
  { question: '🎮 Jarvis Game: Ano ang kabaliktaran ng mataas?', answers: ['mababa', 'low'], displayAnswer: 'mababa' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa bilog na bagay na ginagamit sa basketball?', answers: ['bola', 'ball'], displayAnswer: 'bola / ball' },
  { question: '🎮 Jarvis Game: Anong prutas ang karaniwang pula at may buto sa gitna?', answers: ['mansanas', 'apple'], displayAnswer: 'mansanas / apple' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa hayop na may mahabang leeg?', answers: ['giraffe', 'dyirap'], displayAnswer: 'giraffe / dyirap' },
  { question: '🎮 Jarvis Game: Ilang minuto meron sa isang oras?', answers: ['60', 'animnapu', 'sixty'], displayAnswer: '60 minuto' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa tubig na bumabagsak mula sa ulap?', answers: ['ulan', 'rain'], displayAnswer: 'ulan / rain' },
  { question: '🎮 Jarvis Game: Ano ang ginagamit para maglinis ng ngipin?', answers: ['toothbrush', 'sipilyo'], displayAnswer: 'toothbrush / sipilyo' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa pagkain sa umaga?', answers: ['almusal', 'breakfast'], displayAnswer: 'almusal / breakfast' },
  { question: '🎮 Jarvis Game: Ano ang kabaliktaran ng araw?', answers: ['gabi', 'night'], displayAnswer: 'gabi / night' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa ilaw sa kalangitan kapag gabi?', answers: ['buwan', 'moon', 'bituin', 'star'], displayAnswer: 'buwan o bituin' },
  { question: '🎮 Jarvis Game: Ilang kulay meron sa rainbow na karaniwang tinuturo?', answers: ['7', 'pito', 'seven'], displayAnswer: '7 / pito' },
  { question: '🎮 Jarvis Game: Ano ang hayop na may shell at mabagal maglakad?', answers: ['pagong', 'turtle'], displayAnswer: 'pagong / turtle' },
  { question: '🎮 Jarvis Game: Anong gamit ang ginagamit para buksan ang pinto?', answers: ['susi', 'key'], displayAnswer: 'susi / key' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa malaking libro na may kahulugan ng mga salita?', answers: ['diksyunaryo', 'dictionary'], displayAnswer: 'diksyunaryo / dictionary' },
  { question: '🎮 Jarvis Game: Ano ang kabaliktaran ng mabilis?', answers: ['mabagal', 'slow'], displayAnswer: 'mabagal / slow' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa taong nagmamaneho ng sasakyan?', answers: ['driver', 'drayber'], displayAnswer: 'driver / drayber' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa bahay ng aso?', answers: ['doghouse', 'kulungan', 'bahay aso'], displayAnswer: 'doghouse / kulungan' },
  { question: '🎮 Jarvis Game: Anong number ang kasunod ng 9?', answers: ['10', 'sampu', 'ten'], displayAnswer: '10 / sampu' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa taong gumagamot sa may sakit?', answers: ['doktor', 'doctor'], displayAnswer: 'doktor / doctor' },
  { question: '🎮 Jarvis Game: Ano ang ginagamit para magluto ng kanin?', answers: ['rice cooker', 'kaldero', 'kaserola'], displayAnswer: 'rice cooker / kaldero' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa maliliit na ilaw sa langit kapag gabi?', answers: ['bituin', 'stars', 'star'], displayAnswer: 'bituin / stars' },
  { question: '🎮 Jarvis Game: Anong hayop ang kilala sa pagsasabi ng meow?', answers: ['pusa', 'cat'], displayAnswer: 'pusa / cat' },
  { question: '🎮 Jarvis Game: Ano ang tawag sa sasakyang lumilipad?', answers: ['eroplano', 'airplane', 'plane'], displayAnswer: 'eroplano / airplane' }
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
const ADMIN_DISPLAY_NAME = 'Ripple';
const ADMIN_PASSWORD = 'rip123';
const ADMIN_NAMES = new Set([ADMIN_DISPLAY_NAME.toLowerCase()]);

function cleanName(name: string) {
  return name.trim().replace(/\s+/g, ' ').slice(0, 40) || 'Guest';
}

function isAdminUserName(name: string) {
  return ADMIN_NAMES.has(cleanName(name).toLowerCase());
}

function isBingoTvUrl() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  return params.get('bingoTV') === '1' || params.get('view') === 'bingo-tv';
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

function isAdminLoginName(name: string) {
  return stripNumberSuffix(cleanName(name)).toLowerCase() === ADMIN_DISPLAY_NAME.toLowerCase();
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

function formatChatDateTime(value: string) {
  const date = new Date(value);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = date.getDate();
  const year = String(date.getFullYear()).slice(-2);
  const hour = date.getHours();
  const hour12 = hour % 12 || 12;
  const minute = String(date.getMinutes()).padStart(2, '0');
  const suffix = hour >= 12 ? 'pm' : 'am';

  return `${weekday} ${month}/${day}/${year} - ${hour12}:${minute}${suffix}`;
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

function pickQuestionForSlot(slot: number, currentMessages: Message[]) {
  const recentQuestionTexts = new Set(
    [...currentMessages]
      .reverse()
      .filter((message) =>
        message.user_name === JARVIS_NAME &&
        (message.event_type === 'game_question' || message.content.startsWith('🎮 Jarvis Game:'))
      )
      .slice(0, QUESTION_REPEAT_WINDOW)
      .map((message) => normalizeText(message.content))
  );

  const startIndex = Math.abs((slot * 7 + Math.floor(slot / jarvisQuestions.length) * 11) % jarvisQuestions.length);

  for (let offset = 0; offset < jarvisQuestions.length; offset += 1) {
    const questionIndex = (startIndex + offset) % jarvisQuestions.length;
    const question = jarvisQuestions[questionIndex];

    if (!recentQuestionTexts.has(normalizeText(question.question))) {
      return { questionIndex, question };
    }
  }

  return { questionIndex: startIndex, question: jarvisQuestions[startIndex] };
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

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], seedText: string) {
  const result = [...items];
  const random = seededRandom(hashString(seedText));

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function makeRoundId() {
  return Date.now().toString(36);
}

function pickBingoPatterns(roundId: string, count = 3) {
  const safeCount = Math.min(3, Math.max(1, count));
  return shuffleWithSeed(BINGO_PATTERN_POOL, `patterns-${roundId}`).slice(0, safeCount);
}

function parseBingoPatternList(content: string) {
  const match = content.match(/Patterns to win:\s*([^.]*)/i);
  if (!match) return [];

  return match[1]
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .map((label) => BINGO_PATTERN_POOL.find((pattern) => pattern.label.toLowerCase() === label))
    .filter(Boolean) as BingoPattern[];
}

function normalizeBingoPlayerName(name: string) {
  return cleanName(name).toLowerCase();
}

function parseBingoEligiblePlayers(content: string) {
  const match = content.match(/\[ELIGIBLE:\s*([^\]]*)\]/i);
  if (!match) return [];

  return match[1]
    .split('|')
    .map((item) => cleanName(item))
    .filter((name) => name && name !== 'Guest');
}

function sanitizeBingoSettingValue(value: string) {
  return value.replace(/[\]|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 48);
}

function parseBingoSettings(content: string) {
  const defaults = {
    callIntervalMs: BINGO_CALL_INTERVAL_MS,
    winnerLimit: 1,
    prizeLabel: BINGO_DEFAULT_PRIZE,
    patternCount: 3,
    allowLateJoiners: false
  };
  const match = content.match(/\[SETTINGS:\s*([^\]]*)\]/i);
  if (!match) return defaults;

  const settings = { ...defaults };
  match[1].split('|').forEach((part) => {
    const [rawKey, ...rawValueParts] = part.split('=');
    const key = rawKey.trim().toLowerCase();
    const value = rawValueParts.join('=').trim();

    if (key === 'callms') {
      const parsed = Number(value);
      if (BINGO_SPEED_OPTIONS.includes(parsed as (typeof BINGO_SPEED_OPTIONS)[number])) {
        settings.callIntervalMs = parsed;
      }
    }

    if (key === 'winnerlimit') {
      const parsed = Number(value);
      if (BINGO_WINNER_LIMIT_OPTIONS.includes(parsed as (typeof BINGO_WINNER_LIMIT_OPTIONS)[number])) {
        settings.winnerLimit = parsed;
      }
    }

    if (key === 'patterncount') {
      const parsed = Number(value);
      if (BINGO_PATTERN_COUNT_OPTIONS.includes(parsed as (typeof BINGO_PATTERN_COUNT_OPTIONS)[number])) {
        settings.patternCount = parsed;
      }
    }

    if (key === 'allowlatejoiners') {
      settings.allowLateJoiners = value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
    }

    if (key === 'prize') {
      settings.prizeLabel = sanitizeBingoSettingValue(value) || BINGO_DEFAULT_PRIZE;
    }
  });

  return settings;
}


function getLatestScoreResetBaseline(currentMessages: Message[]) {
  const latestReset = [...currentMessages].reverse().find((message) => message.event_type === 'score_reset');
  if (!latestReset) return new Map<string, number>();

  const baseline = new Map<string, number>();
  const match = latestReset.content.match(/\[SCORE_BASELINE:\s*([^\]]*)\]/i);
  if (!match) return baseline;

  match[1].split('|').forEach((entry) => {
    const [rawName, rawScore] = entry.split('=');
    const name = cleanName(rawName || '');
    const score = Number(rawScore || 0);
    if (name && Number.isFinite(score)) baseline.set(name, score);
  });

  return baseline;
}

function applyScoreBaseline(scores: UserScore[], baseline: Map<string, number>) {
  return sortScores(
    scores.map((score) => ({
      ...score,
      total_score: Math.max(0, Number(score.total_score || 0) - Number(baseline.get(score.user_name) || 0))
    }))
  ).filter((score) => score.total_score > 0);
}

function getLastChatClearTime(currentMessages: Message[]) {
  const latestClear = [...currentMessages].reverse().find((message) => message.event_type === 'chat_clear');
  return latestClear ? new Date(latestClear.created_at).getTime() : 0;
}

function parseAdminTarget(content: string) {
  const match = content.match(/\[TARGET:\s*([^\]]+)\]/i);
  return match ? cleanName(match[1]) : '';
}

function getActiveAdminTargets(currentMessages: Message[], activeEvent: string, clearEvent: string) {
  const targets = new Set<string>();

  currentMessages.forEach((message) => {
    const target = parseAdminTarget(message.content);
    if (!target) return;

    const normalized = normalizeBingoPlayerName(target);
    if (message.event_type === activeEvent) targets.add(normalized);
    if (message.event_type === clearEvent) targets.delete(normalized);
  });

  return targets;
}

function getBingoJoinedPlayers(currentMessages: Message[], roundId?: string, eligiblePlayers: string[] = []) {
  const players = new Set(eligiblePlayers.map((player) => cleanName(player)).filter(Boolean));
  if (!roundId) return Array.from(players).sort((a, b) => a.localeCompare(b));

  currentMessages.forEach((message) => {
    if (message.event_type !== 'bingo_join') return;
    if (!message.event_key?.startsWith(`bingo-join-${roundId}-`)) return;
    const target = parseAdminTarget(message.content) || message.user_name;
    if (target) players.add(cleanName(target));
  });

  return Array.from(players).sort((a, b) => a.localeCompare(b));
}

function getBingoActualJoinedPlayers(currentMessages: Message[], roundId?: string) {
  const players = new Set<string>();
  if (!roundId) return [];

  currentMessages.forEach((message) => {
    if (message.event_type !== 'bingo_join') return;
    if (!message.event_key?.startsWith(`bingo-join-${roundId}-`)) return;
    const target = parseAdminTarget(message.content) || message.user_name;
    if (target) players.add(cleanName(target));
  });

  return Array.from(players).sort((a, b) => a.localeCompare(b));
}

function getBingoReadyPlayers(currentMessages: Message[], roundId?: string) {
  const players = new Set<string>();
  if (!roundId) return [];

  currentMessages.forEach((message) => {
    if (message.event_type !== 'bingo_ready') return;
    if (!message.event_key?.startsWith(`bingo-ready-${roundId}-`)) return;
    const target = parseAdminTarget(message.content) || message.user_name;
    if (target) players.add(cleanName(target));
  });

  return Array.from(players).sort((a, b) => a.localeCompare(b));
}

function isPlayerBingoReady(readyPlayers: string[], userName: string) {
  if (!userName) return false;
  const normalizedName = normalizeBingoPlayerName(userName);
  return readyPlayers.some((player) => normalizeBingoPlayerName(player) === normalizedName);
}

function allJoinedBingoPlayersReady(joinedPlayers: string[], readyPlayers: string[]) {
  if (!joinedPlayers.length) return false;
  const readySet = new Set(readyPlayers.map((player) => normalizeBingoPlayerName(player)));
  return joinedPlayers.every((player) => readySet.has(normalizeBingoPlayerName(player)));
}

function parseBingoWinnerRecord(message: Message) {
  const content = message.content;
  const name = content.match(/Winner #\d+:\s*([^\s].*?)\s+wins Round/i)?.[1]?.trim() || '';
  const roundId = content.match(/Round\s+([a-z0-9]+)/i)?.[1] || '';
  const pattern = content.match(/with\s+([^.]*)\./i)?.[1]?.trim() || 'Verified pattern';
  const score = content.match(/\+(\d+)\s+score/i)?.[1] || String(BINGO_WIN_SCORE);
  return { name, roundId, pattern, score, time: message.created_at, verification: 'Verified by Jarvis' };
}

function getDefaultAvatar(name: string) {
  return USER_PROFILE_AVATARS[getUserHue(name) % USER_PROFILE_AVATARS.length];
}

function getProfileColorStyle(colorKey: string, name: string): CSSProperties {
  const profileColor = USER_PROFILE_COLORS.find((item) => item.key === colorKey);
  if (!profileColor) return getUserAccentStyle(name);
  return { '--user-color': profileColor.color, '--user-soft': profileColor.soft } as CSSProperties;
}

function encodeQrData(value: string) {
  return encodeURIComponent(value);
}

function formatBingoSeconds(ms: number) {
  return `${Math.round(ms / 1000)} sec`;
}

function eventSafeSlug(value: string) {
  return normalizeText(value).replace(/\s+/g, '-').slice(0, 40) || 'player';
}

function getBingoWinnerMessages(currentMessages: Message[], roundId?: string, startedAt?: string) {
  if (!roundId) return [];
  const startTime = startedAt ? new Date(startedAt).getTime() : 0;

  return currentMessages.filter((message) => {
    const messageTime = new Date(message.created_at).getTime();
    return (
      message.event_type === 'bingo_winner' &&
      messageTime >= startTime &&
      Boolean(message.event_key?.includes(roundId))
    );
  });
}

function isBingoEligiblePlayer(round: ActiveBingoRound | null, userName: string) {
  if (!round || !userName) return false;

  if (round.allowLateJoiners) return true;

  // Backward-compatible: older Bingo start messages had no eligible-player lock.
  if (!round.eligiblePlayers.length) return true;

  const normalizedUserName = normalizeBingoPlayerName(userName);
  return round.eligiblePlayers.some((player) => normalizeBingoPlayerName(player) === normalizedUserName);
}

function getLatestBingoRound(currentMessages: Message[]): ActiveBingoRound | null {
  const latestStart = [...currentMessages]
    .reverse()
    .find((message) => message.user_name === JARVIS_NAME && message.event_type === 'bingo_start' && message.event_key);

  if (!latestStart?.event_key) return null;

  const roundId = latestStart.event_key.replace('bingo-start-', '');
  const parsedPatterns = parseBingoPatternList(latestStart.content);

  const settings = parseBingoSettings(latestStart.content);

  return {
    roundId,
    patterns: parsedPatterns.length ? parsedPatterns : pickBingoPatterns(roundId, settings.patternCount),
    startedAt: latestStart.created_at,
    eligiblePlayers: parseBingoEligiblePlayers(latestStart.content),
    ...settings
  };
}

function getActiveBingoRound(currentMessages: Message[]): ActiveBingoRound | null {
  const latestStart = [...currentMessages]
    .reverse()
    .find((message) => message.user_name === JARVIS_NAME && message.event_type === 'bingo_start' && message.event_key);

  if (!latestStart?.event_key) return null;

  const roundId = latestStart.event_key.replace('bingo-start-', '');
  const startTime = new Date(latestStart.created_at).getTime();
  const settings = parseBingoSettings(latestStart.content);
  const winnerMessages = getBingoWinnerMessages(currentMessages, roundId, latestStart.created_at);
  const hasManualEnd = currentMessages.some((message) => {
    const messageTime = new Date(message.created_at).getTime();
    return (
      messageTime > startTime &&
      message.event_type === 'bingo_end' &&
      Boolean(message.event_key?.includes(roundId))
    );
  });
  const hasEnded = hasManualEnd || winnerMessages.length >= settings.winnerLimit;

  if (hasEnded) return null;

  const parsedPatterns = parseBingoPatternList(latestStart.content);

  return {
    roundId,
    patterns: parsedPatterns.length ? parsedPatterns : pickBingoPatterns(roundId, settings.patternCount),
    startedAt: latestStart.created_at,
    eligiblePlayers: parseBingoEligiblePlayers(latestStart.content),
    ...settings
  };
}

function numberToBingoLabel(number: number) {
  const column = BINGO_COLUMNS.find((item) => number >= item.min && number <= item.max);
  return `${column?.letter || '?'}-${number}`;
}

function parseBingoCallNumber(content: string) {
  const match = content.match(/([BINGO])-\s*(\d{1,2})/i);
  if (!match) return null;

  const number = Number(match[2]);
  return Number.isFinite(number) && number >= 1 && number <= 75 ? number : null;
}

function getBingoCalledNumbers(currentMessages: Message[], roundId?: string) {
  if (!roundId) return [];

  const roundEvents = currentMessages.filter((message) => message.event_key?.includes(roundId));
  const latestResetTime = [...roundEvents]
    .reverse()
    .find((message) => message.event_type === 'bingo_reset_calls');
  const resetTime = latestResetTime ? new Date(latestResetTime.created_at).getTime() : 0;
  const seenNumbers = new Set<number>();
  const calledNumbers: number[] = [];

  [...currentMessages]
    .filter((message) => {
      const messageTime = new Date(message.created_at).getTime();
      return (
        message.event_type === 'bingo_call' &&
        message.event_key?.startsWith(`bingo-call-${roundId}-`) &&
        messageTime > resetTime
      );
    })
    .sort((a, b) => {
      const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (timeDiff !== 0) return timeDiff;
      return Number(a.id || 0) - Number(b.id || 0);
    })
    .forEach((message) => {
      const number = parseBingoCallNumber(message.content);
      if (typeof number !== 'number' || seenNumbers.has(number)) return;
      seenNumbers.add(number);
      calledNumbers.push(number);
    });

  return calledNumbers;
}

function getBingoCallOrder(roundId: string) {
  return shuffleWithSeed(
    Array.from({ length: 75 }, (_, index) => index + 1),
    `calls-${roundId}`
  );
}

function generateBingoCard(seedText: string): BingoCellValue[][] {
  const card: BingoCellValue[][] = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 0));

  BINGO_COLUMNS.forEach((column, columnIndex) => {
    const numbers = shuffleWithSeed(
      Array.from({ length: column.max - column.min + 1 }, (_, index) => column.min + index),
      `${seedText}-${column.letter}`
    );

    for (let rowIndex = 0; rowIndex < 5; rowIndex += 1) {
      card[rowIndex][columnIndex] = columnIndex === 2 && rowIndex === 2 ? 'FREE' : numbers.pop() || column.min;
    }
  });

  return card;
}


function getBingoCardSeed(roundId: string, userName: string, cardIndex: number, mode: BingoCardMode, choice: string, seed: string) {
  const cleanUser = eventSafeSlug(userName || 'player');
  const cleanChoice = eventSafeSlug(choice || 'lucky-a');
  const cleanSeed = eventSafeSlug(seed || 'default');

  if (mode === 'same') {
    return `${roundId}:${cleanUser}:same-card:${cleanChoice}:${cleanSeed}`;
  }

  if (mode === 'choose') {
    return `${roundId}:${cleanUser}:chosen-card:${cleanChoice}:card-${cardIndex + 1}:${cleanSeed}`;
  }

  return `${roundId}:${cleanUser}:random-card-${cardIndex + 1}:${cleanSeed}`;
}

function generatePlayerBingoCards(
  roundId: string,
  userName: string,
  cardCount: number,
  mode: BingoCardMode,
  choice: string,
  seed: string
) {
  const safeCount = Math.max(1, Math.min(4, Number(cardCount) || 1));
  return Array.from({ length: safeCount }, (_, cardIndex) =>
    generateBingoCard(getBingoCardSeed(roundId, userName, cardIndex, mode, choice, seed))
  );
}

function uniqueCells(cells: BingoCell[]) {
  const seen = new Set<string>();
  return cells.filter(([row, column]) => {
    const key = `${row}-${column}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getBingoPatternCandidates(patternKey: BingoPatternKey) {
  const allCells = Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, column) => [row, column] as BingoCell)
  ).flat();

  const rows = Array.from({ length: 5 }, (_, row) => Array.from({ length: 5 }, (_, column) => [row, column] as BingoCell));
  const columns = Array.from({ length: 5 }, (_, column) => Array.from({ length: 5 }, (_, row) => [row, column] as BingoCell));
  const diagonalDown = Array.from({ length: 5 }, (_, index) => [index, index] as BingoCell);
  const diagonalUp = Array.from({ length: 5 }, (_, index) => [index, 4 - index] as BingoCell);

  switch (patternKey) {
    case 'straight_line':
      return [...rows, ...columns, diagonalDown, diagonalUp];
    case 'four_corners':
      return [[[0, 0], [0, 4], [4, 0], [4, 4]] as BingoCell[]];
    case 'letter_x':
      return [uniqueCells([...diagonalDown, ...diagonalUp])];
    case 'letter_t':
      return [uniqueCells([...rows[0], ...columns[2]])];
    case 'letter_l':
      return [uniqueCells([...columns[0], ...rows[4]])];
    case 'letter_h':
      return [uniqueCells([...columns[0], ...columns[4], ...rows[2]])];
    case 'cross':
      return [uniqueCells([...columns[2], ...rows[2]])];
    case 'diamond':
      return [
        [
          [0, 2],
          [1, 1],
          [1, 3],
          [2, 0],
          [2, 2],
          [2, 4],
          [3, 1],
          [3, 3],
          [4, 2]
        ] as BingoCell[]
      ];
    case 'picture_frame':
      return [allCells.filter(([row, column]) => row === 0 || row === 4 || column === 0 || column === 4)];
    case 'blackout':
      return [allCells];
    default:
      return [];
  }
}

function getBingoPreviewCells(patternKey: BingoPatternKey) {
  const candidates = getBingoPatternCandidates(patternKey);
  const preview = patternKey === 'straight_line' ? candidates[2] || candidates[0] : candidates[0];
  return new Set((preview || []).map(([row, column]) => `${row}-${column}`));
}

function bingoCellIsCovered(card: BingoCellValue[][], row: number, column: number, calledNumbers: Set<number>) {
  const value = card[row]?.[column];
  return value === 'FREE' || (typeof value === 'number' && calledNumbers.has(value));
}

function verifyBingoCard(card: BingoCellValue[][], calledNumbers: Set<number>, patterns: BingoPattern[]) {
  return patterns.find((pattern) =>
    getBingoPatternCandidates(pattern.key).some((candidate) =>
      candidate.every(([row, column]) => bingoCellIsCovered(card, row, column, calledNumbers))
    )
  );
}

function isJarvisBingoStartRequest(message: string) {
  const normalized = normalizeText(message);
  if (!normalized.includes('bingo')) return false;

  return (
    normalized.includes('start') ||
    normalized.includes('simula') ||
    normalized.includes('umpisa') ||
    normalized.includes('host') ||
    normalized.includes('laro') ||
    normalized.includes('game') ||
    normalized.includes('pa bingo') ||
    normalized.includes('mag bingo') ||
    normalized === 'bingo'
  );
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [myName, setMyName] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [selectedSender, setSelectedSender] = useState('');
  const [nameError, setNameError] = useState('');
  const [nameNotice, setNameNotice] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [statusText, setStatusText] = useState('Jarvis is online');
  const [scores, setScores] = useState<UserScore[]>([]);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [celebrationText, setCelebrationText] = useState('');
  const [isBingoOpen, setIsBingoOpen] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [isInvitePanelOpen, setIsInvitePanelOpen] = useState(false);
  const [isBingoParticipant, setIsBingoParticipant] = useState(false);
  const [bingoMarkedNumbers, setBingoMarkedNumbers] = useState<number[]>([]);
  const [bingoNotice, setBingoNotice] = useState('');
  const [bingoMarkColor, setBingoMarkColor] = useState('blue');
  const [bingoCardCount, setBingoCardCount] = useState<number>(1);
  const [bingoCardMode, setBingoCardMode] = useState<BingoCardMode>('random');
  const [bingoCardChoice, setBingoCardChoice] = useState('lucky-a');
  const [bingoCardSeed, setBingoCardSeed] = useState('default');
  const [bingoCardNotice, setBingoCardNotice] = useState('');
  const [bingoCallSpeedMs, setBingoCallSpeedMs] = useState<number>(BINGO_CALL_INTERVAL_MS);
  const [bingoWinnerLimit, setBingoWinnerLimit] = useState<number>(1);
  const [bingoPatternCount, setBingoPatternCount] = useState<number>(3);
  const [allowLateBingoJoiners, setAllowLateBingoJoiners] = useState(false);
  const [bingoPrizeLabel, setBingoPrizeLabel] = useState(BINGO_DEFAULT_PRIZE);
  const [adminSelectedPlayer, setAdminSelectedPlayer] = useState('');
  const [bingoCountdown, setBingoCountdown] = useState(0);
  const [userAvatar, setUserAvatar] = useState('😀');
  const [userProfileColor, setUserProfileColor] = useState('sky');
  const [soundVolumes, setSoundVolumes] = useState<Record<SoundKey, number>>({ ...DEFAULT_SOUND_VOLUMES });
  const [isBingoTvMode, setIsBingoTvMode] = useState(() => isBingoTvUrl());
  const [bingoTvSyncAt, setBingoTvSyncAt] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const currentPresenceKeyRef = useRef('');
  const messagesRef = useRef<Message[]>([]);
  const previousTopScoreRef = useRef<UserScore | null>(null);
  const celebrationTimerRef = useRef<number | null>(null);
  const activeBingoRoundRef = useRef<ActiveBingoRound | null>(null);
  const pendingBingoStartRef = useRef('');
  const bingoCalledNumbersRef = useRef<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastBingoCallSoundRef = useRef('');
  const isBingoTvModeRef = useRef(isBingoTvMode);

  const onlineCount = onlineUsers.length;
  const senderName = myName;
  const isAdminLoginAttempt = useMemo(() => isAdminLoginName(nameDraft), [nameDraft]);
  const isAdminUser = useMemo(
    () => isAdminUserName(myName) && isAdminAuthenticated,
    [myName, isAdminAuthenticated]
  );

  const scoreResetBaseline = useMemo(() => getLatestScoreResetBaseline(messages), [messages]);
  const displayScores = useMemo(() => applyScoreBaseline(scores, scoreResetBaseline), [scores, scoreResetBaseline]);
  const topScore = useMemo(() => sortScores(displayScores)[0] || null, [displayScores]);

  const scoreMap = useMemo(() => {
    const map = new Map<string, number>();
    displayScores.forEach((score) => map.set(score.user_name, Number(score.total_score || 0)));
    return map;
  }, [displayScores]);

  const mutedUsers = useMemo(() => getActiveAdminTargets(messages, 'admin_mute', 'admin_unmute'), [messages]);
  const kickedUsers = useMemo(() => getActiveAdminTargets(messages, 'admin_kick', 'admin_restore'), [messages]);
  const isMuted = myName ? mutedUsers.has(normalizeBingoPlayerName(myName)) : false;
  const chatClearTime = useMemo(() => getLastChatClearTime(messages), [messages]);
  const displayedMessages = useMemo(
    () => messages.filter((message) => new Date(message.created_at).getTime() > chatClearTime || message.event_type === 'chat_clear'),
    [messages, chatClearTime]
  );

  const activeBingoRound = useMemo(() => getActiveBingoRound(messages), [messages]);
  const latestBingoRound = useMemo(() => getLatestBingoRound(messages), [messages]);
  const bingoTvRound = activeBingoRound || latestBingoRound;
  const bingoCalledNumbers = useMemo(
    () => getBingoCalledNumbers(messages, activeBingoRound?.roundId),
    [messages, activeBingoRound?.roundId]
  );
  const bingoTvCalledNumbers = useMemo(
    () => getBingoCalledNumbers(messages, bingoTvRound?.roundId),
    [messages, bingoTvRound?.roundId]
  );
  const bingoCalledSet = useMemo(() => new Set(bingoCalledNumbers), [bingoCalledNumbers]);
  const bingoMarkedSet = useMemo(() => new Set(bingoMarkedNumbers), [bingoMarkedNumbers]);
  const bingoCards = useMemo(
    () =>
      myName && activeBingoRound
        ? generatePlayerBingoCards(
            activeBingoRound.roundId,
            myName,
            bingoCardCount,
            bingoCardMode,
            bingoCardChoice,
            bingoCardSeed
          )
        : [],
    [activeBingoRound?.roundId, myName, bingoCardCount, bingoCardMode, bingoCardChoice, bingoCardSeed]
  );
  const bingoCard = bingoCards[0] || null;
  const latestBingoCall = bingoCalledNumbers.length ? bingoCalledNumbers[bingoCalledNumbers.length - 1] : null;
  const nextBingoCallNumber = useMemo(() => {
    if (!activeBingoRound) return null;
    return getBingoCallOrder(activeBingoRound.roundId)[bingoCalledNumbers.length] || null;
  }, [activeBingoRound?.roundId, bingoCalledNumbers.length]);

  const bingoVerificationMessages = useMemo(() => {
    if (!bingoTvRound) return [];
    const startedAt = new Date(bingoTvRound.startedAt).getTime();

    return messages.filter((message) => {
      const messageTime = new Date(message.created_at).getTime();
      const isVerificationEvent = message.event_type === 'bingo_winner' || message.event_type === 'bingo_invalid';
      return isVerificationEvent && messageTime >= startedAt;
    });
  }, [messages, bingoTvRound?.roundId, bingoTvRound?.startedAt]);

  const latestBingoVerification = bingoVerificationMessages[bingoVerificationMessages.length - 1] || null;
  const activeBingoWinners = useMemo(
    () => (activeBingoRound ? getBingoWinnerMessages(messages, activeBingoRound.roundId, activeBingoRound.startedAt) : []),
    [messages, activeBingoRound?.roundId, activeBingoRound?.startedAt]
  );
  const bingoWinnerHistory = useMemo(
    () => messages.filter((message) => message.event_type === 'bingo_winner').slice(-20).reverse(),
    [messages]
  );
  const bingoWinnerRecords = useMemo(() => bingoWinnerHistory.map(parseBingoWinnerRecord), [bingoWinnerHistory]);
  const bingoJoinedPlayers = useMemo(
    () => getBingoJoinedPlayers(messages, bingoTvRound?.roundId, bingoTvRound?.eligiblePlayers || []),
    [messages, bingoTvRound?.roundId, bingoTvRound?.eligiblePlayers.join('|')]
  );
  const bingoActualJoinedPlayers = useMemo(
    () => getBingoActualJoinedPlayers(messages, activeBingoRound?.roundId),
    [messages, activeBingoRound?.roundId]
  );
  const bingoTvActualJoinedPlayers = useMemo(
    () => getBingoActualJoinedPlayers(messages, bingoTvRound?.roundId),
    [messages, bingoTvRound?.roundId]
  );
  const bingoReadyPlayers = useMemo(
    () => getBingoReadyPlayers(messages, activeBingoRound?.roundId),
    [messages, activeBingoRound?.roundId]
  );
  const bingoTvReadyPlayers = useMemo(
    () => getBingoReadyPlayers(messages, bingoTvRound?.roundId),
    [messages, bingoTvRound?.roundId]
  );
  const isCurrentPlayerBingoReady = useMemo(
    () => isPlayerBingoReady(bingoReadyPlayers, myName),
    [bingoReadyPlayers, myName]
  );
  const canEditBingoCards = Boolean(activeBingoRound && (!isBingoParticipant || (!isCurrentPlayerBingoReady && bingoCalledNumbers.length === 0)));
  const allActiveJoinedPlayersReady = useMemo(
    () => allJoinedBingoPlayersReady(bingoActualJoinedPlayers, bingoReadyPlayers),
    [bingoActualJoinedPlayers, bingoReadyPlayers]
  );
  const adminCardPlayer = adminSelectedPlayer || bingoJoinedPlayers[0] || myName;
  const adminPreviewCard = useMemo(
    () => (bingoTvRound && adminCardPlayer ? generateBingoCard(`${bingoTvRound.roundId}:${adminCardPlayer}`) : null),
    [bingoTvRound?.roundId, adminCardPlayer]
  );
  const latestBingoTvMessage = useMemo(() => {
    if (!bingoTvRound) return null;
    const startedAt = new Date(bingoTvRound.startedAt).getTime();

    return [...messages].reverse().find((message) => {
      const messageTime = new Date(message.created_at).getTime();
      return messageTime >= startedAt && Boolean(message.event_type?.startsWith('bingo_'));
    }) || null;
  }, [messages, bingoTvRound?.roundId, bingoTvRound?.startedAt]);

  const chatInviteUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';

  const canJoinActiveBingo = useMemo(
    () => Boolean(activeBingoRound && myName && isBingoEligiblePlayer(activeBingoRound, myName)),
    [activeBingoRound?.roundId, activeBingoRound?.eligiblePlayers.join('|'), myName]
  );

  const selectedBingoMarkColor =
    BINGO_MARK_COLORS.find((color) => color.key === bingoMarkColor) || BINGO_MARK_COLORS[0];

  const bingoMarkStyle = useMemo(
    () =>
      ({
        '--bingo-mark-fill': selectedBingoMarkColor.fill,
        '--bingo-mark-border': selectedBingoMarkColor.border
      }) as CSSProperties,
    [selectedBingoMarkColor.fill, selectedBingoMarkColor.border]
  );

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
    const wantsAdminAccess = isAdminLoginName(baseName);

    if (isReservedName(baseName)) {
      setNameError('Reserved ang name na iyan. Gumamit ng totoong participant name.');
      return '';
    }

    if (wantsAdminAccess && adminPassword.trim() !== ADMIN_PASSWORD) {
      setIsAdminAuthenticated(false);
      localStorage.removeItem('chat_admin_verified');
      setNameError('Admin password required para mag-login bilang Ripple.');
      return '';
    }

    const uniqueName = wantsAdminAccess
      ? ADMIN_DISPLAY_NAME
      : makeUniqueParticipantName(baseName, getTakenParticipantNames(), myName);

    setMyName(uniqueName);
    setNameDraft(uniqueName);
    setSelectedSender(uniqueName);
    localStorage.setItem('chat_user_name', uniqueName);

    if (wantsAdminAccess) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('chat_admin_verified', '1');
      setAdminPassword('');
      setNameNotice('Ripple admin verified. Admin tools are now unlocked on this device.');
    } else {
      setIsAdminAuthenticated(false);
      localStorage.removeItem('chat_admin_verified');
      setAdminPassword('');

      if (uniqueName !== cleanedName) {
        setNameNotice(`May kaparehong name, kaya ginawa nating: ${uniqueName}`);
      } else {
        setNameNotice('Name confirmed. Pwede ka nang mag-chat.');
      }
    }

    return uniqueName;
  }


  function getAudioContext() {
    if (typeof window === 'undefined') return null;

    const AudioContextConstructor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextConstructor) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    return audioContextRef.current;
  }

  function playToneSequence(tones: Array<{ frequency: number; start: number; duration: number; volume: number }>) {
    try {
      const audioContext = getAudioContext();
      if (!audioContext) return;

      if (audioContext.state === 'suspended') {
        void audioContext.resume();
      }

      tones.forEach((tone) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(tone.frequency, audioContext.currentTime + tone.start);
        gain.gain.setValueAtTime(0.0001, audioContext.currentTime + tone.start);
        gain.gain.exponentialRampToValueAtTime(tone.volume, audioContext.currentTime + tone.start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + tone.start + tone.duration);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(audioContext.currentTime + tone.start);
        oscillator.stop(audioContext.currentTime + tone.start + tone.duration + 0.03);
      });
    } catch (error) {
      console.warn('Bingo sound skipped:', getErrorText(error));
    }
  }

  function enableBingoSounds() {
    const audioContext = getAudioContext();
    if (audioContext?.state === 'suspended') {
      void audioContext.resume();
    }
    setSoundEnabled(true);
    playToneSequence([{ frequency: 740, start: 0, duration: 0.08, volume: 0.05 }]);
  }

  function getSoundVolume(key: SoundKey, base: number) {
    return Math.max(0, Math.min(1, soundVolumes[key] ?? DEFAULT_SOUND_VOLUMES[key])) * base;
  }

  function playBingoCallSound() {
    if (!soundEnabled && audioContextRef.current?.state !== 'running') return;
    playToneSequence([
      { frequency: 880, start: 0, duration: 0.09, volume: getSoundVolume('call', 0.10) },
      { frequency: 1175, start: 0.11, duration: 0.14, volume: getSoundVolume('call', 0.09) }
    ]);
  }

  function playWinnerSound() {
    if (!soundEnabled && audioContextRef.current?.state !== 'running') return;
    playToneSequence([
      { frequency: 659, start: 0, duration: 0.12, volume: getSoundVolume('winner', 0.08) },
      { frequency: 880, start: 0.13, duration: 0.12, volume: getSoundVolume('winner', 0.08) },
      { frequency: 1319, start: 0.28, duration: 0.2, volume: getSoundVolume('winner', 0.075) }
    ]);
  }

  function playInvalidClaimSound() {
    if (!soundEnabled && audioContextRef.current?.state !== 'running') return;
    playToneSequence([
      { frequency: 220, start: 0, duration: 0.13, volume: getSoundVolume('invalid', 0.08) },
      { frequency: 180, start: 0.15, duration: 0.18, volume: getSoundVolume('invalid', 0.07) }
    ]);
  }

  function playCountdownSound() {
    if (!soundEnabled && audioContextRef.current?.state !== 'running') return;
    playToneSequence([{ frequency: 740, start: 0, duration: 0.1, volume: getSoundVolume('countdown', 0.065) }]);
  }

  function playConfettiSound() {
    if (!soundEnabled && audioContextRef.current?.state !== 'running') return;
    playToneSequence([
      { frequency: 784, start: 0, duration: 0.08, volume: getSoundVolume('confetti', 0.08) },
      { frequency: 988, start: 0.09, duration: 0.08, volume: getSoundVolume('confetti', 0.08) },
      { frequency: 1319, start: 0.18, duration: 0.12, volume: getSoundVolume('confetti', 0.085) },
      { frequency: 1568, start: 0.31, duration: 0.15, volume: getSoundVolume('confetti', 0.07) }
    ]);
  }

  function changeSoundVolume(key: SoundKey, value: string) {
    const next = Math.max(0, Math.min(1, Number(value)));
    if (!Number.isFinite(next)) return;
    setSoundVolumes((current) => {
      const updated = { ...current, [key]: next };
      localStorage.setItem('bingo_sound_volumes', JSON.stringify(updated));
      return updated;
    });
  }

  function getBingoTvUrl() {
    const tvUrl = new URL(window.location.href);
    tvUrl.searchParams.set('bingoTV', '1');
    return tvUrl.toString();
  }

  function openBingoTvWindow() {
    const openedWindow = window.open(getBingoTvUrl(), 'jarvis-bingo-tv', 'popup=yes,width=1920,height=1080');
    if (openedWindow) {
      openedWindow.focus();
    }
    return openedWindow;
  }

  function openBingoTvScreen() {
    if (!isAdminUser) return;
    enableBingoSounds();
    const openedWindow = openBingoTvWindow();
    if (!openedWindow) {
      setTemporaryBingoNotice('BingoTV popup was blocked. Allow popups, then click BingoTV again.');
    }
  }

  function enterBingoTvFullscreen() {
    enableBingoSounds();
    void document.documentElement.requestFullscreen?.();
  }

  function setTemporaryBingoNotice(message: string) {
    setBingoNotice(message);
    window.setTimeout(() => setBingoNotice(''), 2500);
  }

  function saveBingoMarks(roundId: string, userName: string, marks: number[]) {
    localStorage.setItem(`bingo_marks_${roundId}_${userName}`, JSON.stringify(marks));
  }

  function changeBingoMarkColor(colorKey: string) {
    if (!BINGO_MARK_COLORS.some((color) => color.key === colorKey)) return;
    setBingoMarkColor(colorKey);
    localStorage.setItem('bingo_mark_color', colorKey);
  }

  function clearCurrentBingoMarks() {
    if (activeBingoRound && myName) {
      localStorage.removeItem(`bingo_marks_${activeBingoRound.roundId}_${myName}`);
    }
    setBingoMarkedNumbers([]);
  }

  function changeBingoCardCount(value: string) {
    const nextCount = Number(value);
    if (!BINGO_CARD_COUNT_OPTIONS.includes(nextCount as (typeof BINGO_CARD_COUNT_OPTIONS)[number])) return;
    if (!canEditBingoCards) {
      setBingoCardNotice('Card settings are locked after the first Bingo call.');
      return;
    }
    setBingoCardCount(nextCount);
    localStorage.setItem('bingo_card_count', String(nextCount));
    clearCurrentBingoMarks();
    setBingoCardNotice(`${nextCount} Bingo card${nextCount > 1 ? 's' : ''} ready.`);
  }

  function changeBingoCardMode(value: string) {
    if (!BINGO_CARD_MODES.some((mode) => mode.key === value)) return;
    if (!canEditBingoCards) {
      setBingoCardNotice('Card settings are locked after the first Bingo call.');
      return;
    }
    const nextMode = value as BingoCardMode;
    setBingoCardMode(nextMode);
    localStorage.setItem('bingo_card_mode', nextMode);
    clearCurrentBingoMarks();
    setBingoCardNotice(nextMode === 'same' ? 'Same card mode enabled.' : nextMode === 'choose' ? 'Choose card mode enabled.' : 'Random cards enabled.');
  }

  function changeBingoCardChoice(value: string) {
    if (!BINGO_CARD_CHOICES.some((choice) => choice.key === value)) return;
    if (!canEditBingoCards) {
      setBingoCardNotice('Card settings are locked after the first Bingo call.');
      return;
    }
    setBingoCardChoice(value);
    localStorage.setItem('bingo_card_choice', value);
    clearCurrentBingoMarks();
    setBingoCardNotice('Selected card family updated.');
  }

  function rerollBingoCards() {
    if (!canEditBingoCards || !activeBingoRound || !myName) {
      setBingoCardNotice('Cards can only be changed before the first Bingo call.');
      return;
    }
    const nextSeed = `${Date.now()}-${Math.floor(Math.random() * 99999)}`;
    setBingoCardSeed(nextSeed);
    localStorage.setItem('bingo_card_seed', nextSeed);
    localStorage.setItem(`bingo_card_seed_${activeBingoRound.roundId}_${myName}`, nextSeed);
    clearCurrentBingoMarks();
    setBingoCardNotice('New Bingo card layout generated.');
  }

  function changeBingoCallSpeed(value: string) {
    const nextSpeed = Number(value);
    if (!BINGO_SPEED_OPTIONS.includes(nextSpeed as (typeof BINGO_SPEED_OPTIONS)[number])) return;
    setBingoCallSpeedMs(nextSpeed);
    localStorage.setItem('bingo_call_speed_ms', String(nextSpeed));
  }

  function changeBingoWinnerLimit(value: string) {
    const nextLimit = Number(value);
    if (!BINGO_WINNER_LIMIT_OPTIONS.includes(nextLimit as (typeof BINGO_WINNER_LIMIT_OPTIONS)[number])) return;
    setBingoWinnerLimit(nextLimit);
    localStorage.setItem('bingo_winner_limit', String(nextLimit));
  }

  function changeBingoPatternCount(value: string) {
    const nextCount = Number(value);
    if (!BINGO_PATTERN_COUNT_OPTIONS.includes(nextCount as (typeof BINGO_PATTERN_COUNT_OPTIONS)[number])) return;
    setBingoPatternCount(nextCount);
    localStorage.setItem('bingo_pattern_count', String(nextCount));
  }

  function changeAllowLateBingoJoiners(value: boolean) {
    setAllowLateBingoJoiners(value);
    localStorage.setItem('bingo_allow_late_joiners', value ? '1' : '0');
  }

  function changeUserAvatar(value: string) {
    if (!USER_PROFILE_AVATARS.includes(value as (typeof USER_PROFILE_AVATARS)[number])) return;
    setUserAvatar(value);
    localStorage.setItem('chat_user_avatar', value);
  }

  function changeUserProfileColor(value: string) {
    if (!USER_PROFILE_COLORS.some((color) => color.key === value)) return;
    setUserProfileColor(value);
    localStorage.setItem('chat_profile_color', value);
  }

  function changeBingoPrizeLabel(value: string) {
    const nextPrize = sanitizeBingoSettingValue(value);
    setBingoPrizeLabel(nextPrize);
    localStorage.setItem('bingo_prize_label', nextPrize);
  }

  async function endBingoRound() {
    const round = activeBingoRoundRef.current;
    if (!isAdminUser || !round) return;

    await insertUniqueEvent(
      `🛑 Ripple ended Bingo Round ${round.roundId}. Winner report is now closed.`,
      JARVIS_NAME,
      `bingo-end-${round.roundId}-manual`,
      'bingo_end',
      { isAi: true }
    );
    setTemporaryBingoNotice('Bingo round ended by Ripple admin.');
  }



  async function resetBingoCalls() {
    const round = activeBingoRoundRef.current;
    if (!isAdminUser || !round) return;

    await insertUniqueEvent(
      `🔄 Ripple reset the called numbers for Bingo Round ${round.roundId}. Jarvis will start calling again from Call #1.`,
      JARVIS_NAME,
      `bingo-reset-calls-${round.roundId}-${Date.now()}`,
      'bingo_reset_calls',
      { isAi: true }
    );
    setTemporaryBingoNotice('Bingo calls reset for this round.');
  }

  async function resetScoreDisplay() {
    if (!isAdminUser) return;
    const baseline = scores.map((score) => `${cleanName(score.user_name)}=${Number(score.total_score || 0)}`).join('|');
    await insertUniqueEvent(
      `🔄 Ripple reset the visible scoreboard from this point. [SCORE_BASELINE: ${baseline}]`,
      'System',
      `score-reset-${Date.now()}`,
      'score_reset',
      { isAi: true }
    );
    setTemporaryBingoNotice('Scoreboard display reset. Future scores count from zero.');
  }

  async function clearChatDisplay() {
    if (!isAdminUser) return;
    await insertUniqueEvent(
      '🧹 Ripple cleared the chat display. New messages will show from here.',
      'System',
      `chat-clear-${Date.now()}`,
      'chat_clear',
      { isAi: true }
    );
    setTemporaryBingoNotice('Chat display cleared.');
  }

  async function muteUser(targetName: string) {
    if (!isAdminUser || !targetName || isAdminUserName(targetName)) return;
    await insertUniqueEvent(
      `🔇 Ripple muted ${targetName}. [TARGET: ${targetName}]`,
      'System',
      `admin-mute-${eventSafeSlug(targetName)}-${Date.now()}`,
      'admin_mute',
      { isAi: true }
    );
  }

  async function unmuteUser(targetName: string) {
    if (!isAdminUser || !targetName) return;
    await insertUniqueEvent(
      `🔊 Ripple unmuted ${targetName}. [TARGET: ${targetName}]`,
      'System',
      `admin-unmute-${eventSafeSlug(targetName)}-${Date.now()}`,
      'admin_unmute',
      { isAi: true }
    );
  }

  async function kickUser(targetName: string) {
    if (!isAdminUser || !targetName || isAdminUserName(targetName)) return;
    await insertUniqueEvent(
      `🚪 Ripple kicked ${targetName} from the chatroom. [TARGET: ${targetName}]`,
      'System',
      `admin-kick-${eventSafeSlug(targetName)}-${Date.now()}`,
      'admin_kick',
      { isAi: true }
    );
  }

  function leaveBingoRound() {
    if (!activeBingoRound || !myName) return;

    localStorage.removeItem(`bingo_joined_${activeBingoRound.roundId}_${myName}`);
    localStorage.removeItem(`bingo_marks_${activeBingoRound.roundId}_${myName}`);
    localStorage.removeItem(`bingo_card_seed_${activeBingoRound.roundId}_${myName}`);
    setIsBingoParticipant(false);
    setBingoMarkedNumbers([]);
    setTemporaryBingoNotice('Umalis ka sa Bingo. Pwede kang sumali ulit habang eligible pa ang round.');
  }

  function logoutChatroom() {
    const currentName = myName;

    if (activeBingoRound && currentName) {
      localStorage.removeItem(`bingo_joined_${activeBingoRound.roundId}_${currentName}`);
      localStorage.removeItem(`bingo_marks_${activeBingoRound.roundId}_${currentName}`);
      localStorage.removeItem(`bingo_card_seed_${activeBingoRound.roundId}_${currentName}`);
    }

    channelRef.current?.untrack();
    localStorage.removeItem('chat_user_name');
    localStorage.removeItem('chat_admin_verified');
    setIsAdminAuthenticated(false);
    setAdminPassword('');
    setMyName('');
    setNameDraft('');
    setSelectedSender('');
    setInput('');
    setNameError('');
    setNameNotice('Logged out. Enter your name to join again.');
    setIsBingoParticipant(false);
    setBingoMarkedNumbers([]);
    setIsBingoOpen(false);
  }

  function joinBingoRound() {
    if (!myName) {
      setNameError('Maglagay muna ng participant name bago sumali sa Bingo.');
      return;
    }

    if (!activeBingoRound) {
      setTemporaryBingoNotice('Wala pang active Bingo round. Pindutin ang Start Bingo.');
      setIsBingoOpen(true);
      return;
    }

    if (!isBingoEligiblePlayer(activeBingoRound, myName)) {
      setIsBingoOpen(true);
      setTemporaryBingoNotice('Late join ka na sa Bingo. Hintayin muna matapos ang current round bago sumali.');
      return;
    }

    enableBingoSounds();
    const savedRoundSeed = localStorage.getItem(`bingo_card_seed_${activeBingoRound.roundId}_${myName}`);
    const activeSeed = savedRoundSeed || bingoCardSeed || `${Date.now()}-${Math.floor(Math.random() * 99999)}`;
    setBingoCardSeed(activeSeed);
    localStorage.setItem('bingo_card_seed', activeSeed);
    localStorage.setItem(`bingo_card_seed_${activeBingoRound.roundId}_${myName}`, activeSeed);
    localStorage.setItem(`bingo_joined_${activeBingoRound.roundId}_${myName}`, '1');
    void insertUniqueEvent(
      `🎟️ ${myName} joined Bingo Round ${activeBingoRound.roundId}. Cards: ${bingoCardCount}. Mode: ${bingoCardMode}. Choice: ${bingoCardChoice}. [TARGET: ${myName}] [CARDS: count=${bingoCardCount}|mode=${bingoCardMode}|choice=${bingoCardChoice}|seed=${activeSeed}]`,
      'System',
      `bingo-join-${activeBingoRound.roundId}-${eventSafeSlug(myName)}`,
      'bingo_join',
      { isAi: true }
    );
    setIsBingoParticipant(true);
    setIsBingoOpen(true);
    setTemporaryBingoNotice(`${bingoCardCount} Bingo card${bingoCardCount > 1 ? 's' : ''} generated. Review your setup, then press Ready before Jarvis calls the first number.`);
  }


  async function markPlayerBingoReady() {
    if (!activeBingoRound || !myName) {
      setTemporaryBingoNotice('Wala pang active Bingo round para i-ready ang card.');
      return;
    }

    if (!isBingoParticipant) {
      setTemporaryBingoNotice('Join Bingo muna, setup ang cards, then press Ready.');
      return;
    }

    if (bingoCalledNumbers.length > 0) {
      setTemporaryBingoNotice('Nagsimula na ang calls. Locked na ang card setup.');
      return;
    }

    if (isCurrentPlayerBingoReady) {
      setTemporaryBingoNotice('Ready ka na sa Bingo round na ito. Hintayin si Jarvis mag-start ng calls.');
      return;
    }

    const readyMessage = await insertUniqueEvent(
      `✅ ${myName} is READY for Bingo Round ${activeBingoRound.roundId}. Cards locked: ${bingoCardCount}. Mode: ${bingoCardMode}. Choice: ${bingoCardChoice}. [TARGET: ${myName}] [READY: count=${bingoCardCount}|mode=${bingoCardMode}|choice=${bingoCardChoice}]`,
      'System',
      `bingo-ready-${activeBingoRound.roundId}-${eventSafeSlug(myName)}`,
      'bingo_ready',
      { isAi: true }
    );

    if (readyMessage) {
      setTemporaryBingoNotice('Ready ka na! Jarvis will start calling once joined players are ready.');
    } else {
      setTemporaryBingoNotice('Ready status already saved. Hintayin si Jarvis mag-call.');
    }
  }

  function toggleBingoMark(value: BingoCellValue) {
    if (!activeBingoRound || !myName || !isBingoParticipant) return;
    if (value === 'FREE') return;

    if (!bingoCalledSet.has(value)) {
      setTemporaryBingoNotice(`${numberToBingoLabel(value)} hindi pa tinatawag ni Jarvis.`);
      return;
    }

    setBingoMarkedNumbers((current) => {
      const next = current.includes(value) ? current.filter((number) => number !== value) : [...current, value];
      saveBingoMarks(activeBingoRound.roundId, myName, next);
      return next;
    });
  }

  async function requestJarvisStartBingoRound(requestedBy: string) {
    const safeRequester = cleanName(requestedBy || myName || 'Guest');

    if (!myName) {
      setNameError('Maglagay muna ng participant name bago mag-request ng Bingo kay Jarvis.');
      return true;
    }

    enableBingoSounds();
    setIsBingoOpen(true);

    const currentRound = activeBingoRoundRef.current;
    if (currentRound) {
      await insertUniqueEvent(
        `ℹ️ ${safeRequester} asked Jarvis to start Bingo, but Round ${currentRound.roundId} is already active. Join the current round or wait for the next one.`,
        JARVIS_NAME,
        `bingo-request-active-${currentRound.roundId}-${eventSafeSlug(safeRequester)}-${Date.now()}`,
        'bingo_request',
        { isAi: true }
      );
      setTemporaryBingoNotice('May active Bingo round na. Join current round or wait for next session.');
      return true;
    }

    const recentCountdown = [...messagesRef.current].reverse().find((message) => {
      if (message.event_type !== 'bingo_countdown') return false;
      return Date.now() - new Date(message.created_at).getTime() < (BINGO_COUNTDOWN_SECONDS + 4) * 1000;
    });

    if (recentCountdown || pendingBingoStartRef.current) {
      setTemporaryBingoNotice('Naghahanda na si Jarvis ng Bingo round. Sandali lang.');
      return true;
    }

    const roundId = makeRoundId();
    pendingBingoStartRef.current = roundId;
    const quickPatternCount = 3;
    const quickWinnerLimit = 1;
    const quickCallSpeedMs = BINGO_CALL_INTERVAL_MS;
    const quickPrizeLabel = 'Jarvis Community Bingo';
    const patterns = pickBingoPatterns(roundId, quickPatternCount);
    const patternText = patterns.map((pattern) => pattern.label).join(', ');
    const eligiblePlayers = Array.from(
      new Set<string>(
        userList
          .map((user) => cleanName(user.name))
          .filter((name) => name && name !== JARVIS_NAME && name !== 'System')
      )
    );

    if (!eligiblePlayers.some((name) => normalizeBingoPlayerName(name) === normalizeBingoPlayerName(safeRequester))) {
      eligiblePlayers.push(safeRequester);
    }

    eligiblePlayers.sort((a, b) => a.localeCompare(b));
    const eligibleText = eligiblePlayers.length ? eligiblePlayers.join(' | ') : safeRequester;

    setBingoCountdown(BINGO_COUNTDOWN_SECONDS);
    await insertUniqueEvent(
      `🙋 ${safeRequester} requested a Jarvis-hosted Bingo round. Jarvis will host even without Ripple admin online.`,
      JARVIS_NAME,
      `bingo-user-request-${roundId}-${eventSafeSlug(safeRequester)}`,
      'bingo_request',
      { isAi: true }
    );

    await insertUniqueEvent(
      `⏳ Bingo starts in ${BINGO_COUNTDOWN_SECONDS} seconds! Requested by ${safeRequester}. Prize: ${quickPrizeLabel}. Get ready on your cards. [COUNTDOWN: roundId=${roundId}|seconds=${BINGO_COUNTDOWN_SECONDS}]`,
      JARVIS_NAME,
      `bingo-countdown-${roundId}`,
      'bingo_countdown',
      { isAi: true }
    );

    window.setTimeout(async () => {
      await insertUniqueEvent(
        `🎱 Jarvis Bingo started by request from ${safeRequester}! Round ${roundId}. Prize: ${quickPrizeLabel}. Winner limit: ${quickWinnerLimit}. Calls every ${formatBingoSeconds(quickCallSpeedMs)}. Patterns to win: ${patternText}. Eligible players: ${eligibleText.replace(/ \| /g, ', ')}. Late joiners must wait for the next round. Join using the Bingo tab, setup your cards, then press Ready. Jarvis will wait before the first call. Trivia and Jarvis question games are paused while Bingo is active. [ELIGIBLE: ${eligibleText}] [SETTINGS: callMs=${quickCallSpeedMs}|winnerLimit=${quickWinnerLimit}|patternCount=${quickPatternCount}|allowLateJoiners=0|prize=${quickPrizeLabel}]`,
        JARVIS_NAME,
        `bingo-start-${roundId}`,
        'bingo_start',
        { isAi: true }
      );
      pendingBingoStartRef.current = '';
      setBingoCountdown(0);
      setTemporaryBingoNotice('Jarvis started the Bingo round by user request.');
    }, BINGO_COUNTDOWN_SECONDS * 1000);

    return true;
  }

  async function startBingoRound() {
    enableBingoSounds();

    if (!isAdminUser) {
      setTemporaryBingoNotice('Admin lang ang puwedeng mag-start ng Bingo. Admin name: Ripple.');
      return;
    }

    if (!myName) {
      setNameError('Maglagay muna ng participant name bago mag-start ng Bingo.');
      return;
    }

    const autoBingoTvWindow = openBingoTvWindow();

    if (activeBingoRoundRef.current) {
      setIsBingoOpen(true);
      setTemporaryBingoNotice(autoBingoTvWindow ? 'May active Bingo round na. Binuksan ang BingoTV monitor.' : 'May active Bingo round na. Popup blocked ang BingoTV; click BingoTV button.');
      return;
    }

    const roundId = makeRoundId();
    const patterns = pickBingoPatterns(roundId, bingoPatternCount);
    const patternText = patterns.map((pattern) => pattern.label).join(', ');
    const safePrizeLabel = sanitizeBingoSettingValue(bingoPrizeLabel) || BINGO_DEFAULT_PRIZE;
    const eligiblePlayers = Array.from(
      new Set<string>(
        userList
          .map((user) => cleanName(user.name))
          .filter((name) => name && name !== JARVIS_NAME && name !== 'System')
      )
    ).sort((a, b) => a.localeCompare(b));
    const eligibleText = eligiblePlayers.length ? eligiblePlayers.join(' | ') : cleanName(myName);

    setIsBingoOpen(true);
    setBingoCountdown(BINGO_COUNTDOWN_SECONDS);
    await insertUniqueEvent(
      `⏳ Bingo starts in ${BINGO_COUNTDOWN_SECONDS} seconds! Prize: ${safePrizeLabel}. Get ready on your cards. [COUNTDOWN: roundId=${roundId}|seconds=${BINGO_COUNTDOWN_SECONDS}]`,
      JARVIS_NAME,
      `bingo-countdown-${roundId}`,
      'bingo_countdown',
      { isAi: true }
    );

    window.setTimeout(async () => {
      await insertUniqueEvent(
        `🎱 Jarvis Bingo started! Round ${roundId}. Prize: ${safePrizeLabel}. Winner limit: ${bingoWinnerLimit}. Calls every ${formatBingoSeconds(bingoCallSpeedMs)}. Patterns to win: ${patternText}. Eligible players: ${eligibleText.replace(/ \| /g, ', ')}. ${allowLateBingoJoiners ? 'Late joiners are allowed for this round.' : 'Late joiners must wait for the next round.'} Join using the Bingo tab, setup your cards, then press Ready. Jarvis will wait before the first call. Trivia and Jarvis question games are paused while Bingo is active. [ELIGIBLE: ${eligibleText}] [SETTINGS: callMs=${bingoCallSpeedMs}|winnerLimit=${bingoWinnerLimit}|patternCount=${bingoPatternCount}|allowLateJoiners=${allowLateBingoJoiners ? '1' : '0'}|prize=${safePrizeLabel}]`,
        JARVIS_NAME,
        `bingo-start-${roundId}`,
        'bingo_start',
        { isAi: true }
      );
      setBingoCountdown(0);
      setTemporaryBingoNotice(autoBingoTvWindow ? 'Bingo round started. BingoTV monitor opened automatically.' : 'Bingo round started. Popup blocked ang BingoTV; click BingoTV button.');
    }, BINGO_COUNTDOWN_SECONDS * 1000);
  }

  async function postNextBingoCall() {
    const round = activeBingoRoundRef.current;
    if (!round) return;

    const calledNumbers = bingoCalledNumbersRef.current;
    const latestCallMessage = [...messagesRef.current]
      .reverse()
      .find((message) => message.event_type === 'bingo_call' && message.event_key?.startsWith(`bingo-call-${round.roundId}-`));

    if (latestCallMessage) {
      const elapsedMs = Date.now() - new Date(latestCallMessage.created_at).getTime();
      const requiredDelayMs = Math.max(1000, (round.callIntervalMs || BINGO_CALL_INTERVAL_MS) - 250);
      if (elapsedMs < requiredDelayMs) return;
    }

    if (calledNumbers.length >= 75) {
      await insertUniqueEvent(
        '🎱 Bingo round ended. All 75 numbers were called and no verified winner was recorded.',
        JARVIS_NAME,
        `bingo-end-${round.roundId}`,
        'bingo_end',
        { isAi: true }
      );
      return;
    }

    if (calledNumbers.length === 0) {
      const joinedPlayers = getBingoActualJoinedPlayers(messagesRef.current, round.roundId);
      const readyPlayers = getBingoReadyPlayers(messagesRef.current, round.roundId);

      if (!allJoinedBingoPlayersReady(joinedPlayers, readyPlayers)) {
        return;
      }
    }

    const nextIndex = calledNumbers.length;
    const nextNumber = getBingoCallOrder(round.roundId)[nextIndex];
    if (!nextNumber) return;

    await insertUniqueEvent(
      `🎱 Bingo Call #${nextIndex + 1}: ${numberToBingoLabel(nextNumber)}`,
      JARVIS_NAME,
      `bingo-call-${round.roundId}-${nextIndex}`,
      'bingo_call',
      { isAi: true }
    );
  }

  async function handleBingoClaim() {
    if (!activeBingoRound || !bingoCards.length || !myName) return;

    if (!isBingoEligiblePlayer(activeBingoRound, myName)) {
      setTemporaryBingoNotice('Late join ka sa round na ito. Hindi puwedeng mag-claim hanggang next Bingo session.');
      return;
    }

    if (!isBingoParticipant) {
      setTemporaryBingoNotice('Join Bingo muna bago mag-claim.');
      return;
    }

    const currentWinnerMessages = getBingoWinnerMessages(messagesRef.current, activeBingoRound.roundId, activeBingoRound.startedAt);
    const alreadyWonThisRound = currentWinnerMessages.some((message) => message.event_key?.endsWith(`-${eventSafeSlug(myName)}`));

    if (currentWinnerMessages.length >= activeBingoRound.winnerLimit) {
      setTemporaryBingoNotice('Tapos na ang winner limit ng round na ito. Wait for next Bingo session.');
      return;
    }

    if (alreadyWonThisRound) {
      setTemporaryBingoNotice('Verified winner ka na sa round na ito. Wait for next Bingo session.');
      return;
    }

    const winningResult = bingoCards
      .map((card, index) => ({ card, cardIndex: index, pattern: verifyBingoCard(card, bingoCalledSet, activeBingoRound.patterns) }))
      .find((result) => result.pattern);
    const winningPattern = winningResult?.pattern || null;

    if (winningPattern && winningResult) {
      const winnerNumber = currentWinnerMessages.length + 1;
      const winnerMessage = await insertUniqueEvent(
        `🏆 BINGO verified! Winner #${winnerNumber}: ${myName} wins Round ${activeBingoRound.roundId} with ${winningPattern.label} on Card #${winningResult.cardIndex + 1}. Prize: ${activeBingoRound.prizeLabel}. +${BINGO_WIN_SCORE} score! Jarvis checked the card against the official called numbers.`,
        JARVIS_NAME,
        `bingo-winner-${activeBingoRound.roundId}-${eventSafeSlug(myName)}`,
        'bingo_winner',
        { isAi: true }
      );

      if (winnerMessage) {
        playWinnerSound();
        const awarded = await awardScoreOnce(myName, `bingo-${activeBingoRound.roundId}-${eventSafeSlug(myName)}`, BINGO_WIN_SCORE);
        triggerTopScoreCelebration({
          user_name: myName,
          total_score: Number(scoreMap.get(myName) || 0) + (awarded ? BINGO_WIN_SCORE : 0)
        });

        if (winnerNumber >= activeBingoRound.winnerLimit) {
          await insertUniqueEvent(
            `✅ Bingo Round ${activeBingoRound.roundId} closed. Winner limit reached (${activeBingoRound.winnerLimit}/${activeBingoRound.winnerLimit}).`,
            JARVIS_NAME,
            `bingo-end-${activeBingoRound.roundId}-winner-limit`,
            'bingo_end',
            { isAi: true }
          );
        }
      }

      setTemporaryBingoNotice(`Verified BINGO: ${winningPattern.label} on Card #${winningResult.cardIndex + 1}! +${BINGO_WIN_SCORE} score.`);
      return;
    }

    await insertUniqueEvent(
      `🚨 Suspicious/invalid Bingo claim by ${myName}. Jarvis verified: not valid yet. [TARGET: ${myName}]`,
      JARVIS_NAME,
      `bingo-invalid-${activeBingoRound.roundId}-${eventSafeSlug(myName)}-${Date.now()}`,
      'bingo_invalid',
      { isAi: true }
    );
    playInvalidClaimSound();
    setTemporaryBingoNotice('Hindi pa valid ang BINGO. Kulang pa sa called numbers.');
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
    playConfettiSound();

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
      map.set(myName, { key: 'me', name: myName, onlineAt: new Date().toISOString(), avatar: userAvatar, profileColor: userProfileColor });
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [onlineUsers, myName, isAdminUser, userAvatar, userProfileColor]);

  const recentMessagesForJarvis = useMemo(
    () =>
      displayedMessages.slice(-8).map((message) => ({
        user_name: message.user_name,
        content: message.content,
        is_ai: message.is_ai
      })),
    [displayedMessages]
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeBingoRoundRef.current = activeBingoRound;
    bingoCalledNumbersRef.current = bingoCalledNumbers;
  }, [activeBingoRound, bingoCalledNumbers]);

  useEffect(() => {
    if (!activeBingoRound || !myName) {
      setIsBingoParticipant(false);
      setBingoMarkedNumbers([]);
      return;
    }

    if (!isBingoEligiblePlayer(activeBingoRound, myName)) {
      setIsBingoParticipant(false);
      setBingoMarkedNumbers([]);
      return;
    }

    const joinedKey = `bingo_joined_${activeBingoRound.roundId}_${myName}`;
    const marksKey = `bingo_marks_${activeBingoRound.roundId}_${myName}`;
    setIsBingoParticipant(localStorage.getItem(joinedKey) === '1');

    try {
      const savedMarks = JSON.parse(localStorage.getItem(marksKey) || '[]');
      setBingoMarkedNumbers(Array.isArray(savedMarks) ? savedMarks.filter((value) => typeof value === 'number') : []);
    } catch {
      setBingoMarkedNumbers([]);
    }
  }, [activeBingoRound?.roundId, myName]);

  useEffect(() => {
    if (!activeBingoRound || !myName) return;
    const roundSeedKey = `bingo_card_seed_${activeBingoRound.roundId}_${myName}`;
    const savedRoundSeed = localStorage.getItem(roundSeedKey);
    if (savedRoundSeed) {
      setBingoCardSeed(savedRoundSeed);
      return;
    }
    const savedGlobalSeed = localStorage.getItem('bingo_card_seed') || 'default';
    setBingoCardSeed(savedGlobalSeed);
  }, [activeBingoRound?.roundId, myName]);

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
    const savedAdminVerified = localStorage.getItem('chat_admin_verified') === '1';

    if (savedName && !isReservedName(stripNumberSuffix(savedName))) {
      if (isAdminLoginName(savedName)) {
        if (savedAdminVerified) {
          setIsAdminAuthenticated(true);
          setMyName(ADMIN_DISPLAY_NAME);
          setNameDraft(ADMIN_DISPLAY_NAME);
          setSelectedSender(ADMIN_DISPLAY_NAME);
        } else {
          localStorage.removeItem('chat_user_name');
          localStorage.removeItem('chat_admin_verified');
        }
      } else {
        setIsAdminAuthenticated(false);
        setMyName(savedName);
        setNameDraft(savedName);
        setSelectedSender(savedName);
      }
    }

    const savedMarkColor = localStorage.getItem('bingo_mark_color') || 'blue';
    if (BINGO_MARK_COLORS.some((color) => color.key === savedMarkColor)) {
      setBingoMarkColor(savedMarkColor);
    }

    const savedCardCount = Number(localStorage.getItem('bingo_card_count') || 1);
    if (BINGO_CARD_COUNT_OPTIONS.includes(savedCardCount as (typeof BINGO_CARD_COUNT_OPTIONS)[number])) {
      setBingoCardCount(savedCardCount);
    }

    const savedCardMode = localStorage.getItem('bingo_card_mode') || 'random';
    if (BINGO_CARD_MODES.some((mode) => mode.key === savedCardMode)) {
      setBingoCardMode(savedCardMode as BingoCardMode);
    }

    const savedCardChoice = localStorage.getItem('bingo_card_choice') || 'lucky-a';
    if (BINGO_CARD_CHOICES.some((choice) => choice.key === savedCardChoice)) {
      setBingoCardChoice(savedCardChoice);
    }

    const savedCardSeed = localStorage.getItem('bingo_card_seed') || 'default';
    setBingoCardSeed(savedCardSeed);

    const savedCallSpeed = Number(localStorage.getItem('bingo_call_speed_ms') || BINGO_CALL_INTERVAL_MS);
    if (BINGO_SPEED_OPTIONS.includes(savedCallSpeed as (typeof BINGO_SPEED_OPTIONS)[number])) {
      setBingoCallSpeedMs(savedCallSpeed);
    }

    const savedWinnerLimit = Number(localStorage.getItem('bingo_winner_limit') || 1);
    if (BINGO_WINNER_LIMIT_OPTIONS.includes(savedWinnerLimit as (typeof BINGO_WINNER_LIMIT_OPTIONS)[number])) {
      setBingoWinnerLimit(savedWinnerLimit);
    }

    const savedPatternCount = Number(localStorage.getItem('bingo_pattern_count') || 3);
    if (BINGO_PATTERN_COUNT_OPTIONS.includes(savedPatternCount as (typeof BINGO_PATTERN_COUNT_OPTIONS)[number])) {
      setBingoPatternCount(savedPatternCount);
    }

    setAllowLateBingoJoiners(localStorage.getItem('bingo_allow_late_joiners') === '1');

    const savedPrizeLabel = sanitizeBingoSettingValue(localStorage.getItem('bingo_prize_label') || '');
    if (savedPrizeLabel) setBingoPrizeLabel(savedPrizeLabel);

    const savedAvatar = localStorage.getItem('chat_user_avatar') || getDefaultAvatar(savedName || 'Guest');
    if (USER_PROFILE_AVATARS.includes(savedAvatar as (typeof USER_PROFILE_AVATARS)[number])) setUserAvatar(savedAvatar);

    const savedProfileColor = localStorage.getItem('chat_profile_color') || 'sky';
    if (USER_PROFILE_COLORS.some((color) => color.key === savedProfileColor)) setUserProfileColor(savedProfileColor);

    try {
      const savedVolumes = JSON.parse(localStorage.getItem('bingo_sound_volumes') || '{}');
      setSoundVolumes({ ...DEFAULT_SOUND_VOLUMES, ...savedVolumes });
    } catch {
      setSoundVolumes({ ...DEFAULT_SOUND_VOLUMES });
    }
  }, []);

  useEffect(() => {
    const tvMode = isBingoTvUrl();
    isBingoTvModeRef.current = tvMode;
    setIsBingoTvMode(tvMode);
    if (tvMode) document.title = 'Jarvis BingoTV - Live Monitor';
  }, []);

  useEffect(() => {
    isBingoTvModeRef.current = isBingoTvMode;
  }, [isBingoTvMode]);

  useEffect(() => {
    if (!isBingoTvMode) return;

    let cancelled = false;

    async function refreshBingoTvSnapshot() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room', ROOM_NAME)
        .order('created_at', { ascending: false })
        .limit(300);

      if (!cancelled && !error && data) {
        setMessages([...(data as Message[])].reverse());
        setBingoTvSyncAt(new Date().toISOString());
      }

      if (!cancelled) {
        await loadScores();
      }
    }

    void refreshBingoTvSnapshot();
    const tvRefreshTimer = window.setInterval(refreshBingoTvSnapshot, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(tvRefreshTimer);
    };
  }, [isBingoTvMode]);

  useEffect(() => {
    const soundRound = isBingoTvMode ? bingoTvRound : activeBingoRound;
    const soundCall = isBingoTvMode
      ? (bingoTvCalledNumbers.length ? bingoTvCalledNumbers[bingoTvCalledNumbers.length - 1] : null)
      : latestBingoCall;
    const soundCount = isBingoTvMode ? bingoTvCalledNumbers.length : bingoCalledNumbers.length;

    if (!soundRound?.roundId || !soundCall) return;

    const callKey = `${soundRound.roundId}:${soundCount}:${soundCall}`;
    if (lastBingoCallSoundRef.current === callKey) return;

    lastBingoCallSoundRef.current = callKey;
    playBingoCallSound();
  }, [activeBingoRound?.roundId, bingoTvRound?.roundId, latestBingoCall, bingoCalledNumbers.length, bingoTvCalledNumbers.length, isBingoTvMode, soundEnabled]);

  useEffect(() => {
    if (!myName || !channelRef.current) return;

    channelRef.current.track({
      user_name: myName,
      online_at: new Date().toISOString(),
      avatar: userAvatar,
      profile_color: userProfileColor
    });
  }, [myName, userAvatar, userProfileColor]);

  useEffect(() => {
    if (!myName || !currentPresenceKeyRef.current) return;
    if (isAdminUser) return;

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
  }, [onlineUsers, myName, isAdminUser]);



  useEffect(() => {
    if (!myName || isAdminUser) return;
    if (!kickedUsers.has(normalizeBingoPlayerName(myName))) return;
    logoutChatroom();
    setNameNotice('You were removed from the chatroom by Ripple admin.');
  }, [kickedUsers, myName, isAdminUser]);

  useEffect(() => {
    if (!bingoCountdown) return;
    playCountdownSound();
    const timer = window.setTimeout(() => setBingoCountdown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [bingoCountdown]);

  useEffect(() => {
    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room', ROOM_NAME)
        .order('created_at', { ascending: false })
        .limit(300);

      if (!error && data) setMessages([...(data as Message[])].reverse());
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
            return [...current, newMessage].slice(-250);
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
            onlineAt: String(firstPresence?.online_at || ''),
            avatar: String(firstPresence?.avatar || ''),
            profileColor: String(firstPresence?.profile_color || '')
          };
        });

        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, (payload) => {
        const joinPayload = payload as { key: string; newPresences?: Array<Record<string, unknown>> };
        const joinedUsers = Array.isArray(joinPayload.newPresences) ? joinPayload.newPresences : [];

        if (isBingoTvModeRef.current) return;

        joinedUsers.forEach((presence) => {
          const name = cleanName(String(presence.user_name || 'Guest'));
          postJoinMessages(joinPayload.key, name);
        });
      })
      .on('presence', { event: 'leave' }, (payload) => {
        const leavePayload = payload as { key: string; leftPresences?: Array<Record<string, unknown>> };
        const leftUsers = Array.isArray(leavePayload.leftPresences) ? leavePayload.leftPresences : [];

        if (isBingoTvModeRef.current) return;

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
    const runJarvisHostLoop = () => {
      if (isBingoTvModeRef.current) return;

      if (activeBingoRoundRef.current) {
        void postNextBingoCall();
        return;
      }

      postJarvisGameQuestion();
      checkGameAnswerTimeout();
      postJarvisTrivia();
    };

    const timer = window.setInterval(runJarvisHostLoop, BINGO_HOST_TICK_MS);
    window.setTimeout(runJarvisHostLoop, 1200);

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

  async function awardScoreOnce(userName: string, gameEventKey?: string | number | null, points = 1) {
    const safeName = cleanName(userName);
    if (!safeName || safeName === JARVIS_NAME || safeName === 'System') return false;

    try {
      const { data, error } = await supabase.rpc('award_score_once', {
        p_event_key: `score-${String(gameEventKey ?? 'unknown')}`,
        p_user_name: safeName,
        p_points: points
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
            total_score: Number(existing?.total_score || 0) + points,
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
    if (activeBingoRoundRef.current) return;

    const slot = Math.floor(Date.now() / GAME_INTERVAL_MS);
    const savedSlot = Number(localStorage.getItem('jarvis_last_game_slot') || '0');
    if (savedSlot >= slot) return;

    const currentMessages = messagesRef.current;
    const lastGame = [...currentMessages]
      .reverse()
      .find((message) => message.user_name === JARVIS_NAME && message.content.startsWith('🎮 Jarvis Game:'));

    if (lastGame && Date.now() - new Date(lastGame.created_at).getTime() < GAME_INTERVAL_MS - 5000) return;

    const { questionIndex, question } = pickQuestionForSlot(slot, currentMessages);

    await insertUniqueEvent(question.question, JARVIS_NAME, `game-question-${slot}`, 'game_question', {
      isAi: true,
      gameSlot: questionIndex
    });

    localStorage.setItem('jarvis_last_game_slot', String(slot));
  }

  async function checkGameAnswerTimeout() {
    if (activeBingoRoundRef.current) return;

    const gameMessage = findLatestOpenGameQuestion();
    if (!gameMessage) return;

    const question = getQuestionBySlot(gameMessage.game_slot);
    if (!question) return;

    const askedAt = new Date(gameMessage.created_at).getTime();
    if (Date.now() - askedAt < GAME_ANSWER_DELAY_MS) return;

    const gameSlot = gameMessage.game_slot ?? 0;
    const gameEventKey = gameMessage.event_key || `game-${gameMessage.id || gameSlot}`;
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
        `game-winner-${gameEventKey}`,
        'game_winner',
        { isAi: true, replyToMessageId: gameMessage.id }
      );

      if (winnerMessage) {
        await awardScoreOnce(correctGuess.user_name, gameEventKey);
      }

      return;
    }

    await insertUniqueEvent(
      `⏰ Time's up! Walang naka-hula. Ang tamang sagot ay: ${question.displayAnswer}.`,
      JARVIS_NAME,
      `game-answer-${gameEventKey}`,
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
    const gameEventKey = gameMessage.event_key || `game-${gameMessage.id || gameSlot}`;
    const winnerMessage = await insertUniqueEvent(
      `Tama, ${activeSender}! 🎉 +1 score! Ang sagot ay: ${question.displayAnswer}.`,
      JARVIS_NAME,
      `game-winner-${gameEventKey}`,
      'game_winner',
      { isAi: true, replyToMessageId: gameMessage.id }
    );

    if (winnerMessage) {
      await awardScoreOnce(activeSender, gameEventKey);
    }

    return true;
  }

  async function postJarvisTrivia() {
    if (activeBingoRoundRef.current) return;

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

    if (isMuted) {
      setNameError('Muted ka muna ni Ripple admin. Hindi ka makakapag-send habang naka-mute.');
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

      if (isJarvisBingoStartRequest(rawMessage)) {
        answeredGame = await requestJarvisStartBingoRound(activeSender);
      } else {
        answeredGame = await tryCongratulateGameWinner(rawMessage, activeSender);
      }
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

  if (isBingoTvMode) {
    const callOrder = bingoTvRound ? getBingoCallOrder(bingoTvRound.roundId) : [];
    const nextTvCall = bingoTvRound ? callOrder[bingoTvCalledNumbers.length] || null : null;
    const calledNumberSet = new Set(bingoTvCalledNumbers);
    const latestTvBingoCall = bingoTvCalledNumbers.length ? bingoTvCalledNumbers[bingoTvCalledNumbers.length - 1] : null;
    const latestTvBingoLabel = latestTvBingoCall ? numberToBingoLabel(latestTvBingoCall) : '--';
    const [latestTvLetter = '', latestTvNumberText = '--'] = latestTvBingoLabel.split('-');
    const recentTvCalls = bingoTvCalledNumbers.slice(-10).reverse();
    const tvCallProgress = Math.round((bingoTvCalledNumbers.length / 75) * 100);
    const tvStatusText = activeBingoRound
      ? 'Connected to live Bingo game'
      : bingoTvRound
        ? 'Showing latest finished Bingo round'
        : 'Waiting for Ripple or Jarvis request to start a round';
    const tvLastSyncText = bingoTvSyncAt ? `Synced ${formatTime(bingoTvSyncAt)}` : 'Realtime + auto-refresh ready';
    const playerJoinUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    const latestCountdown = !bingoTvRound ? [...messages].reverse().find((message) => message.event_type === 'bingo_countdown') : null;

    return (
      <main className="bingo-tv-shell bingo-tv-fixed-shell">
        <div className="bingo-tv-title-card">
          <p>Jarvis hosted monitor</p>
          <h1>BingoTV</h1>
          <span>{bingoTvRound ? `Round ${bingoTvRound.roundId}` : 'Waiting for Ripple or Jarvis request to start a round'}</span>
          <div className="bingo-tv-sync-pill">
            <span className={activeBingoRound ? 'connected' : 'standby'} />
            {tvStatusText} • {tvLastSyncText}
          </div>
        </div>

        {bingoCountdown || latestCountdown ? (
          <section className="bingo-tv-countdown">
            <strong>Bingo starts in</strong>
            <span>{bingoCountdown || BINGO_COUNTDOWN_SECONDS}</span>
            <small>Players, ready your cards!</small>
          </section>
        ) : null}

        <section className="bingo-tv-live-strip">
          <div>
            <strong>Recent Called Numbers</strong>
            <div className="bingo-tv-recent-calls">
              {recentTvCalls.length ? recentTvCalls.map((number) => (
                <span key={`recent-tv-call-${number}`} className={number === latestTvBingoCall ? 'latest' : ''}>{numberToBingoLabel(number)}</span>
              )) : <span className="empty">No calls yet</span>}
            </div>
          </div>
          <div>
            <strong>Next Number Preview</strong>
            <span className="bingo-tv-next-call">{nextTvCall ? numberToBingoLabel(nextTvCall) : activeBingoRound ? 'Final call reached' : 'Hidden until live'}</span>
          </div>
          <div>
            <strong>Jarvis Bingo Status</strong>
            <span className="bingo-tv-event-text">{latestBingoTvMessage ? latestBingoTvMessage.content : 'No Bingo event yet'}</span>
          </div>
        </section>

        <div className={`bingo-tv-live-card ${latestTvBingoCall ? 'has-call' : 'standby'}`} key={`tv-call-${latestTvBingoCall || 'standby'}-${bingoTvCalledNumbers.length}`}>
          <span className={activeBingoRound ? 'live' : 'idle'}>{activeBingoRound ? 'LIVE ROUND' : bingoTvRound ? 'LAST ROUND' : 'STANDBY'}</span>
          <div className="bingo-draw-machine" aria-label={latestTvBingoCall ? `Current drawn number ${latestTvBingoLabel}` : 'No Bingo call yet'}>
            <div className="bingo-ball-track"><span /><span /><span /></div>
            <div className="bingo-tv-call-orb">
              <em>{latestTvBingoCall ? latestTvLetter : 'BINGO'}</em>
              <strong>{latestTvBingoCall ? latestTvNumberText : '--'}</strong>
            </div>
          </div>
          <small>Call Count: {bingoTvCalledNumbers.length || 0}/75</small>
          <div className="bingo-tv-call-progress" style={{ '--progress': `${tvCallProgress}%` } as CSSProperties}>
            <span />
          </div>
        </div>

        <section className="bingo-tv-panel bingo-tv-pattern-panel">
          <div className="bingo-tv-panel-title">
            <span>{bingoTvRound?.patterns.length || bingoPatternCount} Patterns to Win</span>
            <small>Official round patterns</small>
          </div>
          {bingoTvRound ? (
            <div className="bingo-tv-pattern-list">
              {bingoTvRound.patterns.map((pattern) => {
                const previewCells = getBingoPreviewCells(pattern.key);

                return (
                  <article key={`tv-${pattern.key}`} className="bingo-tv-pattern-card">
                    <div className="pattern-mini-grid tv" aria-hidden="true">
                      {Array.from({ length: 25 }, (_, index) => {
                        const row = Math.floor(index / 5);
                        const column = index % 5;
                        const isCenter = row === 2 && column === 2;
                        return (
                          <span
                            key={`tv-${pattern.key}-${index}`}
                            className={previewCells.has(`${row}-${column}`) || isCenter ? 'needed' : ''}
                          >
                            {isCenter ? 'F' : ''}
                          </span>
                        );
                      })}
                    </div>
                    <div>
                      <strong>{pattern.label}</strong>
                      <p>{pattern.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="bingo-tv-muted">No active Bingo round yet.</p>
          )}
        </section>

        <section className="bingo-tv-panel bingo-tv-call-panel">
          <div className="bingo-tv-panel-title">
            <span>Master Called Numbers</span>
            <small>{activeBingoRound ? 'Live master board from user Bingo games' : 'Synced from latest Bingo round'}</small>
          </div>
          <div className="bingo-tv-master-board">
            {BINGO_COLUMNS.map((column) => (
              <div key={`tv-col-${column.letter}`} className="bingo-tv-column">
                <strong>{column.letter}</strong>
                {Array.from({ length: 15 }, (_, index) => column.min + index).map((number) => {
                  const isCalled = calledNumberSet.has(number);
                  const isLatest = latestTvBingoCall === number;
                  return (
                    <span key={`tv-number-${number}`} className={`${isCalled ? 'called' : ''} ${isLatest ? 'latest' : ''}`}>
                      {number}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <section className="bingo-tv-panel bingo-tv-report-panel">
          <div className="bingo-tv-panel-title">
            <span>Winner Verification Report</span>
            <small>Jarvis checks claims vs. official called list</small>
          </div>
          <div className="bingo-tv-report-content">
            {latestBingoVerification ? (
              <div className="bingo-tv-report-stack">
                {bingoVerificationMessages.slice(-4).reverse().map((verification) => (
                  <div key={verification.id} className={`bingo-tv-report ${verification.event_type === 'bingo_winner' ? 'valid' : 'invalid'}`}>
                    <strong>{verification.event_type === 'bingo_winner' ? 'VERIFIED WINNER' : 'INVALID CLAIM'}</strong>
                    <p>{verification.content}</p>
                    <small>{formatChatDateTime(verification.created_at)}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bingo-tv-report pending">
                <strong>No winner yet</strong>
                <p>Kapag may user na pumindot ng BINGO, lalabas dito ang verification result ni Jarvis.</p>
              </div>
            )}
            <div className="bingo-tv-qr-card bingo-tv-report-qr-card">
              <QrCode size={22} />
              <div>
                <strong>Scan to join</strong>
                <small>{playerJoinUrl || 'Open the chatroom link'}</small>
              </div>
              {playerJoinUrl ? <img alt="Chatroom QR code" src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeQrData(playerJoinUrl)}`} /> : null}
            </div>
          </div>
        </section>

        <section className="bingo-tv-panel bingo-tv-side-panel">
          <div className="bingo-tv-stat-grid">
            <div>
              <span>Players Online</span>
              <strong>{onlineCount}</strong>
            </div>
            <div>
              <span>Eligible Players</span>
              <strong>{bingoTvRound?.eligiblePlayers.length || 0}</strong>
            </div>
            <div>
              <span>Ready Players</span>
              <strong>{bingoTvReadyPlayers.length}/{bingoTvActualJoinedPlayers.length}</strong>
            </div>
            <div>
              <span>Numbers Called</span>
              <strong>{bingoTvCalledNumbers.length}/75</strong>
            </div>
            <div>
              <span>Winner Score</span>
              <strong>+{BINGO_WIN_SCORE}</strong>
            </div>
            <div>
              <span>Prize</span>
              <strong>{bingoTvRound?.prizeLabel || BINGO_DEFAULT_PRIZE}</strong>
            </div>
            <div>
              <span>Call Speed</span>
              <strong>{formatBingoSeconds(bingoTvRound?.callIntervalMs || BINGO_CALL_INTERVAL_MS)}</strong>
            </div>
          </div>
          <div className="bingo-tv-actions">
            <button type="button" onClick={enableBingoSounds}>
              <Volume2 size={18} /> {soundEnabled ? 'Sounds On' : 'Enable Sounds'}
            </button>
            <button type="button" onClick={enterBingoTvFullscreen}>Fullscreen</button>
          </div>
        </section>
      </main>
    );
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

      {myName ? (
        <div className="mobile-quick-actions" aria-label="Mobile quick actions">
          <button
            type="button"
            onClick={() => {
              setIsBingoOpen(true);
              setIsProfilePanelOpen(false);
              setIsInvitePanelOpen(false);
            }}
          >
            <Gamepad2 size={16} /> Bingo
          </button>
          <button
            type="button"
            onClick={() => {
              setIsProfilePanelOpen(true);
              setIsInvitePanelOpen(false);
              setIsBingoOpen(false);
            }}
          >
            <UserCog size={16} /> Profile
          </button>
          <button
            type="button"
            onClick={() => {
              setIsInvitePanelOpen(true);
              setIsProfilePanelOpen(false);
              setIsBingoOpen(false);
            }}
          >
            <QrCode size={16} /> Invite
          </button>
        </div>
      ) : null}

      {myName && isProfilePanelOpen ? (
        <section className="mobile-pop-panel" aria-label="Profile and users">
          <header>
            <div>
              <p className="small-label">Profile center</p>
              <h3>Profile + Users</h3>
            </div>
            <button type="button" onClick={() => setIsProfilePanelOpen(false)}>Close</button>
          </header>
          <div className="mobile-profile-card">
            <p><UserCog size={14} /> Choose avatar</p>
            <div className="avatar-picker">
              {USER_PROFILE_AVATARS.map((avatar) => (
                <button key={`mobile-${avatar}`} type="button" className={userAvatar === avatar ? 'active' : ''} onClick={() => changeUserAvatar(avatar)}>{avatar}</button>
              ))}
            </div>
            <p><Sparkles size={14} /> Profile color</p>
            <div className="profile-color-picker">
              {USER_PROFILE_COLORS.map((color) => (
                <button
                  key={`mobile-${color.key}`}
                  type="button"
                  className={userProfileColor === color.key ? 'active' : ''}
                  style={{ '--profile-color': color.color } as CSSProperties}
                  onClick={() => changeUserProfileColor(color.key)}
                >
                  {color.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mobile-user-panel">
            <div className="list-header">
              <span><Users size={16} /> Users</span>
              <strong>{onlineCount} online</strong>
            </div>
            <div className="user-list mobile" role="listbox" aria-label="Mobile chat users">
              {userList.map((user) => {
                const userAccentStyle = getProfileColorStyle(user.profileColor || '', user.name);

                return (
                  <button
                    key={`mobile-${user.key}-${user.name}`}
                    type="button"
                    className={`user-item ${selectedSender === user.name ? 'active' : ''}`}
                    style={userAccentStyle}
                    onClick={() => selectSender(user.name)}
                  >
                    <span className="user-avatar">{user.avatar || getDefaultAvatar(user.name)}</span>
                    <span>
                      <strong className="name-color">{user.name}</strong>
                      <small>{selectedSender === user.name ? 'Selected participant' : 'Tap to highlight'} · Score: {scoreMap.get(user.name) || 0}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {myName && isInvitePanelOpen ? (
        <section className="mobile-pop-panel invite" aria-label="Invite QR code">
          <header>
            <div>
              <p className="small-label">Invite players</p>
              <h3>Scan QR Code</h3>
            </div>
            <button type="button" onClick={() => setIsInvitePanelOpen(false)}>Close</button>
          </header>
          <div className="mobile-invite-card">
            <QrCode size={30} />
            <strong>Invite to Jarvis Chatroom</strong>
            <p>Pa-scan ito sa ibang phone para makapasok agad sa chatroom at Bingo game.</p>
            {chatInviteUrl ? <img alt="Chatroom invite QR code" src={`https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeQrData(chatInviteUrl)}`} /> : null}
            <small>{chatInviteUrl || 'Open the chatroom link'}</small>
          </div>
        </section>
      ) : null}

      {myName ? (
        <>
          <button
            type="button"
            className={`bingo-tab ${isBingoOpen ? 'open' : ''}`}
            onClick={() => setIsBingoOpen((current) => !current)}
            aria-label="Open Bingo card"
          >
            <Gamepad2 size={18} />
            <span>Bingo</span>
            <ChevronRight size={16} />
          </button>

          <section className={`bingo-drawer ${isBingoOpen ? 'open' : ''}`} aria-label="Jarvis Bingo screen">
            <header className="bingo-drawer-header">
              <div>
                <p className="small-label">Jarvis hosted game</p>
                <h3>Bingo Screen</h3>
              </div>
              <button type="button" onClick={() => setIsBingoOpen(false)} aria-label="Hide Bingo card">
                <ChevronRight size={18} />
              </button>
            </header>

            {isAdminUser ? (
              <section className="bingo-admin-panel" aria-label="Ripple admin Bingo controls">
                <div className="bingo-admin-heading">
                  <span><Settings size={15} /> Ripple Admin Control Panel</span>
                  <small>{activeBingoRound ? `Live: Round ${activeBingoRound.roundId}` : bingoCountdown ? `Countdown: ${bingoCountdown}` : 'Ready to configure next round'}</small>
                </div>

                <div className="bingo-admin-grid extended">
                  <label>
                    <span>Call speed</span>
                    <select value={bingoCallSpeedMs} onChange={(event) => changeBingoCallSpeed(event.target.value)} disabled={Boolean(activeBingoRound) || Boolean(bingoCountdown)}>
                      {BINGO_SPEED_OPTIONS.map((speed) => (
                        <option key={speed} value={speed}>{formatBingoSeconds(speed)}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Patterns</span>
                    <select value={bingoPatternCount} onChange={(event) => changeBingoPatternCount(event.target.value)} disabled={Boolean(activeBingoRound) || Boolean(bingoCountdown)}>
                      {BINGO_PATTERN_COUNT_OPTIONS.map((count) => (
                        <option key={count} value={count}>{count} pattern{count > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Winner limit</span>
                    <select value={bingoWinnerLimit} onChange={(event) => changeBingoWinnerLimit(event.target.value)} disabled={Boolean(activeBingoRound) || Boolean(bingoCountdown)}>
                      {BINGO_WINNER_LIMIT_OPTIONS.map((limit) => (
                        <option key={limit} value={limit}>{limit} winner{limit > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </label>
                  <label className="bingo-admin-prize">
                    <span>Prize / round label</span>
                    <input value={bingoPrizeLabel} onChange={(event) => changeBingoPrizeLabel(event.target.value)} disabled={Boolean(activeBingoRound) || Boolean(bingoCountdown)} placeholder="Bingo Champion" />
                  </label>
                  <label className="bingo-admin-toggle">
                    <span>Late joiners</span>
                    <button type="button" className={allowLateBingoJoiners ? 'active' : ''} onClick={() => changeAllowLateBingoJoiners(!allowLateBingoJoiners)} disabled={Boolean(activeBingoRound) || Boolean(bingoCountdown)}>
                      {allowLateBingoJoiners ? 'Allowed' : 'Locked'}
                    </button>
                  </label>
                </div>

                <div className="bingo-admin-actions wide">
                  <button type="button" onClick={startBingoRound}>
                    <Play size={15} /> {activeBingoRound ? 'Open BingoTV' : bingoCountdown ? 'Counting...' : 'Start Bingo'}
                  </button>
                  <button type="button" onClick={openBingoTvScreen}>
                    <Monitor size={15} /> BingoTV
                  </button>
                  <button type="button" onClick={endBingoRound} disabled={!activeBingoRound} className="danger">
                    <StopCircle size={15} /> End Bingo
                  </button>
                  <button type="button" onClick={resetBingoCalls} disabled={!activeBingoRound}>
                    <RotateCcw size={15} /> Reset Calls
                  </button>
                  <button type="button" onClick={resetScoreDisplay}>
                    <Trophy size={15} /> Reset Scores
                  </button>
                  <button type="button" onClick={clearChatDisplay}>
                    <Trash2 size={15} /> Clear Chat
                  </button>
                </div>

                <div className="bingo-admin-manager-grid">
                  <div className="bingo-admin-history full-records">
                    <p><History size={14} /> View Winners / Records</p>
                    {bingoWinnerRecords.length ? (
                      bingoWinnerRecords.slice(0, 6).map((record, index) => (
                        <small key={`${record.roundId}-${record.name}-${index}`}>
                          {formatChatDateTime(record.time)} · {record.name || 'Winner'} · Round {record.roundId || '-'} · {record.pattern} · +{record.score} · {record.verification}
                        </small>
                      ))
                    ) : (
                      <small>No verified Bingo winner yet.</small>
                    )}
                  </div>

                  <div className="bingo-admin-users">
                    <p><UserCog size={14} /> User actions</p>
                    {userList.filter((user) => !isAdminUserName(user.name)).slice(0, 8).map((user) => {
                      const muted = mutedUsers.has(normalizeBingoPlayerName(user.name));
                      return (
                        <div key={`admin-user-${user.key}-${user.name}`} className="bingo-admin-user-row">
                          <span>{user.avatar || getDefaultAvatar(user.name)} {user.name}</span>
                          <button type="button" onClick={() => muted ? unmuteUser(user.name) : muteUser(user.name)}>
                            {muted ? <Volume2 size={13} /> : <VolumeX size={13} />} {muted ? 'Unmute' : 'Mute'}
                          </button>
                          <button type="button" onClick={() => kickUser(user.name)} className="danger"><UserX size={13} /> Kick</button>
                          <button type="button" onClick={() => setAdminSelectedPlayer(user.name)}><Eye size={13} /> Card</button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bingo-admin-card-viewer">
                  <p><Eye size={14} /> Player Card Viewer: <strong>{adminCardPlayer || 'No player selected'}</strong></p>
                  {adminPreviewCard ? (
                    <div className="admin-mini-bingo-card">
                      {['B', 'I', 'N', 'G', 'O'].map((letter) => <strong key={`admin-head-${letter}`}>{letter}</strong>)}
                      {adminPreviewCard.flatMap((row, rowIndex) => row.map((value, columnIndex) => {
                        const called = value === 'FREE' || (typeof value === 'number' && (bingoTvRound ? new Set(getBingoCalledNumbers(messages, bingoTvRound.roundId)).has(value) : false));
                        return <span key={`admin-card-${rowIndex}-${columnIndex}`} className={called ? 'called' : ''}>{value}</span>;
                      }))}
                    </div>
                  ) : <small>Start a round or select a player to preview their card.</small>}
                </div>

                <div className="sound-control-panel">
                  <p><Volume2 size={14} /> Sound Control Panel</p>
                  {(Object.keys(DEFAULT_SOUND_VOLUMES) as SoundKey[]).map((key) => (
                    <label key={`sound-${key}`}>
                      <span>{key}</span>
                      <input type="range" min="0" max="1" step="0.05" value={soundVolumes[key]} onChange={(event) => changeSoundVolume(key, event.target.value)} />
                    </label>
                  ))}
                </div>
              </section>
            ) : null}

            {activeBingoRound ? (
              <>
                <div className="bingo-status-card">
                  <strong>Round {activeBingoRound.roundId}</strong>
                  <span>Current call: {latestBingoCall ? numberToBingoLabel(latestBingoCall) : allActiveJoinedPlayersReady ? 'Waiting for Jarvis...' : 'Setup/Ready phase'}</span>
                  <small>Prize: {activeBingoRound.prizeLabel} · Calls every {formatBingoSeconds(activeBingoRound.callIntervalMs)} · Winners {activeBingoWinners.length}/{activeBingoRound.winnerLimit} · Ready {bingoReadyPlayers.length}/{bingoActualJoinedPlayers.length}</small>
                </div>

                <div className="bingo-patterns">
                  <p className="bingo-section-title">{activeBingoRound.patterns.length} pattern{activeBingoRound.patterns.length > 1 ? 's' : ''} to win</p>
                  {activeBingoRound.patterns.map((pattern) => {
                    const previewCells = getBingoPreviewCells(pattern.key);

                    return (
                      <div key={pattern.key} className="bingo-pattern-card">
                        <div className="pattern-mini-grid" aria-hidden="true">
                          {Array.from({ length: 25 }, (_, index) => {
                            const row = Math.floor(index / 5);
                            const column = index % 5;
                            const isCenter = row === 2 && column === 2;
                            return (
                              <span
                                key={`${pattern.key}-${index}`}
                                className={previewCells.has(`${row}-${column}`) || isCenter ? 'needed' : ''}
                              >
                                {isCenter ? 'F' : ''}
                              </span>
                            );
                          })}
                        </div>
                        <div>
                          <strong>{pattern.label}</strong>
                          <small>{pattern.description}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bingo-card-options">
                  <p className="bingo-section-title">Card options</p>
                  <div className="bingo-card-option-grid">
                    <label>
                      <span>Cards</span>
                      <select value={bingoCardCount} onChange={(event) => changeBingoCardCount(event.target.value)} disabled={!canEditBingoCards}>
                        {BINGO_CARD_COUNT_OPTIONS.map((count) => (
                          <option key={count} value={count}>{count} card{count > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Card type</span>
                      <select value={bingoCardMode} onChange={(event) => changeBingoCardMode(event.target.value)} disabled={!canEditBingoCards}>
                        {BINGO_CARD_MODES.map((mode) => (
                          <option key={mode.key} value={mode.key}>{mode.label}</option>
                        ))}
                      </select>
                    </label>
                    {bingoCardMode === 'choose' ? (
                      <label>
                        <span>Choose card</span>
                        <select value={bingoCardChoice} onChange={(event) => changeBingoCardChoice(event.target.value)} disabled={!canEditBingoCards}>
                          {BINGO_CARD_CHOICES.map((choice) => (
                            <option key={choice.key} value={choice.key}>{choice.label}</option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <button type="button" onClick={rerollBingoCards} disabled={!canEditBingoCards}>
                      <RotateCcw size={14} /> Change cards
                    </button>
                  </div>
                  <small>{canEditBingoCards ? 'Setup your cards before the first call. Press Ready after setup. Maximum 4 cards.' : isCurrentPlayerBingoReady ? 'Ready submitted. Cards are locked for this round.' : 'Cards are locked after the first Bingo call to prevent cheating.'}</small>
                  {bingoCardNotice ? <em>{bingoCardNotice}</em> : null}
                </div>

                <div className="bingo-mark-options">
                  <p className="bingo-section-title">Mark color</p>
                  <div className="bingo-color-row">
                    {BINGO_MARK_COLORS.map((color) => (
                      <button
                        key={color.key}
                        type="button"
                        className={`bingo-color-option ${bingoMarkColor === color.key ? 'active' : ''}`}
                        style={
                          {
                            '--bingo-swatch-fill': color.fill,
                            '--bingo-swatch-border': color.border
                          } as CSSProperties
                        }
                        aria-pressed={bingoMarkColor === color.key}
                        onClick={() => changeBingoMarkColor(color.key)}
                      >
                        <span aria-hidden="true" />
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>

                {isBingoParticipant && bingoCards.length ? (
                  <>
                    <div className={`bingo-ready-card ${isCurrentPlayerBingoReady ? 'is-ready' : ''}`}>
                      <div>
                        <strong>{isCurrentPlayerBingoReady ? 'Ready submitted' : 'Setup your cards first'}</strong>
                        <small>
                          {bingoCalledNumbers.length > 0
                            ? 'Bingo calls already started. Card setup is locked.'
                            : isCurrentPlayerBingoReady
                              ? 'Your cards are locked. Jarvis will begin when all joined players are ready.'
                              : 'Choose card count, card type, card color, then press Ready. Jarvis will not call the first number until joined players are ready.'}
                        </small>
                      </div>
                      <button type="button" onClick={markPlayerBingoReady} disabled={isCurrentPlayerBingoReady || bingoCalledNumbers.length > 0}>
                        {isCurrentPlayerBingoReady ? 'READY' : 'I am Ready'}
                      </button>
                    </div>

                    <div className={`bingo-card-stack cards-${bingoCards.length}`} style={bingoMarkStyle}>
                      {bingoCards.map((card, cardIndex) => (
                        <div key={`player-card-${cardIndex}`} className="bingo-card-wrap">
                          <div className="bingo-card-title">Card #{cardIndex + 1}</div>
                          <div className="bingo-card">
                            {['B', 'I', 'N', 'G', 'O'].map((letter) => (
                              <div key={`${cardIndex}-${letter}`} className={`bingo-card-head ${letter.toLowerCase()}`}>{letter}</div>
                            ))}
                            {card.flatMap((row, rowIndex) =>
                              row.map((value, columnIndex) => {
                                const isFree = value === 'FREE';
                                const isCalled = typeof value === 'number' && bingoCalledSet.has(value);
                                const isMarked = isFree || (typeof value === 'number' && bingoMarkedSet.has(value));

                                return (
                                  <button
                                    key={`${cardIndex}-${rowIndex}-${columnIndex}`}
                                    type="button"
                                    className={`bingo-cell ${isFree ? 'free' : ''} ${isCalled ? 'called' : ''} ${isMarked ? 'marked' : ''}`}
                                    onClick={() => toggleBingoMark(value)}
                                    disabled={!isCurrentPlayerBingoReady && !isFree}
                                  >
                                    <span>{value}</span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bingo-action-row">
                      <button type="button" className="bingo-claim-button" onClick={handleBingoClaim}>
                        BINGO
                      </button>
                      <button type="button" className="bingo-leave-button" onClick={leaveBingoRound}>
                        Leave Bingo
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bingo-join-card">
                    {canJoinActiveBingo ? (
                      <>
                        <p>Gusto mong sumali? Piliin muna ang card setup mo, then press Ready. Jarvis will wait before calling the first number.</p>
                        <button type="button" onClick={joinBingoRound}>Join & Setup Cards</button>
                      </>
                    ) : (
                      <>
                        <p>Locked na ang Bingo session. Late join ka na, kaya hintayin muna matapos ang current round.</p>
                        <button type="button" disabled>Wait for next round</button>
                      </>
                    )}
                  </div>
                )}

                <div className="called-board">
                  <p className="bingo-section-title">Official Called Numbers</p>
                  <div>
                    {bingoCalledNumbers.length ? (
                      bingoCalledNumbers.slice(-18).map((number) => <span key={`called-${number}`}>{numberToBingoLabel(number)}</span>)
                    ) : (
                      <small>Waiting for Jarvis to call the first number.</small>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bingo-empty">
                <Gamepad2 size={38} />
                <h3>No active Bingo round</h3>
                <p>Ripple admin can start Bingo, or any user can ask Jarvis to start a community Bingo round. Trivia and question games will pause while Bingo is active.</p>
                {isAdminUser ? (
                  <button type="button" onClick={startBingoRound}>
                    <Play size={16} /> Start Bingo
                  </button>
                ) : (
                  <button type="button" onClick={() => requestJarvisStartBingoRound(senderName || nameDraft || 'Guest')} disabled={!myName}>
                    <Bot size={16} /> Ask Jarvis to Start Bingo
                  </button>
                )}
              </div>
            )}

            {bingoNotice ? <p className="bingo-notice">{bingoNotice}</p> : null}
            {nextBingoCallNumber && activeBingoRound ? (
              <p className="bingo-next">Next hidden draw: {numberToBingoLabel(nextBingoCallNumber)}</p>
            ) : null}
          </section>
        </>
      ) : null}

      <aside className={`sidebar ${myName ? 'joined' : 'needs-name'}`}>
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
          {isAdminLoginAttempt ? (
            <div className="admin-password-card">
              <label htmlFor="admin-password-sidebar"><KeyRound size={14} /> Ripple admin password</label>
              <input
                id="admin-password-sidebar"
                type="password"
                value={adminPassword}
                onChange={(event) => {
                  setAdminPassword(event.target.value);
                  setNameError('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') saveName();
                }}
                placeholder="Enter admin password"
              />
            </div>
          ) : null}
          {nameError ? <p className="name-feedback error">{nameError}</p> : null}
          {nameNotice ? <p className="name-feedback success">{nameNotice}</p> : null}
        </div>

        {myName ? (
          <div className="profile-card">
            <p><UserCog size={14} /> Profile + Avatar</p>
            <div className="avatar-picker">
              {USER_PROFILE_AVATARS.map((avatar) => (
                <button key={avatar} type="button" className={userAvatar === avatar ? 'active' : ''} onClick={() => changeUserAvatar(avatar)}>{avatar}</button>
              ))}
            </div>
            <div className="profile-color-picker">
              {USER_PROFILE_COLORS.map((color) => (
                <button
                  key={color.key}
                  type="button"
                  className={userProfileColor === color.key ? 'active' : ''}
                  style={{ '--profile-color': color.color } as CSSProperties}
                  onClick={() => changeUserProfileColor(color.key)}
                >
                  {color.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="list-header">
          <span><Users size={16} /> Users</span>
          <strong>{onlineCount} online</strong>
        </div>

        <div className="user-list" role="listbox" aria-label="Chat users">
          {userList.map((user) => {
            const userAccentStyle = getProfileColorStyle(user.profileColor || '', user.name);

            return (
              <button
                key={user.key + user.name}
                type="button"
                className={`user-item ${selectedSender === user.name ? 'active' : ''}`}
                style={userAccentStyle}
                onClick={() => selectSender(user.name)}
              >
                <span className="user-avatar">{user.avatar || getDefaultAvatar(user.name)}</span>
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
          <Gamepad2 size={16} /> Jarvis hosts games/trivia, pauses them while Bingo is active, and gives +50 score to a verified Bingo winner.
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
            {isAdminUser ? (
              <button type="button" className="bingo-tv-button" onClick={openBingoTvScreen}>
                <Monitor size={17} /> BingoTV
              </button>
            ) : null}
            <div className="sender-pill">Logged in as: <strong>{senderName || 'Name required'}</strong>{isAdminUser ? <span className="admin-verified-badge">Admin verified</span> : null}</div>
            {myName ? (
              <button type="button" className="logout-button" onClick={logoutChatroom}>
                Logout
              </button>
            ) : null}
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
              {isAdminLoginAttempt ? (
                <div className="admin-password-card gate-admin-password">
                  <label htmlFor="admin-password-gate"><KeyRound size={14} /> Ripple admin password</label>
                  <input
                    id="admin-password-gate"
                    type="password"
                    value={adminPassword}
                    onChange={(event) => {
                      setAdminPassword(event.target.value);
                      setNameError('');
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') saveName();
                    }}
                    placeholder="Enter admin password"
                  />
                  <small>Admin tools like BingoTV and Start Bingo unlock only after verification.</small>
                </div>
              ) : null}
              {nameError ? <p className="name-feedback error">{nameError}</p> : null}
              {nameNotice ? <p className="name-feedback success">{nameNotice}</p> : null}
            </div>
          ) : displayedMessages.length === 0 ? (
            <div className="empty-state">
              <Bot size={42} />
              <h3>Start the conversation</h3>
              <p>Mag-message ka lang. Hindi na kailangan ng /ai — automatic nang sasagot si Jarvis.</p>
            </div>
          ) : (
            displayedMessages.map((message) => {
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
                      <time>-{formatChatDateTime(message.created_at)}</time>
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
            placeholder={isMuted ? 'Muted by Ripple admin' : myName ? 'Type a message... Jarvis will join the conversation' : 'Enter your name first to unlock chat'}
            disabled={!myName || isMuted}
          />
          <button type="submit" disabled={!myName || isMuted || !input.trim() || isSending}>
            {isSending ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
            <span className="send-label">Send</span>
          </button>
        </form>
      </section>
    </main>
  );
}
