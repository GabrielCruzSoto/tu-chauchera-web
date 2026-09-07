# Product Proposal: credit-cards-and-third-party-debts

## Change Name
`credit-cards-and-third-party-debts`

## Problem Statement
Actualmente, Tu Chauchera maneja deudas y compromisos P2P a nivel de obligaciones aisladas. Sin embargo, los usuarios que operan con tarjetas de crédito enfrentan desafíos que el modelo actual no cubre:
1. **Falta de entidad de Tarjeta de Crédito:** No existe el concepto de cuenta/tarjeta que centralice límite, día de corte (cierre) y día de pago (vencimiento).
2. **Tarjetas Adicionales invisibles:** No se puede desglosar qué compras fueron realizadas por el plástico titular y cuáles por un plástico adicional (pareja, hijos, familiares), a pesar de que el banco emite un único resumen consolidado.
3. **Manejo de compras prestadas a terceros:** Cuando se presta la tarjeta para una compra (al contado o en cuotas), registrarla como gasto distorsiona los gráficos y presupuestos personales del usuario. Debe tratarse como un activo por cobrar (activo circulante) sin inflar los gastos propios.
4. **Conciliación de resumen mensual y cobranzas parciales:** No hay un mecanismo claro para proyectar el resumen del mes próximo (según día de corte) ni para asentar los pagos/reintegros que los terceros realizan a una cuenta de destino (ej. transferencia a cuenta bancaria).

## Target Users
- Personas y familias que utilizan tarjetas de crédito para consumos propios y compras en cuotas.
- Usuarios que comparten o tienen plásticos adicionales emitidos a familiares o terceros.
- Personas que prestan su tarjeta de crédito o cupo a amigos/familiares y necesitan saber exactamente cuánto cobrarles antes del vencimiento del estado de cuenta.

## Business Problem & Value
1. **Auditoría y conciliación:** Conocer qué compras componen el total a pagar del resumen mensual, divididas por plástico.
2. **Salud financiera real:** No mezclar activos temporales (deuda a tu favor por préstamo de tarjeta) con consumos de vida personal.
3. **Previsibilidad de cobro:** Anticipar con exactitud el monto que cada tercero debe transferir antes del día de vencimiento de la tarjeta.

## Solution Overview
Implementar un módulo integral de **Tarjetas de Crédito y Cuentas por Cobrar**:
1. **Cuentas de Crédito y Plásticos:**
   - Entidad padre: `CreditCardAccount` (Institución, Nombre de la cuenta, límite de crédito, día de cierre del ciclo, día de vencimiento).
   - Sub-entidad: `CreditCardPlastic` (Plástico titular y adicionales: Nombre del portador, últimos 4 dígitos, tipo `TITULAR` | `ADICIONAL`).
2. **Registro de Consumos por Transacción:**
   - Monto total, número de cuotas, fecha de compra, comercio/detalle.
   - Vinculación al plástico emisor puntual.
   - Clasificación de propiedad: `PROPIO` vs `TERCERO` (con selector de contacto / beneficiario).
   - Cálculo automático de período/resumen asignado según día de corte (compras antes de fecha de corte entran en el resumen inmediato; posteriores pasan al siguiente período).
3. **Módulo de Cuentas por Cobrar y Reintegros:**
   - Vista consolidada de deudas de terceros por tarjeta y período.
   - Registro de cobros/reintegros parciales o totales con fecha, monto y cuenta de destino (Caja de Ahorro / Cuenta Corriente).
   - Estados: `PENDIENTE`, `COBRADO_PARCIAL`, `COBRADO_TOTAL`.
4. **Exclusión de Métricas Personales:**
   - Los consumos de terceros se excluyen de los reportes y KPIs de gastos del titular, mostrándose en el panel de Cobranzas y Pasivos por liquidar.

## Scope Boundaries

### In Scope
- CRUD de Cuentas de Tarjeta de Crédito y Plásticos (titulares y adicionales).
- Formulario de registro de compras con tarjeta vinculadas a plástico, cuotas y atribución (propio / tercero).
- Cálculo automático de resumen mensual proyectado basado en fecha de compra y día de cierre.
- Generación y seguimiento de Cuentas por Cobrar para compras asignadas a terceros.
- Registro de cobranzas (parciales/totales) recibidas por compras de terceros.
- Ajuste de reportes y dashboard para tratar compras de terceros como Activo por Cobrar y no como gasto propio.

### Out of Scope
- Scraping bancario automático o lectura automática de PDF de resúmenes (ingreso manual / guiado).
- Multi-moneda (se mantiene en CLP integer cents).
- Envío directo de emails bancarios (se mantiene WhatsApp / copiado de texto para cobranza).

## Technical Constraints & Standards
- Persistencia local-first cifrada (Google Drive appDataFolder) compatible con las migraciones de esquema existentes.
- Manejo monetario en enteros (`Money` branded type en centavos CLP).
- Git Flow y Conventional Commits con PRs < 800 líneas.
- Arquitectura desacoplada: types, slices de Zustand, hooks de proyección y componentes modulares.

## Success Criteria
- El usuario puede registrar una tarjeta con plástico titular y 1+ adicionales.
- Al cargar una compra, puede elegir el plástico emisor y marcar si es propia o de un tercero.
- Las compras antes del día de cierre entran en el mes actual y las posteriores al mes siguiente.
- Las compras de terceros no se suman a los gráficos de gastos personales y generan un saldo por cobrar rastreable con registro de abonos.
