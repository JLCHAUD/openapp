import { test, expect } from '@playwright/test'
import { enterMySanctuary } from './helpers'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function futureDateISO(daysFromNow: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

test.describe('Échéances — T3Deadlines', () => {
  test.beforeEach(async ({ page }) => {
    await enterMySanctuary(page)
    await page.getByText('TÂCHES', { exact: true }).click()
    await page.getByText('Échéances', { exact: true }).click()
  })

  // ─── ÉTAT VIDE ─────────────────────────────────────────────────────────────

  test('état vide : message affiché', async ({ page }) => {
    await expect(page.getByText('Aucune échéance à venir.')).toBeVisible()
  })

  test('bouton + AJOUTER visible à l\'état vide', async ({ page }) => {
    await expect(page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE')).toBeVisible()
  })

  test('aucune section EN RETARD / AUJOURD\'HUI / CETTE SEMAINE vide', async ({ page }) => {
    await expect(page.getByText('EN RETARD')).not.toBeVisible()
    await expect(page.getByText('AUJOURD\'HUI')).not.toBeVisible()
    await expect(page.getByText('CETTE SEMAINE')).not.toBeVisible()
  })

  // ─── FORMULAIRE ────────────────────────────────────────────────────────────

  test('cliquer le bouton ouvre le formulaire', async ({ page }) => {
    await page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE').click()
    await expect(page.getByText('NOUVELLE TÂCHE')).toBeVisible()
    await expect(page.getByPlaceholder('Titre de la tâche…')).toBeVisible()
    await expect(page.locator('input[type="date"]')).toBeVisible()
    await expect(page.getByText('AJOUTER')).toBeVisible()
  })

  test('bouton ✕ ferme le formulaire sans créer de tâche', async ({ page }) => {
    await page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE').click()
    await page.getByPlaceholder('Titre de la tâche…').fill('Tâche à annuler')
    await page.getByRole('main').locator('button', { hasText: '✕' }).click()
    await expect(page.getByText('NOUVELLE TÂCHE')).not.toBeVisible()
    await expect(page.getByText('Tâche à annuler')).not.toBeVisible()
    await expect(page.getByText('Aucune échéance à venir.')).toBeVisible()
  })

  test('fermer le formulaire réaffiche le bouton + AJOUTER', async ({ page }) => {
    await page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE').click()
    await page.getByRole('main').locator('button', { hasText: '✕' }).click()
    await expect(page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE')).toBeVisible()
  })

  test('titre vide : ne crée pas la tâche', async ({ page }) => {
    await page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE').click()
    await page.getByText('AJOUTER').click()
    await expect(page.getByText('NOUVELLE TÂCHE')).toBeVisible()
    await expect(page.getByText('Aucune échéance à venir.')).not.toBeVisible()
  })

  // ─── CRÉER UNE TÂCHE POUR AUJOURD'HUI ────────────────────────────────────

  test('tâche pour aujourd\'hui → section AUJOURD\'HUI', async ({ page }) => {
    await page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE').click()
    await page.getByPlaceholder('Titre de la tâche…').fill('Réunion équipe')
    const today = todayISO()
    await page.locator('input[type="date"]').fill(today)
    await page.getByText('AJOUTER').click()
    await expect(page.getByText('AUJOURD\'HUI')).toBeVisible()
    await expect(page.getByText('Réunion équipe')).toBeVisible()
    await expect(page.getByText('Aucune échéance à venir.')).not.toBeVisible()
  })

  test('formulaire fermé après création réussie', async ({ page }) => {
    await page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE').click()
    await page.getByPlaceholder('Titre de la tâche…').fill('Tâche test')
    await page.getByText('AJOUTER').click()
    await expect(page.getByText('NOUVELLE TÂCHE')).not.toBeVisible()
  })

  test('Enter dans le champ titre soumet le formulaire', async ({ page }) => {
    await page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE').click()
    await page.getByPlaceholder('Titre de la tâche…').fill('Via Enter')
    await page.getByPlaceholder('Titre de la tâche…').press('Enter')
    await expect(page.getByText('Via Enter')).toBeVisible()
  })

  // ─── CRÉER UNE TÂCHE POUR DANS 3 JOURS ───────────────────────────────────

  test('tâche dans 3 jours → section CETTE SEMAINE', async ({ page }) => {
    await page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE').click()
    await page.getByPlaceholder('Titre de la tâche…').fill('Rapport mensuel')
    await page.locator('input[type="date"]').fill(futureDateISO(3))
    await page.getByText('AJOUTER').click()
    await expect(page.getByText('CETTE SEMAINE')).toBeVisible()
    await expect(page.getByText('Rapport mensuel')).toBeVisible()
    await expect(page.getByText('dans 3 j')).toBeVisible()
  })

  test('tâche pour demain → CETTE SEMAINE avec label "demain"', async ({ page }) => {
    await page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE').click()
    await page.getByPlaceholder('Titre de la tâche…').fill('Tâche demain')
    await page.locator('input[type="date"]').fill(futureDateISO(1))
    await page.getByText('AJOUTER').click()
    await expect(page.getByText('demain', { exact: true })).toBeVisible()
  })

  // ─── MARQUER COMME FAIT ────────────────────────────────────────────────────

  test('cliquer le cercle marque la tâche comme faite (disparaît)', async ({ page }) => {
    await page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE').click()
    await page.getByPlaceholder('Titre de la tâche…').fill('Tâche à cocher')
    await page.locator('input[type="date"]').fill(todayISO())
    await page.getByText('AJOUTER').click()
    await expect(page.getByText('Tâche à cocher')).toBeVisible()
    // Cliquer le cercle coloré
    await page.locator('div').filter({ hasText: 'Tâche à cocher' })
      .locator('div[style*="border-radius: 50%"]').first().click()
    await expect(page.getByText('Tâche à cocher')).not.toBeVisible()
  })

  // ─── PLUSIEURS TÂCHES ─────────────────────────────────────────────────────

  test('plusieurs tâches affichées dans leurs sections', async ({ page }) => {
    // Aujourd'hui
    await page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE').click()
    await page.getByPlaceholder('Titre de la tâche…').fill('Tâche 1')
    await page.locator('input[type="date"]').fill(todayISO())
    await page.getByText('AJOUTER').click()

    // Dans 2 jours
    await page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE').click()
    await page.getByPlaceholder('Titre de la tâche…').fill('Tâche 2')
    await page.locator('input[type="date"]').fill(futureDateISO(2))
    await page.getByText('AJOUTER').click()

    await expect(page.getByText('AUJOURD\'HUI')).toBeVisible()
    await expect(page.getByText('CETTE SEMAINE')).toBeVisible()
    await expect(page.getByText('Tâche 1')).toBeVisible()
    await expect(page.getByText('Tâche 2')).toBeVisible()
  })

  test('ouvrir / fermer le formulaire plusieurs fois fonctionne', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE').click()
      await expect(page.getByText('NOUVELLE TÂCHE')).toBeVisible()
      await page.getByRole('main').locator('button', { hasText: '✕' }).click()
      await expect(page.getByText('+ AJOUTER UNE TÂCHE AVEC ÉCHÉANCE')).toBeVisible()
    }
  })
})
