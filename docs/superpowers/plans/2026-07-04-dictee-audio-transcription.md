# Dictée vocale — Plan d'implémentation

> **Pour l'agent exécutant :** SOUS-SKILL REQUISE : utiliser superpowers:subagent-driven-development
> (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes
> utilisent des cases à cocher (`- [ ]`).

**Goal :** Enregistrer des dictées audio sur iPhone (hors-ligne possible), les faire transcrire par
Whisper sur le PC via un relais Supabase, et récupérer le texte dans une note « dictée » — audio et
texte conservés.

**Architecture :** PWA React (capture + IndexedDB + synchro Supabase) ↔ Supabase (Storage + table
`dictation_jobs` + Realtime + Auth mono-utilisateur) ↔ agent Python sur PC (`faster-whisper`).

**Tech Stack :** React 19 / Vite, IndexedDB, `@supabase/supabase-js`, Vitest, Playwright ; Python +
`faster-whisper` + `supabase` (agent PC).

**Réf. design :** `docs/superpowers/specs/2026-07-04-dictee-audio-transcription-design.md`

---

## Structure des fichiers

**PWA (repo `openapp`) :**
- `src/apps/MySanctuary/lib/idb.js` — micro-wrapper IndexedDB générique
- `src/apps/MySanctuary/lib/audioStore.js` — store `ms_audio` (CRUD enregistrements)
- `src/apps/MySanctuary/hooks/useAudioRecorder.js` — capture MediaRecorder
- `src/apps/MySanctuary/lib/supabaseClient.js` — client Supabase
- `src/apps/MySanctuary/lib/syncClient.js` — push/pull + transitions d'état
- `src/apps/MySanctuary/screens/notes/N3Dictee.jsx` — UI dictée (remplace le placeholder)
- `src/apps/MySanctuary/screens/notes/N1Notes.jsx` — rendu note « dictée » (audio + texte)
- Tests : fichiers `*.test.js` à côté ; `tests/dictee.spec.ts` (Playwright)
- `.env.local` / `.env.example` — variables Vite Supabase

**Agent PC (repo/dossier séparé `sync-agent`) :**
- `sync-agent/transcribe.py`, `sync-agent/agent.py`, `sync-agent/config.py`
- `sync-agent/requirements.txt`, `sync-agent/.env.example`, `sync-agent/README.md`
- `sync-agent/tests/test_transcribe.py`, `sync-agent/tests/test_agent.py`

---

## Prérequis (installation de dépendances)

- [ ] **Étape 0.1 : ajouter les deps PWA**

```bash
cd openapp
npm i @supabase/supabase-js
npm i -D fake-indexeddb
```

- [ ] **Étape 0.2 : commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add supabase-js + fake-indexeddb"
```

---

## Phase A — Capture locale (téléphone seul, testable sans backend)

### Task 1 : Micro-wrapper IndexedDB (`idb.js`)

**Files :**
- Create : `src/apps/MySanctuary/lib/idb.js`
- Test : `src/apps/MySanctuary/lib/idb.test.js`

- [ ] **Étape 1.1 : test qui échoue**

```js
// idb.test.js
import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { openDB, idbPut, idbGet, idbGetAll, idbDelete } from './idb.js'

describe('idb', () => {
  it('put puis get renvoie l\'objet', async () => {
    await openDB('test-db', 'items')
    await idbPut('test-db', 'items', { id: 'a', v: 1 })
    expect(await idbGet('test-db', 'items', 'a')).toEqual({ id: 'a', v: 1 })
  })
  it('getAll renvoie tous les objets', async () => {
    await idbPut('test-db', 'items', { id: 'b', v: 2 })
    const all = await idbGetAll('test-db', 'items')
    expect(all.length).toBeGreaterThanOrEqual(2)
  })
  it('delete retire l\'objet', async () => {
    await idbDelete('test-db', 'items', 'a')
    expect(await idbGet('test-db', 'items', 'a')).toBeUndefined()
  })
})
```

- [ ] **Étape 1.2 : lancer, vérifier l'échec** — `npm test -- idb` → FAIL (module absent)

- [ ] **Étape 1.3 : implémenter**

```js
// idb.js — wrapper minimal, keyPath 'id'
const cache = {}
export function openDB(name, store) {
  if (cache[name]) return cache[name]
  cache[name] = new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return cache[name]
}
async function tx(name, store, mode) {
  const db = await openDB(name, store)
  return db.transaction(store, mode).objectStore(store)
}
function wrap(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
export async function idbPut(name, store, obj) { return wrap((await tx(name, store, 'readwrite')).put(obj)) }
export async function idbGet(name, store, id)  { return wrap((await tx(name, store, 'readonly')).get(id)) }
export async function idbGetAll(name, store)   { return wrap((await tx(name, store, 'readonly')).getAll()) }
export async function idbDelete(name, store, id){ return wrap((await tx(name, store, 'readwrite')).delete(id)) }
```

- [ ] **Étape 1.4 : lancer, vérifier le succès** — `npm test -- idb` → PASS
- [ ] **Étape 1.5 : commit** — `git commit -m "feat: minimal IndexedDB wrapper"`

### Task 2 : Store audio (`audioStore.js`)

**Files :**
- Create : `src/apps/MySanctuary/lib/audioStore.js`
- Test : `src/apps/MySanctuary/lib/audioStore.test.js`

- [ ] **Étape 2.1 : test qui échoue** — round-trip d'un enregistrement (id, blob, mime, syncStatus),
  `updateRecording` change `syncStatus`, `listRecordings` trié par `createdAt` desc.

```js
import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { saveRecording, getRecording, listRecordings, updateRecording, deleteRecording } from './audioStore.js'

it('sauve et relit un enregistrement', async () => {
  const blob = new Blob(['x'], { type: 'audio/webm' })
  await saveRecording({ id: '1', blob, mime: 'audio/webm', durationSec: 3, createdAt: '2026-07-04T10:00:00Z' })
  const r = await getRecording('1')
  expect(r.mime).toBe('audio/webm'); expect(r.syncStatus).toBe('pending')
})
it('met à jour le statut', async () => {
  await updateRecording('1', { syncStatus: 'done', transcript: 'bonjour' })
  expect((await getRecording('1')).transcript).toBe('bonjour')
})
```

- [ ] **Étape 2.2 : échec** — `npm test -- audioStore` → FAIL
- [ ] **Étape 2.3 : implémenter** (par-dessus `idb.js`, DB `ms_sanctuary`, store `ms_audio`,
  `syncStatus` par défaut `'pending'`, `listRecordings` = `idbGetAll` trié desc).
- [ ] **Étape 2.4 : succès** — `npm test -- audioStore` → PASS
- [ ] **Étape 2.5 : commit** — `git commit -m "feat: audio recording IndexedDB store"`

### Task 3 : Hook d'enregistrement (`useAudioRecorder.js`)

**Files :**
- Create : `src/apps/MySanctuary/hooks/useAudioRecorder.js`
- Test : `src/apps/MySanctuary/hooks/useAudioRecorder.test.js`

- [ ] **Étape 3.1 : test qui échoue** — `pickMime()` renvoie le 1er type supporté ; export testable.

```js
import { describe, it, expect, vi } from 'vitest'
import { pickMime } from './useAudioRecorder.js'

it('choisit audio/mp4 si supporté (iOS)', () => {
  vi.stubGlobal('MediaRecorder', { isTypeSupported: (t) => t === 'audio/mp4' })
  expect(pickMime()).toBe('audio/mp4')
})
it('retombe sur webm', () => {
  vi.stubGlobal('MediaRecorder', { isTypeSupported: (t) => t === 'audio/webm' })
  expect(pickMime()).toBe('audio/webm')
})
```

- [ ] **Étape 3.2 : échec** — FAIL
- [ ] **Étape 3.3 : implémenter** — `pickMime()` teste `['audio/mp4','audio/webm;codecs=opus','audio/webm']`.
  Hook `useAudioRecorder()` : `start()` (getUserMedia + MediaRecorder + timer), `stop()` → résout
  `{ blob, mime, durationSec }`, expose `isRecording`, `seconds`.
- [ ] **Étape 3.4 : succès** — PASS
- [ ] **Étape 3.5 : commit** — `git commit -m "feat: useAudioRecorder hook"`

### Task 4 : UI Dictée locale (`N3Dictee.jsx`, sans synchro)

**Files :**
- Modify : `src/apps/MySanctuary/screens/notes/N3Dictee.jsx` (remplace le placeholder)

- [ ] **Étape 4.1 : implémenter l'UI** — gros bouton micro (idle → recording avec minuteur),
  à l'arrêt : `saveRecording(...)` puis rafraîchir la liste (`listRecordings`). Chaque item : date,
  durée, badge d'état, `<audio controls src={URL.createObjectURL(blob)}>`, bouton supprimer.
  Bouton « transcrire maintenant » présent mais désactivé (branché en Phase B).
- [ ] **Étape 4.2 : vérifier build** — `npm run build` → OK
- [ ] **Étape 4.3 : commit** — `git commit -m "feat: dictation recording UI (local capture)"`

> **JALON A** — déployer (`npx vercel deploy --prod`) et valider sur iPhone : enregistrer, réécouter,
> supprimer. Aucune synchro encore.

---

## Phase B — Backend Supabase + synchro (push)

### Task 5 : Projet Supabase (setup guidé)

**Files :**
- Create : `openapp/.env.example`, `openapp/.env.local` (non commité)
- Create : `docs/supabase-setup.md`

- [ ] **Étape 5.1 : créer le projet** — sur supabase.com, noter `Project URL`, clé `anon`, clé
  `service_role`.
- [ ] **Étape 5.2 : SQL (SQL editor)**

```sql
create table dictation_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'pending',
  audio_path text, audio_mime text, duration_sec integer,
  language text not null default 'fr',
  transcript text, error text, device text,
  owner uuid not null default auth.uid()
);
alter table dictation_jobs enable row level security;
create policy "own rows" on dictation_jobs
  for all using (owner = auth.uid()) with check (owner = auth.uid());
-- bucket privé
insert into storage.buckets (id, name, public) values ('audio-notes','audio-notes', false);
create policy "own audio" on storage.objects for all
  using (bucket_id = 'audio-notes' and owner = auth.uid())
  with check (bucket_id = 'audio-notes' and owner = auth.uid());
```

- [ ] **Étape 5.3 : activer Realtime** sur la table `dictation_jobs`.
- [ ] **Étape 5.4 : `.env.example`**

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

- [ ] **Étape 5.5 : documenter** dans `docs/supabase-setup.md` (dont les clés Vercel env prod).
- [ ] **Étape 5.6 : commit** — `git commit -m "docs: supabase setup + env example"`

### Task 6 : Client Supabase + Auth mono-utilisateur

**Files :**
- Create : `src/apps/MySanctuary/lib/supabaseClient.js`
- Create : `src/apps/MySanctuary/hooks/useAuth.js`
- Test : `src/apps/MySanctuary/lib/supabaseClient.test.js`

- [ ] **Étape 6.1 : test** — `getSupabase()` renvoie un singleton (mocké via `vi.mock('@supabase/supabase-js')`).
- [ ] **Étape 6.2 : échec** — FAIL
- [ ] **Étape 6.3 : implémenter** — `createClient(import.meta.env.VITE_SUPABASE_URL, ...ANON, { auth: { persistSession: true } })`.
  `useAuth()` : état `session`, `signInWithOtp(email)` (magic link), écoute `onAuthStateChange`.
- [ ] **Étape 6.4 : mini-UI login** — dans `N3Dictee`, si pas de session : champ email + « Recevoir
  le lien ». Une fois connecté (une seule fois), caché.
- [ ] **Étape 6.5 : succès + build** — PASS ; `npm run build` OK
- [ ] **Étape 6.6 : commit** — `git commit -m "feat: supabase client + one-user magic-link auth"`

### Task 7 : Sync client — push (`syncClient.js`)

**Files :**
- Create : `src/apps/MySanctuary/lib/syncClient.js`
- Test : `src/apps/MySanctuary/lib/syncClient.test.js`

- [ ] **Étape 7.1 : test** (Supabase mocké) — `pushRecording(rec)` : insert job `pending`, upload
  blob dans `audio-notes/<uid>/<id>.<ext>`, met à jour l'audioStore local `uploading`→`transcribing`,
  écrit `audio_path`. En cas d'erreur upload → statut local `error`.

```js
import { describe, it, expect, vi } from 'vitest'
// mock getSupabase() -> from().insert(), storage.from().upload()
```

- [ ] **Étape 7.2 : échec** — FAIL
- [ ] **Étape 7.3 : implémenter** `pushRecording` + `pushAllPending()`.
- [ ] **Étape 7.4 : succès** — PASS
- [ ] **Étape 7.5 : brancher dans `N3Dictee`** — bouton « transcrire maintenant » actif ; auto-push
  à l'arrêt d'un enregistrement si en ligne + connecté ; écouteur `window 'online'` → `pushAllPending`.
- [ ] **Étape 7.6 : build + commit** — `git commit -m "feat: sync client push (upload audio + job)"`

---

## Phase C — Agent PC (Whisper)

### Task 8 : Scaffold agent Python

**Files :**
- Create : `sync-agent/requirements.txt`, `sync-agent/.env.example`, `sync-agent/config.py`

- [ ] **Étape 8.1** — `requirements.txt` : `faster-whisper`, `supabase`, `python-dotenv`.
- [ ] **Étape 8.2** — `.env.example` : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WHISPER_MODEL=small`,
  `POLL_SECONDS=15`, `BUCKET=audio-notes`.
- [ ] **Étape 8.3** — `config.py` charge le `.env` (via `python-dotenv`).
- [ ] **Étape 8.4 : commit** — `git commit -m "chore: sync-agent scaffold"`

### Task 9 : Transcription (`transcribe.py`)

**Files :**
- Create : `sync-agent/transcribe.py`
- Test : `sync-agent/tests/test_transcribe.py`

- [ ] **Étape 9.1 : test** — transcrire un court WAV de référence (généré dans le test, silence/tonalité)
  → renvoie une chaîne (peut être vide) sans exception ; charge le modèle une seule fois (singleton).
- [ ] **Étape 9.2 : échec** — `pytest` → FAIL
- [ ] **Étape 9.3 : implémenter**

```python
# transcribe.py
from faster_whisper import WhisperModel
_model = None
def _get_model(size="small"):
    global _model
    if _model is None:
        _model = WhisperModel(size, device="auto", compute_type="int8")
    return _model
def transcribe(path, language="fr", size="small"):
    segments, _ = _get_model(size).transcribe(path, language=language)
    return " ".join(s.text.strip() for s in segments).strip()
```

- [ ] **Étape 9.4 : succès** — PASS
- [ ] **Étape 9.5 : commit** — `git commit -m "feat: faster-whisper transcription wrapper"`

### Task 10 : Boucle agent (`agent.py`)

**Files :**
- Create : `sync-agent/agent.py`
- Test : `sync-agent/tests/test_agent.py`

- [ ] **Étape 10.1 : test** (Supabase mocké) — `process_pending()` : lit 1 job `pending`, passe
  `transcribing`, download → `transcribe()` (mocké) → `update(status=done, transcript=...)`. Sur
  exception de `transcribe` → `update(status=error, error=...)`.
- [ ] **Étape 10.2 : échec** — FAIL
- [ ] **Étape 10.3 : implémenter** `process_pending(client)` + `main()` (boucle `POLL_SECONDS`,
  service_role key).
- [ ] **Étape 10.4 : succès** — PASS
- [ ] **Étape 10.5 : README** — installation Python, `pip install -r requirements.txt`, `python agent.py`,
  Planificateur de tâches Windows (au logon).
- [ ] **Étape 10.6 : commit** — `git commit -m "feat: PC sync agent loop + README"`

> **JALON C** — lancer l'agent sur le PC ; un enregistrement poussé depuis le tel doit passer
> `transcribing` → `done` avec un `transcript` en base.

---

## Phase D — Récupération + intégration note

### Task 11 : Sync client — pull (`syncClient.js`)

**Files :**
- Modify : `src/apps/MySanctuary/lib/syncClient.js`
- Test : `src/apps/MySanctuary/lib/syncClient.test.js`

- [ ] **Étape 11.1 : test** — `onTranscript(job)` : met à jour l'audioStore local (`done` + transcript),
  crée une note type `dictée` dans le state notes, supprime le blob cloud. `subscribeDone(cb)`
  s'abonne au Realtime (mocké) sur `status=done`. `pollDone()` (fallback) récupère les jobs `done`
  pas encore traités localement.
- [ ] **Étape 11.2 : échec** — FAIL
- [ ] **Étape 11.3 : implémenter** `subscribeDone`, `pollDone`, `onTranscript`.
- [ ] **Étape 11.4 : succès** — PASS
- [ ] **Étape 11.5 : commit** — `git commit -m "feat: sync client pull (transcript -> note)"`

### Task 12 : Note « dictée » dans `N1Notes.jsx`

**Files :**
- Modify : `src/apps/MySanctuary/screens/notes/N1Notes.jsx`

- [ ] **Étape 12.1 : implémenter** — le type `dictée` fait partie des types ; une note `dictée`
  affiche le texte éditable **et** un `<audio>` dont la source vient de l'IndexedDB
  (`getRecording(note.audioId)` → `URL.createObjectURL`, révoqué au démontage).
- [ ] **Étape 12.2 : build** — OK
- [ ] **Étape 12.3 : commit** — `git commit -m "feat: dictation note type with audio playback"`

### Task 13 : Câblage récupération dans `N3Dictee` + erreurs/retry

**Files :**
- Modify : `src/apps/MySanctuary/screens/notes/N3Dictee.jsx`

- [ ] **Étape 13.1 : implémenter** — au montage (si connecté) : `subscribeDone(onTranscript)` +
  `pollDone()`. Badges d'état live. Item `error` → bouton « Réessayer » (remet `pending` + re-push).
- [ ] **Étape 13.2 : build + commit** — `git commit -m "feat: wire transcript retrieval + retry UI"`

### Task 14 : E2E + déploiement

**Files :**
- Create : `tests/dictee.spec.ts`

- [ ] **Étape 14.1 : test Playwright** — contexte avec permission micro + fake media
  (`--use-fake-device-for-media-stream` déjà par défaut sous Chromium headless) : ouvrir l'onglet
  Notes → Dictée, enregistrer 1 s, arrêter → un item apparaît avec badge « à transcrire » et un
  lecteur audio. (La transcription PC n'est pas couverte en E2E.)
- [ ] **Étape 14.2 : lancer** — `npx playwright test dictee` → PASS
- [ ] **Étape 14.3 : build + deploy** — `npm run build` puis `npx vercel deploy --prod`
  (⚠️ configurer `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` dans les env Vercel prod).
- [ ] **Étape 14.4 : commit** — `git commit -m "test: e2e dictation capture + deploy"`

---

## Revue finale

- [ ] Parcours complet réel : enregistrer sur iPhone → agent PC transcrit → texte dans la note, audio
  réécoutable. Vérifier hors-ligne (enregistrer sans réseau, upload au retour).
- [ ] Vérifier qu'aucune clé `service_role` n'est dans le bundle PWA ni dans git.
