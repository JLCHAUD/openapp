# Dictée vocale — Enregistrement audio + transcription Whisper (design)

**Date :** 2026-07-04
**Statut :** approuvé (design), en attente du plan d'implémentation

## Objectif

Permettre à l'utilisateur d'enregistrer des dictées vocales (prières, prophéties, réflexions) depuis
son iPhone, hors-ligne si besoin, puis de récupérer automatiquement une transcription française
générée par Whisper tournant sur son PC, sans API payante et sans dépendre des limites d'iOS.

## Principe directeur

Le téléphone **capture** seulement. La transcription (coûteuse) tourne sur le **PC**. Les deux
communiquent en asynchrone via un **relais cloud** : le téléphone dépose l'audio et l'oublie, le PC
le ramasse quand il est disponible, le téléphone récupère le texte plus tard. Aucune des deux
machines n'a besoin d'être allumée en même temps.

L'audio **et** le texte sont conservés.

## Architecture

```
📱 iPhone (PWA)                ☁️ Supabase              🖥️ PC (agent Windows)
─────────────────             ──────────────           ─────────────────────
1. MediaRecorder → blob
2. Blob → IndexedDB (local)
3. INSERT job (pending) ─────► table dictation_jobs
4. Upload audio ─────────────► bucket audio-notes
                                    │
                                    ▼  (Realtime / poll)
                                              ◄──────── 5. Détecte job pending
                                                        6. Download audio
                                                        7. faster-whisper (fr)
                              UPDATE transcript ◄─────── 8. status=done + texte
                                    │
9. Realtime / poll ◄────────────────┘
10. Injecte le texte dans la note (type "dictée")
    Audio local (IndexedDB) → lecteur réattaché
11. (option) supprime le blob cloud
```

### Choix du relais : Supabase

Retenu plutôt que Vercel Blob / Firebase parce qu'il regroupe les trois briques nécessaires :

- **Storage** (bucket `audio-notes`, privé) pour les blobs audio.
- **Postgres** (table `dictation_jobs`) qui **est** la file d'attente / machine à états.
- **Realtime** pour notifier le téléphone dès que la transcription est prête (fallback : polling).

Client JS depuis le navigateur (`@supabase/supabase-js`), client Python côté PC (`supabase`).
Gratuit à ce volume d'usage personnel.

## Modèle de données

### Table `dictation_jobs`

```sql
create table dictation_jobs (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  status       text not null default 'pending',   -- pending | transcribing | done | error
  audio_path   text,          -- chemin dans le bucket, ex. "<uid>/<id>.m4a"
  audio_mime   text,          -- "audio/mp4" (iOS) ou "audio/webm"
  duration_sec integer,
  language     text not null default 'fr',
  transcript   text,
  error        text,
  device       text,          -- libellé libre ("iphone")
  owner        uuid not null default auth.uid()
);
```

### Bucket `audio-notes`

Privé. Objets nommés `<owner-uid>/<job-id>.<ext>`.

### État local (IndexedDB, store `ms_audio`)

Chaque enregistrement local :

```
{
  id,               // = job id (uuid généré côté client)
  blob,             // Blob audio
  mime,             // "audio/mp4" | "audio/webm"
  durationSec,
  createdAt,        // ISO
  syncStatus,       // 'pending' | 'uploading' | 'transcribing' | 'done' | 'error'
  transcript,       // rempli quand done
  noteId            // id de la note créée dans notes.notes, quand transcrit
}
```

Les blobs **ne passent jamais par localStorage** (limite ~5 Mo). Seul l'index léger (métadonnées)
peut être miroité dans le state React ; les blobs restent dans IndexedDB.

## Machine à états d'une dictée

```
recording ──stop──► pending ──online+upload──► uploading ──ok──► transcribing
                                                   │                   │
                                                   └──fail──► error     │ (PC bosse)
                                                                        ▼
                     done ◄──texte récupéré──────────────────── (transcript prêt)
```

- `pending` : audio en IndexedDB, job pas encore poussé (hors-ligne, ou upload en attente).
- `uploading` : job inséré + upload du blob en cours.
- `transcribing` : upload fini, on attend le PC.
- `done` : transcript récupéré, note créée/mise à jour, blob cloud supprimé (option).
- `error` : échec upload ou transcription (message stocké, ré-essayable).

## Composants — 📱 PWA (React)

| Fichier | Responsabilité |
|---|---|
| `src/apps/MySanctuary/hooks/useAudioRecorder.js` | Wrapper `MediaRecorder` + `getUserMedia`. Démarrer/pause/stop, timer, choix du mime supporté (iOS `audio/mp4`, sinon `audio/webm`). Retourne le blob final + durée. |
| `src/apps/MySanctuary/lib/audioStore.js` | Accès IndexedDB (store `ms_audio`) : `put`, `get`, `getAll`, `update`, `delete`. Aucune dépendance externe (wrapper minimal sur l'API IndexedDB). |
| `src/apps/MySanctuary/lib/supabaseClient.js` | Instancie le client Supabase (URL + clé anon via variables d'env Vite `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). |
| `src/apps/MySanctuary/lib/syncClient.js` | Logique de synchro : `pushPending()` (insert job + upload blob), `subscribe(onDone)` / `pollPending()`, récupération du transcript, suppression du blob cloud. |
| `src/apps/MySanctuary/screens/notes/N3Dictee.jsx` | UI : gros bouton micro (états idle/recording), minuteur, liste des enregistrements avec badge d'état (⏳ à transcrire / 🔄 en cours / ✅ transcrit / ⚠️ erreur), lecteur `<audio>`, bouton « transcrire maintenant ». |
| Intégration `src/apps/MySanctuary/screens/notes/N1Notes.jsx` | Une dictée transcrite apparaît comme note de type **« dictée »** : texte éditable + lecteur audio réattaché (source = blob IndexedDB via `URL.createObjectURL`). |

### Authentification (mono-utilisateur)

Pas de page de login classique. Supabase Auth avec **un seul compte** (l'email de l'utilisateur) :

- Connexion **une fois** sur le téléphone via *magic link* ; la session est mise en cache par le
  SDK (persistée), donc plus de re-login au quotidien.
- Le client navigateur utilise la clé **anon** + la session : la RLS ne laisse voir/écrire que ses
  propres lignes (`owner = auth.uid()`).
- Le blob dans le bucket est nommé sous `<uid>/…` et la policy Storage restreint à `auth.uid()`.

## Composant — 🖥️ Agent PC (nouveau projet Python séparé)

Dossier séparé (hors du repo de la PWA), ex. `MySanctuary/sync-agent/`.

| Fichier | Responsabilité |
|---|---|
| `agent.py` | Boucle principale : détecte les jobs `pending` (poll toutes les N s, ou Realtime), passe en `transcribing`, télécharge l'audio, transcrit, écrit `transcript` + `done`. Sur exception → `error`. |
| `transcribe.py` | Wrapper `faster-whisper` : charge le modèle (`small` par défaut, `medium` optionnel), langue `fr`, retourne le texte concaténé. |
| `config.py` / `.env` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (clé **service_role**, jamais dans le client — reste sur le PC), taille du modèle, intervalle de poll. |
| `requirements.txt` | `faster-whisper`, `supabase`, `python-dotenv`. |
| `README.md` | Installation Python, `pip install -r requirements.txt`, lancement, mise en tâche planifiée Windows au démarrage. |

- L'agent utilise la clé **service_role** → bypass RLS, accès complet à la table et au bucket.
- Modèle Whisper : `small` (bon compromis vitesse/qualité FR sur CPU) ; `medium` si GPU NVIDIA ou
  besoin de plus de précision. `ffmpeg` requis (géré par faster-whisper) pour décoder `.m4a`/`.webm`.

## Sécurité

- La clé **anon** est publique par nature (embarquée dans le bundle) ; c'est la **RLS** qui protège
  (`owner = auth.uid()` sur la table, policy équivalente sur le bucket).
- La clé **service_role** ne quitte jamais le PC (dans le `.env` de l'agent, hors repo, hors git).
- Bucket privé ; URLs signées à durée limitée si un accès direct est nécessaire.

## Gestion des erreurs

- **Micro refusé / indisponible** : message clair dans `N3Dictee`, pas de crash.
- **Hors-ligne à l'enregistrement** : l'audio reste en `pending` dans IndexedDB ; upload auto au
  retour du réseau (écoute `online`) ou via bouton manuel.
- **Échec upload** : job passe `error`, ré-essayable.
- **Échec transcription (PC)** : l'agent écrit `status=error` + `error` ; le téléphone l'affiche et
  propose de relancer (remet `pending`).
- **Format audio inattendu** : faster-whisper via ffmpeg gère `m4a`/`webm`/`wav`.

## Tests

- **Unitaires (Vitest)** :
  - `audioStore` : put/get/update/delete round-trip (jsdom + fake-indexeddb).
  - `syncClient` : transitions d'état avec un client Supabase mocké (pas d'appel réseau réel).
  - `useAudioRecorder` : sélection du mime supporté, gestion start/stop (MediaRecorder mocké).
- **E2E (Playwright)** : parcours `N3Dictee` avec `getUserMedia` simulé (fake media stream de
  Chromium) → un enregistrement apparaît dans la liste avec badge « à transcrire ». La transcription
  réelle (PC) n'est pas testée en E2E (hors navigateur).
- **Agent PC** : test unitaire `transcribe.py` sur un court fichier audio de référence → texte non
  vide ; test de la boucle avec Supabase mocké.

## Hors périmètre (YAGNI)

- Édition/découpage audio.
- Multi-utilisateurs / partage.
- Transcription temps réel sur le téléphone.
- Détection automatique de locuteurs.

## Points à confirmer au démarrage

1. Création du compte / projet Supabase (guidage fourni dans le plan).
2. Taille du modèle Whisper par défaut (`small` proposé) selon le matériel du PC.
```
