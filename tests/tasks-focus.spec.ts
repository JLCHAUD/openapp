import { test, expect } from '@playwright/test'
import { enterMySanctuary } from './helpers'

test.describe('Focus — T1Focus', () => {
  test.beforeEach(async ({ page }) => {
    await enterMySanctuary(page)
    await page.getByText('TÂCHES', { exact: true }).click()
    await expect(page.getByText('PRIORITÉS DU JOUR')).toBeVisible()
  })

  // ─── ÉTAT INITIAL ─────────────────────────────────────────────────────────────

  test('3 slots vides affichés au démarrage', async ({ page }) => {
    await expect(page.getByText('+ Ajouter une priorité…')).toHaveCount(3)
  })

  test('pas de section PLUS TARD au démarrage', async ({ page }) => {
    await expect(page.getByText('PLUS TARD')).not.toBeVisible()
  })

  test('champ de saisie bas de page visible', async ({ page }) => {
    await expect(page.getByPlaceholder('+ Nouvelle tâche…')).toBeVisible()
    await expect(page.locator('button', { hasText: '+' }).last()).toBeVisible()
  })

  // ─── AJOUTER UNE PRIORITÉ ─────────────────────────────────────────────────────

  test('cliquer slot 1 affiche un champ de saisie', async ({ page }) => {
    await page.getByText('+ Ajouter une priorité…').first().click()
    await expect(page.getByPlaceholder('Titre de la priorité…')).toBeVisible()
  })

  test('saisir une priorité avec Enter la crée', async ({ page }) => {
    await page.getByText('+ Ajouter une priorité…').first().click()
    await page.getByPlaceholder('Titre de la priorité…').fill('Finir le rapport')
    await page.keyboard.press('Enter')
    await expect(page.getByText('Finir le rapport')).toBeVisible()
    // Numéro "1" en Cormorant Garamond
    await expect(page.locator('span', { hasText: '1' }).first()).toBeVisible()
  })

  test('blur sans texte annule la création', async ({ page }) => {
    await page.getByText('+ Ajouter une priorité…').first().click()
    await page.getByPlaceholder('Titre de la priorité…').blur()
    await expect(page.getByText('+ Ajouter une priorité…')).toHaveCount(3)
    await expect(page.getByText('PLUS TARD')).not.toBeVisible()
  })

  test('remplir les 3 slots de priorité', async ({ page }) => {
    const tasks = ['Prier le matin', 'Lire la Bible', 'Appeler Marie']
    for (let i = 0; i < 3; i++) {
      await page.getByText('+ Ajouter une priorité…').first().click()
      await page.getByPlaceholder('Titre de la priorité…').fill(tasks[i])
      await page.keyboard.press('Enter')
    }
    await expect(page.getByText('Prier le matin')).toBeVisible()
    await expect(page.getByText('Lire la Bible')).toBeVisible()
    await expect(page.getByText('Appeler Marie')).toBeVisible()
    await expect(page.getByText('+ Ajouter une priorité…')).toHaveCount(0)
  })

  // ─── DÉMOTION ─────────────────────────────────────────────────────────────────

  test('bouton ↓ déplace une priorité vers PLUS TARD', async ({ page }) => {
    await page.getByText('+ Ajouter une priorité…').first().click()
    await page.getByPlaceholder('Titre de la priorité…').fill('Tâche à démoter')
    await page.keyboard.press('Enter')
    await expect(page.getByText('Tâche à démoter')).toBeVisible()

    await page.locator('.card--gold').filter({ hasText: 'Tâche à démoter' })
      .locator('button', { hasText: '↓' }).click()

    await expect(page.getByText('PLUS TARD')).toBeVisible()
    await expect(page.getByText('Tâche à démoter')).toBeVisible()
    await expect(page.getByText('+ Ajouter une priorité…')).toHaveCount(3)
  })

  // ─── PROMOTION ────────────────────────────────────────────────────────────────

  test('bouton ↑ Priorité depuis PLUS TARD promeut dans le premier slot vide', async ({ page }) => {
    const input = page.getByPlaceholder('+ Nouvelle tâche…')
    await input.fill('Tâche à promouvoir')
    await page.locator('button', { hasText: '+' }).last().click()
    await expect(page.getByText('PLUS TARD')).toBeVisible()

    await page.getByText('↑ Priorité').click()
    await expect(page.getByText('Tâche à promouvoir')).toBeVisible()
    await expect(page.getByText('+ Ajouter une priorité…')).toHaveCount(2)
    await expect(page.getByText('PLUS TARD')).not.toBeVisible()
  })

  // ─── AJOUTER DANS PLUS TARD ───────────────────────────────────────────────────

  test('bouton + ajoute une tâche dans PLUS TARD', async ({ page }) => {
    const input = page.getByPlaceholder('+ Nouvelle tâche…')
    await input.fill('Nouvelle tâche libre')
    await page.locator('button', { hasText: '+' }).last().click()
    await expect(page.getByText('PLUS TARD')).toBeVisible()
    await expect(page.getByText('Nouvelle tâche libre')).toBeVisible()
    // Le champ est vidé après ajout
    await expect(input).toHaveValue('')
  })

  test('ajouter via Enter dans le champ bas', async ({ page }) => {
    const input = page.getByPlaceholder('+ Nouvelle tâche…')
    await input.fill('Tâche via Enter')
    await input.press('Enter')
    await expect(page.getByText('Tâche via Enter')).toBeVisible()
    await expect(page.getByText('PLUS TARD')).toBeVisible()
  })

  test('champ vide ne crée pas de tâche', async ({ page }) => {
    await page.locator('button', { hasText: '+' }).last().click()
    await expect(page.getByText('PLUS TARD')).not.toBeVisible()
  })

  // ─── EXPAND / COLLAPSE ────────────────────────────────────────────────────────

  test('bouton ⌄ expand les sous-tâches', async ({ page }) => {
    await page.getByText('+ Ajouter une priorité…').first().click()
    await page.getByPlaceholder('Titre de la priorité…').fill('Tâche avec sous-tâches')
    await page.keyboard.press('Enter')
    await page.locator('.card--gold').locator('button', { hasText: '⌄' }).click()
    await expect(page.getByPlaceholder('+ sous-tâche')).toBeVisible()
  })

  test('bouton ⌃ collapse les sous-tâches', async ({ page }) => {
    await page.getByText('+ Ajouter une priorité…').first().click()
    await page.getByPlaceholder('Titre de la priorité…').fill('Ma tâche')
    await page.keyboard.press('Enter')
    // Expand
    await page.locator('.card--gold').locator('button', { hasText: '⌄' }).click()
    await expect(page.getByPlaceholder('+ sous-tâche')).toBeVisible()
    // Collapse
    await page.locator('.card--gold').locator('button', { hasText: '⌃' }).click()
    await expect(page.getByPlaceholder('+ sous-tâche')).not.toBeVisible()
  })

  test('ajouter une sous-tâche via Enter', async ({ page }) => {
    await page.getByText('+ Ajouter une priorité…').first().click()
    await page.getByPlaceholder('Titre de la priorité…').fill('Tâche principale')
    await page.keyboard.press('Enter')
    await page.locator('.card--gold').locator('button', { hasText: '⌄' }).click()
    await page.getByPlaceholder('+ sous-tâche').fill('Etape 1')
    await page.getByPlaceholder('+ sous-tâche').press('Enter')
    await expect(page.getByText('Etape 1')).toBeVisible()
    await expect(page.getByText('0/1', { exact: true })).toBeVisible()
  })

  test('cocher une sous-tâche met à jour le compteur', async ({ page }) => {
    await page.getByText('+ Ajouter une priorité…').first().click()
    await page.getByPlaceholder('Titre de la priorité…').fill('Tâche')
    await page.keyboard.press('Enter')
    await page.locator('.card--gold').locator('button', { hasText: '⌄' }).click()
    await page.getByPlaceholder('+ sous-tâche').fill('Sous-tache A')
    await page.getByPlaceholder('+ sous-tâche').press('Enter')
    await page.locator('.subtask-check').first().click()
    await expect(page.getByText('1/1', { exact: true })).toBeVisible()
  })

  test('décocher une sous-tâche revient à 0', async ({ page }) => {
    await page.getByText('+ Ajouter une priorité…').first().click()
    await page.getByPlaceholder('Titre de la priorité…').fill('Tâche')
    await page.keyboard.press('Enter')
    await page.locator('.card--gold').locator('button', { hasText: '⌄' }).click()
    await page.getByPlaceholder('+ sous-tâche').fill('A')
    await page.getByPlaceholder('+ sous-tâche').press('Enter')
    await page.locator('.subtask-check').first().click()
    await expect(page.getByText('1/1', { exact: true })).toBeVisible()
    await page.locator('.subtask-check').first().click()
    await expect(page.getByText('0/1', { exact: true })).toBeVisible()
  })
})
