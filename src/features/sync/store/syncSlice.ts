/**
 * Zustand Slice for Global Synchronization state and Drive orchestration.
 */
import { create } from 'zustand'
import type {
  SyncStatus,
  DataDomain,
  SyncableDomain,
  ObligationsStore,
  IncomesStore,
  CategoriesStore,
  CreditCardsStore,
  PreferencesStore,
} from '@/shared/types/domain'
import { DriveClient } from '@/shared/services/driveClient'
import { SyncService } from '@/shared/services/syncService'
import { useAuthStore } from '@/store/authSlice'
import { useObligationsStore } from '@/features/obligations/store/obligationsSlice'
import { useIncomeStore } from '@/features/income/store/incomeSlice'
import { useCreditCardStore } from '@/features/credit-cards/store/creditCardSlice'
import { useSettingsStore } from '@/features/settings/store/settingsSlice'
import { decryptData } from '@/shared/utils/crypto'
import { migrateDomainPayload, wrapDomainEnvelope } from '@/shared/migrations/migrate'
import { isDriveStorageQuotaError } from '@/shared/services/driveErrors'

export interface SyncState {
  status: SyncStatus
  lastSyncedAt: string | null
  pendingMutations: number
  errorMessage: string | null
  isOnline: boolean
  isQuotaExceeded: boolean

  // Actions
  setStatus: (status: SyncStatus, error?: unknown) => void
  setOnlineStatus: (isOnline: boolean) => void
  setQuotaExceeded: (val: boolean) => void
  dismissQuotaModal: () => void
  queueSyncDomain: (domain: SyncableDomain) => void
  forceResync: () => Promise<void>
  hydrateFromDrive: () => Promise<void>
  resetSync: () => void
}

let syncServiceInstance: SyncService | null = null

export function getSyncService(): SyncService | null {
  return syncServiceInstance
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'SYNCED',
  lastSyncedAt: null,
  pendingMutations: 0,
  errorMessage: null,
  isOnline: navigator.onLine,
  isQuotaExceeded: false,

  setStatus: (status, error = null) => {
    const isQuota = isDriveStorageQuotaError(error)
    const errorMsg =
      typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : error
            ? String(error)
            : null

    set({
      status,
      errorMessage: errorMsg,
      isQuotaExceeded: isQuota ? true : status === 'SYNCED' ? false : get().isQuotaExceeded,
      lastSyncedAt: status === 'SYNCED' ? new Date().toISOString() : get().lastSyncedAt,
      pendingMutations: syncServiceInstance ? syncServiceInstance.getPendingCount() : 0,
    })
  },

  setQuotaExceeded: (val: boolean) => {
    set({ isQuotaExceeded: val })
  },

  dismissQuotaModal: () => {
    set({ isQuotaExceeded: false })
  },

  setOnlineStatus: isOnline => {
    set({
      isOnline,
      status: isOnline ? (get().pendingMutations > 0 ? 'PENDING' : 'SYNCED') : 'OFFLINE',
    })
  },

  queueSyncDomain: domain => {
    if ((domain as DataDomain) === 'settings') {
      console.error(
        'Refusing to queue "settings" domain in syncSlice: settings.enc is reserved for master password sentinel',
      )
      return
    }

    if (!syncServiceInstance) {
      const auth = useAuthStore.getState()
      if (!auth.accessToken) return

      const driveClient = new DriveClient(() => useAuthStore.getState().accessToken)
      syncServiceInstance = new SyncService(driveClient, {
        getCryptoKey: () => useAuthStore.getState().cryptoKey,
        getDomainData: d => {
          if (d === 'obligations') {
            const state = useObligationsStore.getState()
            const payload: ObligationsStore = {
              obligations: state.obligations,
              installments: state.installments,
            }
            return wrapDomainEnvelope('obligations', payload)
          }
          if (d === 'categories') {
            const state = useObligationsStore.getState()
            const payload: CategoriesStore = {
              categories: state.categories,
            }
            return wrapDomainEnvelope('categories', payload)
          }
          if (d === 'incomes') {
            const state = useIncomeStore.getState()
            const payload: IncomesStore = {
              incomes: state.incomes,
            }
            return wrapDomainEnvelope('incomes', payload)
          }
          if (d === 'credit_cards') {
            const state = useCreditCardStore.getState()
            const payload: CreditCardsStore = {
              accounts: state.accounts,
              purchases: state.purchases,
            }
            return wrapDomainEnvelope('credit_cards', payload)
          }
          if (d === 'preferences') {
            const state = useSettingsStore.getState()
            const payload: PreferencesStore = {
              preferences: state.preferences,
            }
            return wrapDomainEnvelope('preferences', payload)
          }
          return null
        },
        setDomainData: () => {},
        onSyncStatusChange: (status, error) => {
          get().setStatus(status, error)
        },
      })
    }

    syncServiceInstance.queueWrite(domain)
    set({ pendingMutations: syncServiceInstance.getPendingCount() })
  },

  forceResync: async () => {
    if (!syncServiceInstance) return
    await syncServiceInstance.forceSync()
  },

  hydrateFromDrive: async () => {
    const auth = useAuthStore.getState()
    const { accessToken, cryptoKey } = auth
    if (!accessToken || !cryptoKey) return

    get().setStatus('SYNCING')
    const driveClient = new DriveClient(() => accessToken)

    try {
      // 1. Obligations & Installments
      const oblBuffer = await driveClient.readDomain('obligations')
      if (oblBuffer) {
        const rawOblData = await decryptData<unknown>(cryptoKey, oblBuffer)
        const { data: oblData, wasMigrated } = migrateDomainPayload<ObligationsStore>(
          'obligations',
          rawOblData,
        )
        useObligationsStore.getState().setObligationsData(oblData)
        if (wasMigrated) {
          get().queueSyncDomain('obligations')
        }
      } else {
        useObligationsStore.getState().resetObligations()
      }

      // 2. Categories
      const catBuffer = await driveClient.readDomain('categories')
      if (catBuffer) {
        const rawCatData = await decryptData<unknown>(cryptoKey, catBuffer)
        const { data: catData, wasMigrated } = migrateDomainPayload<CategoriesStore>(
          'categories',
          catBuffer && rawCatData,
        )
        useObligationsStore.getState().setCategoriesData(catData)
        if (wasMigrated) {
          get().queueSyncDomain('categories')
        }
      }

      // 3. Incomes
      const incBuffer = await driveClient.readDomain('incomes')
      if (incBuffer) {
        const rawIncData = await decryptData<unknown>(cryptoKey, incBuffer)
        const { data: incData, wasMigrated } = migrateDomainPayload<IncomesStore>(
          'incomes',
          rawIncData,
        )
        useIncomeStore.getState().setIncomesData(incData)
        if (wasMigrated) {
          get().queueSyncDomain('incomes')
        }
      } else {
        useIncomeStore.getState().resetIncomes()
      }

      // 4. Credit Cards
      const ccBuffer = await driveClient.readDomain('credit_cards')
      if (ccBuffer) {
        const rawCcData = await decryptData<unknown>(cryptoKey, ccBuffer)
        const { data: ccData, wasMigrated } = migrateDomainPayload<CreditCardsStore>(
          'credit_cards',
          rawCcData,
        )
        useCreditCardStore.getState().setCreditCardsData(ccData)
        if (wasMigrated) {
          get().queueSyncDomain('credit_cards')
        }
      } else {
        useCreditCardStore.getState().resetCreditCards()
      }

      // 5. User Preferences (preferences.enc — isolated from settings.enc)
      const prefBuffer = await driveClient.readDomain('preferences')
      if (prefBuffer) {
        const rawPrefData = await decryptData<unknown>(cryptoKey, prefBuffer)
        const { data: prefData, wasMigrated } = migrateDomainPayload<PreferencesStore>(
          'preferences',
          rawPrefData,
        )
        useSettingsStore.getState().setPreferences(prefData.preferences)
        if (wasMigrated) {
          get().queueSyncDomain('preferences')
        }
      } else {
        useSettingsStore.getState().resetPreferences()
      }

      get().setStatus('SYNCED')
    } catch (err: unknown) {
      get().setStatus('ERROR', err)
    }
  },

  resetSync: () => {
    if (syncServiceInstance) {
      syncServiceInstance.cancel()
      syncServiceInstance = null
    }
    set({
      status: 'SYNCED',
      lastSyncedAt: null,
      pendingMutations: 0,
      errorMessage: null,
      isQuotaExceeded: false,
    })
  },
}))
