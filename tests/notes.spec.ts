import { test, expect } from '@playwright/test'
import { enterMySanctuary } from './helpers'

test.describe('Notes — N1Notes', () => {
  test.beforeEach(async ({ page }) => {
    await enterMySanctuary(page)
    await page.getByText('NOTES', { exact: true }).click()
    await expect(page.getByText('+ NOUVELLE NOTE')).toBeVisible()
  })

  // ─── FILTRES ──────────────────────────────────────────────────────────────

  test('6 chips de filtre visibles', async ({ page }) => {
    const chips = ['Tous', 'Réflexion', 'Prière', 'Gratitude', 'Prophétie', 'Sermon']
    for (const chip of chips) {
      await expect(page.getByText(chip, { exact: true })).toBeVisible()
    }
  })

  test('chip "Tous" actif par défaut', async ({ page }) => {
    await expect(page.locator('.note-chip.active', { hasText: 'Tous' })).toBeVisible()
  })

  test('cliquer un chip l\'active', async ({ page }) => {
    await page.getByText('Réflexion', { exact: true }).click()
    await expect(page.locator('.note-chip.active', { hasText: 'Réflexion' })).toBeVisible()
    await expect(page.locator('.note-chip.active', { hasText: 'Tous' })).not.toBeVisible()
  })

  test('cliquer "Tous" réactive le filtre global', async ({ page }) => {
    await page.getByText('Prière', { exact: true }).click()
    await page.getByText('Tous', { exact: true }).click()
    await expect(page.locator('.note-chip.active', { hasText: 'Tous' })).toBeVisible()
  })

  // ─── ÉTAT VIDE ─────────────────────────────────────────────────────────────

  test('état vide : message "Aucune note" visible', async ({ page }) => {
    await expect(page.getByText('Aucune note.')).toBeVisible()
  })

  test('état vide par type : message avec type', async ({ page }) => {
    await page.getByText('Prière', { exact: true }).click()
    await expect(page.getByText('Aucune note de type "prière".')).toBeVisible()
  })

  // ─── FORMULAIRE DE CRÉATION ───────────────────────────────────────────────

  test('bouton "+ NOUVELLE NOTE" ouvre le formulaire', async ({ page }) => {
    await page.getByText('+ NOUVELLE NOTE').click()
    await expect(page.getByPlaceholder('Titre…')).toBeVisible()
    await expect(page.getByPlaceholder('Contenu…')).toBeVisible()
    await expect(page.getByText('ENREGISTRER')).toBeVisible()
    await expect(page.getByText('Annuler')).toBeVisible()
  })

  test('bouton Annuler ferme le formulaire sans créer de note', async ({ page }) => {
    await page.getByText('+ NOUVELLE NOTE').click()
    await page.getByPlaceholder('Titre…').fill('Note abandonnée')
    await page.getByText('Annuler').click()
    await expect(page.getByPlaceholder('Titre…')).not.toBeVisible()
    await expect(page.getByText('Note abandonnée')).not.toBeVisible()
    await expect(page.getByText('Aucune note.')).toBeVisible()
  })

  test('annuler réaffiche le bouton + NOUVELLE NOTE', async ({ page }) => {
    await page.getByText('+ NOUVELLE NOTE').click()
    await page.getByText('Annuler').click()
    await expect(page.getByText('+ NOUVELLE NOTE')).toBeVisible()
  })

  test('titre vide ne crée pas de note', async ({ page }) => {
    await page.getByText('+ NOUVELLE NOTE').click()
    await page.getByText('ENREGISTRER').click()
    // Le formulaire reste ouvert (titre vide → addNote() return early)
    await expect(page.getByPlaceholder('Titre…')).toBeVisible()
    // Pas de note créée — le message vide n'apparaît pas encore (form open)
    await expect(page.getByText('ENREGISTRER')).toBeVisible()
  })

  // ─── CRÉER UNE NOTE ───────────────────────────────────────────────────────

  test('créer une note de type Réflexion', async ({ page }) => {
    await page.getByText('+ NOUVELLE NOTE').click()
    await page.getByPlaceholder('Titre…').fill('Ma première réflexion')
    await page.getByPlaceholder('Contenu…').fill('Dieu est fidèle dans toutes ses voies.')
    await page.getByText('ENREGISTRER').click()
    await expect(page.getByText('Ma première réflexion')).toBeVisible()
    await expect(page.getByText('Dieu est fidèle dans toutes ses voies.')).toBeVisible()
    await expect(page.getByText('RÉFLEXION', { exact: true })).toBeVisible()
  })

  test('formulaire fermé après enregistrement', async ({ page }) => {
    await page.getByText('+ NOUVELLE NOTE').click()
    await page.getByPlaceholder('Titre…').fill('Test')
    await page.getByText('ENREGISTRER').click()
    await expect(page.getByPlaceholder('Titre…')).not.toBeVisible()
    await expect(page.getByText('+ NOUVELLE NOTE')).toBeVisible()
  })

  test('note affiche la date du jour', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0]
    await page.getByText('+ NOUVELLE NOTE').click()
    await page.getByPlaceholder('Titre…').fill('Note datée')
    await page.getByText('ENREGISTRER').click()
    await expect(page.getByText(today)).toBeVisible()
  })

  test('changer le type de note dans le formulaire', async ({ page }) => {
    await page.getByText('+ NOUVELLE NOTE').click()
    await page.locator('select').selectOption('prière')
    await page.getByPlaceholder('Titre…').fill('Intercession ce matin')
    await page.getByText('ENREGISTRER').click()
    await expect(page.getByText('Intercession ce matin')).toBeVisible()
    await expect(page.getByText('PRIÈRE', { exact: true })).toBeVisible()
  })

  test('créer une note Gratitude', async ({ page }) => {
    await page.getByText('+ NOUVELLE NOTE').click()
    await page.locator('select').selectOption('gratitude')
    await page.getByPlaceholder('Titre…').fill('Merci pour la santé')
    await page.getByText('ENREGISTRER').click()
    await expect(page.getByText('GRATITUDE', { exact: true })).toBeVisible()
    await expect(page.getByText('Merci pour la santé')).toBeVisible()
  })

  // ─── FILTRAGE AVEC NOTES EXISTANTES ──────────────────────────────────────

  test('filtre par type affiche seulement ce type', async ({ page }) => {
    // Créer une note Réflexion
    await page.getByText('+ NOUVELLE NOTE').click()
    await page.getByPlaceholder('Titre…').fill('Note réflexion')
    await page.getByText('ENREGISTRER').click()

    // Créer une note Prière
    await page.getByText('+ NOUVELLE NOTE').click()
    await page.locator('select').selectOption('prière')
    await page.getByPlaceholder('Titre…').fill('Note prière')
    await page.getByText('ENREGISTRER').click()

    // Filtrer sur Prière
    await page.getByText('Prière', { exact: true }).click()
    await expect(page.getByText('Note prière')).toBeVisible()
    await expect(page.getByText('Note réflexion')).not.toBeVisible()
  })

  test('filtre "Tous" réaffiche toutes les notes', async ({ page }) => {
    // Créer deux notes de types différents
    await page.getByText('+ NOUVELLE NOTE').click()
    await page.getByPlaceholder('Titre…').fill('Réflexion A')
    await page.getByText('ENREGISTRER').click()

    await page.getByText('+ NOUVELLE NOTE').click()
    await page.locator('select').selectOption('prière')
    await page.getByPlaceholder('Titre…').fill('Prière B')
    await page.getByText('ENREGISTRER').click()

    // Filtrer, puis revenir à Tous
    await page.getByText('Prière', { exact: true }).click()
    await expect(page.getByText('Réflexion A')).not.toBeVisible()
    await page.getByText('Tous', { exact: true }).click()
    await expect(page.getByText('Réflexion A')).toBeVisible()
    await expect(page.getByText('Prière B')).toBeVisible()
  })

  test('la plus récente note apparaît en premier', async ({ page }) => {
    await page.getByText('+ NOUVELLE NOTE').click()
    await page.getByPlaceholder('Titre…').fill('Note ancienne')
    await page.getByText('ENREGISTRER').click()

    await page.getByText('+ NOUVELLE NOTE').click()
    await page.getByPlaceholder('Titre…').fill('Note récente')
    await page.getByText('ENREGISTRER').click()

    const cards = page.locator('.card').filter({ hasText: /Note (ancienne|récente)/ })
    await expect(cards.first()).toContainText('Note récente')
  })

  test('ouvrir le formulaire plusieurs fois sans fuites', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.getByText('+ NOUVELLE NOTE').click()
      await expect(page.getByPlaceholder('Titre…')).toBeVisible()
      await page.getByText('Annuler').click()
      await expect(page.getByText('+ NOUVELLE NOTE')).toBeVisible()
    }
  })

  // ─── NAVIGATION VERS PRIÈRE ───────────────────────────────────────────────

  test('l\'onglet NOTES affiche bien les chips de filtres', async ({ page }) => {
    // Vérification que la section notes est bien chargée et complète
    await expect(page.locator('.note-chips')).toBeVisible()
    await expect(page.locator('.note-chip')).toHaveCount(6)
  })
})
