import { useAuthStore, registerLogoutListener } from "./authSlice"
import { useObligationsStore } from "@/features/obligations/store/obligationsSlice"
import { useIncomeStore } from "@/features/income/store/incomeSlice"
import { useCreditCardStore } from "@/features/credit-cards/store/creditCardSlice"
import { useSettingsStore } from "@/features/settings/store/settingsSlice"
import { useSyncStore } from "@/features/sync/store/syncSlice"

/**
 * Purges all in-memory domain stores and cancels any pending sync timers.
 */
export function purgeDomainStores(): void {
  useSyncStore.getState().resetSync()
  useCreditCardStore.getState().resetCreditCards()
  useObligationsStore.getState().resetObligations()
  useIncomeStore.getState().resetIncomes()
  useSettingsStore.getState().resetPreferences()
}

// Automatically purge all in-memory domain stores when logging out or locking vault
registerLogoutListener(purgeDomainStores)

/**
 * Resets all domain stores and logs out of the session.
 */
export function resetAllAppData(): void {
  purgeDomainStores()
  useAuthStore.getState().logout()
}
