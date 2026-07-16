import { test, expect } from '@playwright/test'

test.describe('Apply Log+', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/Apply-Log-plus/')
  })

  test('loads the app with header', async ({ page }) => {
    await expect(page.getByText('Apply Log+')).toBeVisible()
  })

  test('shows empty state', async ({ page }) => {
    await expect(page.getByText('No applications yet. Add your first one!')).toBeVisible()
  })

  test('adds an application', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Application' }).click()

    await page.getByLabel('Company').fill('TestCorp')
    await page.getByLabel('Role').fill('Developer')
    await page.getByLabel('Save').click()

    await expect(page.getByText('TestCorp')).toBeVisible()
    await expect(page.getByText('Developer')).toBeVisible()
  })

  test('searches applications', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Application' }).click()
    await page.getByLabel('Company').fill('Alpha')
    await page.getByLabel('Role').fill('Engineer')
    await page.getByLabel('Save').click()

    await page.getByRole('button', { name: 'Add Application' }).click()
    await page.getByLabel('Company').fill('Beta')
    await page.getByLabel('Role').fill('Designer')
    await page.getByLabel('Save').click()

    const searchInput = page.getByPlaceholder('Search company or role...')
    await searchInput.fill('Alpha')

    await expect(page.getByText('Alpha')).toBeVisible()
    await expect(page.getByText('Beta')).not.toBeVisible()
  })

  test('edits an application', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Application' }).click()
    await page.getByLabel('Company').fill('EditCorp')
    await page.getByLabel('Role').fill('Tester')
    await page.getByLabel('Save').click()

    await page.getByRole('button', { name: 'Edit Application' }).click()
    await page.getByLabel('Role').fill('Senior Tester')
    await page.getByLabel('Save').click()

    await expect(page.getByText('Senior Tester')).toBeVisible()
  })

  test('deletes an application', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Application' }).click()
    await page.getByLabel('Company').fill('DeleteCorp')
    await page.getByLabel('Role').fill('Intern')
    await page.getByLabel('Save').click()

    await expect(page.getByText('DeleteCorp')).toBeVisible()

    page.on('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: 'Delete' }).click()

    await expect(page.getByText('DeleteCorp')).not.toBeVisible()
  })

  test('shows stats cards when applications exist', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Application' }).click()
    await page.getByLabel('Company').fill('StatsCorp')
    await page.getByLabel('Role').fill('Dev')
    await page.getByLabel('Save').click()

    await expect(page.getByText('Total')).toBeVisible()
    await expect(page.getByText('Active')).toBeVisible()
  })
})
