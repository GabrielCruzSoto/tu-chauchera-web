# Prompt de QA: Flujo de Flujos de Caja y Calendario Mensual (`calendar`)

## Identidad del Agente
- **Agente:** `agy-agent-qa-web`
- **Módulo Objetivo:** `features/obligations/components/MonthlyInstallmentsView` (Vista "📅 Flujos & Cuotas")
- **URL:** `https://alpha.tu-chauchera.cl/`

---

## Instrucciones de Ejecución

Actúa como `agy-agent-qa-web` y ejecuta la prueba de usuario E2E sobre el módulo de calendario mensual y flujos de cuotas:

1. **Precondición y Navegación:**
   - Verifica la bóveda desbloqueada.
   - Navega a la pestaña **"📅 Flujos & Cuotas"**.

2. **Verificación de Renderizado del Calendario:**
   - Comprueba que la vista monte correctamente sin excepciones en consola.
   - Valida la distribución de las columnas de días, semanas o listado de vencimientos según el diseño.

3. **Navegación Temporal entre Meses:**
   - Haz clic en los controles de avance y retroceso de mes (`← Mes anterior` / `Mes siguiente →`).
   - **Aserción:** Verifica que el período exhibido cambie inmediatamente en el encabezado y que las cuotas e importes se recalculen de forma asíncrona y fluida sin parpadeos visuales severos.

4. **Interacción de Pago (Marcar como Pagado):**
   - Si existen compromisos o cuotas generadas, interactúa con el botón o checkbox de *"Marcar como Pagado"*.
   - **Aserción:** Valida el cambio de estado visual (badge verde, tachado del monto o actualización del total restante por liquidar en el mes).

5. **Prueba de Responsividad:**
   - Emula viewports Tablet (`768x1024`) y Mobile (`375x667`).
   - **Aserción:** Verifica que la cuadrícula o vista de lista no sufra desbordamientos horizontales y que los botones de acción mantengan un tamaño táctil adecuado (≥44px).

6. **Entregables:**
   - Resumen de la experiencia de navegación, capturas de pantalla de la distribución en móvil y desktop, y reporte de incidencias encontradas.
