# Import d'un fichier audio existant (vocaux Apple) — Design

## But

Permettre d'importer un fichier audio déjà enregistré ailleurs (typiquement un vocal de
l'app Dictaphone Apple, exporté vers Fichiers) dans MySanctuary, pour qu'il suive le même
pipeline de transcription que les dictées enregistrées directement dans l'app.

## Contexte

MySanctuary a déjà un pipeline complet : enregistrement → IndexedDB → formulaire de nommage
(titre/catégorie/langue/GPS) → push Supabase → transcription Whisper (agent PC) → conversion
en note. Ce pipeline attend un `Blob` audio en entrée, produit jusqu'ici uniquement par
`useAudioRecorder`. Le besoin ici est d'ajouter une deuxième source de `Blob` : un fichier
choisi par l'utilisateur via le sélecteur de fichiers natif.

Contrainte plateforme : iOS Safari ne supporte pas le Web Share Target (impossible de
"partager" directement un vocal depuis l'app Dictaphone vers la PWA). L'utilisateur doit
d'abord exporter le vocal vers l'app Fichiers (Partager → Enregistrer dans Fichiers), puis
le sélectionner dans MySanctuary via un `<input type="file">`.

## Décisions (validées en conversation)

- Import **un fichier à la fois** (pas de sélection multiple/batch).
- Bouton d'import sur l'écran Dictée (`N3Dictee.jsx`), à côté du bouton micro.
- **Pas de capture GPS** pour un fichier importé (la position actuelle ne correspond pas au
  lieu d'origine de l'enregistrement — inutile, potentiellement trompeur).

## Flux

1. L'utilisateur tape "Importer un vocal" → ouvre le sélecteur de fichiers natif
   (`accept="audio/*"`).
2. Fichier sélectionné → on lit sa durée réelle via un élément `<audio>` caché
   (`loadedmetadata`), avec un timeout de repli (durée à 0 si la lecture échoue ou ne répond
   pas sous 3 s — n'empêche pas l'import).
3. Le fichier alimente le **même état `pending`** que `handleStop()` après un enregistrement
   (`{ blob, mime, durationSec, createdAt, coords: null, locating: false }`), ce qui réutilise
   tel quel le formulaire de nommage existant (titre, catégorie, langue).
4. Après validation (`confirmSave`), le flux est identique à une dictée enregistrée :
   sauvegarde IndexedDB, push Supabase si connecté, transcription PC, conversion en note.

## Changements

- `audioStore.js` : ajout d'un champ `source` au shape par défaut d'un enregistrement
  (`'mic'` par défaut, `'import'` pour un fichier importé). Champ informatif seulement — ne
  change aucune logique existante.
- `N3Dictee.jsx` :
  - Nouveau bouton "Importer un vocal" à côté du bouton micro (visible seulement hors
    enregistrement, désactivé si un `pending` est déjà en cours — même contrainte que le
    micro).
  - `<input type="file" accept="audio/*" hidden>` déclenché par ce bouton.
  - Nouvelle fonction `handleFileImport(file)` : lit la durée via `<audio>` caché, construit
    l'objet `pending` avec `coords: null`, `locating: false`, et route vers le même formulaire
    de nommage que l'enregistrement micro.
- Aucun changement côté Supabase, agent Whisper, ou `syncClient.js` : un enregistrement
  importé est indiscernable d'un enregistrement micro une fois dans le pipeline (même shape,
  même table `dictation_jobs`).

## Hors scope

- Import groupé / sélection multiple (l'utilisateur a choisi "un par un, au fil de l'eau").
- Réception directe depuis l'app Dictaphone via partage iOS (non supporté par la plateforme).
- Badge visuel distinguant "importé" vs "enregistré" dans la liste des dictées (le champ
  `source` est posé pour permettre ça plus tard si besoin, mais non affiché pour l'instant —
  YAGNI).

## Tests

- `lib/audioStore.test.js` : vérifie que `source` par défaut vaut `'mic'`, et qu'on peut le
  surcharger à `'import'` via `saveRecording`.
- Pas de test automatisé pour la lecture de durée via `<audio>` (API navigateur, difficile à
  fiabiliser en jsdom) — vérification manuelle sur appareil après déploiement, comme pour les
  autres fonctionnalités audio de l'app.
