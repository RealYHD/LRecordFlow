import { test, expect } from '@playwright/test'

test.describe('LRecordFlow E2E', () => {
  test('app loads and renders', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#app')).toBeVisible()
    await expect(page.locator('body')).toBeVisible()
  })

  test('page title is present', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/LRecordFlow/)
  })
})
