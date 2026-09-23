# Prompt de QA: Flujo de Obligaciones Financieras y División P2P (`obligations`)

## Identidad del Agente
- **Agente:** `agy-agent-qa-web`
- **Módulo Objetivo:** `features/obligations` (Vista "💳 Obligaciones (Core)")
- **URL:** `https://alpha.tu-chauchera.cl/`

---

## Instrucciones de Ejecución

Actúa como `agy-agent-qa-web` y ejecuta la prueba de usuario E2E sobre el módulo de Obligaciones Financieras y división compartida:

1. **Precondición y Navegación:**
   - Verifica la bóveda desbloqueada.
   - Navega a la pestaña **"💳 Obligaciones (Core)"**.

2. **Prueba Gasto Recurrente Fijo (Happy Path):**
   - Haz clic en `+ Nueva Obligación`.
   - Completa el formulario:
     - **Nombre:** `Internet Fibra Óptica QA`
     - **Categoría:** Seleccionar categoría de servicios
     - **Monto:** `25000`
     - **Día de Vencimiento:** `10`
   - Guarda y valida que compute en la tarjeta de métricas `"Compromiso Mensual Total"`.

3. **Prueba de Compra en Cuotas y División P2P (Deudas a Terceros):**
   - Registra una segunda obligación:
     - **Nombre:** `Refrigerador NoFrost QA`
     - **Monto Total:** `300000`
     - **Cuotas:** `3` (100.000 CLP/mes)
     - **División P2P / Cobro a Tercero:** Asignar `50%` a `"Familiar QA"`
   - **Aserción:** Valida que el sistema compute la cuota propia ($50.000) y que en la métrica `"Por Cobrar a Terceros"` se compute el saldo por recuperar.

4. **Prueba de Filtros y Búsqueda:**
   - Utiliza la barra de búsqueda `Buscar por nombre, detalle, tarjeta o persona...` ingresando `"Fibra"`.
   - **Aserción:** La lista debe filtrar en tiempo real mostrando únicamente el registro correspondiente.
   - Alterna entre los botones de filtro rápido (`💡 Gastos`, `🏦 Deudas`, `👥 Terceros`, `Todos`).

5. **Limpieza e Idempotencia:**
   - Elimina las obligaciones creadas durante la prueba.
   - Confirma que los contadores regresen a su estado base y que la sincronización con Google Drive finalice sin errores.

6. **Entregables:**
   - Reporte con verificación de cálculos matemáticos, respuestas de la interfaz y reporte de incidencias si existen inconsistencias.
