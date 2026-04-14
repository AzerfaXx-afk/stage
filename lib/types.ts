export type Category = 'inventaire' | 'standards' | 'dvid' | 'recherches' | 'reunions' | 'autre';
export type Mood = 'great' | 'good' | 'ok' | 'hard' | 'lost';

export interface JournalEntry {
  id: string;
  date: string;           // ISO string
  category: Category;
  title: string;
  content: string;
  learnings: string;
  challenges: string;
  nextSteps: string;
  mood: Mood;
}

export interface MissionTask {
  id: string;
  text: string;
  done: boolean;
}

export interface MissionGroup {
  id: string;
  title: string;
  emoji: string;
  tasks: MissionTask[];
}

export interface AppState {
  entries: JournalEntry[];
  missions: MissionGroup[];
}

export const CATEGORIES: { key: Category; label: string; emoji: string }[] = [
  { key: 'inventaire', label: 'Inventaire', emoji: '📊' },
  { key: 'standards', label: 'Standards', emoji: '📐' },
  { key: 'dvid', label: 'DVID', emoji: '🔧' },
  { key: 'recherches', label: 'Recherches', emoji: '🔍' },
  { key: 'reunions', label: 'Réunions', emoji: '🤝' },
  { key: 'autre', label: 'Autre', emoji: '📎' },
];

export const MOODS: { key: Mood; emoji: string }[] = [
  { key: 'great', emoji: '🔥' },
  { key: 'good', emoji: '😊' },
  { key: 'ok', emoji: '😐' },
  { key: 'hard', emoji: '😓' },
  { key: 'lost', emoji: '😵' },
];

export const MOOD_MAP: Record<Mood, string> = {
  great: '🔥',
  good: '😊',
  ok: '😐',
  hard: '😓',
  lost: '😵',
};

export const CAT_EMOJI: Record<Category, string> = {
  inventaire: '📊',
  standards: '📐',
  dvid: '🔧',
  recherches: '🔍',
  reunions: '🤝',
  autre: '📎',
};
