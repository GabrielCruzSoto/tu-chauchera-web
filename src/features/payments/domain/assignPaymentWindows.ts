import type { PaymentItem, PaymentWindow } from "./types"

/**
 * Partitions calendar payment items into intuitive payment windows (Ventanas de Pago).
 *
 * Chilean/LatAm Personal Finance Standard Archetype:
 * - Window 1: "Ventana Fin/Inicio de Mes (Cobro Sueldo)" -> Días 25 al 5.
 *   Covers month-end credit payments, mortgages, credit card bills due on 1st-5th, rent, basic utilities.
 *   These MUST be paid or earmarked the moment salary arrives.
 *
 * - Window 2: "Ventana Quincena" -> Días 6 al 24.
 *   Covers mid-month car loans, educational fees, credit cards due on 10th-15th.
 *   Earmarked from salary or paid with biweekly advance (anticipo).
 */
export function assignPaymentWindows(items: PaymentItem[]): PaymentWindow[] {
  const window1Items: PaymentItem[] = []
  const window2Items: PaymentItem[] = []

  for (const item of items) {
    // If due day is 25-31 or 1-5, belongs to Month-End/Start Salary Window
    if (item.dueDay >= 25 || item.dueDay <= 5) {
      window1Items.push(item)
    } else {
      window2Items.push(item)
    }
  }

  // Calculate aggregations helper
  const summarizeWindow = (
    id: string,
    name: string,
    description: string,
    startDay: number,
    endDay: number,
    windowItems: PaymentItem[]
  ): PaymentWindow => {
    let totalAmountCents = 0
    let totalPendingCents = 0
    let totalPaidCents = 0

    for (const item of windowItems) {
      totalAmountCents += item.amountCents
      if (item.isPaid) {
        totalPaidCents += item.amountCents
      } else {
        totalPendingCents += item.amountCents
      }
    }

    return {
      id,
      name,
      description,
      startDay,
      endDay,
      items: windowItems.sort((a, b) => {
        // Sort items so end-of-month (25-31) come first if in window 1, then 1-5
        const normA = a.dueDay >= 25 ? a.dueDay - 32 : a.dueDay
        const normB = b.dueDay >= 25 ? b.dueDay - 32 : b.dueDay
        return normA - normB
      }),
      totalAmountCents,
      totalPendingCents,
      totalPaidCents,
    }
  }

  return [
    summarizeWindow(
      "window-salary-month-end",
      "Ventana Sueldo / Fin e Inicio de Mes",
      "Vencimientos entre el día 25 y el 5. Se pagan o reservan inmediatamente al recibir el sueldo.",
      25,
      5,
      window1Items
    ),
    summarizeWindow(
      "window-mid-month",
      "Ventana Quincenal / Mitad de Mes",
      "Vencimientos entre el día 6 y el 24. Fondos que deben separarse el día de cobro para evitar gastarlos.",
      6,
      24,
      window2Items
    ),
  ]
}
