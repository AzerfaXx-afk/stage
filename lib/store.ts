'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { JournalEntry, MissionGroup, AppState } from './types';
import { DEFAULT_MISSIONS } from './missions';

const STORAGE_KEY = 'stageflow_data';

function loadState(): AppState {
  if (typeof window === 'undefined') {
    return { entries: [], missions: DEFAULT_MISSIONS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      /* Merge any new missions from code updates */
      const existingIds = new Set(parsed.missions.map((g) => g.id));
      for (const group of DEFAULT_MISSIONS) {
        if (!existingIds.has(group.id)) {
          parsed.missions.push(group);
        }
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return { entries: [], missions: DEFAULT_MISSIONS };
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState());
  const initialized = useRef(false);

  /* Re-load from localStorage on mount (client only) */
  useEffect(() => {
    if (!initialized.current) {
      setState(loadState());
      initialized.current = true;
    }
  }, []);

  /* Persist whenever state changes */
  useEffect(() => {
    if (initialized.current) saveState(state);
  }, [state]);

  const addEntry = useCallback((entry: JournalEntry) => {
    setState((s) => ({ ...s, entries: [entry, ...s.entries] }));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
  }, []);

  const updateEntry = useCallback((id: string, patch: Partial<JournalEntry>) => {
    setState((s) => ({
      ...s,
      entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const toggleTask = useCallback((groupId: string, taskId: string) => {
    setState((s) => ({
      ...s,
      missions: s.missions.map((g) =>
        g.id === groupId
          ? {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t
              ),
            }
          : g
      ),
    }));
  }, []);

  const importData = useCallback((data: AppState) => {
    setState(data);
  }, []);

  /* Computed */
  const totalTasks = state.missions.reduce((a, g) => a + g.tasks.length, 0);
  const doneTasks = state.missions.reduce(
    (a, g) => a + g.tasks.filter((t) => t.done).length,
    0
  );

  const startDate = new Date('2026-04-13');
  const endDate = new Date('2026-06-19');
  const now = new Date();
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / 86400000
  );
  const daysElapsed = Math.max(
    0,
    Math.ceil((now.getTime() - startDate.getTime()) / 86400000)
  );
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const progressPct = Math.min(
    100,
    Math.round((daysElapsed / totalDays) * 100)
  );

  return {
    state,
    entries: state.entries,
    missions: state.missions,
    addEntry,
    deleteEntry,
    updateEntry,
    toggleTask,
    importData,
    totalTasks,
    doneTasks,
    startDate,
    endDate,
    totalDays,
    daysElapsed,
    daysRemaining,
    progressPct,
  };
}

/* ============================================
   Voice hook
   ============================================ */
export function useVoice() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;
    setSupported(!!SR);
    if (SR) {
      const r = new SR();
      r.lang = 'fr-FR';
      r.continuous = true;
      r.interimResults = true;
      r.onresult = (ev: SpeechRecognitionEvent) => {
        let t = '';
        for (let i = 0; i < ev.results.length; i++) {
          t += ev.results[i][0].transcript;
        }
        setTranscript(t);
      };
      r.onend = () => setListening(false);
      r.onerror = () => setListening(false);
      recognitionRef.current = r;
    }
  }, []);

  const toggle = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) return;
    if (listening) {
      r.stop();
      setListening(false);
    } else {
      setTranscript('');
      r.start();
      setListening(true);
    }
  }, [listening]);

  const reset = useCallback(() => setTranscript(''), []);

  return { listening, transcript, supported, toggle, reset };
}

/* ============================================
   Toast hook
   ============================================ */
export function useToast() {
  const [msg, setMsg] = useState('');
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string) => {
    setMsg(text);
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2500);
  }, []);

  return { msg, visible, show };
}

/* ============================================
   Export helpers
   ============================================ */
export function exportMarkdown(entries: JournalEntry[], missions: MissionGroup[]): string {
  const catLabels: Record<string, string> = {
    inventaire: 'Inventaire', standards: 'Standards', dvid: 'DVID',
    recherches: 'Recherches', reunions: 'Réunions', autre: 'Autre',
  };
  let md = '# 📝 Rapport de Stage — IoT @ Ville de Luxembourg\n\n';
  md += `> Généré le ${new Date().toLocaleDateString('fr-FR')}\n\n`;

  /* Group entries by week */
  const byWeek = new Map<string, JournalEntry[]>();
  for (const e of [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
    const d = new Date(e.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay() + 1);
    const key = weekStart.toISOString().slice(0, 10);
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(e);
  }

  for (const [week, wEntries] of byWeek) {
    md += `## 📅 Semaine du ${new Date(week).toLocaleDateString('fr-FR')}\n\n`;
    for (const e of wEntries) {
      md += `### ${catLabels[e.category] || e.category} — ${e.title}\n`;
      md += `*${new Date(e.date).toLocaleDateString('fr-FR')}*\n\n`;
      if (e.content) md += `${e.content}\n\n`;
      if (e.learnings) md += `**💡 Apprentissages :** ${e.learnings}\n\n`;
      if (e.challenges) md += `**⚠️ Difficultés :** ${e.challenges}\n\n`;
      if (e.nextSteps) md += `**🎯 Prochaines étapes :** ${e.nextSteps}\n\n`;
      md += '---\n\n';
    }
  }

  md += '## 🎯 Missions et Tâches\n\n';
  for (const g of missions) {
    const done = g.tasks.filter((t) => t.done).length;
    md += `### ${g.emoji} ${g.title} (${done}/${g.tasks.length})\n\n`;
    for (const t of g.tasks) {
      md += `- [${t.done ? 'x' : ' '}] ${t.text}\n`;
    }
    md += '\n';
  }

  return md;
}

export function downloadFile(content: string, filename: string, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
