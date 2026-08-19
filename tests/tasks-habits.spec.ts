import { test, expect } from '@playwright/test'
import { enterMySanctuary } from './helpers'

test.describe('Habitudes — T2Habits', () => {
  test.beforeEach(async ({ page }) => {
    await enterMySanctuary(page)
    await page.getByText('TÂCHES', { exact: true }).click()
    await page.getByText('Habitudes', { exact: true }).click()
  })

  test('état vide affiché sans habitudes', async ({ page }) => {
    await expect(page.getByText('Aucune habitude. Ajoutes-en une ci-dessous.')).toBeVisible()
  })

  test('7 jours de la semaine visibles dans l\'en-tête', async ({ page }) => {
    // L M M J V S D
    const header = page.locator('div').filter({ hasText: /^LMMJVSD$/ }).first()
    await expect(header).not.toBeNull()
    // Vérifier que les lettres L M M J V S D sont toutes présentes
    for (const letter of ['L', 'M', 'M', 'J', 'V', 'S', 'D']) {
      await expect(page.locator('span', { hasText: letter }).first()).toBeVisible()
    }
  })

  test('champ "+ Nouvelle habitude…" visible', async ({ page }) => {
    await expect(page.getByPlaceholder('+ Nouvelle habitude…')).toBeVisible()
  })

  test('ajouter une habitude via Enter', async ({ page }) => {
    const input = page.getByPlaceholder('+ Nouvelle habitude…')
    await input.fill('Méditer 10 min')
    await input.press('Enter')
    await expect(page.getByText('Méditer 10 min')).toBeVisible()
    await expect(page.getByText('Aucune habitude.')).not.toBeVisible()
  })

  test('ajouter une habitude vide ne crée rien', async ({ page }) => {
    const input = page.getByPlaceholder('+ Nouvelle habitude…')
    await input.press('Enter')
    await expect(page.getByText('Aucune habitude.')).toBeVisible()
  })

  test('habitude affiche 7 cercles de jours', async ({ page }) => {
    const input = page.getByPlaceholder('+ Nouvelle habitude…')
    await input.fill('Courir')
    await input.press('Enter')
    await expect(page.locator('.habit-circle')).toHaveCount(7)
  })

  test('cercle d\'aujourd\'hui a la classe "today"', async ({ page }) => {
    const input = page.getByPlaceholder('+ Nouvelle habitude…')
    await input.fill('Habitude test')
    await input.press('Enter')
    await expect(page.locator('.habit-circle.today')).toBeVisible()
  })

  test('cliquer aujourd\'hui coche l\'habitude (done)', async ({ page }) => {
    const input = page.getByPlaceholder('+ Nouvelle habitude…')
    await input.fill('Sport')
    await input.press('Enter')
    await page.locator('.habit-circle.today').click()
    await expect(page.locator('.habit-circle.done')).toBeVisible()
    await expect(page.locator('.habit-circle.done span', { hasText: '✓' })).toBeVisible()
  })

  test('cliquer à nouveau décoche l\'habitude (toggle)', async ({ page }) => {
    const input = page.getByPlaceholder('+ Nouvelle habitude…')
    await input.fill('Sport')
    await input.press('Enter')
    // Cocher
    await page.locator('.habit-circle.today').click()
    await expect(page.locator('.habit-circle.done')).toBeVisible()
    // Décocher
    await page.locator('.habit-circle.done').click()
    await expect(page.locator('.habit-circle.done')).not.toBeVisible()
    await expect(page.locator('.habit-circle.today')).toBeVisible()
  })

  test('ajouter plusieurs habitudes', async ({ page }) => {
    const habits = ['Prière', 'Sport', 'Lecture', 'Hydratation']
    for (const h of habits) {
      const input = page.getByPlaceholder('+ Nouvelle habitude…')
      await input.fill(h)
      await input.press('Enter')
      // Attend que l'input soit vidé avant la prochaine saisie
      await expect(input).toHaveValue('')
    }
    for (const h of habits) {
      await expect(page.getByText(h)).toBeVisible()
    }
    // 4 habitudes × 7 jours = 28 cercles
    await expect(page.locator('.habit-circle')).toHaveCount(28)
  })

  test('jours passés non cliquables (pas de today)', async ({ page }) => {
    const input = page.getByPlaceholder('+ Nouvelle habitude…')
    await input.fill('Test passé')
    await input.press('Enter')
    // Les cercles passés ont cursor: default et ne répondent pas au toggle
    const circles = page.locator('.habit-circle:not(.today)')
    const count = await circles.count()
    if (count > 0) {
      await circles.first().click()
      // Aucun cercle "done" ne doit apparaître
      await expect(page.locator('.habit-circle.done')).not.toBeVisible()
    }
  })

  test('champ vidé automatiquement après ajout', async ({ page }) => {
    const input = page.getByPlaceholder('+ Nouvelle habitude…')
    await input.fill('Prière du soir')
    await input.press('Enter')
    await expect(input).toHaveValue('')
  })
})
