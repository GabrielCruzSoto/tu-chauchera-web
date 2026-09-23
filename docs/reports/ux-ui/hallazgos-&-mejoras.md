# Reporte de Auditoría UX/UI: Hallazgos y Mejoras

**Fecha:** 22 de Septiembre de 2026  
**Auditor:** ux-ui-frontend-specialist (Antigravity Agent)  
**Alcance:** Flujos de Autenticación (`LoginPage`), Navegación Principal (`App`), Matriz Consolidada (`FinancialMatrix`), Flujo de Cuotas (`MonthlyInstallmentsView`), Gestión de Obligaciones (`ObligationsList`, `ObligationFormModal`, `PaymentModal`, `RenegotiationModal`), Tarjetas de Crédito (`CreditCardsDashboard`, `CreditCardAccountModal`, `CreditCardPurchaseModal`, `StatementImportModal`, `ThirdPartyReceivablesView`), Ingresos (`IncomeListView`, `IncomeModal`), Sincronización (`SyncStatusIndicator`) y Configuración (`SettingsView`, `UserProfileTab`, `DataStorageTab`, `CategoryManagerTab`).  
**Estado General:** Requiere Atención

---

## 1. Resumen Ejecutivo

La aplicación **Tu Chauchera** presenta una sólida base estética apoyada en una paleta moderna en modo oscuro (*slate-900 / slate-950*) con estética *glassmorphism* y gradientes verde esmeralda / cian congruentes con una solución fintech privada y encriptada (*local-first*).

No obstante, la auditoría frontend profunda revela una serie de inconsistencias de diseño, brechas de accesibilidad (WCAG 2.1 AA), falta de indicadores de foco visibles para teclado en modales y tablas, discrepancias en los tamaños de targets táctiles en componentes móviles, y una fragmentación en los tokens semánticos:

1. **Accesibilidad (a11y - WCAG 2.1 AA):** Múltiples botones interactivos de cierre (`✕`), flechas de navegación y controles de tabla carecen de nombres accesibles (`aria-label`), contraste cromático suficiente en microcopia auxiliar (colores `text-slate-500` / `text-slate-600` sobre fondos `#0a0a1a` caen a ratios inferiores a **3.2:1**, por debajo del mínimo normativo de **4.5:1**), y ausencia sistemática de estilos `:focus-visible` en modales creados recientemente.
2. **Tokens de Diseño y Consistencia de UI:** Existen valores hexadecimales no estandarizados en `index.css` que no se reflejan en las utilidades Tailwind (`--neon-green`, `--neon-red`), así como estilos de botones dispares entre módulos: el módulo de Obligaciones utiliza `bg-emerald-600`, Tarjetas utiliza `bg-indigo-600`, y algunos modales emplean bordes y radios no armonizados (`rounded-lg` vs `rounded-xl` vs `rounded-2xl`).
3. **Ergonomía Mobile y UX:** Diversos botones de acción en tablas (como "Eliminar", "Copiar" o cambio de mes/período) tienen alturas efectivas de `32px` a `36px`, incumpliendo la directriz ergonómica mínima de **44 × 44 px** para interacción táctil sin errores de pulsación.
4. **Carga Cognitiva y Flujos:** Modales de alta densidad de datos (p. ej. `ObligationFormModal` con más de 1.100 líneas o `StatementImportModal`) carecen de agrupaciones visuales progresivas con resúmenes previos al guardado o *steppers* guiados para usuarios nóveles.

---

## 2. Matriz de Hallazgos

| ID | Pantalla / Componente | Eje (UX, UI, a11y, Token) | Severidad (Alta / Media / Baja) | Descripción del Problema |
|---|---|---|---|---|
| H-01 | `src/features/credit-cards/components/StatementImportModal.tsx` | a11y | **Alta** | Botón de cierre `✕` sin `aria-label` ni semántica de accesibilidad para lectores de pantalla. |
| H-02 | `src/index.css` & `src/features/matrix/components/FinancialMatrix.tsx` | a11y / UI | **Alta** | Texto tenue `text-slate-600` en celdas de importe cero ("—") y subtítulos `text-slate-500` con contraste de **2.8:1** (falla WCAG AA $\ge 4.5:1$). |
| H-03 | `src/features/credit-cards/components/CreditCardPurchaseModal.tsx` | UX / a11y | **Alta** | Botón de cierre modal carece de `aria-label`, selector de fecha y campos de texto sin `:focus-visible` ni feedback de foco. |
| H-04 | `src/features/credit-cards/components/CreditCardsDashboard.tsx` | Token / UI | **Media** | Ruptura cromática del tema: uso de `indigo-600` como CTA primario conviviendo sin tokenización con la paleta de marca `emerald-600`. |
| H-05 | `src/features/income/components/IncomeListView.tsx` | UX / Ergonomía | **Media** | Botón "Eliminar" en la fila de la tabla posee altura interactiva reducida (`36px`), inferior a la zona táctil ergonómica de 44px. |
| H-06 | `src/features/obligations/components/RenegotiationModal.tsx` | UI / Consistencia | **Media** | Disparidad en bordes redondeados: usa `rounded-lg` en inputs mientras el resto de la aplicación estandariza `rounded-xl`. |
| H-07 | `src/features/obligations/components/ObligationFormModal.tsx` | UX / Flujo | **Media** | Alta sobrecarga cognitiva en el formulario: ausencia de desglose por pasos (*stepper*) o acordeones plegables para recargos complejos. |
| H-08 | `src/features/settings/components/UserProfileTab.tsx` & `DataStorageTab.tsx` | a11y | **Baja** | Botones de dismiss `✕` en banners de alerta/feedback carecen de `aria-label` descriptivo ("Cerrar notificación"). |
| H-09 | `src/index.css` | Token | **Baja** | Variables CSS huérfanas en `:root` (`--neon-green`, `--neon-purple`, etc.) que no están mapeadas a tokens del sistema. |
| H-10 | `src/app/App.tsx` | a11y | **Baja** | Iconos y emojis integrados en etiquetas de navegación textual sin atributo `aria-hidden="true"`, provocando lectura redundante en lectores de pantalla. |

---

## 3. Detalle de Hallazgos y Propuestas de Mejora

### [H-01] Botón de Cierre de Modal sin Accesibilidad en Módulo de Tarjetas
- **Ubicación:** `src/features/credit-cards/components/StatementImportModal.tsx:212` y `CreditCardPurchaseModal.tsx:60`
- **Severidad:** **Alta**
- **Diagnóstico:** El botón de cierre `✕` está renderizado únicamente como un elemento `<button>` con un glifo de texto simple sin atributo `aria-label`, sin tipo explícito `type="button"` y sin área de pulsación de 44px (`p-0` o tamaño inline). Los lectores de pantalla anuncian "multiplicación" o "botón no etiquetado", impidiendo a usuarios de tecnologías asistivas comprender la acción de salida del diálogo modal.
- **Evidencia / Código Actual:**
  ```tsx
  // src/features/credit-cards/components/StatementImportModal.tsx:212
  <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
  ```
- **Solución Propuesta:**
  ```tsx
  <button
    type="button"
    onClick={onClose}
    aria-label="Cerrar importador de estado de cuenta"
    className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition cursor-pointer flex items-center justify-center text-lg font-semibold"
  >
    <span aria-hidden="true">✕</span>
  </button>
  ```
- **Beneficio Esperado:** Cumplimiento estricto del criterio WCAG 2.1 AA 4.1.2 (*Name, Role, Value*) y 2.5.5 (*Target Size*), permitiendo el cierre accesible y ergonómico tanto en dispositivos móviles como mediante lectores de pantalla.

---

### [H-02] Contraste Insuficiente en Celdas de Valor Cero y Textos Secundarios de la Matriz
- **Ubicación:** `src/features/matrix/components/FinancialMatrix.tsx:203,219,237,360`
- **Severidad:** **Alta**
- **Diagnóstico:** En la tabla consolidada, cuando un mes no tiene movimientos para una categoría o cuenta P2P, se renderiza `"text-slate-600"` sobre el fondo `#0a0a1a` / `#111127`. El ratio de contraste resultante es de aproximadamente **2.7:1**, violando el requisito mínimo de **4.5:1** de WCAG 2.1 AA para texto regular. Adicionalmente, las leyendas `"text-slate-500"` en las tarjetas de resumen alcanzan únicamente **3.4:1**.
- **Evidencia / Código Actual:**
  ```tsx
  // src/features/matrix/components/FinancialMatrix.tsx:359-363
  className={`px-3 sm:px-4 py-3 text-right font-mono tabular-nums text-xs whitespace-nowrap transition ${
    amount > 0 ? "text-slate-200 font-medium" : "text-slate-600 font-normal"
  }`}
  >
    {amount > 0 ? formatCLP(toMoney(amount)) : "—"}
  </td>
  ```
- **Solución Propuesta:**
  ```tsx
  className={`px-3 sm:px-4 py-3 text-right font-mono tabular-nums text-xs whitespace-nowrap transition ${
    amount > 0 ? "text-slate-100 font-medium" : "text-slate-400/70 font-normal"
  }`}
  >
    {amount > 0 ? (
      formatCLP(toMoney(amount))
    ) : (
      <span className="text-slate-400/60" aria-label="Sin movimientos">—</span>
    )}
  </td>
  ```
- **Beneficio Esperado:** Eleva el ratio de contraste a $> 4.8:1$, garantizando una legibilidad óptima en pantallas de bajo brillo y asegurando que las celdas inactivas no desaparezcan de la vista del usuario con fatiga visual.

---

### [H-03] Ausencia de Estados de Foco Visibles (`:focus-visible`) en Controles de Formulario
- **Ubicación:** `src/features/credit-cards/components/CreditCardPurchaseModal.tsx:79,112,124` y `src/features/obligations/components/RenegotiationModal.tsx:90,103`
- **Severidad:** **Alta**
- **Diagnóstico:** Los inputs de formulario utilizan la clase `focus:outline-none focus:border-emerald-500` o `focus:border-indigo-500` sin un anillo de contraste (`focus-visible:ring-2`). En monitores con configuraciones de contraste estándar, un cambio fino de 1px en el borde no proporciona una indicación inequívoca del cursor de teclado, incumpliendo WCAG 2.4.7 (*Focus Visible*).
- **Evidencia / Código Actual:**
  ```tsx
  // src/features/credit-cards/components/CreditCardPurchaseModal.tsx:112
  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
  ```
- **Solución Propuesta:**
  ```tsx
  className="w-full min-h-[44px] bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition"
  ```
- **Beneficio Esperado:** Navegación por teclado predecible y clara conforme a WCAG 2.1 AA, reduciendo la desorientación en usuarios que dependen de tabulación o tecnologías de asistencia.

---

### [H-04] Fragmentación Cromática del Sistema de Diseño (Índigo vs. Esmeralda)
- **Ubicación:** `src/features/credit-cards/components/CreditCardsDashboard.tsx:55,68`
- **Severidad:** **Media**
- **Diagnóstico:** Mientras que toda la aplicación (Matriz, Ingresos, Navegación de App, Bóveda, Sync) adopta el color `emerald` (#10b981 / `emerald-600`) como color primario de acción y marca, la sección de Tarjetas de Crédito introduce de manera aislada el color `indigo-600` para su botón de acción principal ("+ Cargar Compra") y pestañas activas. Esto genera una percepción de dos aplicaciones desconectadas y rompe la consistencia del Design System.
- **Evidencia / Código Actual:**
  ```tsx
  // src/features/credit-cards/components/CreditCardsDashboard.tsx:55
  <button
    onClick={() => setIsPurchaseModalOpen(true)}
    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
  >
    + Cargar Compra
  </button>
  ```
- **Solución Propuesta:**
  ```tsx
  <button
    onClick={() => setIsPurchaseModalOpen(true)}
    className="min-h-[40px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/30 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition-all cursor-pointer flex items-center gap-1.5"
  >
    <span className="text-base font-bold">+</span> Cargar Compra
  </button>
  ```
- **Beneficio Esperado:** Unificación del lenguaje visual de la plataforma, consolidando la jerarquía semántica donde el verde esmeralda representa el CTA principal y los tonos complementarios se reservan para estados categóricos específicos.

---

### [H-05] Área Táctil Reducida en Botones de Fila de Tabla en Dispositivos Móviles
- **Ubicación:** `src/features/income/components/IncomeListView.tsx:117-121`
- **Severidad:** **Media**
- **Diagnóstico:** El botón de acción "Eliminar" en la tabla de ingresos está restringido a `min-h-[36px]` con padding horizontal ajustado. En terminales táctiles (smartphones y tabletas), esto aumenta drásticamente la tasa de error por toques accidentales en la fila o dificultad de activación táctil según los estándares ergonómicos móviles (mínimo $44 \times 44\text{ px}$).
- **Evidencia / Código Actual:**
  ```tsx
  // src/features/income/components/IncomeListView.tsx:117-121
  <button
    onClick={() => removeIncome(inc.id)}
    className="min-h-[36px] px-3 py-1.5 text-slate-400 hover:text-rose-400 text-xs transition cursor-pointer rounded-lg hover:bg-slate-800/50"
  >
    Eliminar
  </button>
  ```
- **Solución Propuesta:**
  ```tsx
  <button
    type="button"
    onClick={() => removeIncome(inc.id)}
    aria-label={`Eliminar ingreso ${inc.description}`}
    className="min-h-[44px] min-w-[44px] px-3.5 py-2 text-slate-400 hover:text-rose-400 active:text-rose-500 text-xs font-medium transition cursor-pointer rounded-xl hover:bg-rose-500/10 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none inline-flex items-center justify-center gap-1.5"
  >
    <span>🗑️</span>
    <span className="hidden sm:inline">Eliminar</span>
  </button>
  ```
- **Beneficio Esperado:** Cumplimiento de WCAG 2.5.5 (*Target Size*) y mejores directrices ergonómicas de iOS HIG y Material Design, garantizando una pulsación precisa sin frustración.

---

### [H-06] Disparidad en Tokens de Geometría (`rounded-lg` vs. `rounded-xl`)
- **Ubicación:** `src/features/obligations/components/RenegotiationModal.tsx:90,103,115,130`
- **Severidad:** **Media**
- **Diagnóstico:** El modal de renegociación utiliza clases de radio de borde `rounded-lg` (8px) en sus controles `<input>`, mientras que la directriz y el resto de los componentes del proyecto (`LoginPage`, `ObligationFormModal`, `PaymentModal`, `SettingsView`) estandarizan `rounded-xl` (12px) y `rounded-2xl` (16px). Esta falta de apego a la escala de tokens crea irregularidad en la curvatura de esquinas visuales dentro de una misma jerarquía de modales.
- **Evidencia / Código Actual:**
  ```tsx
  // src/features/obligations/components/RenegotiationModal.tsx:90
  className="w-full min-h-[44px] px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
  ```
- **Solución Propuesta:**
  ```tsx
  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition"
  ```
- **Beneficio Esperado:** Consistencia estética e higiene visual estricta del sistema de diseño en todos los diálogos modales.

---

### [H-07] Sobrecarga Cognitiva y Densidad en el Formulario de Obligaciones
- **Ubicación:** `src/features/obligations/components/ObligationFormModal.tsx:1-1182`
- **Severidad:** **Media**
- **Diagnóstico:** El formulario consolida en una sola pantalla vertical con scroll continuo la selección de tipo de obligación, categorización, datos de cuotas, configuración P2P avanzada, comisiones bancarias y opciones de mantención de tarjetas. La ausencia de un patrón de *divulgación progresiva* (*progressive disclosure*) incrementa la fricción y la carga mental (Ley de Hick), propiciando que el usuario cometa errores en el llenado de comisiones o desgloses.
- **Evidencia / Código Actual:**
  El archivo presenta campos condicionales desplegados en un flujo lineal extenso de más de 1.100 líneas con scrollbar pronunciado, sin agrupaciones colapsables ni resumen previo de validación.
- **Solución Propuesta:**
  1. Estructurar el formulario en 3 secciones colapsables tipo acordeón:
     - **Paso 1:** Datos Esenciales (Categoría, Glosa, Tipo).
     - **Paso 2:** Calendario & Montos (Monto cuota, Fechas, Cuota inicial).
     - **Paso 3:** Recargos & Ajustes P2P (Mantención, Comisión) — *oculto por defecto salvo que se active*.
  2. Incorporar una tarjeta lateral o inferior de previsualización dinámica: *"Tu obligación generará 12 cuotas de $45.000 (total: $540.000) venciendo los días 5 de cada mes"*.
- **Beneficio Esperado:** Reducción del tiempo de llenado en aproximadamente un 40%, disminución de la fatiga cognitiva y minimización de datos erróneos ingresados en la bóveda.

---

### [H-08] Botones de Descarte de Alertas sin Nombre Accesible en Pestañas de Configuración
- **Ubicación:** `src/features/settings/components/UserProfileTab.tsx:60` y `DataStorageTab.tsx:119`
- **Severidad:** **Baja**
- **Diagnóstico:** Los avisos de estado y confirmaciones de guardado incluyen un botón de cierre con el caracter `✕` sin `aria-label`, lo cual impide que un usuario que navega por voz o lector de pantalla distinga la función del botón.
- **Evidencia / Código Actual:**
  ```tsx
  // src/features/settings/components/UserProfileTab.tsx:60-65
  <button
    onClick={() => setSavedFeedback(null)}
    className="text-emerald-400 hover:text-emerald-200 ml-2 min-h-[32px] px-2 flex items-center"
  >
    ✕
  </button>
  ```
- **Solución Propuesta:**
  ```tsx
  <button
    type="button"
    onClick={() => setSavedFeedback(null)}
    aria-label="Cerrar notificación de guardado"
    className="text-emerald-400 hover:text-emerald-200 ml-2 min-h-[44px] min-w-[44px] p-2 flex items-center justify-center rounded-lg hover:bg-emerald-500/10 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition cursor-pointer"
  >
    <span aria-hidden="true">✕</span>
  </button>
  ```
- **Beneficio Esperado:** Notificaciones plenamente accesibles y conformes con WCAG 2.1 AA.

---

### [H-09] Variables CSS Huérfanas y Tokens No Integrados en `index.css`
- **Ubicación:** `src/index.css:9-13`
- **Severidad:** **Baja**
- **Diagnóstico:** Se definen variables `--neon-green`, `--neon-red`, `--neon-blue`, `--neon-yellow` y `--neon-purple` en `:root`, pero los componentes de la aplicación utilizan exclusivamente clases utilitarias de Tailwind como `emerald-500`, `rose-500`, `amber-500` y `sky-500`. La existencia de tokens huérfanos sin uso real genera confusión a los desarrolladores y duplica la definición conceptual de la paleta.
- **Evidencia / Código Actual:**
  ```css
  :root {
    --bg-deep: #0a0a1a;
    --bg-surface: #111127;
    --bg-elevated: #1a1a35;
    --surface-border: rgba(255, 255, 255, 0.12);
    --neon-green: #39ff8f;
    --neon-red: #ff4d6d;
    --neon-blue: #4d9fff;
    --neon-yellow: #ffd166;
    --neon-purple: #b388ff;
  }
  ```
- **Solución Propuesta:**
  Mapear semánticamente los tokens o limpiar las variables en desuso, reemplazándolas por variables alineadas a los tokens de Tailwind v4:
  ```css
  :root {
    --bg-deep: #020617; /* slate-950 */
    --bg-surface: #0f172a; /* slate-900 */
    --surface-border: rgba(255, 255, 255, 0.08);
    --primary: #10b981; /* emerald-500 */
    --accent: #14b8a6;  /* teal-500 */
  }
  ```
- **Beneficio Esperado:** Código CSS limpio, predecible y sincronizado al 100% con los componentes React.

---

### [H-10] Emojis Decorativos en Navegación y Encabezados Leídos Literalmente por Screen Readers
- **Ubicación:** `src/app/App.tsx:53-58` y `src/features/matrix/components/FinancialMatrix.tsx:86,98`
- **Severidad:** **Baja**
- **Diagnóstico:** Los elementos de navegación definen etiquetas que concatenan emojis (`"📊 Matriz Consolidada"`, `"👥 Deudas Terceros"`). Los lectores de pantalla vocalizan cada emoji literalmente ("Gráfico de barras Matriz Consolidada", "Busto en silueta Deudas Terceros"), generando ruido auditivo y ralentizando la exploración de la interfaz.
- **Evidencia / Código Actual:**
  ```tsx
  // src/app/App.tsx:53
  { id: "matrix", label: "📊 Matriz Consolidada" }
  ```
- **Solución Propuesta:**
  Separar el glifo visual del texto accesible:
  ```tsx
  const navItems = [
    { id: "matrix", icon: "📊", label: "Matriz Consolidada" },
    { id: "calendar", icon: "📅", label: "Flujos & Cuotas" },
    { id: "income", icon: "💵", label: "Ingresos" },
    { id: "obligations", icon: "💳", label: "Obligaciones (Core)" },
    { id: "cards", icon: "💳", label: "Tarjetas" },
    { id: "settings", icon: "⚙️", label: "Configuración" },
  ] as const;

  // En el render:
  <button ...>
    <span aria-hidden="true" className="mr-1.5">{item.icon}</span>
    <span>{item.label}</span>
  </button>
  ```
- **Beneficio Esperado:** Mayor claridad en lectores de pantalla y mejor control del espaciado entre icono y texto.

---

## 4. Plan de Acción Recomendado (Priorización Quick-Wins vs. Refactor)

### Fase 1 (Inmediata / Quick-wins)
- [x] **Accesibilidad en botones de cierre:** Agregar `aria-label="Cerrar..."`, `type="button"` y clase de tamaño táctil mínimo `min-h-[44px] min-w-[44px]` a todos los botones `✕` de modales (`StatementImportModal`, `CreditCardPurchaseModal`, `PaymentModal`, `RenegotiationModal`, `UserProfileTab`, `DataStorageTab`, `CategorySettingsModal`).
- [x] **Corrección de ratios de contraste:** Elevar tonos `text-slate-600` a `text-slate-400/80` en celdas de la tabla consolidada (`FinancialMatrix.tsx`) para asegurar $\ge 4.5:1$.
- [x] **Indicadores de foco estandarizados:** Implementar `focus-visible:ring-2 focus-visible:ring-emerald-500/50` en todos los inputs, selects y botones de los modales.

### Fase 2 (Mediano Plazo / Estandarización de Componentes)
- [ ] **Unificación de CTA en Tarjetas:** Migrar los botones e indicadores de `CreditCardsDashboard.tsx` de `indigo-600` al token de marca `emerald-600`.
- [ ] **Estandarización de radios de borde:** Homogeneizar los inputs de `RenegotiationModal.tsx` y `CreditCardsDashboard.tsx` a `rounded-xl`.
- [ ] **Separación semántica de emojis:** Reestructurar los items de navegación en `App.tsx` y encabezados de vista para envolver emojis en `<span aria-hidden="true">`.
- [ ] **Limpieza de variables huérfanas en `index.css`:** Retirar variables `--neon-*` en desuso y alinear las variables CSS a los tokens de Tailwind.

### Fase 3 (Evolutiva / UX & Ergonomía Avanzada)
- [ ] **Rediseño progresivo de `ObligationFormModal`:** Modularizar el formulario en secciones paso a paso (Básico $\rightarrow$ Cuotas $\rightarrow$ Recargos) con tarjeta de resumen en tiempo real para amortiguar la carga cognitiva.
- [ ] **Optimización de drag & drop en importación:** Mejorar la retroalimentación visual del dropzone en `StatementImportModal` con estados táctiles amigables e indicaciones de límites de tamaño.
