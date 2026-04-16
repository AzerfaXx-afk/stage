export type Category = 'contexte' | 'cahier_charges' | 'deroulement' | 'bilan' | 'reunions' | 'dvid' | 'autre';
export type Mood = 'great' | 'good' | 'ok' | 'hard' | 'lost';

export interface JournalEntry {
  id: string;
  date: string;           // ISO string
  category: Category;
  title: string;
  content: string;
  
  // Specific for Rapport & Soutenance
  quoi: string;
  pourquoi: string;
  comment: string;
  
  // Bilan & Compétences
  challenges: string;
  skillsSavoir: string;      // Théorie
  skillsSavoirFaire: string; // Technique
  skillsSavoirEtre: string;  // Soft skills
  
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
  { key: 'contexte', label: 'Contexte/Entreprise', emoji: '🏢' },
  { key: 'cahier_charges', label: 'Cahier des charges', emoji: '📋' },
  { key: 'deroulement', label: 'Déroulement (Missions)', emoji: '⚙️' },
  { key: 'bilan', label: 'Bilan de mission', emoji: '🏆' },
  { key: 'reunions', label: 'Réunions', emoji: '🤝' },
  { key: 'dvid', label: 'DVID / Pratique', emoji: '🔧' },
  { key: 'autre', label: 'Autre', emoji: '📎' }
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
  contexte: '🏢',
  cahier_charges: '📋',
  deroulement: '⚙️',
  bilan: '🏆',
  reunions: '🤝',
  dvid: '🔧',
  autre: '📎',
};
