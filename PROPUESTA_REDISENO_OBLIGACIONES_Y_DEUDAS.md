# 📋 Propuesta de Rediseño Integral: Gestión de Obligaciones, Gastos y Deudas

## 1. Resumen Ejecutivo y Diagnóstico

Actualmente, el módulo de **Obligaciones** en **Tu Chauchera Web** gestiona todos los egresos bajo una estructura única basada en créditos financieros tradicionales (*Total de cuotas*, *Monto total adeudado*, *Cuota periódica*). 

Este enfoque presenta tres problemas fundamentales:
1. **Inadecuado para Gastos Recurrentes:** Obliga a inventar montos totales o número de cuotas para gastos corrientes que son indefinidos o anuales (ej. cuentas básicas, arriendos, suscripciones como Netflix o Spotify).
2. **Invisibilidad de Deudas Informales / P2P:** No contempla préstamos directos entre familiares, amigos o colegas.
3. **Falta de soporte para Tarjetas Compartidas y Traspaso de Costos:** No permite registrar cuando un usuario presta su tarjeta de crédito personal para que un tercero compre un producto en cuotas, omitiendo el control de cuotas cobrables y el traspaso de costos operacionales (mantención de tarjeta, comisiones e impuestos).

---

## 2. Los Tres Pilares de Egresos y Compromisos

```
                              ┌───────────────────────────────────┐
                              │    Compromisos Financieros        │
                              └─────────────────┬─────────────────┘
                                                │
         ┌──────────────────────────────┬───────┴──────────────────────┬──────────────────────────────┐
         ▼                              ▼                              ▼                              ▼
┌──────────────────┐          ┌───────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│ 💡 Gastos        │          │ 🏦 Deudas         │          │ 💳 Tarjeta       │          │ 🤝 Préstamos     │
│    Recurrentes   │          │    Financieras    │          │    Prestada      │          │    Directos P2P  │
│ (Luz, Arriendo,  │          │ (Consumo, Hipotec,│          │ (Compra p/tercero│          │ (Efectivo/transf │
│  Suscripciones)  │          │  Automotriz, TC)  │          │  + mantención)   │          │  a/de terceros)  │
└──────────────────┘          └───────────────────┘          └──────────────────┘          └──────────────────┘
```

---

## 3. Especificación Detallada por Módulo / Pestaña

### A. 💡 Gastos Recurrentes (Costo de Vida y Servicios)
Pensado para compromisos periódicos sin capital amortizable.

* **Campos del Formulario:**
  - **Categoría:** Selector (ej. *Servicios Básicos*, *Hogar*, *Suscripciones*, *Educación*).
  - **Nombre del Proveedor / Servicio:** Texto (ej. *Enel Luz*, *VTR Internet*, *Netflix*).
  - **Monto Periódico:** Valor en CLP (fijo o estimado promedio).
  - **Frecuencia:** Mensual, Bimestral, Trimestral, Anual.
  - **Vigencia:**
    - `Indefinido / Permanente` (sin fecha de término predefinida).
    - `Plazo Fijo` (opcional: ej. contrato de arriendo por 12 meses).
  - **Día de Vencimiento:** Día del mes (1–31).
* **Impacto en el Sistema:**
  - Se proyecta mensualmente en la Matriz Financiera.
  - No muestra barras de progreso de cuotas ni suma al "Pasivo Total de Deuda Amortizable".

---

### B. 🏦 Deudas Financieras e Institucionales
Pensado para créditos bancarios formales y compras con tarjeta de crédito propia.

* **Campos del Formulario:**
  - **Institución Acreedora:** Selector/Texto (ej. *Banco Estado*, *Banco de Chile*, *CMR Falabella*, *Líder BCI*).
  - **Tipo de Crédito:** Consumo, Hipotecario, Automotriz, Tarjeta de Crédito en Cuotas, Línea de Sobregiro.
  - **Monto Total Financiado:** Capital + Intereses totales pactados.
  - **Monto Cuota:** Valor mensual en CLP.
  - **Esquema de Cuotas:** Total de cuotas (1–600) y Cuota actual al momento del registro (ej. cuota 5 de 36).
  - **Día de Vencimiento & Fecha de Inicio.**
  - *(Opcional):* Tasa de interés mensual, CAE (%), desglose de seguros obligatorios.
* **Impacto en el Sistema:**
  - Alimenta los KPIs de **Pasivo Total (Deuda Viva)** y **Fecha Estimada de Deuda Cero**.
  - Genera las cuotas por vencer en el calendario mensual con tracking de amortización.

---

### C. 👥 Cuentas y Deudas con Terceros (P2P y Tarjetas Compartidas)

#### 1. 💳 Caso Principal: "Presté mi Tarjeta de Crédito a un Tercero"
Ocurre cuando el titular compra un producto con su tarjeta para otra persona (ej. hermano, amigo).

* **Campos del Formulario:**
  - **¿Quién te debe?:** Nombre de la persona (ej. *Juan Pérez*).
  - **¿Qué tarjeta usaste?:** Identificador de la tarjeta (ej. *CMR Falabella Titular*).
  - **Producto / Concepto:** Ej. *iPhone 15 en 12 cuotas*.
  - **Cuota pura del producto:** Ej. *$45.000 / mes*.
  - **Total de cuotas & Cuota actual:** Ej. 12 cuotas, iniciando en cuota 1.
  - **Día de Cobro Acordado:** Día del mes para que la persona transfiera (idealmente anterior al vencimiento de la tarjeta).

* **⚙️ Traspaso de Costos y Recargos Operacionales:**
  - **Mantención mensual de la tarjeta:**
    - *100% al tercero:* Se suma el costo completo (ej. +$3.990/mes).
    - *Compartida (50/50 o proporcional):* Se divide el costo entre los usuarios de la tarjeta.
    - *Monto fijo personalizado.*
  - **Comisiones e Impuestos bancarios (Impuesto de Timbres y Estampillas / ITE):**
    - *Prorrateado en las cuotas:* Se divide el ITE total entre las N cuotas (ej. +$500/mes).
    - *Cobrado en la primera cuota:* Cuota 1 absorbe todo el impuesto.
  - **Cálculo Automático del Cobro Mensual:**
    $$\text{Cobro Mensual} = \text{Cuota Producto} + \text{Mantención Traspasada} + \text{Comisión Prorrateada}$$

* **Comportamiento en Flujo de Caja:**
  - **Egreso en Tarjeta:** La cuota se descuenta en la fecha de vencimiento del banco.
  - **Ingreso Esperado / Reembolso:** Se genera una cuenta por cobrar a nombre de la persona en el día acordado.
  - **Balance Neto:** Neutro ($0) si paga a tiempo, pero visible en la utilización de cupo.

---

#### 2. 🛍️ Caso: "Usé la Tarjeta de Crédito de otra Persona"
Ocurre cuando un tercero compra algo para ti con su tarjeta.

* **Campos:**
  - **Acreedor:** Persona a quien debes pagarle.
  - **Tarjeta de origen:** Ej. *Banco de Chile de mi papá*.
  - **Monto de cuota acordada + recargo de mantención que te corresponde aportar.**
  - **Fecha de pago pactada.**

---

#### 3. 🤝 Caso: "Préstamos Directos (Efectivo / Transferencia)"
* **Dirección:** *Le presté a alguien* (Activo/Cobro) o *Me prestaron* (Pasivo/Pago).
* **Modalidad:** Pago único con fecha límite, o devolución en N cuotas sin interés bancario.

---

## 4. Diseño del Modelo de Datos (Extensión de `domain.ts`)

```typescript
export type ObligationType = 'EXPENSE' | 'DEBT' | 'P2P_DEBT'

export type P2PRole = 
  | 'LENT_MY_CARD'       // Presté mi tarjeta (alguien me debe)
  | 'USED_THEIR_CARD'     // Usé la tarjeta de alguien (yo le debo)
  | 'DIRECT_LOAN_GIVEN'   // Presté plata directa
  | 'DIRECT_LOAN_TAKEN'   // Me prestaron plata directa

export interface CardFeeSurcharge {
  includeMaintenanceFee: boolean
  maintenanceFeeAmountCents?: Money
  maintenanceSplitMode?: 'FULL' | 'SPLIT_50_50' | 'CUSTOM_AMOUNT'
  includeOneTimeCommission: boolean
  totalCommissionCents?: Money
  commissionCollectionMode?: 'SPREAD_ACROSS_INSTALLMENTS' | 'FIRST_INSTALLMENT_ONLY'
}

export interface P2PMetadata {
  role: P2PRole
  thirdPartyName: string
  cardIssuer?: string
  productDescription: string
  baseInstallmentAmountCents: Money
  surcharges?: CardFeeSurcharge
  totalMonthlyChargeCents: Money
  linkedPaymentDueDay?: number
}

export interface Obligation {
  id: UUID
  type?: ObligationType        // 'EXPENSE' | 'DEBT' | 'P2P_DEBT' (default: 'DEBT')
  categoryId: UUID
  subcategory: string          // Nombre / Institución / Proveedor
  detail: string               // Descripción
  
  totalAmountCents: Money
  installmentAmountCents: Money
  totalInstallments: number
  currentInstallment: number
  isRecurringIndefinite?: boolean
  
  p2pMetadata?: P2PMetadata

  startDate: ISODate
  dueDay: number
  status: ObligationStatus
  createdAt: ISODate
  updatedAt: ISODate
  renegotiatedFromId?: UUID
}
```

---

## 5. Visualización e Interacción en la UI

1. **Selector de Registro Adaptativo:** 
   Tabs claras e intuitivas en la parte superior de `ObligationFormModal.tsx` con transición suave de campos.
2. **Badges de Identificación en la Lista:**
   - 💡 `Gasto`: Badge azul/gris sin contador de cuotas.
   - 🏦 `Deuda`: Badge violeta/esmeralda con progreso `Cuota X/Y`.
   - 💳 `Tarjeta Prestada`: Badge naranja con avatar/nombre de la persona y monto a cobrar.
3. **Módulo de Cobros Mensuales ("¿Quién me debe este mes?"):**
   Filtro y listado rápido de transferencias pendientes por cobrar a terceros.
4. **Generador de Recordatorio / Mensaje de Cobro para WhatsApp:**
   Botón para copiar el desglose exacto (cuota + mantención + comisión) listo para enviar al tercero.
