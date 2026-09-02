/**
 * Type-level smoke tests for domain.ts.
 * These tests verify that the domain types compile correctly
 * and that key structural constraints are met at runtime.
 */
import { describe, it, expect } from 'vitest'
import { toMoney } from './money'
import type {
  Obligation,
  Installment,
  Income,
  SyncMeta,
  DataDomain,
  ObligationsStore,
  SettingsStore,
} from './domain'

describe('Domain type structural tests', () => {
  it('Obligation has all required fields', () => {
    const obligation: Obligation = {
      id: 'uuid-1',
      categoryId: 'cat-1',
      subcategory: 'Banco Estado - Crédito',
      detail: 'Crédito hipotecario',
      totalAmountCents: toMoney(10_000_000),
      totalInstallments: 48,
      currentInstallment: 1,
      installmentAmountCents: toMoney(285_000),
      startDate: '2026-01-15',
      dueDay: 15,
      status: 'PENDING',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    }
    expect(obligation.id).toBe('uuid-1')
    expect(obligation.totalInstallments).toBe(48)
    expect(obligation.status).toBe('PENDING')
  })

  it('Installment has all required fields for eager generation', () => {
    const installment: Installment = {
      id: 'inst-uuid-1',
      obligationId: 'uuid-1',
      installmentNumber: 1,
      dueDate: '2026-01-15',
      amountCents: toMoney(285_000),
      status: 'PENDING',
    }
    expect(installment.obligationId).toBe('uuid-1')
    expect(installment.installmentNumber).toBe(1)
    expect(installment.status).toBe('PENDING')
  })

  it('Installment can be marked PAID with paidDate and period', () => {
    const installment: Installment = {
      id: 'inst-uuid-2',
      obligationId: 'uuid-1',
      installmentNumber: 2,
      dueDate: '2026-02-15',
      amountCents: toMoney(285_000),
      status: 'PAID',
      paidDate: '2026-02-12',
      period: '2026-02',
    }
    expect(installment.paidDate).toBe('2026-02-12')
    expect(installment.period).toBe('2026-02')
  })

  it('Income covers FIXED and VARIABLE types', () => {
    const fixed: Income = {
      id: 'inc-1',
      description: 'Sueldo',
      amountCents: toMoney(1_200_000),
      type: 'FIXED',
      period: '2026-08',
      createdAt: '2026-08-01',
    }
    const variable: Income = {
      id: 'inc-2',
      description: 'Honorario consultoría',
      amountCents: toMoney(300_000),
      type: 'VARIABLE',
      period: '2026-08',
      createdAt: '2026-08-15',
    }
    expect(fixed.type).toBe('FIXED')
    expect(variable.type).toBe('VARIABLE')
  })

  it('SyncMeta has version field for conflict detection', () => {
    const meta: SyncMeta = {
      version: 1,
      lastSyncedAt: '2026-08-31',
      driveFileIds: { obligations: 'drive-file-id-1' },
      pendingChanges: false,
      schemaVersion: '1.0.0',
    }
    expect(meta.version).toBe(1)
    expect(meta.schemaVersion).toBe('1.0.0')
  })

  it('DataDomain covers all expected domains', () => {
    const domains: DataDomain[] = ['obligations', 'incomes', 'categories', 'settings']
    expect(domains).toHaveLength(4)
  })

  it('ObligationsStore includes both obligations and installments', () => {
    const store: ObligationsStore = {
      obligations: {},
      installments: {},
      schemaVersion: '1.0.0',
    }
    expect(store.obligations).toBeDefined()
    expect(store.installments).toBeDefined()
    expect(store.schemaVersion).toBe('1.0.0')
  })

  it('SettingsStore has passwordSentinel field for AES key verification', () => {
    const settings: SettingsStore = {
      passwordSentinel: 'base64-encoded-sentinel-here',
      schemaVersion: '1.0.0',
      createdAt: '2026-08-31',
    }
    expect(settings.passwordSentinel).toBeDefined()
  })
})
