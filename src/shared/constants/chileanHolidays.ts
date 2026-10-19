/**
 * Official Chilean National Holidays (Feriados Nacionales de Chile).
 * Zero-backend, static lookup table covering 2025, 2026, and 2027.
 * Format: "YYYY-MM-DD"
 */
export const CHILEAN_HOLIDAYS: ReadonlySet<string> = new Set([
  // ─── 2025 ──────────────────────────────────────────
  "2025-01-01", // Año Nuevo
  "2025-04-18", // Viernes Santo
  "2025-04-19", // Sábado Santo
  "2025-05-01", // Día del Trabajador
  "2025-05-21", // Día de las Glorias Navales
  "2025-06-20", // Día Nacional de los Pueblos Indígenas
  "2025-06-29", // San Pedro y San Pablo
  "2025-07-16", // Día de la Virgen del Carmen
  "2025-08-15", // Asunción de la Virgen
  "2025-09-18", // Independencia Nacional
  "2025-09-19", // Día de las Glorias del Ejército
  "2025-10-12", // Encuentro de Dos Mundos
  "2025-10-31", // Día de las Iglesias Evangélicas y Protestantes
  "2025-11-01", // Día de Todos los Santos
  "2025-12-08", // Inmaculada Concepción
  "2025-12-25", // Navidad

  // ─── 2026 ──────────────────────────────────────────
  "2026-01-01", // Año Nuevo
  "2026-04-03", // Viernes Santo
  "2026-04-04", // Sábado Santo
  "2026-05-01", // Día del Trabajador
  "2026-05-21", // Día de las Glorias Navales
  "2026-06-24", // Día Nacional de los Pueblos Indígenas
  "2026-06-29", // San Pedro y San Pablo
  "2026-07-16", // Día de la Virgen del Carmen
  "2026-08-15", // Asunción de la Virgen
  "2026-09-18", // Independencia Nacional
  "2026-09-19", // Día de las Glorias del Ejército
  "2026-10-12", // Encuentro de Dos Mundos
  "2026-10-31", // Día de las Iglesias Evangélicas
  "2026-11-01", // Día de Todos los Santos
  "2026-12-08", // Inmaculada Concepción
  "2026-12-25", // Navidad

  // ─── 2027 ──────────────────────────────────────────
  "2027-01-01", // Año Nuevo
  "2027-03-26", // Viernes Santo
  "2027-03-27", // Sábado Santo
  "2027-05-01", // Día del Trabajador
  "2027-05-21", // Día de las Glorias Navales
  "2027-06-21", // Día Nacional de los Pueblos Indígenas
  "2027-06-29", // San Pedro y San Pablo
  "2027-07-16", // Día de la Virgen del Carmen
  "2027-08-15", // Asunción de la Virgen
  "2027-09-18", // Independencia Nacional
  "2027-09-19", // Día de las Glorias del Ejército
  "2027-10-12", // Encuentro de Dos Mundos
  "2027-10-31", // Día de las Iglesias Evangélicas
  "2027-11-01", // Día de Todos los Santos
  "2027-12-08", // Inmaculada Concepción
  "2027-12-25", // Navidad
])

/** Check if a date string YYYY-MM-DD is an official Chilean holiday */
export function isChileanHoliday(isoDate: string): boolean {
  return CHILEAN_HOLIDAYS.has(isoDate.slice(0, 10))
}
