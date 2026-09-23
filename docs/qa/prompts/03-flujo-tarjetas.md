# Prompt de QA: Flujo de Tarjetas de Crédito y Carga de Estados de Cuenta (`cards`)

## Identidad del Agente
- **Agente:** `agy-agent-qa-web`
- **Módulo Objetivo:** `features/credit-cards` (Vista "💳 Tarjetas")
- **URL:** `https://alpha.tu-chauchera.cl/`

---

## Instrucciones de Ejecución

Actúa como `agy-agent-qa-web` y ejecuta la prueba de usuario E2E sobre el módulo de administración de tarjetas de crédito y carga de estados de cuenta:

1. **Precondición y Navegación:**
   - Verifica la bóveda desbloqueada.
   - Navega a la pestaña **"💳 Tarjetas"**.

2. **Creación de Tarjeta de Crédito (Happy Path):**
   - Haz clic en el botón para agregar una nueva tarjeta de crédito.
   - Completa el formulario modal:
     - **Emisor / Banco:** `Banco de Chile QA`
     - **Nombre de Tarjeta:** `Visa Signature QA`
     - **Cupo Total (CLP):** `2000000`
     - **Día de Cierre / Facturación:** `20`
     - **Día de Pago / Vencimiento:** `05`
   - Guarda el formulario.
   - **Aserción:** Valida que la tarjeta se agregue a la galería visual con sus datos de cupo, días de ciclo y opciones de menú disponibles.

3. **Prueba de Resiliencia del Importador de Estados de Cuenta (PDF Parsing):**
   - Localiza la zona de carga (dropzone) de estados de cuenta PDF para la tarjeta.
   - Intenta arrastrar o seleccionar un archivo inválido (ej. un `.txt` o imagen con nombre alterado).
   - **Aserción:** Valida que la aplicación rechace el archivo con un mensaje de validación amigable y que no se produzcan bloqueos ni crashes en el motor de renderizado de React.

4. **Limpieza e Idempotencia:**
   - Elimina la tarjeta de crédito de prueba creada.
   - Confirma que la interfaz vuelva al estado vacío inicial ("No tienes tarjetas registradas" o equivalente).

5. **Entregables:**
   - Informe técnico documentando el comportamiento del parser, llamadas de red y logs de consola.
