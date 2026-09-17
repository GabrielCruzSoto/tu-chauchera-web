# Product Proposal: import-credit-card-statement-falabella

## Change Name
`import-credit-card-statement-falabella`

## Problem Statement
Ingresar manualmente cada compra del resumen mensual de una tarjeta de crédito es tedioso y propenso a errores humanos, especialmente para usuarios que tienen compras en cuotas o prestan su tarjeta a terceros.
Banco Falabella emite estados de cuenta en PDF que contienen toda la información estructurada: fecha de corte, fecha de vencimiento, total facturado y líneas de detalle con comercio, monto y cuotas (ej. `03/12`).

## Target Users
- Usuarios de tarjetas CMR Falabella (Titular y con plásticos adicionales).
- Usuarios que prestan su tarjeta y necesitan conciliar rápidamente qué compras corresponden a cada tercero y cuáles son propias.

## Solution Overview
1. **Lector en Cliente Zero-Backend:**
   - Procesamiento del PDF directamente en el navegador del usuario utilizando `pdfjs-dist` o parser de texto local.
   - 100% privado: ningún dato bancario o personal sale del dispositivo del usuario.
2. **Extractor Especializado Falabella:**
   - Heurísticas y expresiones regulares adaptadas al formato oficial de CMR Falabella.
   - Extracción de metadata: Período facturado, fecha de vencimiento, total facturado.
   - Extracción de movimientos: Fecha, comercio/descripción, cuota actual, total de cuotas, monto facturado.
3. **Modal de Conciliación y Asignación:**
   - Tabla interactiva previa a la confirmación:
     - Selección de tarjeta de destino en Tu Chauchera.
     - Detección o selección de plástico emisor.
     - Toggle rápido por fila: `🙋‍♂️ Propio` vs `👥 Tercero`.
     - Campo de contacto para compras de terceros.
     - Checkbox para incluir o descartar líneas (excluir pagos anteriores o comisiones administrativas si ya están registradas).
4. **Guardado Masivo:**
   - Importación atómica a `CreditCardPurchase` y generación automática de cuentas por cobrar para terceros en `ThirdPartyReceivable`.

## Scope Boundaries
### In Scope
- Carga de archivo PDF de estado de cuenta CMR Falabella vía Drag & Drop o selector de archivos.
- Parser de texto y estructuración de transacciones en cuotas y contado.
- Modal de conciliación previa con edición de beneficiario/tercero.
- Guardado en el store de Zustand de tarjetas de crédito.

### Out of Scope
- Otros bancos en esta primera versión (se diseñará con patrón extensible para agregar Santander, Banco de Chile, etc. en fases futuras).
- Conexión directa con credenciales bancarias (Open Banking / scraping con clave web).

## Success Criteria
- El usuario puede subir su PDF oficial de CMR Falabella y ver en pantalla la lista de compras del mes con sus cuotas y montos.
- Puede categorizar compras como de terceros antes de guardar.
- Al confirmar, todas las compras se registran en la tarjeta correspondiente sin errores.
