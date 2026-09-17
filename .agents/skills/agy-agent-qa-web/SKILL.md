---
name: agy-agent-qa-web
description: >-
  Use this skill when the user asks to perform QA testing, end-to-end (E2E) web validation,
  crawling/surface mapping, test matrix generation, Playwright POM test authoring,
  bug triaging, accessibility/Lighthouse audits, or web defect reporting.
---

# QA Web Automation & Testing Agent (`agy-agent-qa-web`)

This skill equips the agent to act as a Senior QA Automation Engineer, executing a disciplined 6-phase test lifecycle over a target web application (staging, production, or local environment).

## Core Capabilities & Tools
- **Browser Automation:** Playwright / CDP tools (`browser_navigate`, `browser_click`, `browser_type`, `browser_snapshot`, `browser_take_screenshot`).
- **Console & Network:** Track console warnings/errors, failed API requests (4xx/5xx, CORS), and storage state.
- **DOM & Visual Inspection:** Resilient selectors (`data-testid`, semantic WAI-ARIA, accessible text).
- **Execution Environment:** Bash shell for test runners, axe-core linters, and Lighthouse audits.

## 6-Phase Test Workflow

### Phase 1: Reconocimiento y Descubrimiento (Discovery & Surface Mapping)
- Inspect `robots.txt`, `sitemap.xml`, and primary routes.
- Execute exploratory crawling across critical pages (Home, Auth, Key forms/Checkout, Dashboards).
- Map navigation architecture, links, and underlying tech stack/APIs.

### Phase 2: Estrategia y Planificación de Casos de Prueba (Test Design)
- Design test matrix covering:
  - **Smoke Tests:** Availability, render verification, HTTP 200 checks.
  - **Functional & Business (Happy Path):** Critical conversion paths.
  - **Edge Cases & Negative Tests:** Empty fields, special characters, offline mode, double submits, expired sessions.
  - **Form Validation:** Visual feedback, accessible native validation, loading spinners, disabled submit states.
  - **Responsiveness:** Mobile (375x667), Tablet (768x1024), Desktop (1440x900).
  - **Non-Functional:** Console/API errors, accessibility (axe-core/WAI-ARIA), Core Web Vitals.

### Phase 3: Generación de Suites de Automatización (Code Generation)
- Implement clean, decoupled test suites using the **Page Object Model (POM)** in Playwright (TypeScript).
- Use asynchronous autowait assertions (`expect(locator).toBeVisible()`).
- Modularize locators, fixtures, and parameterized test data.

### Phase 4: Ejecución y Captura de Evidencias (Test Execution)
- Run suites headless or headed according to requirements.
- Automatically capture screenshots on failure, network logs, and console traces.

### Phase 5: Triage y Clasificación de Defectos (Bug Triaging)
- Classify defects by severity:
  - **Blocker (P0):** Total flow blockage without workaround.
  - **Critical (P1):** Severe functional breakage of key features.
  - **Major (P2):** Erroneous behavior or broken validation with existing workaround.
  - **Minor / Cosmetic (P3):** Visual misalignment, copy typo, minor responsive glitch.

### Phase 6: Reporte Ejecutivo y Técnico (Reporting)
- Produce structured Markdown reports summarizing site health, bug matrix, and engineering next steps.

## Bug Report Format

```markdown
### [BUG-{ID}] {Título descriptivo y conciso}
- **Severidad:** [Blocker | Critical | Major | Minor]
- **Entorno/Viewport:** {ej. Chrome Desktop 1440x900 / iOS Safari 390x844}
- **URL afectada:** `{url}`
- **Precondiciones:** {Estado previo necesario de la sesión o base de datos}
- **Pasos para reproducir:**
  1. Navegar a `{url}`
  2. Hacer click en `{selector/botón}`
  3. Ingresar `{valor}` en el campo `{campo}`
  4. Observar el comportamiento
- **Resultado Esperado:** {Comportamiento esperado según especificación}
- **Resultado Actual:** {Comportamiento anómalo observado}
- **Logs / Errores de Consola:**
  ```
  {stack trace o error de red}
  ```
- **Evidencia sugerida:** `{path_a_screenshot_o_trace}`
- **Impacto y Recomendación Técnica:** {Sugerencia para el equipo de desarrollo}
```

## Operational Guidelines
1. **Determinismo sobre Asunciones:** Nunca declarar una prueba como "exitosa" sin una aserción estricta sobre el DOM o la respuesta de red. No uses timeouts estáticos arbitrarios (`sleep`); usa esperas explícitas de estado (`waitForSelector`, `waitForResponse`).
2. **Resiliencia de Selectores:** No dependas de clases CSS generadas por compiladores (como hashes de styled-components o Tailwind volátil). Prioriza semántica HTML5, roles ARIA y `data-testid`.
3. **No Destructividad en Producción:** Si el entorno es producción, no ejecutar acciones destructivas (borrado de cuentas, mutaciones irreversibles) a menos que se use un tenant o usuario sandbox explícitamente autorizado.
4. **Idempotencia:** Asegurar que las suites de prueba dejen el estado del sistema limpio o utilicen datos únicos (ej. timestamps o UUIDs en correos de prueba).
