/**
 * Service to fetch economic indicators from mindicador.cl with in-memory & localStorage caching.
 */

export interface MindicadorItem {
  codigo: string
  nombre: string
  unidad_medida: string
  fecha: string
  valor: number
}

export interface MindicadorResponse {
  version: string
  autor: string
  fecha: string
  uf?: MindicadorItem
  ivp?: MindicadorItem
  dolar?: MindicadorItem
  dolar_intercambio?: MindicadorItem
  euro?: MindicadorItem
  ipc?: MindicadorItem
  utm?: MindicadorItem
  tpm?: MindicadorItem
  [key: string]: unknown
}

const CACHE_KEY = 'tc_mindicador_cache'
const CACHE_TTL_MS = 1000 * 60 * 60 * 2 // 2 hours

interface CachePayload {
  timestamp: number
  data: MindicadorResponse
}

let memoryCache: CachePayload | null = null

export const economicIndicatorService = {
  /**
   * Fetches latest indicators. Returns cached data if not expired.
   */
  async getIndicators(): Promise<MindicadorResponse | null> {
    const now = Date.now()

    if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
      return memoryCache.data
    }

    try {
      const stored = localStorage.getItem(CACHE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as CachePayload
        if (now - parsed.timestamp < CACHE_TTL_MS) {
          memoryCache = parsed
          return parsed.data
        }
      }
    } catch {
      // Ignore localStorage read errors
    }

    try {
      const res = await fetch('https://mindicador.cl/api')
      if (!res.ok) {
        throw new Error(`Error fetching indicators: ${res.statusText}`)
      }
      const data: MindicadorResponse = await res.json()
      const payload: CachePayload = { timestamp: now, data }
      memoryCache = payload
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
      } catch {
        // Storage might be full or private mode
      }
      return data
    } catch (err) {
      console.warn('[economicIndicatorService] Failed to fetch mindicador.cl:', err)
      // Return stale cache if available
      if (memoryCache) return memoryCache.data
      try {
        const stored = localStorage.getItem(CACHE_KEY)
        if (stored) {
          return (JSON.parse(stored) as CachePayload).data
        }
      } catch {
        // Ignore fallback errors
      }
      return null
    }
  },

  /**
   * Gets specific observed USD dollar exchange rate.
   */
  async getDolarObserved(): Promise<number | null> {
    const indicators = await this.getIndicators()
    return indicators?.dolar?.valor ?? null
  },

  /**
   * Gets specific UF value in CLP.
   */
  async getUfObserved(): Promise<number | null> {
    const indicators = await this.getIndicators()
    return indicators?.uf?.valor ?? null
  },
}
