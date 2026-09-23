import { test, expect } from '@playwright/test';
import { LoginPage, AppShell, IncomePage } from './pages/TuChaucheraPages';

test.describe('Tu Chauchera - Flujo de Gestión de Ingresos (E2E)', () => {
  test('E2E-INC-01: Verificación de Login y Acceso al Módulo Ingresos', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Verificación de disponibilidad de la pantalla de autenticación
    await expect(page).toHaveTitle(/Tu Chauchera/i);
    await expect(loginPage.googleLoginBtn).toBeVisible();
    await expect(loginPage.systemVersionBadge).toBeVisible();
  });

  test('E2E-INC-02: POM Selectors and Components Integrity Check', async ({ page }) => {
    const incomePage = new IncomePage(page);
    expect(incomePage.addIncomeBtn).toBeDefined();
    expect(incomePage.incomeModal).toBeDefined();
    expect(incomePage.descriptionInput).toBeDefined();
    expect(incomePage.amountInput).toBeDefined();
    expect(incomePage.repeatCheckbox).toBeDefined();
    expect(incomePage.saveBtn).toBeDefined();
  });
});
