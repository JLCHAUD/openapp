# Import d'un fichier audio existant — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un bouton "Importer un vocal" sur l'écran Dictée qui permet de choisir un
fichier audio existant (vocal Apple exporté) et de le faire suivre le même pipeline que les
dictées enregistrées (nommage → push Supabase → transcription Whisper → note).

**Architecture:** Un `<input type="file" accept="audio/*" hidden>` déclenché par un bouton,
sa sélection construit un objet `pending` équivalent à celui produit après un enregistrement
micro (`coords: null` fixé d'office), réutilisant le formulaire de nommage existant.

**Tech Stack:** React 19, IndexedDB (`lib/audioStore.js`), Vitest.

---

### Task 1: Champ `source` par défaut dans audioStore

**Files:**
- Modify: `src/apps/MySanctuary/lib/audioStore.js:10`
- Test: `src/apps/MySanctuary/lib/audioStore.test.js`

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter dans `audioStore.test.js`, dans le premier `it` existant (juste après les assertions
sur `mime`/`syncStatus`) :

```js
    expect(r.source).toBe('mic')
```

Et ajouter un nouveau test à la fin du fichier :

```js
  it('accepte un source personnalisé (import)', async () => {
    const blob = new Blob(['z'], { type: 'audio/mp4' })
    await saveRecording({ id: '3', blob, mime: 'audio/mp4', durationSec: 5, createdAt: '2026-07-08T09:00:00Z', source: 'import' })
    const r = await getRecording('3')
    expect(r.source).toBe('import')
  })
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `npx vitest run audioStore -t "sauve et relit"`
Expected: FAIL — `r.source` est `undefined`, pas `'mic'`.

- [ ] **Step 3: Ajouter le champ par défaut**

Dans `saveRecording`, ligne 10, ajouter `source: 'mic'` au shape par défaut :

```js
  const toStore = { syncStatus: 'pending', transcript: null, noteId: null, title: '', coords: null, language: 'auto', category: 'réflexion', source: 'mic', ...rec }
```

- [ ] **Step 4: Lancer les tests, vérifier le succès**

Run: `npx vitest run audioStore`
Expected: PASS (5/5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/apps/MySanctuary/lib/audioStore.js src/apps/MySanctuary/lib/audioStore.test.js
git commit -m "feat(mysanctuary): champ source (mic/import) sur les enregistrements"
```

---

### Task 2: Bouton d'import + sélection de fichier dans N3Dictee

**Files:**
- Modify: `src/apps/MySanctuary/screens/notes/N3Dictee.jsx`

- [ ] **Step 1: Importer l'icône et ajouter la ref du input file**

En haut du fichier, ajouter `Upload` à l'import lucide-react (ligne 2) :

```js
import { Mic, Square, Trash2, MapPin, UploadCloud, Upload } from 'lucide-react'
```

Dans le corps du composant, à côté de `urlsRef` (après ligne ~104), ajouter :

```js
  const fileInputRef = useRef(null)
```

- [ ] **Step 2: Écrire `readAudioDuration` et `handleFileImport`**

Ajouter ces deux fonctions juste après `handleStop` (après la fermeture de `handleStop`,
avant `confirmSave`) :

```js
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
```

- [ ] **Step 3: Passer `source` au `saveRecording` dans `confirmSave`**

Modifier `confirmSave` (autour de la ligne 204-217) pour transmettre `pending.source` :

```js
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
```
(le reste de la fonction ne change pas)

- [ ] **Step 4: Ajouter le bouton et l'input caché dans le JSX**

Dans la zone d'enregistrement (juste après le `</button>` qui ferme le bouton micro/stop,
avant le bloc `{isRecording ? (...`), ajouter, seulement visible hors enregistrement :

```jsx
        {!isRecording && (
          <>
            <input ref={fileInputRef} type="file" accept="audio/*" hidden
              onChange={handleFileImport} />
            <button onClick={() => fileInputRef.current?.click()} disabled={!!pending}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                border: '1px solid #3a3a55', borderRadius: 8, padding: '6px 12px',
                color: '#a0a0b8', fontSize: 12, opacity: pending ? 0.4 : 1, cursor: 'pointer' }}>
              <Upload size={14} /> Importer un vocal
            </button>
          </>
        )}
```

- [ ] **Step 5: Vérifier manuellement dans le build**

Run: `npx vitest run` (doit rester à 41/41 + les 2 nouveaux tests audioStore = 43/43)
Run: `npm run build`
Expected: build sans erreur.

- [ ] **Step 6: Commit**

```bash
git add src/apps/MySanctuary/screens/notes/N3Dictee.jsx
git commit -m "feat(mysanctuary): importer un fichier audio existant (vocaux Apple)"
```

---

### Task 3: Déploiement et documentation

- [ ] **Step 1: Build + déploiement production**

```bash
npm run build
npx vercel deploy --prod
```

- [ ] **Step 2: Documenter dans le vault Obsidian**

Ajouter une entrée datée dans `20-Projets/MySanctuary/00-MySanctuary.md`, section
"Journal des améliorations", décrivant la fonctionnalité et sa limite connue (pas de
partage direct iOS depuis Dictaphone — passage obligé par Fichiers).
