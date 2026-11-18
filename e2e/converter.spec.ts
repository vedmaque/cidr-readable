import { expect, test, type Page } from '@playwright/test'

const output = (page: Page) => page.getByTestId('output')

test.describe('navigation', () => {
  test('opens CIDR → Readable by default and switches modes', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/#\/cidr-to-readable$/)
    await expect(page.getByRole('textbox', { name: 'CIDR list' })).toBeVisible()

    const nav = page.getByRole('navigation', { name: 'Conversion mode' })
    await nav.getByRole('link', { name: 'Readable → CIDR' }).click()
    await expect(page).toHaveURL(/#\/readable-to-cidr$/)
    await expect(page).toHaveTitle('Readable → CIDR · CIDR Readable')

    await nav.getByRole('link', { name: 'Deny → AllowedIPs' }).click()
    await expect(page.getByRole('textbox', { name: 'Denied networks' })).toBeVisible()
  })

  test('redirects unknown paths to the default mode', async ({ page }) => {
    await page.goto('/#/does-not-exist')
    await expect(page).toHaveURL(/#\/cidr-to-readable$/)
  })
})

test('converts a pasted WireGuard line to readable patterns', async ({ page }) => {
  await page.goto('/#/cidr-to-readable')
  await page
    .getByRole('textbox', { name: 'CIDR list' })
    .fill('AllowedIPs = 172.0.0.0/12, 10.0.0.0/24, 10.0.1.0/24, 192.168.1.7')

  await expect(output(page)).toHaveText(
    ['10.0.[0-1].X', '172.[0-15].X.X', '192.168.1.7'].join('\n'),
  )
  await expect(page.getByTestId('output-summary')).toHaveText('4 entries → 3 patterns')
})

test('converts readable patterns to CIDR and copies them for WireGuard', async ({ page }) => {
  await page.goto('/#/readable-to-cidr')
  await page.getByRole('textbox', { name: 'Readable list' }).fill('172.[0-15].X.X\n10.X.X.X')
  await expect(output(page)).toHaveText('10.0.0.0/8\n172.0.0.0/12')

  await page.getByText('WireGuard', { exact: true }).click()
  await expect(output(page)).toHaveText('10.0.0.0/8, 172.0.0.0/12')

  await page.getByRole('button', { name: 'Copy' }).click()
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboard).toBe('10.0.0.0/8, 172.0.0.0/12')
})

test('builds AllowedIPs from a deny list', async ({ page }) => {
  await page.goto('/#/deny-to-allowed')
  await page.getByRole('textbox', { name: 'Denied networks' }).fill('128.0.0.0/1\n64.X.X.X')

  await expect(output(page)).toHaveText(
    [
      '0.0.0.0/2',
      '65.0.0.0/8',
      '66.0.0.0/7',
      '68.0.0.0/6',
      '72.0.0.0/5',
      '80.0.0.0/4',
      '96.0.0.0/3',
    ].join('\n'),
  )
})

test('withholds AllowedIPs while the deny list has invalid entries', async ({ page }) => {
  await page.goto('/#/deny-to-allowed')
  const input = page.getByRole('textbox', { name: 'Denied networks' })
  await input.fill('128.0.0.0/1\n64.X.X.X, ::/0')

  const issues = page.getByRole('list', { name: 'Problems in the input' })
  await expect(issues).toContainText('Line 2')
  await expect(issues).toContainText('IPv6 is not supported')
  await expect(output(page)).toBeHidden()
  await expect(page.getByTestId('output-empty')).toContainText('Fix the problems')
  await expect(page.getByRole('button', { name: 'Copy' })).toBeDisabled()

  await input.fill('128.0.0.0/1\n64.X.X.X')
  await expect(output(page)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy' })).toBeEnabled()
})

test('keeps the input after a reload', async ({ page }) => {
  await page.goto('/#/readable-to-cidr')
  await page.getByRole('textbox', { name: 'Readable list' }).fill('10.X.X.X')
  await expect(output(page)).toHaveText('10.0.0.0/8')

  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Readable list' })).toHaveValue('10.X.X.X')
  await expect(output(page)).toHaveText('10.0.0.0/8')
})
