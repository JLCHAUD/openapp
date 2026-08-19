import { test, expect } from '@playwright/test'
import { enterMySanctuary } from './helpers'

test.describe('Carte de lecture — Bi2Map & Bi3Book', () => {
  test.beforeEach(async ({ page }) => {
    await enterMySanctuary(page)
    await page.getByText('Ma carte de lecture →').click()
    await expect(page.getByText('ANCIEN TESTAMENT · 39 LIVRES')).toBeVisible()
  })

  test('affiche les deux sections AT et NT', async ({ page }) => {
    await expect(page.getByText('ANCIEN TESTAMENT · 39 LIVRES')).toBeVisible()
    await expect(page.getByText('NOUVEAU TESTAMENT · 27 LIVRES')).toBeVisible()
  })

  test('légende de couleur visible', async ({ page }) => {
    await expect(page.getByText('0%', { exact: true })).toBeVisible()
    await expect(page.getByText('100%', { exact: true })).toBeVisible()
    await expect(page.getByText('Touche un livre pour voir ses chapitres')).toBeVisible()
  })

  test('compteur chapitres lus affiché', async ({ page }) => {
    await expect(page.getByText('/ 1189 chapitres lus')).toBeVisible()
  })

  test('66 cases affichées dans la grille', async ({ page }) => {
    const squares = page.locator('.book-square')
    await expect(squares).toHaveCount(66)
  })

  test('cliquer un livre navigue vers ses chapitres', async ({ page }) => {
    await page.locator('.book-square').first().click()
    await expect(page.locator('.chapter-grid')).toBeVisible()
    // 50 chapitres Genèse — scoped à la grille (hors légende qui ajoute 3 squares)
    await expect(page.locator('.chapter-grid .chapter-square')).toHaveCount(50)
  })

  test('écran Bi3Book affiche le nom du livre dans le header', async ({ page }) => {
    await page.locator('.book-square').first().click()
    await expect(page.locator('.ms-header-title')).toContainText('Genèse')
  })

  test('retour depuis Bi3Book revient à la carte', async ({ page }) => {
    await page.locator('.book-square').first().click()
    await page.locator('.ms-header-back').click()
    await expect(page.getByText('ANCIEN TESTAMENT · 39 LIVRES')).toBeVisible()
    await expect(page.locator('.book-square')).toHaveCount(66)
  })

  test('retour depuis carte revient à Bi1Home', async ({ page }) => {
    await page.locator('.ms-header-back').click()
    await expect(page.getByText('chapitres lus')).toBeVisible()
    await expect(page.getByText('Ma carte de lecture →')).toBeVisible()
  })

  test('Bi3Book — cliquer un chapitre navigue vers les versets', async ({ page }) => {
    await page.locator('.book-square').first().click()
    await page.locator('.chapter-square').first().click()
    await expect(page.locator('.ms-header-title')).toContainText('Genèse 1')
  })

  test('Bi3Book — retour depuis les versets revient aux chapitres', async ({ page }) => {
    await page.locator('.book-square').first().click()
    await page.locator('.chapter-square').first().click()
    await page.locator('.ms-header-back').click()
    await expect(page.locator('.chapter-grid')).toBeVisible()
    await expect(page.locator('.ms-header-title')).toContainText('Genèse')
  })

  test('cliquer un livre NT', async ({ page }) => {
    await page.locator('.book-square').nth(39).click()
    await expect(page.locator('.ms-header-title')).toContainText('Matthieu')
    await expect(page.locator('.chapter-grid .chapter-square')).toHaveCount(28)
  })

  test('Bi3Book — Psaumes a 150 chapitres', async ({ page }) => {
    await page.locator('.book-square').nth(18).click()
    await expect(page.locator('.ms-header-title')).toContainText('Psaumes')
    await expect(page.locator('.chapter-grid .chapter-square')).toHaveCount(150)
  })
})
