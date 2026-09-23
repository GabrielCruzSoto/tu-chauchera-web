import { test, expect } from '@playwright/test';
import { LoginPage, AppShell } from './pages/TuChaucheraPages';

test.describe('Tu Chauchera - Smoke & Security E2E Suite', () => {
  test('AUTH-01 & AUTH-02: Disponibilidad de Login y Estructura Base', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Validar landing de login
    await expect(page).toHaveTitle(/Tu Chauchera/i);
    await expect(loginPage.googleLoginBtn).toBeVisible();
    await expect(loginPage.systemVersionBadge).toBeVisible();
  });

  test('RESP-01 to RESP-03: Auditoría de Viewports y Ausencia de Overflow Horizontal', async ({ page }) => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('https://alpha.tu-chauchera.cl/');
      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(hasHorizontalScroll, `Overflow horizontal detectado en ${vp.name}`).toBe(false);
    }
  });

  test('AUTH-05: Verificación de Seguridad - Cero Fuga de Claves en Storage', async ({ page }) => {
    await page.goto('https://alpha.tu-chauchera.cl/');
    const storage = await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }));

    // Ni la contraseña maestra ni las claves AES en claro deben residir en storage
    expect(storage.local['cryptoKey']).toBeUndefined();
    expect(storage.session['cryptoKey']).toBeUndefined();
  });
});
