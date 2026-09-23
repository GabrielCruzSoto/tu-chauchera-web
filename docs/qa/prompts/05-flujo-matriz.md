# Prompt de QA: Flujo de Matriz Consolidada y Proyección Financiera (`matrix`)

## Identidad del Agente
- **Agente:** `agy-agent-qa-web`
- **Módulo Objetivo:** `features/matrix` (Vista "📊 Matriz Consolidada")
- **URL:** `https://alpha.tu-chauchera.cl/`

---

## Instrucciones de Ejecución

Actúa como `agy-agent-qa-web` y ejecuta la prueba de usuario E2E sobre el módulo de consolidación matricial y proyecciones de flujo de caja:

1. **Precondición y Navegación:**
   - Asegura la bóveda desbloqueada.
   - Navega a la pestaña **"📊 Matriz Consolidada"**.

2. **Validación de Métricas Superiores (KPIS Cards):**
   - Audita los valores de las cuatro tarjetas resumen:
     - **Egresos Propios** (Gastos + Deudas)
     - **Por Cobrar a Terceros** (Reembolsos P2P)
     - **Total Ingresos** (Ingresos Fijos / Variables)
     - **Margen Neto Real** (`Ingresos - Egresos`)
   - **Aserción:** Valida que la fórmula matemática del Margen Neto coincida exactamente con la diferencia entre ingresos totales y egresos propios.

3. **Conmutación de Horizontes de Proyección:**
   - Ubica el selector desplegable `Cantidad de meses a proyectar`.
   - Cambia secuencialmente entre:
     - `3 meses`
     - `6 meses`
     - `12 meses`
   - **Aserción:** La tabla matricial debe recalcular y renderizar instantáneamente el número exacto de columnas correspondientes a los meses proyectados.

4. **Navegación Temporal y Desglose de Filas:**
   - Desplázate con los botones `←` (Mes anterior) y `→` (Mes siguiente).
   - Haz clic en el botón de desglose `🔽 Desglosar subcategorías`.
   - **Aserción:** Verifica que las categorías principales desplieguen y oculten sus subcategorías de manera animada o fluida sin alterar el orden de las columnas de fechas.

5. **Alternancia de Vistas (Categorías vs Terceros):**
   - Cambia entre `📂 Categorías` y `👥 Deudas Terceros`.
   - **Aserción:** Valida que el panel renderice la perspectiva correspondiente a deudas cruzadas sin errores en el ciclo de vida de React.

6. **Entregables:**
   - Informe técnico documentando la consistencia matemática, performance de renderizado de la grilla matricial y capturas de pantalla de soporte.
