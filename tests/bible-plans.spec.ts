import { test, expect } from '@playwright/test'
import { enterMySanctuary, goToBiblePlans, addBookToPlan } from './helpers'

test.describe('Plans de lecture — Bi5Plans', () => {
  test.beforeEach(async ({ page }) => {
    await enterMySanctuary(page)
    await goToBiblePlans(page)
  })

  // ─── ÉTAT VIDE ───────────────────────────────────────────────────────────────

  test('état vide : message "Aucun livre" visible', async ({ page }) => {
    await expect(page.getByText('Aucun livre dans ta liste.')).toBeVisible()
    await expect(page.getByText('Ajoute-en un ci-dessus.')).toBeVisible()
  })

  test('état vide : sections EN COURS / FILE D\'ATTENTE / TERMINÉS absentes', async ({ page }) => {
    await expect(page.getByText('EN COURS')).not.toBeVisible()
    await expect(page.getByText('FILE D\'ATTENTE')).not.toBeVisible()
    await expect(page.getByText('TERMINÉS')).not.toBeVisible()
  })

  // ─── OUVRIR LE PICKER ────────────────────────────────────────────────────────

  test('bouton "+ AJOUTER UN LIVRE À LIRE" ouvre le picker', async ({ page }) => {
    await page.getByText('+ AJOUTER UN LIVRE À LIRE').click()
    await expect(page.getByText('CHOISIR UN LIVRE')).toBeVisible()
    await expect(page.getByText('Genèse')).toBeVisible()
    await expect(page.getByText('Apocalypse')).toBeVisible()
  })

  test('picker affiche les 66 livres', async ({ page }) => {
    await page.getByText('+ AJOUTER UN LIVRE À LIRE').click()
    // 66 spans "X ch." dans la liste du picker
    const items = page.locator('span').filter({ hasText: /^\d+ ch\.$/ })
    await expect(items).toHaveCount(66)
  })

  test('fermer le picker avec le bouton × (coin)', async ({ page }) => {
    await page.getByText('+ AJOUTER UN LIVRE À LIRE').click()
    await expect(page.getByText('CHOISIR UN LIVRE')).toBeVisible()
    // Bouton × dans le header du picker
    await page.locator('div').filter({ hasText: 'CHOISIR UN LIVRE' })
      .locator('button', { hasText: '×' }).click()
    await expect(page.getByText('CHOISIR UN LIVRE')).not.toBeVisible()
    await expect(page.getByText('Aucun livre dans ta liste.')).toBeVisible()
  })

  test('fermer le picker en cliquant le fond sombre (backdrop)', async ({ page }) => {
    await page.getByText('+ AJOUTER UN LIVRE À LIRE').click()
    await expect(page.getByText('CHOISIR UN LIVRE')).toBeVisible()
    // Cliquer le fond fixe (overlay noir) — coin supérieur gauche
    await page.mouse.click(10, 10)
    await expect(page.getByText('CHOISIR UN LIVRE')).not.toBeVisible()
  })

  test('annuler le picker ne crée pas de plan', async ({ page }) => {
    await page.getByText('+ AJOUTER UN LIVRE À LIRE').click()
    await page.mouse.click(10, 10)
    await expect(page.getByText('Aucun livre dans ta liste.')).toBeVisible()
    await expect(page.getByText('EN COURS')).not.toBeVisible()
  })

  // ─── AJOUTER UN LIVRE ────────────────────────────────────────────────────────

  test('sélectionner Genèse → apparaît en FILE D\'ATTENTE', async ({ page }) => {
    await addBookToPlan(page, 'Genèse')
    await expect(page.getByText('FILE D\'ATTENTE')).toBeVisible()
    await expect(page.getByText('Genèse')).toBeVisible()
    await expect(page.getByText('50 chapitres')).toBeVisible()
    await expect(page.getByText('Aucun livre dans ta liste.')).not.toBeVisible()
  })

  test('livre en attente a le bouton ▶ Commencer', async ({ page }) => {
    await addBookToPlan(page, 'Jean')
    await expect(page.getByText('▶ Commencer')).toBeVisible()
  })

  test('livre en attente a le bouton × pour supprimer', async ({ page }) => {
    await addBookToPlan(page, 'Ruth')
    const queue = page.getByText('▶ Commencer').locator('..')
    await expect(queue.locator('button', { hasText: '×' })).toBeVisible()
  })

  test('ajouter plusieurs livres : tous en attente', async ({ page }) => {
    await addBookToPlan(page, 'Genèse')
    await page.getByText('+ AJOUTER UN LIVRE À LIRE').click()
    await page.getByText('Jean').first().click()
    await page.getByText('+ AJOUTER UN LIVRE À LIRE').click()
    await page.getByText('Psaumes').first().click()

    await expect(page.getByText('FILE D\'ATTENTE')).toBeVisible()
    await expect(page.getByText('Genèse')).toBeVisible()
    await expect(page.getByText('Jean')).toBeVisible()
    await expect(page.getByText('Psaumes')).toBeVisible()
    await expect(page.getByText('▶ Commencer')).toHaveCount(3)
  })

  test('livre déjà ajouté n\'apparaît plus dans le picker', async ({ page }) => {
    await addBookToPlan(page, 'Genèse')
    await page.getByText('+ AJOUTER UN LIVRE À LIRE').click()
    // "Genèse" ne doit plus être dans la liste scrollable du picker
    const pickerGenese = page.getByText('CHOISIR UN LIVRE').locator('..').locator('..').getByText('Genèse')
    await expect(pickerGenese).not.toBeVisible()
  })

  // ─── COMMENCER UN LIVRE ───────────────────────────────────────────────────────

  test('cliquer ▶ Commencer passe le livre EN COURS', async ({ page }) => {
    await addBookToPlan(page, 'Marc')
    await page.getByText('▶ Commencer').click()
    await expect(page.getByText('EN COURS')).toBeVisible()
    await expect(page.getByText('Marc')).toBeVisible()
    await expect(page.getByText('▶ Commencer')).not.toBeVisible()
    await expect(page.getByText('FILE D\'ATTENTE')).not.toBeVisible()
  })

  test('livre EN COURS affiche le chapitre actuel', async ({ page }) => {
    await addBookToPlan(page, 'Marc')
    await page.getByText('▶ Commencer').click()
    await expect(page.getByText('Chapitre 1 / 16')).toBeVisible()
  })

  test('livre EN COURS a le bouton ✓ CHAPITRE X LU', async ({ page }) => {
    await addBookToPlan(page, 'Jean')
    await page.getByText('▶ Commencer').click()
    await expect(page.getByText('✓ CHAPITRE 1 LU')).toBeVisible()
  })

  test('livre EN COURS a une barre de progression', async ({ page }) => {
    await addBookToPlan(page, 'Jean')
    await page.getByText('▶ Commencer').click()
    await expect(page.locator('.progress-bar-track')).toBeVisible()
  })

  test('livre EN COURS a le bouton × pour supprimer', async ({ page }) => {
    await addBookToPlan(page, 'Luc')
    await page.getByText('▶ Commencer').click()
    await expect(page.getByText('EN COURS').locator('..').locator('button', { hasText: '×' })).toBeVisible()
  })

  // ─── MARQUER UN CHAPITRE ─────────────────────────────────────────────────────

  test('marquer chapitre 1 → passe au chapitre 2', async ({ page }) => {
    await addBookToPlan(page, 'Jean')
    await page.getByText('▶ Commencer').click()
    await expect(page.getByText('✓ CHAPITRE 1 LU')).toBeVisible()
    await page.getByText('✓ CHAPITRE 1 LU').click()
    await expect(page.getByText('✓ CHAPITRE 2 LU')).toBeVisible()
    await expect(page.getByText('Chapitre 2 / 21')).toBeVisible()
  })

  test('marquer plusieurs chapitres avance le compteur', async ({ page }) => {
    await addBookToPlan(page, 'Ruth')
    await page.getByText('▶ Commencer').click()
    await page.getByText('✓ CHAPITRE 1 LU').click()
    await page.getByText('✓ CHAPITRE 2 LU').click()
    await page.getByText('✓ CHAPITRE 3 LU').click()
    await expect(page.getByText('✓ CHAPITRE 4 LU')).toBeVisible()
    await expect(page.getByText('Chapitre 4 / 4')).toBeVisible()
  })

  test('terminer tous les chapitres → livre passe dans TERMINÉS', async ({ page }) => {
    // Ruth a 4 chapitres — court pour le test
    await addBookToPlan(page, 'Ruth')
    await page.getByText('▶ Commencer').click()
    await page.getByText('✓ CHAPITRE 1 LU').click()
    await page.getByText('✓ CHAPITRE 2 LU').click()
    await page.getByText('✓ CHAPITRE 3 LU').click()
    await page.getByText('✓ CHAPITRE 4 LU').click()
    await expect(page.getByText('TERMINÉS')).toBeVisible()
    await expect(page.getByText('EN COURS')).not.toBeVisible()
  })

  test('livre terminé affiche ✓ vert', async ({ page }) => {
    await addBookToPlan(page, 'Ruth')
    await page.getByText('▶ Commencer').click()
    for (let i = 1; i <= 4; i++) {
      await page.getByText(`✓ CHAPITRE ${i} LU`).click()
    }
    const greenCheck = page.locator('span', { hasText: '✓' }).filter({
      hasNot: page.locator('[class*="btn"]')
    })
    await expect(greenCheck.first()).toHaveCSS('color', 'rgb(76, 175, 130)')
  })

  // ─── SUPPRIMER UN LIVRE ───────────────────────────────────────────────────────

  test('supprimer livre depuis FILE D\'ATTENTE', async ({ page }) => {
    await addBookToPlan(page, 'Genèse')
    await expect(page.getByText('Genèse')).toBeVisible()
    // Trouver le × à côté du bouton Commencer
    const row = page.getByText('Genèse').locator('..').locator('..')
    await row.locator('button', { hasText: '×' }).last().click()
    await expect(page.getByText('Genèse')).not.toBeVisible()
    await expect(page.getByText('Aucun livre dans ta liste.')).toBeVisible()
  })

  test('supprimer livre depuis EN COURS', async ({ page }) => {
    await addBookToPlan(page, 'Jean')
    await page.getByText('▶ Commencer').click()
    await expect(page.getByText('EN COURS')).toBeVisible()
    await page.locator('.card--gold button', { hasText: '×' }).click()
    await expect(page.getByText('Jean')).not.toBeVisible()
    await expect(page.getByText('EN COURS')).not.toBeVisible()
    await expect(page.getByText('Aucun livre dans ta liste.')).toBeVisible()
  })

  test('supprimer livre depuis TERMINÉS', async ({ page }) => {
    await addBookToPlan(page, 'Ruth')
    await page.getByText('▶ Commencer').click()
    for (let i = 1; i <= 4; i++) {
      await page.getByText(`✓ CHAPITRE ${i} LU`).click()
    }
    await expect(page.getByText('TERMINÉS')).toBeVisible()
    await page.getByText('TERMINÉS').locator('..').locator('..').locator('button', { hasText: '×' }).click()
    await expect(page.getByText('Ruth')).not.toBeVisible()
    await expect(page.getByText('TERMINÉS')).not.toBeVisible()
    await expect(page.getByText('Aucun livre dans ta liste.')).toBeVisible()
  })

  // ─── PLUSIEURS LIVRES EN COURS ────────────────────────────────────────────────

  test('deux livres peuvent être EN COURS simultanément', async ({ page }) => {
    await addBookToPlan(page, 'Jean')
    await page.getByText('+ AJOUTER UN LIVRE À LIRE').click()
    await page.getByText('Marc').first().click()
    await page.getByText('▶ Commencer').first().click()
    await page.getByText('▶ Commencer').click()
    await expect(page.getByText('EN COURS')).toBeVisible()
    await expect(page.getByText('✓ CHAPITRE 1 LU')).toHaveCount(2)
  })

  test('ajouter un livre puis annuler le commencer laisse en attente', async ({ page }) => {
    await addBookToPlan(page, 'Luc')
    await addBookToPlan(page, 'Jean')
    // Commencer Luc seulement
    await page.getByText('▶ Commencer').first().click()
    await expect(page.getByText('EN COURS')).toBeVisible()
    await expect(page.getByText('FILE D\'ATTENTE')).toBeVisible()
  })

  // ─── PERSISTANCE APRÈS NAVIGATION ─────────────────────────────────────────────

  test('les plans persistent après navigation vers un autre onglet et retour', async ({ page }) => {
    await addBookToPlan(page, 'Matthieu')
    await page.getByText('▶ Commencer').click()
    await page.getByText('✓ CHAPITRE 1 LU').click()

    // Aller sur TÂCHES puis revenir
    await page.getByText('TÂCHES', { exact: true }).click()
    await page.getByText('BIBLE', { exact: true }).click()
    await page.getByText('Mes plans de lecture →').click()

    await expect(page.getByText('EN COURS')).toBeVisible()
    await expect(page.getByText('Matthieu')).toBeVisible()
    await expect(page.getByText('Chapitre 2 / 28')).toBeVisible()
  })

  // ─── ACCUEIL BIBLE REFLÈTE LE PLAN EN COURS ──────────────────────────────────

  test('Bi1Home affiche le livre en cours après démarrage', async ({ page }) => {
    await addBookToPlan(page, 'Jean')
    await page.getByText('▶ Commencer').click()
    await page.locator('.ms-header-back').click()
    await expect(page.getByText('LECTURE DU JOUR')).toBeVisible()
    await expect(page.getByText('Jean 1')).toBeVisible()
    await expect(page.getByText('✓ MARQUER COMME LU')).toBeVisible()
  })

  test('Bi1Home : marquer lu depuis accueil avance le plan', async ({ page }) => {
    await addBookToPlan(page, 'Jean')
    await page.getByText('▶ Commencer').click()
    await page.locator('.ms-header-back').click()
    await page.getByText('✓ MARQUER COMME LU').click()
    await expect(page.getByText('Jean 2')).toBeVisible()
  })
})
