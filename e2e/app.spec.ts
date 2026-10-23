import { test, expect, type Page } from '@playwright/test'

async function addApplication(page: Page, company = 'Test rekrutacji', role = 'Tester') {
  await page.getByRole('button', { name: 'Dodaj aplikację', exact: true }).click()
  await page.getByLabel('Firma', { exact: true }).fill(company)
  await page.getByLabel('Stanowisko', { exact: true }).fill(role)
  await page.getByRole('button', { name: 'Zapisz', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('rowheader', { name: company, exact: true })).toBeVisible()
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const dialog = page.getByRole('dialog')
  if (await dialog.isVisible()) {
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  }
}

test.describe('Apply Log+', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/Apply-Log-plus/')
  })

  test('loads the app with header and empty state', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Apply Log+' })).toBeVisible()
    await expect(page.getByRole('status')).toHaveText('Brak aplikacji. Dodaj pierwszą!')
  })

  test('adds and edits an application with a translated stage', async ({ page }) => {
    await addApplication(page)
    await page.getByRole('button', { name: 'Edytuj aplikację' }).click()
    await page.getByLabel('Stanowisko', { exact: true }).fill('Starszy tester')
    await page.getByRole('combobox', { name: 'Etap', exact: true }).selectOption('Interview')
    await expect(page.getByRole('combobox', { name: 'Etap', exact: true })).toHaveText(/Rozmowa/)
    await page.getByRole('button', { name: 'Zapisz', exact: true }).click()
    await expect(page.getByRole('cell', { name: 'Starszy tester', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Rozmowa', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Historia', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Ukryj', exact: true })).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('heading', { name: 'Historia' })).toBeVisible()
    await page.getByRole('button', { name: 'Ukryj', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Historia' })).not.toBeVisible()
  })

  test('searches, filters, explains no matches and resets filters', async ({ page }) => {
    await addApplication(page, 'Test Alpha', 'Inżynier')
    await addApplication(page, 'Test Beta', 'Projektant')
    await page.getByRole('searchbox', { name: 'Szukaj aplikacji' }).fill('Alpha')
    await expect(page.getByRole('rowheader', { name: 'Test Alpha' })).toBeVisible()
    await expect(page.getByRole('rowheader', { name: 'Test Beta' })).not.toBeVisible()
    await page.getByRole('combobox', { name: 'Filtruj po etapie' }).selectOption('Interview')
    await expect(page.getByText('Żadna aplikacja nie pasuje do wybranych filtrów.')).toBeVisible()
    await page.getByRole('button', { name: 'Wyczyść filtry' }).click()
    await expect(page.getByRole('rowheader')).toHaveCount(2)
  })

  test('deletes an application after confirmation', async ({ page }) => {
    await addApplication(page)
    page.once('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: 'Usuń', exact: true }).click()
    await expect(page.getByRole('status')).toHaveText('Brak aplikacji. Dodaj pierwszą!')
  })

  test('shows statistics from saved applications', async ({ page }) => {
    await addApplication(page)
    await expect(page.getByText('Wszystkie', { exact: true })).toBeVisible()
    await expect(page.getByText('Aktywne', { exact: true })).toBeVisible()
    await expect(page.getByText('Trend miesięczny', { exact: true })).not.toBeVisible()
    await page.getByText('Szczegóły statystyk', { exact: true }).click()
    await expect(page.getByText('Trend miesięczny', { exact: true })).toBeVisible()
    await page.getByText('Szczegóły statystyk', { exact: true }).click()
    await expect(page.getByText('Trend miesięczny', { exact: true })).not.toBeVisible()
  })

  test('keeps focus in the modal, closes with Escape and restores the opener', async ({ page }) => {
    const opener = page.getByRole('button', { name: 'Dodaj aplikację', exact: true })
    await opener.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Dodaj aplikację' })
    await expect(dialog).toBeVisible()
    await expect(page.getByLabel('Firma', { exact: true })).toBeFocused()
    await page.getByRole('button', { name: 'Zamknij', exact: true }).focus()
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Shift+Tab')
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(opener).toBeFocused()
    await page.keyboard.press('Enter')
    await page.getByRole('button', { name: 'Anuluj' }).click()
    await expect(opener).toBeFocused()
  })

  test('changes stage with only the keyboard', async ({ page }) => {
    await page.getByRole('button', { name: 'Dodaj aplikację', exact: true }).click()
    await page.getByRole('combobox', { name: 'Etap', exact: true }).focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('combobox', { name: 'Etap', exact: true })).toHaveValue('Phone Screen')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('manages stages and opens both sync sections without a network request', async ({ page }) => {
    await page.getByRole('button', { name: 'Zarządzaj etapami' }).click()
    await expect(page.getByRole('button', { name: 'Dodaj etap' })).toBeDisabled()
    await page.getByLabel('Nazwa nowego etapu', { exact: true }).fill('Testowy etap')
    await page.getByRole('button', { name: 'Dodaj etap' }).click()
    await expect(page.getByText('Testowy etap', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Usuń', exact: true }).click()
    await expect(page.getByText('Testowy etap', { exact: true })).not.toBeVisible()
    await page.getByRole('button', { name: 'Zamknij' }).click()
    await page.getByRole('button', { name: 'Synchronizacja', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Zapisz konfigurację' })).toBeDisabled()
    await page.getByRole('button', { name: 'Paruj urządzenie' }).click()
    await expect(page.getByRole('button', { name: 'Połącz' })).toBeDisabled()
    await page.getByRole('button', { name: 'Konfiguracja' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('exports the saved application in both formats', async ({ page }) => {
    await addApplication(page)
    for (const [label, filename] of [
      ['Eksportuj JSON', 'apply-log-plus-export.json'],
      ['Eksportuj CSV', 'apply-log-plus-export.csv'],
    ]) {
      const download = page.waitForEvent('download')
      await page.getByRole('button', { name: label }).click()
      expect((await download).suggestedFilename()).toBe(filename)
    }
  })

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`has readable semantic colors and visible keyboard focus in ${colorScheme} appearance`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      const ratios = await page.evaluate(() => {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 1
        const context = canvas.getContext('2d')!
        const style = getComputedStyle(document.documentElement)
        function luminance(token: string) {
          context.fillStyle = style.getPropertyValue(token).trim()
          context.fillRect(0, 0, 1, 1)
          const rgb = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(value => {
            const channel = value / 255
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
          })
          return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
        }
        return [
          ['--foreground', '--background', 4.5],
          ['--muted-foreground', '--background', 4.5],
          ['--muted-foreground', '--muted', 4.5],
          ['--primary-foreground', '--primary', 4.5],
          ['--destructive-foreground', '--destructive', 4.5],
          ['--input', '--background', 3],
          ['--ring', '--background', 3],
        ].map(([foreground, background, minimum]) => {
          const a = luminance(foreground as string)
          const b = luminance(background as string)
          return { foreground, background, minimum: minimum as number, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
        })
      })
      for (const pair of ratios) {
        expect(pair.ratio, `${pair.foreground} on ${pair.background}`).toBeGreaterThanOrEqual(pair.minimum)
      }
      await page.getByRole('button', { name: 'Dodaj aplikację', exact: true }).focus()
      await page.keyboard.press('Enter')
      const focusStyle = await page.getByLabel('Firma', { exact: true }).evaluate(el => {
        const style = getComputedStyle(el)
        return { width: style.outlineWidth, style: style.outlineStyle }
      })
      expect(focusStyle).toEqual({ width: '2px', style: 'solid' })
    })

    test(`reflows at compact, medium and regular widths in ${colorScheme} appearance`, async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      await addApplication(page, 'TestBardzoDługiejNazwyFirmyBezSpacji'.repeat(3), 'Test stanowiska '.repeat(8))
      for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 800 })
        await expectNoOverflow(page)
        await page.getByRole('button', { name: 'Edytuj aplikację' }).click()
        await expectNoOverflow(page)
        const save = page.getByRole('button', { name: 'Zapisz', exact: true })
        await save.scrollIntoViewIfNeeded()
        await expect(save).toBeInViewport()
        await page.getByRole('button', { name: 'Zamknij' }).click()
        await page.getByRole('button', { name: 'Synchronizacja', exact: true }).click()
        await expectNoOverflow(page)
        await page.getByRole('button', { name: 'Zamknij' }).click()
      }
      const background = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor)
      expect(background).toBe(colorScheme === 'dark' ? 'rgb(24, 26, 31)' : 'oklch(1 0 0)')
    })
  }

  test('reflows with text enlarged to 200 percent', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addStyleTag({ content: 'html { font-size: 200%; }' })
    await addApplication(page)
    await expectNoOverflow(page)
    await page.getByRole('button', { name: 'Edytuj aplikację' }).click()
    await expectNoOverflow(page)
    await page.getByRole('button', { name: 'Zapisz', exact: true }).scrollIntoViewIfNeeded()
    await expect(page.getByRole('button', { name: 'Zapisz', exact: true })).toBeInViewport()
  })

  test('has no runtime errors during local CRUD', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text()) })
    await addApplication(page)
    await page.getByRole('button', { name: 'Edytuj aplikację' }).click()
    await page.keyboard.press('Escape')
    expect(errors).toEqual([])
  })
})
