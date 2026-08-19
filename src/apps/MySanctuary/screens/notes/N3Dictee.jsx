import { useEffect, useState, useRef } from 'react'
import { Mic, Square, Trash2, MapPin, UploadCloud, Upload } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { getPosition } from '../../lib/geo.js'
import { NOTE_TYPES } from '../../tokens.js'
import { saveRecording, listRecordings, deleteRecording, updateRecording, getRecording } from '../../lib/audioStore.js'
import { pushRecording, pushAllPending, pullTranscripts, deleteRemote } from '../../lib/syncClient.js'

const LANGS = [
  { code: 'auto', label: 'Auto (détection)' },
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
]
const LANG_LABEL = Object.fromEntries(LANGS.map(l => [l.code, l.label]))

const STATUS_BADGE = {
  pending:      { label: 'À TRANSCRIRE', color: '#e8c46a' },
  uploading:    { label: 'ENVOI…',       color: '#a89cf8' },
  transcribing: { label: 'TRANSCRIPTION…', color: '#a89cf8' },
  done:         { label: 'TRANSCRIT',    color: '#4caf82' },
  error:        { label: 'ERREUR',       color: '#e05555' },
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    })
  } catch { return iso }
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function defaultTitle(iso) {
  return `Dictée ${formatDate(iso)}`
}

// Visualiseur d'onde en temps réel (défile dans le temps, façon Dictaphone iOS)
function LiveWaveform({ analyserRef }) {
  const canvasRef = useRef(null)
  const barsRef = useRef([])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const buf = new Uint8Array(analyserRef.current?.fftSize ?? 1024)
    barsRef.current = []
    let raf
    function draw() {
      raf = requestAnimationFrame(draw)
      const w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)
      let level = 0
      const analyser = analyserRef.current
      if (analyser) {
        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v }
        level = Math.min(1, Math.sqrt(sum / buf.length) * 2.4)
      }
      const bars = barsRef.current
      bars.push(level)
      const step = 4
      const maxBars = Math.floor(w / step)
      while (bars.length > maxBars) bars.shift()
      ctx.fillStyle = '#e8c46a'
      for (let i = 0; i < bars.length; i++) {
        const bh = Math.max(2, bars[i] * (h - 6))
        const x = w - (bars.length - i) * step
        ctx.fillRect(x, (h - bh) / 2, 2.5, bh)
      }
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [analyserRef])
  return <canvas ref={canvasRef} width={320} height={56}
    style={{ width: '100%', height: 56, display: 'block' }} />
}

export function N3Dictee({ notes, setNotes, recorder }) {
  const { isRecording, seconds, error, start, stop, analyserRef } = recorder
  const { session, ready, configured, signInPassword } = useAuth()
  const [recordings, setRecordings] = useState([])
  const [pending, setPending] = useState(null)   // enregistrement en attente de nom
  const [titleDraft, setTitleDraft] = useState('')
  const [langDraft, setLangDraft] = useState('auto')
  const [catDraft, setCatDraft] = useState('réflexion')

  const noteCategories = [...NOTE_TYPES, ...((notes?.customTypes) ?? [])]
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginMsg, setLoginMsg] = useState(null)
  const urlsRef = useRef({})
  const fileInputRef = useRef(null)

  async function refresh() {
    const list = await listRecordings()
    Object.values(urlsRef.current).forEach(URL.revokeObjectURL)
    urlsRef.current = {}
    for (const r of list) {
      if (r.blob) urlsRef.current[r.id] = URL.createObjectURL(r.blob)
    }
    setRecordings(list)
  }

  useEffect(() => {
    refresh()
    return () => { Object.values(urlsRef.current).forEach(URL.revokeObjectURL) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Push automatique au retour du réseau (si connecté)
  useEffect(() => {
    if (!session) return
    async function onOnline() {
      await pushAllPending(await listRecordings())
      await refresh()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  // Rafraîchit l'affichage local toutes les 10 s tant que l'écran est ouvert, pour
  // refléter les changements de statut/transcript. La conversion transcript → note
  // (createNotesForDone) tourne uniquement au niveau de l'app entière (index.jsx) —
  // ne pas la dupliquer ici, sinon les deux effets peuvent créer chacun une note
  // pour la même dictée avant que l'autre ait eu le temps de marquer noteId.
  useEffect(() => {
    if (!session) return
    let cancelled = false
    async function tick() {
      await pullTranscripts(await listRecordings())
      if (!cancelled) await refresh()
    }
    tick()
    const iv = setInterval(tick, 10000)
    return () => { cancelled = true; clearInterval(iv) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  async function handleLogin() {
    if (!email.trim() || !password) return
    setLoginMsg('Connexion…')
    const { error: err } = await signInPassword(email, password)
    if (err) { setLoginMsg(`Erreur : ${err}`); return }
    setPassword(''); setLoginMsg(null)
  }

  async function syncOne(id) {
    await updateRecording(id, { syncStatus: 'uploading' })
    await refresh()
    const rec = await getRecording(id)
    await pushRecording(rec)
    await refresh()
  }

  async function handleStop() {
    const result = await stop()
    if (!result) return
    const createdAt = new Date().toISOString()
    setPending({ ...result, createdAt, coords: null, locating: true })
    setTitleDraft(defaultTitle(createdAt))
    setLangDraft('auto')
    setCatDraft('réflexion')
    // GPS en arrière-plan : n'empêche pas de nommer tout de suite
    getPosition().then(coords =>
      setPending(p => p ? { ...p, coords, locating: false } : p)
    )
  }

  async function confirmSave() {
    if (!pending) return
    const id = (crypto?.randomUUID?.() ?? Date.now().toString())
    await saveRecording({
      id,
      blob: pending.blob,
      mime: pending.mime,
      durationSec: pending.durationSec,
      createdAt: pending.createdAt,
      title: titleDraft.trim() || defaultTitle(pending.createdAt),
      coords: pending.coords,
      language: langDraft,
      category: catDraft,
      source: pending.source || 'mic',
    })
    setPending(null)
    setTitleDraft('')
    await refresh()
    // Envoi auto si connecté et en ligne
    if (session && navigator.onLine) {
      const rec = await getRecording(id)
      await pushRecording(rec)
      await refresh()
    }
  }

  // Lit la durée réelle d'un fichier audio importé ; ne bloque jamais l'import
  // (résout à 0 si la métadonnée n'arrive pas sous 3s ou en cas d'erreur).
  function readAudioDuration(blob) {
    return new Promise(resolve => {
      const audio = document.createElement('audio')
      const url = URL.createObjectURL(blob)
      const cleanup = (sec) => { URL.revokeObjectURL(url); resolve(sec) }
      const timeout = setTimeout(() => cleanup(0), 3000)
      audio.onloadedmetadata = () => {
        clearTimeout(timeout)
        const sec = Number.isFinite(audio.duration) ? Math.max(1, Math.round(audio.duration)) : 0
        cleanup(sec)
      }
      audio.onerror = () => { clearTimeout(timeout); cleanup(0) }
      audio.src = url
    })
  }

  async function handleFileImport(e) {
    const file = e.target.files?.[0]
    e.target.value = ''  // permet de resélectionner le même fichier plus tard
    if (!file) return
    const durationSec = await readAudioDuration(file)
    const createdAt = new Date().toISOString()
    setPending({
      blob: file, mime: file.type || 'audio/mp4', durationSec, createdAt,
      coords: null, locating: false, source: 'import',
    })
    setTitleDraft(file.name.replace(/\.[^.]+$/, '') || defaultTitle(createdAt))
    setLangDraft('auto')
    setCatDraft('réflexion')
  }

  function cancelPending() {
    setPending(null)
    setTitleDraft('')
  }

  async function handleDelete(id) {
    const rec = await getRecording(id)
    if (session && rec) await deleteRemote(rec)
    await deleteRecording(id)
    await refresh()
  }

  async function saveRename(id) {
    const t = editDraft.trim()
    if (t) await updateRecording(id, { title: t })
    setEditingId(null)
    await refresh()
  }

  return (
    <>
      {/* Zone d'enregistrement */}
      <div className="card card--gold" style={{ display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 14, padding: '24px 16px' }}>
        {!isRecording ? (
          <button onClick={start} aria-label="Enregistrer" disabled={!!pending}
            style={{ width: 84, height: 84, borderRadius: '50%', background: '#1e1e2e',
              border: '2px solid #e8c46a', boxShadow: '0 0 16px rgba(232,196,106,.35)',
              opacity: pending ? 0.4 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Mic size={34} color="#e8c46a" />
          </button>
        ) : (
          <button onClick={handleStop} aria-label="Arrêter" className="rec-pulse"
            style={{ width: 84, height: 84, borderRadius: '50%', background: 'rgba(224,85,85,.15)',
              border: '2px solid #e05555', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer' }}>
            <Square size={30} color="#e05555" fill="#e05555" />
          </button>
        )}
        {isRecording ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: '100%', background: 'rgba(224,85,85,.06)', borderRadius: 8, padding: '2px 4px' }}>
              <LiveWaveform analyserRef={analyserRef} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="rec-blink" style={{ width: 10, height: 10, borderRadius: '50%',
                background: '#e05555', display: 'inline-block' }} />
              <span style={{ fontFamily: 'Cinzel', fontSize: 10, letterSpacing: 3, color: '#e05555' }}>REC</span>
              <span style={{ fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#e05555' }}>
                {formatDuration(seconds)}
              </span>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#6a6a82' }}>
              Appuie pour dicter
            </div>
            {/* accept="audio/*" seul masque parfois les .m4a du Dictaphone dans le
                sélecteur Fichiers iOS (UTI mal reconnu) : on liste explicitement les
                types/extensions courants en plus du filtre générique. */}
            <input ref={fileInputRef} type="file"
              accept="audio/*,.m4a,.mp3,.wav,.aac,.caf,audio/x-m4a,audio/mp4" hidden
              onChange={handleFileImport} />
            <button onClick={() => fileInputRef.current?.click()} disabled={!!pending}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                border: '1px solid #3a3a55', borderRadius: 8, padding: '6px 12px',
                color: '#a0a0b8', fontSize: 12, opacity: pending ? 0.4 : 1, cursor: 'pointer' }}>
              <Upload size={14} /> Importer un vocal
            </button>
          </>
        )}
        {error && <div style={{ color: '#e05555', fontSize: 13 }}>{error}</div>}
      </div>

      {/* Bande de connexion (transcription PC) */}
      {configured && ready && !session && (
        <div className="card" style={{ marginBottom: 8 }}>
          <div className="kicker" style={{ marginBottom: 8 }}>TRANSCRIPTION PC — CONNEXION</div>
          <div style={{ fontSize: 12, color: '#a0a0b8', marginBottom: 10 }}>
            Connecte-toi (une seule fois) pour envoyer tes dictées au PC. L'enregistrement local marche déjà sans ça.
          </div>

          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" autoComplete="email"
            style={{ display: 'block', width: '100%', background: '#1e1e2e', border: '1px solid #5a5a82',
              borderRadius: 8, padding: '9px 12px', color: '#f0ece0', fontSize: 14, outline: 'none',
              boxSizing: 'border-box', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe" autoComplete="current-password"
              onKeyDown={e => { if (e.key === 'Enter') handleLogin() }}
              style={{ flex: 1, background: '#1e1e2e', border: '1px solid #5a5a82', borderRadius: 8,
                padding: '9px 12px', color: '#f0ece0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            <button className="btn-gold" onClick={handleLogin}>Se connecter</button>
          </div>
          {loginMsg && <div style={{ fontSize: 12, color: '#e8c46a', marginTop: 8 }}>{loginMsg}</div>}
        </div>
      )}

      {/* Formulaire de nom (après l'arrêt) */}
      {pending && (
        <div className="card card--gold" style={{ marginBottom: 8 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>NOMMER LA DICTÉE</div>
          <input autoFocus value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
            placeholder="Nom de la dictée…"
            onKeyDown={e => { if (e.key === 'Enter') confirmSave() }}
            style={{ display: 'block', width: '100%', background: '#1e1e2e', border: '1px solid #5a5a82',
              borderRadius: 8, padding: '10px 12px', color: '#f0ece0', fontSize: 16, outline: 'none',
              boxSizing: 'border-box', marginBottom: 10 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: '#6a6a82', width: 62 }}>Catégorie</span>
            <select value={catDraft} onChange={e => setCatDraft(e.target.value)}
              style={{ flex: 1, background: '#1e1e2e', border: '1px solid #5a5a82', borderRadius: 8,
                padding: '8px 10px', color: '#f0ece0', fontSize: 14, outline: 'none' }}>
              {noteCategories.map(t => (
                <option key={t.id} value={t.id} style={{ background: '#151520' }}>{t.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: '#6a6a82', width: 62 }}>Langue</span>
            <select value={langDraft} onChange={e => setLangDraft(e.target.value)}
              style={{ flex: 1, background: '#1e1e2e', border: '1px solid #5a5a82', borderRadius: 8,
                padding: '8px 10px', color: '#f0ece0', fontSize: 14, outline: 'none' }}>
              {LANGS.map(l => (
                <option key={l.code} value={l.code} style={{ background: '#151520' }}>{l.label}</option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: 12, color: '#6a6a82', marginBottom: 12, display: 'flex',
            alignItems: 'center', gap: 6 }}>
            <MapPin size={13} color="#6a6a82" />
            {pending.locating
              ? 'Localisation en cours…'
              : pending.coords
                ? `${pending.coords.lat.toFixed(5)}, ${pending.coords.lon.toFixed(5)}`
                : 'Position indisponible'}
            <span style={{ marginLeft: 'auto' }}>{formatDate(pending.createdAt)}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-sm" onClick={cancelPending}>Annuler</button>
            <button className="btn-gold" style={{ flex: 1 }} onClick={confirmSave}>ENREGISTRER</button>
          </div>
        </div>
      )}

      {/* Liste des enregistrements */}
      {recordings.length === 0 && !pending && (
        <div style={{ textAlign: 'center', color: '#6a6a82', fontSize: 13, padding: 24 }}>
          Aucune dictée pour l'instant.
        </div>
      )}

      {recordings.map(rec => {
        const badge = STATUS_BADGE[rec.syncStatus] ?? STATUS_BADGE.pending
        return (
          <div key={rec.id} className="card" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
              {editingId === rec.id ? (
                <input autoFocus defaultValue={rec.title || ''}
                  onChange={e => setEditDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveRename(rec.id); if (e.key === 'Escape') setEditingId(null) }}
                  onBlur={() => saveRename(rec.id)}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    borderBottom: '1px solid #e8c46a', color: '#f0ece0', fontSize: 16,
                    fontFamily: 'Cormorant Garamond' }} />
              ) : (
                <div onClick={() => { setEditingId(rec.id); setEditDraft(rec.title || '') }}
                  style={{ flex: 1, fontFamily: 'Cormorant Garamond', fontSize: 17, color: '#f0ece0', cursor: 'text' }}>
                  {rec.title || defaultTitle(rec.createdAt)}
                </div>
              )}
              <div className="kicker" style={{ color: badge.color, flexShrink: 0, marginTop: 3 }}>{badge.label}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#6a6a82', marginBottom: 8, flexWrap: 'wrap' }}>
              <span>{formatDate(rec.createdAt)} · {formatDuration(rec.durationSec)}</span>
              {rec.language && rec.language !== 'auto' && (
                <span style={{ textTransform: 'uppercase', letterSpacing: 1,
                  color: '#a89cf8', border: '1px solid #3a3a55', borderRadius: 4, padding: '0 4px' }}>
                  {rec.language}
                </span>
              )}
              {rec.category && (
                <span style={{ color: '#e8c46a', border: '1px solid #3a3a55', borderRadius: 4, padding: '0 4px' }}>
                  {noteCategories.find(c => c.id === rec.category)?.label ?? rec.category}
                </span>
              )}
              {rec.noteId && <span style={{ color: '#4caf82' }}>✓ dans Notes</span>}
              {rec.coords && (
                <a href={`https://maps.google.com/?q=${rec.coords.lat},${rec.coords.lon}`}
                  target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#a89cf8' }}>
                  <MapPin size={12} />
                  {rec.coords.lat.toFixed(4)}, {rec.coords.lon.toFixed(4)}
                </a>
              )}
            </div>

            {rec.transcript && (
              <div style={{ fontSize: 14, color: '#f0ece0', marginBottom: 8,
                fontFamily: 'Cormorant Garamond' }}>{rec.transcript}</div>
            )}

            <audio controls src={urlsRef.current[rec.id]}
              style={{ width: '100%', height: 36, marginBottom: 8 }} />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
              {session && (rec.syncStatus === 'pending' || rec.syncStatus === 'error') && (
                <button className="btn-sm" onClick={() => syncOne(rec.id)}
                  style={{ color: '#e8c46a', borderColor: '#e8c46a', display: 'flex',
                    alignItems: 'center', gap: 5 }}>
                  <UploadCloud size={14} /> Transcrire
                </button>
              )}
              <button onClick={() => handleDelete(rec.id)}
                style={{ color: '#6a6a82', display: 'flex', alignItems: 'center', padding: '0 6px' }}
                aria-label="Supprimer">
                <Trash2 size={16} />
              </button>
            </div>
            {rec.syncStatus === 'error' && rec.error && (
              <div style={{ fontSize: 11, color: '#e05555', marginTop: 6 }}>{rec.error}</div>
            )}
          </div>
        )
      })}

      <div style={{ fontSize: 11, color: '#6a6a82', textAlign: 'center', marginTop: 4 }}>
        La transcription automatique arrivera avec la synchro PC.
      </div>
      <div style={{ fontSize: 10, color: '#4a4a5f', textAlign: 'center', marginTop: 6 }}>
        MySanctuary · build {__BUILD_TIME__}
      </div>
    </>
  )
}
