# Technical Specification: import-credit-card-statement-falabella

## 1. Data Contracts

### 1.1 Parsed Statement Result
```typescript
export interface ParsedStatementTransaction {
  id: string
  date: string                  // YYYY-MM-DD
  description: string
  currentInstallment: number    // e.g., 3
  totalInstallments: number      // e.g., 12 (or 1 for single payment)
  amountCents: Money
  suggestedPlasticLastFour?: string | undefined
  isThirdParty: boolean
  thirdPartyName?: string | undefined
  selected: boolean             // Included in import
}

export interface ParsedStatementMetadata {
  institution: 'BANCO_FALABELLA'
  closingDate?: string | undefined
  dueDate?: string | undefined
  totalBilledCents?: Money | undefined
  minimumPaymentCents?: Money | undefined
  transactions: ParsedStatementTransaction[]
}
```

## 2. Parser Logic (`falabellaParser.ts`)
- **Limpieza y normalización de texto:** Divide el texto extraído en líneas limpias.
- **Detección de montos:** Remueve signos `$`, puntos de miles y castea a entero `toMoney()`.
- **Detección de cuotas:** Expresión regular `(\d{1,2})\/(\d{1,2})` para identificar cuota actual y cuotas totales (ej. `01/03`, `05/12`). Si no contiene cuotas explícitas, se asigna `1/1`.
- **Detección de fechas:** Mapeo de formatos comunes `DD/MM/YYYY` o `DD-MM-YYYY` a `YYYY-MM-DD`.

## 3. UI Component (`StatementImportModal.tsx`)
- Área de Drag & Drop para archivo PDF o texto pegado de la cartola.
- Tabla interactiva para:
  - Seleccionar tarjeta de destino de la app.
  - Editar descripción, monto o marcar como Tercero.
  - Botón "Importar X transacciones seleccionadas".
