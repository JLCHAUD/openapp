import { test, expect } from '@playwright/test'
import { enterMySanctuary, goToTab, goToBiblePlans } from './helpers'

test.describe('Navigation générale', () => {
  test.beforeEach(async ({ page }) => {
    await enterMySanctuary(page)
  })

  test('OpenApp home affiche les tuiles', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await expect(page.getByText('OpenApp')).toBeVisible()
    await expect(page.getByText('My Sanctuary')).toBeVisible()
    await expect(page.getByText('Ma Piscine')).toBeVisible()
  })

  test('cliquer My Sanctuary entre dans l\'app', async ({ page }) => {
    await expect(page.locator('.ms-root')).toBeVisible()
    await expect(page.getByText('MON SANCTUAIRE')).toBeVisible()
    await expect(page.locator('.ms-header-title', { hasText: 'Bible' })).toBeVisible()
  })

  test('3 onglets visibles dans la tab bar', async ({ page }) => {
    await expect(page.getByText('BIBLE', { exact: true })).toBeVisible()
    await expect(page.getByText('TÂCHES', { exact: true })).toBeVisible()
    await expect(page.getByText('NOTES', { exact: true })).toBeVisible()
  })

  test('onglet BIBLE actif par défaut', async ({ page }) => {
    await expect(page.getByText('chapitres lus')).toBeVisible()
    await expect(page.getByText('Ma carte de lecture →')).toBeVisible()
  })

  test('switch vers onglet TÂCHES', async ({ page }) => {
    await goToTab(page, 'TÂCHES')
    await expect(page.getByText('PRIORITÉS DU JOUR')).toBeVisible()
  })

  test('switch vers onglet NOTES', async ({ page }) => {
    await goToTab(page, 'NOTES')
    await expect(page.getByText('+ NOUVELLE NOTE')).toBeVisible()
  })

  test('retour vers BIBLE depuis NOTES', async ({ page }) => {
    await goToTab(page, 'NOTES')
    await goToTab(page, 'BIBLE')
    await expect(page.getByText('chapitres lus')).toBeVisible()
  })

  test('naviguer vers la carte de lecture', async ({ page }) => {
    await page.getByText('Ma carte de lecture →').click()
    await expect(page.getByText('ANCIEN TESTAMENT · 39 LIVRES')).toBeVisible()
    await expect(page.getByText('NOUVEAU TESTAMENT · 27 LIVRES')).toBeVisible()
  })

  test('bouton retour depuis la carte revient à l\'accueil Bible', async ({ page }) => {
    await page.getByText('Ma carte de lecture →').click()
    await expect(page.locator('.ms-header-title', { hasText: 'Carte de lecture' })).toBeVisible()
    await page.locator('.ms-header-back').click()
    await expect(page.getByText('chapitres lus')).toBeVisible()
    await expect(page.getByText('Ma carte de lecture →')).toBeVisible()
  })

  test('naviguer vers les plans de lecture', async ({ page }) => {
    await goToBiblePlans(page)
    await expect(page.getByText('Mes plans')).toBeVisible()
  })

  test('bouton retour depuis plans revient à l\'accueil Bible', async ({ page }) => {
    await goToBiblePlans(page)
    await page.locator('.ms-header-back').click()
    await expect(page.getByText('chapitres lus')).toBeVisible()
  })

  test('changer d\'onglet réinitialise la navigation Bible', async ({ page }) => {
    await page.getByText('Ma carte de lecture →').click()
    await expect(page.getByText('ANCIEN TESTAMENT · 39 LIVRES')).toBeVisible()
    await goToTab(page, 'TÂCHES')
    await goToTab(page, 'BIBLE')
    await expect(page.getByText('chapitres lus')).toBeVisible()
    await expect(page.getByText('ANCIEN TESTAMENT · 39 LIVRES')).not.toBeVisible()
  })

  test('bouton maison (⌂) revient à OpenApp depuis MySanctuary', async ({ page }) => {
    await page.locator('.ms-header-home').click()
    await expect(page.getByText('OpenApp')).toBeVisible()
    await expect(page.locator('.ms-root')).not.toBeVisible()
  })

  test('la tuile Ma Piscine est marquée BIENTÔT et non cliquable', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.getByText('Ma Piscine').click()
    await expect(page.locator('.ms-root')).not.toBeVisible()
    await expect(page.getByText('OpenApp')).toBeVisible()
  })
})
