import { useRef, useState, useCallback } from 'react'

// Choisit le premier type MIME supporté par le navigateur.
// iOS Safari ne supporte que audio/mp4 ; Chrome/Firefox préfèrent webm/opus.
export function pickMime() {
  const candidates = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
  const MR = typeof MediaRecorder !== 'undefined' ? MediaRecorder : null
  if (!MR || !MR.isTypeSupported) return ''
  for (const type of candidates) {
    if (MR.isTypeSupported(type)) return type
  }
  return ''
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState(null)

  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const startedAtRef = useRef(0)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)   // AnalyserNode pour le visualiseur d'onde
  const wakeLockRef = useRef(null)

  // Empêche l'écran de se verrouiller pendant l'enregistrement : sur iOS, un
  // écran verrouillé peut suspendre la capture micro de la PWA en arrière-plan
  // et tronquer l'enregistrement (ex. 4 min parlées → 1 min captée).
  async function acquireWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch { /* wake lock optionnel, pas bloquant */ }
  }

  function releaseWakeLock() {
    try { wakeLockRef.current?.release() } catch { /* ignore */ }
    wakeLockRef.current = null
  }

  function teardownAudioContext() {
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close() } catch { /* ignore */ }
      audioCtxRef.current = null
    }
    analyserRef.current = null
  }

  const start = useCallback(async () => {
    setError(null)
    try {
      // echoCancellation/noiseSuppression sont calibrés pour la voix/téléphonie :
      // ils peuvent traiter un chant ou de la musique à faible volume comme du
      // bruit à supprimer et produire un signal quasi silencieux. On les désactive.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true }
      })
      streamRef.current = stream
      const mime = pickMime()
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data) }
      // timeslice : récupère les données par morceaux réguliers pendant l'enregistrement
      // plutôt qu'un seul bloc à l'arrêt — sans ça, un souci en fin de capture (mémoire,
      // arrière-plan, ou codec qui juge l'audio "silencieux") peut faire perdre TOUT
      // l'enregistrement (fichier 0 Ko) au lieu de juste la fin.
      recorder.start(1000)
      recorderRef.current = recorder
      startedAtRef.current = Date.now()

      // Analyse temps réel du signal micro (pour le visualiseur d'onde)
      try {
        const AC = window.AudioContext || window.webkitAudioContext
        const ctx = new AC()
        if (ctx.state === 'suspended') ctx.resume()
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 1024
        source.connect(analyser)   // pas de connexion à destination (évite le larsen)
        audioCtxRef.current = ctx
        analyserRef.current = analyser
      } catch { /* visualiseur optionnel */ }

      acquireWakeLock()
      setSeconds(0)
      setIsRecording(true)
      timerRef.current = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000))
      }, 250)
    } catch (err) {
      setError(err?.name === 'NotAllowedError'
        ? 'Accès au micro refusé.'
        : 'Micro indisponible.')
      setIsRecording(false)
    }
  }, [])

  const stop = useCallback(() => {
    return new Promise(resolve => {
      const recorder = recorderRef.current

      // Coupe systématiquement le micro et le contexte audio, quoi qu'il arrive
      // (même si le recorder est déjà arrêté / en erreur) — évite que l'icône
      // micro reste active côté OS après l'arrêt dans l'app.
      const finalize = () => {
        clearInterval(timerRef.current)
        releaseWakeLock()
        const mime = recorder?.mimeType || pickMime() || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mime })
        const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop())
          streamRef.current = null
        }
        teardownAudioContext()
        recorderRef.current = null
        setIsRecording(false)
        resolve({ blob, mime, durationSec })
      }

      if (!recorder || recorder.state === 'inactive') { finalize(); return }

      recorder.onstop = finalize
      try {
        recorder.stop()
      } catch {
        // recorder.stop() peut lever si l'état a changé entre-temps : on nettoie quand même
        finalize()
      }
    })
  }, [])

  return { isRecording, seconds, error, start, stop, analyserRef }
}
