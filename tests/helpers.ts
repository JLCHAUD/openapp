import { Page, expect } from '@playwright/test'

export async function resetApp(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.home-grid')
}

export async function enterMySanctuary(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByText('My Sanctuary').click()
  await page.waitForSelector('.ms-root')
}

export async function goToTab(page: Page, tab: 'BIBLE' | 'TÂCHES' | 'NOTES') {
  await page.getByText(tab, { exact: true }).click()
}

export async function goToTaskView(page: Page, view: 'Focus' | 'Habitudes' | 'Échéances' | 'Tableaux') {
  await page.getByText(view, { exact: true }).click()
}

export async function goToBiblePlans(page: Page) {
  await page.getByText('Mes plans de lecture →').click()
  await expect(page.getByText('+ AJOUTER UN LIVRE À LIRE')).toBeVisible()
}

export async function addBookToPlan(page: Page, bookName: string) {
  await page.getByText('+ AJOUTER UN LIVRE À LIRE').click()
  await page.getByText(bookName).first().click()
  await expect(page.getByText('FILE D\'ATTENTE')).toBeVisible()
}
