'use client';

import { useState, useMemo, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useAppState,
  useVoice,
  useToast,
  exportMarkdown,
  downloadFile,
} from '../lib/store';
import type { Category, Mood, JournalEntry } from '../lib/types';
import { CATEGORIES, MOODS, MOOD_MAP, CAT_EMOJI } from '../lib/types';

type Page = 'dashboard' | 'journal' | 'add' | 'missions' | 'export';

const pageVariants = {
  initial: { opacity: 0, y: 18 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -12 },
};

const pageTrans = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };

/* ============================================  Greeting  ============================================ */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Bonne nuit';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

/* ============================================  Main App  ============================================ */
export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [splash, setSplash] = useState(true);
  const store = useAppState();
  const voice = useVoice();
  const toast = useToast();
  const [detailEntry, setDetailEntry] = useState<JournalEntry | null>(null);

  /* Form state */
  const [fCat, setFCat] = useState<Category>('inventaire');
  const [fTitle, setFTitle] = useState('');
  const [fContent, setFContent] = useState('');
  const [fLearn, setFLearn] = useState('');
  const [fChallenge, setFChallenge] = useState('');
  const [fNext, setFNext] = useState('');
  const [fMood, setFMood] = useState<Mood>('good');

  /* Search & filter */
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Category | 'all'>('all');

  /* Splash */
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1600);
    return () => clearTimeout(t);
  }, []);

  /* Sync voice transcript */
  useEffect(() => {
    if (voice.transcript) setFContent(voice.transcript);
  }, [voice.transcript]);

  /* Filtered entries */
  const filteredEntries = useMemo(() => {
    let list = store.entries;
    if (filter !== 'all') list = list.filter((e) => e.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q)
      );
    }
    return list;
  }, [store.entries, filter, search]);

  const navigate = (p: Page) => {
    if (page === 'add' && voice.listening) voice.toggle();
    setPage(p);
  };

  /* Submit */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!fTitle.trim() && !fContent.trim()) {
      toast.show('⚠️ Ajoute un titre ou du contenu');
      return;
    }
    if (voice.listening) voice.toggle();
    store.addEntry({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toISOString(),
      category: fCat,
      title: fTitle.trim() || 'Sans titre',
      content: fContent.trim(),
      learnings: fLearn.trim(),
      challenges: fChallenge.trim(),
      nextSteps: fNext.trim(),
      mood: fMood,
    });
    setFTitle('');
    setFContent('');
    setFLearn('');
    setFChallenge('');
    setFNext('');
    setFMood('good');
    voice.reset();
    toast.show('✅ Entrée sauvegardée !');
    setPage('journal');
  };

  /* Missions progress */
  const mPct =
    store.totalTasks > 0
      ? Math.round((store.doneTasks / store.totalTasks) * 100)
      : 0;

  /* Export functions */
  const doExportMd = () => {
    const md = exportMarkdown(store.entries, store.missions);
    downloadFile(md, `rapport-stage-iot-${new Date().toISOString().slice(0, 10)}.md`);
    toast.show('📄 Rapport exporté !');
  };
  const doExportJson = () => {
    downloadFile(
      JSON.stringify(store.state, null, 2),
      `stageflow-backup-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
    toast.show('💾 Backup téléchargé !');
  };
  const doExportWeekly = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEntries = store.entries.filter(
      (e) => new Date(e.date) >= weekStart
    );
    let md = `# 📅 Résumé Semaine du ${weekStart.toLocaleDateString('fr-FR')}\n\n`;
    if (weekEntries.length === 0) {
      md += 'Aucune entrée cette semaine.\n';
    } else {
      for (const e of weekEntries) {
        md += `## ${e.title}\n*${new Date(e.date).toLocaleDateString('fr-FR')}* — ${CATEGORIES.find(c => c.key === e.category)?.label}\n\n${e.content}\n\n`;
      }
    }
    downloadFile(md, `resume-semaine-${weekStart.toISOString().slice(0, 10)}.md`);
    toast.show('📅 Résumé hebdo exporté !');
  };
  const doImport = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.entries && data.missions) {
          store.importData(data);
          toast.show('📥 Données importées !');
        } else {
          toast.show('❌ Fichier invalide');
        }
      } catch {
        toast.show('❌ Erreur de lecture');
      }
    };
    reader.readAsText(file);
    ev.target.value = '';
  };

  /* ============================================  SPLASH  ============================================ */
  if (splash) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#06060c',
          zIndex: 9999,
        }}
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ fontSize: '3rem', marginBottom: 16 }}
        >
          🏛️
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #818cf8, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          StageFlow
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          style={{ fontSize: '0.8rem', color: '#8b8ba7', marginTop: 4 }}
        >
          Ville de Luxembourg
        </motion.p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.7, ease: 'easeInOut' }}
          style={{
            marginTop: 32,
            width: 120,
            height: 3,
            borderRadius: 999,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            transformOrigin: 'left',
          }}
        />
      </div>
    );
  }

  /* ============================================  RENDER  ============================================ */
  return (
    <>
      <div className="app-container">
        <AnimatePresence mode="wait">
          {/* ===== DASHBOARD ===== */}
          {page === 'dashboard' && (
            <motion.div
              key="dashboard"
              className="page-content"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTrans}
            >
              <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h1 className="page-title">
                      {getGreeting()} Adam{' '}
                      <motion.span
                        initial={{ rotate: 0 }}
                        animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                        transition={{ duration: 1.5, delay: 0.4 }}
                        style={{ display: 'inline-block' }}
                      >
                        👋
                      </motion.span>
                    </h1>
                    <p className="page-subtitle">Stage IoT — Ville de Luxembourg</p>
                  </div>
                  <motion.div
                    className="day-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
                  >
                    J{store.daysElapsed}
                  </motion.div>
                </div>
              </div>

              {/* Progress */}
              <motion.div
                className="card progress-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="progress-header">
                  <div>
                    <span className="progress-label">Progression du stage</span>
                    <div className="progress-value">{store.progressPct}%</div>
                  </div>
                  <div className="progress-dates">
                    <span>13/04</span>
                    <span>→</span>
                    <span>19/06</span>
                  </div>
                </div>
                <div className="progress-bar-wrap">
                  <motion.div
                    className="progress-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(store.progressPct, 2)}%` }}
                    transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-number">{store.daysElapsed}</span>
                    <span className="stat-text">jours</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{store.daysRemaining}</span>
                    <span className="stat-text">restants</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{store.entries.length}</span>
                    <span className="stat-text">entrées</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{store.doneTasks}</span>
                    <span className="stat-text">tâches</span>
                  </div>
                </div>
              </motion.div>

              {/* Quick actions */}
              <div className="section-label">Actions rapides</div>
              <div className="actions-grid">
                {[
                  { emoji: '🎙️', label: 'Vocal', go: 'add' as Page },
                  { emoji: '✍️', label: 'Écrire', go: 'add' as Page },
                  { emoji: '✅', label: 'Tâches', go: 'missions' as Page },
                  { emoji: '📄', label: 'Rapport', go: 'export' as Page },
                ].map((a, i) => (
                  <motion.button
                    key={a.label}
                    className="action-btn"
                    onClick={() => navigate(a.go)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <span className="action-emoji">{a.emoji}</span>
                    <span className="action-label">{a.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Recent entries */}
              <div className="section-label">Dernières entrées</div>
              {store.entries.length === 0 ? (
                <div className="empty-box">
                  <span className="empty-emoji">📝</span>
                  <p>Aucune entrée</p>
                  <p className="empty-sub">Appuie sur ➕ pour commencer</p>
                </div>
              ) : (
                <div className="entries-list">
                  {store.entries.slice(0, 3).map((e, i) => (
                    <motion.div
                      key={e.id}
                      className="entry-card"
                      data-cat={e.category}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      onClick={() => setDetailEntry(e)}
                    >
                      <div className="entry-top">
                        <span className="entry-title">{e.title}</span>
                        <span className="entry-mood">{MOOD_MAP[e.mood]}</span>
                      </div>
                      <div className="entry-meta">
                        <span className="entry-date">
                          {new Date(e.date).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="cat-badge" data-cat={e.category}>
                          {CAT_EMOJI[e.category]} {e.category}
                        </span>
                      </div>
                      {e.content && (
                        <p className="entry-excerpt">{e.content}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Brief */}
              <div className="section-label">Brief de mission</div>
              <div className="card brief-card">
                <div className="brief-row">
                  <span className="brief-key">Thématique</span>
                  <span className="brief-val">IoT, Inventaire et définition de standards</span>
                </div>
                <div className="brief-row">
                  <span className="brief-key">Sujet</span>
                  <span className="brief-val">Création d&apos;une nomenclature IoT — document de référence pour tous les appareils IoT de la VDL</span>
                </div>
                <div className="brief-row">
                  <span className="brief-key">Rôle</span>
                  <span className="brief-val">Chef de projet, chargé d&apos;étude</span>
                </div>
                <div className="brief-row">
                  <span className="brief-key">Compétences</span>
                  <span className="brief-val">Protocoles IoT • Outils d&apos;inventaire • Sécurité IoT • Rédaction de référentiel</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== JOURNAL ===== */}
          {page === 'journal' && (
            <motion.div
              key="journal"
              className="page-content"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTrans}
            >
              <div className="page-header">
                <h1 className="page-title">📝 Journal de bord</h1>
                <p className="page-subtitle">Toutes tes entrées, jour par jour</p>
              </div>

              <div className="filters-row">
                <button
                  className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  Tout
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    className={`filter-chip ${filter === c.key ? 'active' : ''}`}
                    onClick={() => setFilter(c.key)}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>

              <div className="search-wrap">
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Rechercher dans le journal..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {filteredEntries.length === 0 ? (
                <div className="empty-box">
                  <span className="empty-emoji">📖</span>
                  <p>Aucune entrée</p>
                  <p className="empty-sub">
                    {store.entries.length === 0
                      ? 'Commence à documenter ton stage !'
                      : 'Aucun résultat pour ce filtre'}
                  </p>
                </div>
              ) : (
                <div className="entries-list">
                  {filteredEntries.map((e, i) => (
                    <motion.div
                      key={e.id}
                      className="entry-card"
                      data-cat={e.category}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setDetailEntry(e)}
                    >
                      <div className="entry-top">
                        <span className="entry-title">{e.title}</span>
                        <span className="entry-mood">{MOOD_MAP[e.mood]}</span>
                      </div>
                      <div className="entry-meta">
                        <span className="entry-date">
                          {new Date(e.date).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="cat-badge" data-cat={e.category}>
                          {CAT_EMOJI[e.category]} {e.category}
                        </span>
                      </div>
                      {e.content && (
                        <p className="entry-excerpt">{e.content}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ===== ADD ENTRY ===== */}
          {page === 'add' && (
            <motion.div
              key="add"
              className="page-content"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTrans}
            >
              <div className="page-header">
                <h1 className="page-title">
                  ✨ <span className="page-title-gradient">Nouvelle entrée</span>
                </h1>
                <p className="page-subtitle">
                  {new Date().toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Category */}
                <div className="form-group">
                  <label className="form-label">Catégorie</label>
                  <div className="cat-grid">
                    {CATEGORIES.map((c) => (
                      <label key={c.key} className="cat-option">
                        <input
                          type="radio"
                          name="category"
                          checked={fCat === c.key}
                          onChange={() => setFCat(c.key)}
                        />
                        <span className="cat-chip">
                          {c.emoji} {c.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="form-group">
                  <label className="form-label">Titre</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Découverte de Cisco ISE..."
                    value={fTitle}
                    onChange={(e) => setFTitle(e.target.value)}
                  />
                </div>

                {/* Voice */}
                <div className="form-group">
                  <label className="form-label">Ce que j&apos;ai fait aujourd&apos;hui</label>
                  <div className="voice-area">
                    <button
                      type="button"
                      className={`voice-btn ${voice.listening ? 'recording' : ''}`}
                      onClick={voice.toggle}
                    >
                      <span className="voice-emoji">
                        {voice.listening ? '⏹️' : '🎙️'}
                      </span>
                      <span>
                        {voice.listening
                          ? 'Arrêter la dictée...'
                          : voice.supported
                          ? 'Appuyer pour dicter'
                          : 'Micro non disponible'}
                      </span>
                    </button>
                    {voice.listening && (
                      <motion.div
                        className="voice-status"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        🔴 Écoute en cours... Parle en français
                      </motion.div>
                    )}
                  </div>
                  <textarea
                    className="form-textarea"
                    placeholder="Décris ce que tu as fait, appris, rencontré comme problèmes..."
                    rows={5}
                    value={fContent}
                    onChange={(e) => setFContent(e.target.value)}
                  />
                </div>

                {/* Learnings */}
                <div className="form-group">
                  <label className="form-label">💡 Ce que j&apos;ai appris</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Nouveaux protocoles, contacts importants, infos clés..."
                    rows={3}
                    value={fLearn}
                    onChange={(e) => setFLearn(e.target.value)}
                  />
                </div>

                {/* Challenges */}
                <div className="form-group">
                  <label className="form-label">⚠️ Difficultés rencontrées</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Blocages, questions sans réponse, droits d'accès manquants..."
                    rows={3}
                    value={fChallenge}
                    onChange={(e) => setFChallenge(e.target.value)}
                  />
                </div>

                {/* Next Steps */}
                <div className="form-group">
                  <label className="form-label">🎯 Prochaines étapes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Ce que je dois faire demain/cette semaine..."
                    rows={3}
                    value={fNext}
                    onChange={(e) => setFNext(e.target.value)}
                  />
                </div>

                {/* Mood */}
                <div className="form-group">
                  <label className="form-label">Comment s&apos;est passée la journée ?</label>
                  <div className="mood-row">
                    {MOODS.map((m) => (
                      <label key={m.key} className="mood-option">
                        <input
                          type="radio"
                          name="mood"
                          checked={fMood === m.key}
                          onChange={() => setFMood(m.key)}
                        />
                        <span className="mood-face">{m.emoji}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="submit-btn"
                  whileTap={{ scale: 0.97 }}
                >
                  💾 Sauvegarder l&apos;entrée
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ===== MISSIONS ===== */}
          {page === 'missions' && (
            <motion.div
              key="missions"
              className="page-content"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTrans}
            >
              <div className="page-header">
                <h1 className="page-title">🎯 Missions & Tâches</h1>
                <p className="page-subtitle">Suivi de l&apos;avancement du stage</p>
              </div>

              <div className="missions-bar-wrap">
                <div className="missions-bar-track">
                  <motion.div
                    className="missions-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${mPct}%` }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                  />
                </div>
                <span className="missions-pct">{mPct}%</span>
              </div>

              {store.missions.map((g) => {
                const gDone = g.tasks.filter((t) => t.done).length;
                return (
                  <motion.div
                    key={g.id}
                    className="mission-group"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="mission-group-head">
                      <span>{g.emoji}</span>
                      <h3>{g.title}</h3>
                      <span className="mission-count">
                        {gDone}/{g.tasks.length}
                      </span>
                    </div>
                    <div className="mission-items">
                      {g.tasks.map((t) => (
                        <div
                          key={t.id}
                          className={`mission-row ${t.done ? 'done' : ''}`}
                        >
                          <input
                            type="checkbox"
                            className="mission-check"
                            checked={t.done}
                            onChange={() => store.toggleTask(g.id, t.id)}
                          />
                          <span className="mission-label">{t.text}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ===== EXPORT ===== */}
          {page === 'export' && (
            <motion.div
              key="export"
              className="page-content"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTrans}
            >
              <div className="page-header">
                <h1 className="page-title">📤 Export & Rapport</h1>
                <p className="page-subtitle">Génère ton rapport de stage automatiquement</p>
              </div>

              <div className="export-grid">
                {[
                  {
                    emoji: '📄',
                    name: 'Rapport Markdown',
                    desc: 'Export complet structuré par semaine et catégorie',
                    fn: doExportMd,
                  },
                  {
                    emoji: '💾',
                    name: 'Sauvegarde JSON',
                    desc: 'Backup complet de toutes tes données',
                    fn: doExportJson,
                  },
                  {
                    emoji: '📅',
                    name: 'Résumé hebdo',
                    desc: 'Résumé de la semaine en cours',
                    fn: doExportWeekly,
                  },
                  {
                    emoji: '📈',
                    name: 'Timeline',
                    desc: 'Toutes les entrées par date',
                    fn: doExportMd, /* same as full report */
                  },
                ].map((ex, i) => (
                  <motion.button
                    key={ex.name}
                    className="export-btn"
                    onClick={ex.fn}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <span className="export-emoji">{ex.emoji}</span>
                    <span className="export-name">{ex.name}</span>
                    <span className="export-desc">{ex.desc}</span>
                  </motion.button>
                ))}
              </div>

              <div className="section-label">📥 Importer une sauvegarde</div>
              <label className="import-area">
                <span>📁</span> Sélectionner un fichier JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={doImport}
                  hidden
                />
              </label>

              <div className="section-label">📊 Statistiques</div>
              <div className="card">
                <div className="stat-row">
                  <span className="stat-row-label">Entrées totales</span>
                  <span className="stat-row-value">{store.entries.length}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-row-label">Tâches complétées</span>
                  <span className="stat-row-value">
                    {store.doneTasks}/{store.totalTasks}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-row-label">Jours actifs</span>
                  <span className="stat-row-value">
                    {new Set(store.entries.map((e) => e.date.slice(0, 10))).size}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-row-label">Mots écrits</span>
                  <span className="stat-row-value">
                    {store.entries
                      .reduce(
                        (a, e) =>
                          a +
                          (e.content + ' ' + e.learnings + ' ' + e.challenges + ' ' + e.nextSteps)
                            .split(/\s+/)
                            .filter(Boolean).length,
                        0
                      )
                      .toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== BOTTOM NAV ===== */}
      <nav className="bottom-nav">
        {(
          [
            { page: 'dashboard' as Page, icon: '📊', label: 'Accueil' },
            { page: 'journal' as Page, icon: '📝', label: 'Journal' },
            { page: 'add' as Page, icon: '➕', label: '' },
            { page: 'missions' as Page, icon: '🎯', label: 'Missions' },
            { page: 'export' as Page, icon: '📤', label: 'Export' },
          ] as const
        ).map((n) => (
          <button
            key={n.page}
            className={`nav-item ${page === n.page ? 'active' : ''} ${
              n.page === 'add' ? 'nav-add' : ''
            }`}
            onClick={() => navigate(n.page)}
          >
            <span className="nav-icon">{n.icon}</span>
            {n.label && <span className="nav-label">{n.label}</span>}
          </button>
        ))}
      </nav>

      {/* ===== TOAST ===== */}
      <div className={`toast ${toast.visible ? 'visible' : ''}`}>{toast.msg}</div>

      {/* ===== DETAIL MODAL ===== */}
      <AnimatePresence>
        {detailEntry && (
          <>
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailEntry(null)}
            />
            <motion.div
              className="modal-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="modal-handle" />
              <div className="entry-meta" style={{ marginBottom: 16 }}>
                <span className="cat-badge" data-cat={detailEntry.category}>
                  {CAT_EMOJI[detailEntry.category]} {detailEntry.category}
                </span>
                <span className="entry-date">
                  {new Date(detailEntry.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </span>
                <span>{MOOD_MAP[detailEntry.mood]}</span>
              </div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  marginBottom: 20,
                }}
              >
                {detailEntry.title}
              </h2>

              {detailEntry.content && (
                <div className="detail-block">
                  <h4>📝 Ce que j&apos;ai fait</h4>
                  <p>{detailEntry.content}</p>
                </div>
              )}
              {detailEntry.learnings && (
                <div className="detail-block">
                  <h4>💡 Ce que j&apos;ai appris</h4>
                  <p>{detailEntry.learnings}</p>
                </div>
              )}
              {detailEntry.challenges && (
                <div className="detail-block">
                  <h4>⚠️ Difficultés</h4>
                  <p>{detailEntry.challenges}</p>
                </div>
              )}
              {detailEntry.nextSteps && (
                <div className="detail-block">
                  <h4>🎯 Prochaines étapes</h4>
                  <p>{detailEntry.nextSteps}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                <button
                  className="submit-btn"
                  style={{ flex: 1 }}
                  onClick={() => setDetailEntry(null)}
                >
                  Fermer
                </button>
                <button
                  className="submit-btn"
                  style={{
                    flex: 0,
                    padding: '16px 20px',
                    background: 'var(--red)',
                    boxShadow: 'none',
                  }}
                  onClick={() => {
                    store.deleteEntry(detailEntry.id);
                    setDetailEntry(null);
                    toast.show('🗑️ Entrée supprimée');
                  }}
                >
                  🗑️
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
