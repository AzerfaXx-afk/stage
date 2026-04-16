'use client';

import { useState, useMemo, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useAppState,
  useVoice,
  useToast,
  exportOfficialReport,
  downloadFile,
} from '../lib/store';
import type { Category, Mood, JournalEntry } from '../lib/types';
import { CATEGORIES, MOODS, MOOD_MAP, CAT_EMOJI } from '../lib/types';

type Page = 'dashboard' | 'journal' | 'add' | 'missions' | 'export' | 'soutenance';

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
  const [fCat, setFCat] = useState<Category>('deroulement');
  const [fTitle, setFTitle] = useState('');
  const [fContent, setFContent] = useState('');
  
  const [fQuoi, setFQuoi] = useState('');
  const [fPourquoi, setFPourquoi] = useState('');
  const [fComment, setFComment] = useState('');
  
  const [fChallenge, setFChallenge] = useState('');
  const [fSavoir, setFSavoir] = useState('');
  const [fSavoirFaire, setFSavoirFaire] = useState('');
  const [fSavoirEtre, setFSavoirEtre] = useState('');
  
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
      quoi: fQuoi.trim(),
      pourquoi: fPourquoi.trim(),
      comment: fComment.trim(),
      challenges: fChallenge.trim(),
      skillsSavoir: fSavoir.trim(),
      skillsSavoirFaire: fSavoirFaire.trim(),
      skillsSavoirEtre: fSavoirEtre.trim(),
      nextSteps: fNext.trim(),
      mood: fMood,
    });
    setFTitle('');
    setFContent('');
    setFQuoi('');
    setFPourquoi('');
    setFComment('');
    setFChallenge('');
    setFSavoir('');
    setFSavoirFaire('');
    setFSavoirEtre('');
    setFNext('');
    setFMood('good');
    voice.reset();
    toast.show('✅ Entrée sauvegardée pour le Rapport !');
    setPage('journal');
  };

  const mPct =
    store.totalTasks > 0
      ? Math.round((store.doneTasks / store.totalTasks) * 100)
      : 0;

  const doExportMd = () => {
    const md = exportOfficialReport(store.entries, store.missions);
    downloadFile(md, `rapport-officiel-${new Date().toISOString().slice(0, 10)}.md`);
    toast.show('📄 Squelette Officiel généré !');
  };
  const doExportJson = () => {
    downloadFile(
      JSON.stringify(store.state, null, 2),
      `stageflow-backup-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
    toast.show('💾 Backup téléchargé !');
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

  if (splash) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#06060c', zIndex: 9999,
        }}
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ fontSize: '3rem', marginBottom: 16 }}
        >
          🎓
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #818cf8, #8b5cf6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}
        >
          StageFlow
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.6, duration: 0.4 }}
          style={{ fontSize: '0.8rem', color: '#8b8ba7', marginTop: 4 }}
        >
          IUT NB R&T - VDL
        </motion.p>
      </div>
    );
  }

  return (
    <>
      <div className="app-container">
        <AnimatePresence mode="wait">
          {page === 'dashboard' && (
            <motion.div key="dashboard" className="page-content" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTrans}>
              <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h1 className="page-title">
                      {getGreeting()} Adam{' '}
                    </h1>
                    <p className="page-subtitle">Stage IoT — Ville de Luxembourg</p>
                  </div>
                  <motion.div className="day-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}>
                    J{store.daysElapsed}
                  </motion.div>
                </div>
              </div>

              <motion.div className="card progress-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="progress-header">
                  <div>
                    <span className="progress-label">Progression</span>
                    <div className="progress-value">{store.progressPct}%</div>
                  </div>
                  <div className="progress-dates"><span>13/04</span><span>→</span><span>19/06</span></div>
                </div>
                <div className="progress-bar-wrap">
                  <motion.div className="progress-bar-fill" initial={{ width: 0 }} animate={{ width: `${Math.max(store.progressPct, 2)}%` }} transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }} />
                </div>
                <div className="stats-grid">
                  <div className="stat-item"><span className="stat-number">{store.daysRemaining}</span><span className="stat-text">jours restants</span></div>
                  <div className="stat-item"><span className="stat-number">{store.entries.length}</span><span className="stat-text">entrées</span></div>
                  <div className="stat-item"><span className="stat-number">{store.doneTasks}</span><span className="stat-text">tâches finies</span></div>
                </div>
              </motion.div>

              <div className="section-label">Actions rapides</div>
              <div className="actions-grid">
                {[
                  { emoji: '✍️', label: 'Entrée', go: 'add' as Page },
                  { emoji: '🎯', label: 'Missions', go: 'missions' as Page },
                  { emoji: '🎙️', label: 'Soutenance', go: 'soutenance' as Page },
                  { emoji: '📄', label: 'Rapport', go: 'export' as Page },
                ].map((a, i) => (
                  <motion.button key={a.label} className="action-btn" onClick={() => navigate(a.go)} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }} whileTap={{ scale: 0.92 }}>
                    <span className="action-emoji">{a.emoji}</span>
                    <span className="action-label">{a.label}</span>
                  </motion.button>
                ))}
              </div>

              <div className="section-label">Dernières entrées</div>
              {store.entries.length === 0 ? (
                <div className="empty-box"><span className="empty-emoji">📝</span><p>Aucune entrée</p></div>
              ) : (
                <div className="entries-list">
                  {store.entries.slice(0, 3).map((e, i) => (
                    <motion.div key={e.id} className="entry-card" data-cat={e.category} onClick={() => setDetailEntry(e)}>
                      <div className="entry-top">
                        <span className="entry-title">{e.title}</span><span className="entry-mood">{MOOD_MAP[e.mood]}</span>
                      </div>
                      <div className="entry-meta">
                        <span className="entry-date">{new Date(e.date).toLocaleDateString('fr-FR')}</span>
                        <span className="cat-badge" data-cat={e.category}>{CAT_EMOJI[e.category]} {e.category}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {page === 'journal' && (
            <motion.div key="journal" className="page-content" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTrans}>
              <div className="page-header">
                <h1 className="page-title">📝 Journal</h1>
                <p className="page-subtitle">Tes notes pour le rapport</p>
              </div>
              <div className="filters-row">
                <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tout</button>
                {CATEGORIES.map((c) => (
                  <button key={c.key} className={`filter-chip ${filter === c.key ? 'active' : ''}`} onClick={() => setFilter(c.key)}>{c.emoji} {c.label}</button>
                ))}
              </div>
              <div className="search-wrap">
                <span>🔍</span><input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="entries-list">
                {filteredEntries.map((e, i) => (
                  <motion.div key={e.id} className="entry-card" data-cat={e.category} onClick={() => setDetailEntry(e)}>
                    <div className="entry-top">
                      <span className="entry-title">{e.title}</span><span className="entry-mood">{MOOD_MAP[e.mood]}</span>
                    </div>
                    <div className="entry-meta">
                      <span className="entry-date">{new Date(e.date).toLocaleDateString('fr-FR')}</span>
                      <span className="cat-badge" data-cat={e.category}>{CAT_EMOJI[e.category]} {e.category}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {page === 'add' && (
            <motion.div key="add" className="page-content" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTrans}>
              <div className="page-header">
                <h1 className="page-title">✨ <span className="page-title-gradient">Nouvelle entrée IUT</span></h1>
                <p className="page-subtitle">Conçue pour remplir ton rapport</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Partie du Rapport / Catégorie</label>
                  <div className="cat-grid">
                    {CATEGORIES.map((c) => (
                      <label key={c.key} className="cat-option">
                        <input type="radio" name="category" checked={fCat === c.key} onChange={() => setFCat(c.key)} />
                        <span className="cat-chip">{c.emoji} {c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Titre</label>
                  <input type="text" className="form-input" placeholder="Ex: Configuration Gateway LoRaWAN..." value={fTitle} onChange={(e) => setFTitle(e.target.value)} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Notes Générales (ou Dictée Rapide)</label>
                  <div className="voice-area">
                    <button type="button" className={`voice-btn ${voice.listening ? 'recording' : ''}`} onClick={voice.toggle}>
                      <span className="voice-emoji">{voice.listening ? '⏹️' : '🎙️'}</span>
                      <span>{voice.listening ? 'Arrêter' : 'Dicter au micro'}</span>
                    </button>
                  </div>
                  <textarea className="form-textarea" rows={3} value={fContent} onChange={(e) => setFContent(e.target.value)} />
                </div>

                {(fCat === 'deroulement' || fCat === 'dvid' || fCat === 'cahier_charges') && (
                  <div className="methodology-block" style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginTop: '16px' }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: 12 }}>🎯 Méthodologie (Quoi / Pourquoi / Comment)</h3>
                    <div className="form-group">
                      <label className="form-label">Quoi ? (Objectif de la tâche)</label>
                      <input type="text" className="form-input" value={fQuoi} onChange={(e) => setFQuoi(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pourquoi ? (Pourquoi toi ? Intérêt ?)</label>
                      <input type="text" className="form-input" value={fPourquoi} onChange={(e) => setFPourquoi(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Comment ? (Contraintes, outils, moyens)</label>
                      <textarea className="form-textarea" rows={2} value={fComment} onChange={(e) => setFComment(e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="skills-block" style={{ marginTop: 24, padding: '16px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <h3 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: 12 }}>🧠 Compétences & Bilan</h3>
                  <div className="form-group">
                    <label className="form-label">⚠️ Difficultés surmontées (Comment as-tu fait ?)</label>
                    <textarea className="form-textarea" rows={2} value={fChallenge} onChange={(e) => setFChallenge(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">📚 SAVOIR (Connaissances théoriques apprises)</label>
                    <input type="text" className="form-input" placeholder="Ex: Architecture MQTT, BBMD Bacnet..." value={fSavoir} onChange={(e) => setFSavoir(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">🔧 SAVOIR-FAIRE (Compétences techniques acquises)</label>
                    <input type="text" className="form-input" placeholder="Ex: Faire un scan Nmap, configurer Wireshark..." value={fSavoirFaire} onChange={(e) => setFSavoirFaire(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">🤝 SAVOIR-ÊTRE (Compétences comportementales)</label>
                    <input type="text" className="form-input" placeholder="Ex: Travail en autonomie, communication équipe..." value={fSavoirEtre} onChange={(e) => setFSavoirEtre(e.target.value)} />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 24 }}>
                  <label className="form-label">Comment te sens-tu ?</label>
                  <div className="mood-row">
                    {MOODS.map((m) => (
                      <label key={m.key} className="mood-option">
                        <input type="radio" name="mood" checked={fMood === m.key} onChange={() => setFMood(m.key)} />
                        <span className="mood-face">{m.emoji}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <motion.button type="submit" className="submit-btn" whileTap={{ scale: 0.97 }}>
                  💾 Sauvegarder pour le rapport
                </motion.button>
              </form>
            </motion.div>
          )}

          {page === 'missions' && (
            <motion.div key="missions" className="page-content" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTrans}>
              <div className="page-header">
                <h1 className="page-title">🎯 Missions</h1>
              </div>
              <div className="missions-bar-wrap">
                <div className="missions-bar-track"><motion.div className="missions-bar-fill" initial={{ width: 0 }} animate={{ width: `${mPct}%` }} /></div>
                <span className="missions-pct">{mPct}%</span>
              </div>
              {store.missions.map((g) => {
                const gDone = g.tasks.filter((t) => t.done).length;
                return (
                  <motion.div key={g.id} className="mission-group">
                    <div className="mission-group-head"><span>{g.emoji}</span><h3>{g.title}</h3><span className="mission-count">{gDone}/{g.tasks.length}</span></div>
                    <div className="mission-items">
                      {g.tasks.map((t) => (
                        <div key={t.id} className={`mission-row ${t.done ? 'done' : ''}`}>
                          <input type="checkbox" className="mission-check" checked={t.done} onChange={() => store.toggleTask(g.id, t.id)} />
                          <span className="mission-label">{t.text}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {page === 'soutenance' && (
            <motion.div key="soutenance" className="page-content" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTrans}>
              <div className="page-header">
                <h1 className="page-title">🎙️ Soutenance (Diapos)</h1>
                <p className="page-subtitle">Plan officiel de ta présentation (20 min)</p>
              </div>
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>1. Contexte & Enjeux</h3>
                <p style={{ fontSize: '0.85rem', color: '#a0a0b2' }}>N'oublie pas le logo IUT et VDL sur l'en-tête.</p>
                <ul style={{ paddingLeft: 20, fontSize: '0.85rem', color: '#e0e0e0', marginTop: 8 }}>
                  <li>Pourquoi la ville a-t-elle besoin de structurer son IoT ?</li>
                  <li>Sujet exact : Nomenclature et inventaire.</li>
                </ul>
              </div>
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>2. Missions (Quoi/Pourquoi/Comment)</h3>
                <p style={{ fontSize: '0.85rem', color: '#a0a0b2' }}>Ne jamais faire de liste de mots-clés, privilégier des schémas (ex: Topologie BACnet/LoRa).</p>
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: 8, fontSize: '0.85rem' }}>
                  <strong>💡 Conseil : </strong> Parle des contraintes de sécurité que tu as trouvé grâce aux tests DVID !
                </div>
              </div>
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>3. Le Bilan (Le plus important !)</h3>
                <p style={{ fontSize: '0.85rem', color: '#a0a0b2' }}>Voici les compétences que tu pourras citer grâce à ton suivi :</p>
                <div style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <strong>📚 Théorie : </strong> {store.entries.filter(e => e.skillsSavoir).length} éléments notés.<br/>
                  <strong>🔧 Pratique : </strong> {store.entries.filter(e => e.skillsSavoirFaire).length} éléments notés.<br/>
                  <strong>🤝 Humain : </strong> {store.entries.filter(e => e.skillsSavoirEtre).length} éléments notés.
                </div>
              </div>
            </motion.div>
          )}

          {page === 'export' && (
            <motion.div key="export" className="page-content" variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTrans}>
              <div className="page-header">
                <h1 className="page-title">📤 Rapport & Export</h1>
                <p className="page-subtitle">Génère et récupère tes données</p>
              </div>
              <div className="export-grid">
                <motion.button className="export-btn" onClick={doExportMd} whileTap={{ scale: 0.96 }}>
                  <span className="export-emoji">📄</span><span className="export-name" style={{ color: '#818cf8', fontWeight: 'bold' }}>Rapport Officiel IUT</span>
                  <span className="export-desc">Texte formaté pour ton Document Word final.</span>
                </motion.button>
                <motion.button className="export-btn" onClick={doExportJson} whileTap={{ scale: 0.96 }}>
                  <span className="export-emoji">💾</span><span className="export-name">Sauvegarde (JSON)</span>
                  <span className="export-desc">Backup de toutes tes données.</span>
                </motion.button>
              </div>
              <div className="section-label" style={{ marginTop: '32px' }}>📥 Importer une sauvegarde (JSON)</div>
              <label className="import-area">
                <span>📁</span> Sélectionner un fichier
                <input type="file" accept=".json" onChange={doImport} hidden />
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="bottom-nav">
        {(
          [
            { page: 'dashboard' as Page, icon: '📊' },
            { page: 'journal' as Page, icon: '📝' },
            { page: 'add' as Page, icon: '➕' },
            { page: 'soutenance' as Page, icon: '🎙️' },
            { page: 'export' as Page, icon: '📤' },
          ] as const
        ).map((n) => (
          <button key={n.page} className={`nav-item ${page === n.page ? 'active' : ''} ${n.page === 'add' ? 'nav-add' : ''}`} onClick={() => navigate(n.page)}>
            <span className="nav-icon">{n.icon}</span>
          </button>
        ))}
      </nav>

      <div className={`toast ${toast.visible ? 'visible' : ''}`}>{toast.msg}</div>

      <AnimatePresence>
        {detailEntry && (
          <>
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailEntry(null)} />
            <motion.div className="modal-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}>
              <div className="modal-handle" />
              <div className="entry-meta" style={{ marginBottom: 16 }}>
                <span className="cat-badge" data-cat={detailEntry.category}>{CAT_EMOJI[detailEntry.category]} {detailEntry.category}</span>
                <span className="entry-date">{new Date(detailEntry.date).toLocaleDateString('fr-FR')}</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 20 }}>{detailEntry.title}</h2>
              
              <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                {detailEntry.quoi && <div className="detail-block"><h4>🎯 Quoi (Objectif)</h4><p>{detailEntry.quoi}</p></div>}
                {detailEntry.pourquoi && <div className="detail-block"><h4>🤔 Pourquoi</h4><p>{detailEntry.pourquoi}</p></div>}
                {detailEntry.comment && <div className="detail-block"><h4>⚙️ Comment</h4><p>{detailEntry.comment}</p></div>}
                {detailEntry.content && <div className="detail-block"><h4>📝 Notes globales</h4><p>{detailEntry.content}</p></div>}
                {detailEntry.challenges && <div className="detail-block"><h4>⚠️ Difficultés surmontées</h4><p>{detailEntry.challenges}</p></div>}
                
                {(detailEntry.skillsSavoir || detailEntry.skillsSavoirFaire || detailEntry.skillsSavoirEtre) && (
                  <div className="detail-block">
                    <h4>🧠 Compétences acquises</h4>
                    <ul style={{ paddingLeft: '1rem', marginTop: '4px' }}>
                      {detailEntry.skillsSavoir && <li><strong>Savoir :</strong> {detailEntry.skillsSavoir}</li>}
                      {detailEntry.skillsSavoirFaire && <li><strong>Savoir-Faire :</strong> {detailEntry.skillsSavoirFaire}</li>}
                      {detailEntry.skillsSavoirEtre && <li><strong>Savoir-Être :</strong> {detailEntry.skillsSavoirEtre}</li>}
                    </ul>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                <button className="submit-btn" style={{ flex: 1 }} onClick={() => setDetailEntry(null)}>Fermer</button>
                <button className="submit-btn" style={{ flex: 0, padding: '16px', background: 'var(--red)', boxShadow: 'none' }} onClick={() => { store.deleteEntry(detailEntry.id); setDetailEntry(null); }}>🗑️</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
