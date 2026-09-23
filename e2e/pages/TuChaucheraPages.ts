import { test, expect, Page, Locator } from '@playwright/test';

/**
 * Page Object: LoginPage
 */
export class LoginPage {
  readonly page: Page;
  readonly loginHeading: Locator;
  readonly googleLoginBtn: Locator;
  readonly unlockHeading: Locator;
  readonly masterPasswordInput: Locator;
  readonly unlockVaultBtn: Locator;
  readonly lockVaultBtn: Locator;
  readonly systemVersionBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginHeading = page.getByRole('heading', { name: 'Acceder a Tu Bóveda' });
    this.googleLoginBtn = page.getByRole('button', { name: 'Continuar con Google' });
    this.unlockHeading = page.getByRole('heading', { name: 'Desbloquear Bóveda' });
    this.masterPasswordInput = page.getByRole('textbox', { name: /Ingresa tu contraseña para/i });
    this.unlockVaultBtn = page.getByRole('button', { name: 'Desbloquear Bóveda' });
    this.lockVaultBtn = page.getByRole('button', { name: 'Bloquear Bóveda' });
    this.systemVersionBadge = page.locator('text=Sistema:');
  }

  async goto() {
    await this.page.goto('https://alpha.tu-chauchera.cl/');
  }

  async enterMasterPassword(password: string) {
    await this.masterPasswordInput.fill(password);
    await this.unlockVaultBtn.click();
  }
}

/**
 * Page Object: AppShell & Navigation
 */
export class AppShell {
  readonly page: Page;
  readonly brandLogo: Locator;
  readonly syncStatus: Locator;
  readonly lockVaultBtn: Locator;
  readonly mobileMenuBtn: Locator;
  readonly mobileDrawer: Locator;
  readonly mobileCloseBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.brandLogo = page.getByText('Tu Chauchera').first();
    this.syncStatus = page.locator('header').locator('text=/Drive Sincronizado|Subiendo datos/i');
    this.lockVaultBtn = page.getByRole('button', { name: 'Bloquear Bóveda' }).first();
    this.mobileMenuBtn = page.getByRole('button', { name: /Abrir menú/i });
    this.mobileDrawer = page.getByTestId('mobile-nav-drawer');
    this.mobileCloseBtn = page.getByRole('button', { name: 'Cerrar menú' });
  }

  async navigateToTab(tabName: 'Matriz Consolidada' | 'Flujos & Cuotas' | 'Ingresos' | 'Obligaciones' | 'Tarjetas' | 'Configuración') {
    const isMobile = await this.mobileMenuBtn.isVisible();
    if (isMobile) {
      await this.mobileMenuBtn.click();
      await this.page.getByTestId('mobile-nav-links').getByRole('button', { name: new RegExp(tabName, 'i') }).click();
    } else {
      await this.page.getByRole('button', { name: new RegExp(tabName, 'i') }).click();
    }
  }
}

/**
 * Page Object: IncomePage
 */
export class IncomePage {
  readonly page: Page;
  readonly addIncomeBtn: Locator;
  readonly incomeModal: Locator;
  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly typeSelect: Locator;
  readonly periodInput: Locator;
  readonly repeatCheckbox: Locator;
  readonly saveBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addIncomeBtn = page.getByRole('button', { name: /Agregar Ingreso/i }).first();
    this.incomeModal = page.getByRole('heading', { name: 'Registrar Ingreso' });
    this.descriptionInput = page.getByRole('textbox', { name: /Ej\. Sueldo Principal/i });
    this.amountInput = page.getByRole('spinbutton', { name: /Ej\. 1500000/i });
    this.typeSelect = page.getByRole('combobox');
    this.periodInput = page.locator('input[value*="-"]');
    this.repeatCheckbox = page.getByRole('checkbox', { name: /Repetir automáticamente/i });
    this.saveBtn = page.getByRole('button', { name: 'Guardar Ingreso' });
    this.cancelBtn = page.getByRole('button', { name: 'Cancelar' });
  }

  async createIncome(desc: string, amount: string) {
    await this.addIncomeBtn.click();
    await expect(this.incomeModal).toBeVisible();
    await this.descriptionInput.fill(desc);
    await this.amountInput.fill(amount);
    await this.saveBtn.click();
  }
}

/**
 * Page Object: ObligationsPage
 */
export class ObligationsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newObligationBtn: Locator;
  readonly categoryConfigBtn: Locator;
  readonly modalHeading: Locator;
  readonly expenseTab: Locator;
  readonly debtTab: Locator;
  readonly p2pTab: Locator;
  readonly categorySelect: Locator;
  readonly subcategoryInput: Locator;
  readonly monthlyAmountInput: Locator;
  readonly totalAmountInput: Locator;
  readonly totalInstallmentsInput: Locator;
  readonly dueDayInput: Locator;
  readonly startDateInput: Locator;
  readonly saveBtn: Locator;
  readonly cancelBtn: Locator;

  // P2P Specific
  readonly p2pRoleLentBtn: Locator;
  readonly p2pThirdPartyInput: Locator;
  readonly p2pCardIssuerInput: Locator;
  readonly p2pProductInput: Locator;
  readonly p2pTotalAmountInput: Locator;
  readonly p2pBaseInstallmentInput: Locator;

  // Search & Filter toolbar
  readonly searchInput: Locator;
  readonly filterAllBtn: Locator;
  readonly filterExpenseBtn: Locator;
  readonly filterDebtBtn: Locator;
  readonly filterP2PBtn: Locator;

  // Metrics
  readonly metricTotalObligations: Locator;
  readonly metricMonthlyCommitment: Locator;
  readonly metricTotalDebtBalance: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Obligaciones Financieras' });
    this.newObligationBtn = page.getByRole('button', { name: '+ Nueva Obligación' });
    this.categoryConfigBtn = page.getByRole('button', { name: /Configurar Categorías/i });
    this.modalHeading = page.getByRole('heading', { name: /Nueva Obligación Financiera|Editar Obligación/i });

    // Tabs inside modal
    this.expenseTab = page.getByRole('button', { name: /Gasto Recurrente/i });
    this.debtTab = page.getByRole('button', { name: /Deuda Financiera/i });
    this.p2pTab = page.getByRole('button', { name: /Entre Personas/i });

    // Inputs
    this.categorySelect = page.getByRole('combobox');
    this.subcategoryInput = page.getByPlaceholder(/Enel, VTR|Banco Estado/i);
    this.monthlyAmountInput = page.getByPlaceholder('Ej. 29990');
    this.totalAmountInput = page.getByPlaceholder('Ej. 12000000');
    this.totalInstallmentsInput = page.locator('input[type="number"][max="600"]');
    this.dueDayInput = page.locator('input[type="number"][max="31"]');
    this.startDateInput = page.locator('input[type="date"]');
    this.saveBtn = page.getByRole('button', { name: /Guardar Obligación|Guardar Cambios/i });
    this.cancelBtn = page.getByRole('button', { name: 'Cancelar' });

    // P2P Specific locators
    this.p2pRoleLentBtn = page.getByRole('button', { name: /Presté mi tarjeta/i });
    this.p2pThirdPartyInput = page.getByPlaceholder(/Juan Pérez/i);
    this.p2pCardIssuerInput = page.getByPlaceholder(/CMR Falabella, Santander/i);
    this.p2pProductInput = page.getByPlaceholder(/Smart TV Samsung/i);
    this.p2pTotalAmountInput = page.getByPlaceholder('Ej. 839990');
    this.p2pBaseInstallmentInput = page.getByPlaceholder(/209998|45000/i);

    // Toolbar
    this.searchInput = page.getByPlaceholder('Buscar por nombre, detalle, tarjeta o persona...');
    this.filterAllBtn = page.getByRole('button', { name: /^Todos/i });
    this.filterExpenseBtn = page.getByRole('button', { name: /Gastos/i });
    this.filterDebtBtn = page.getByRole('button', { name: /Deudas/i });
    this.filterP2PBtn = page.getByRole('button', { name: /Terceros/i });

    // Metrics summary
    this.metricTotalObligations = page.locator('text=Total Obligaciones').locator('..');
    this.metricMonthlyCommitment = page.locator('text=Compromiso Mensual Total').locator('..');
    this.metricTotalDebtBalance = page.locator('text=Saldo Total Deudas').locator('..');
  }
}

