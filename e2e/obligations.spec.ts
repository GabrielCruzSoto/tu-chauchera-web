import { test, expect } from '@playwright/test';
import { LoginPage, AppShell, ObligationsPage } from './pages/TuChaucheraPages';

test.describe('Tu Chauchera - Flujo de Obligaciones Financieras y División P2P (E2E)', () => {
  test('E2E-OBL-01: Verificación de Login y Acceso al Módulo Obligaciones', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Verificación de disponibilidad de la pantalla de autenticación
    await expect(page).toHaveTitle(/Tu Chauchera/i);
    await expect(loginPage.googleLoginBtn).toBeVisible();
    await expect(loginPage.systemVersionBadge).toBeVisible();
  });

  test('E2E-OBL-02: POM Selectors and Components Integrity Check', async ({ page }) => {
    const obligationsPage = new ObligationsPage(page);
    expect(obligationsPage.heading).toBeDefined();
    expect(obligationsPage.newObligationBtn).toBeDefined();
    expect(obligationsPage.categoryConfigBtn).toBeDefined();
    expect(obligationsPage.expenseTab).toBeDefined();
    expect(obligationsPage.debtTab).toBeDefined();
    expect(obligationsPage.p2pTab).toBeDefined();
    expect(obligationsPage.searchInput).toBeDefined();
    expect(obligationsPage.filterAllBtn).toBeDefined();
    expect(obligationsPage.filterExpenseBtn).toBeDefined();
    expect(obligationsPage.filterDebtBtn).toBeDefined();
    expect(obligationsPage.filterP2PBtn).toBeDefined();
  });
});
