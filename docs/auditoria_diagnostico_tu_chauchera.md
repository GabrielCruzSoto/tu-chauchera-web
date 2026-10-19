# Informe de Auditoría y Diagnóstico: Plataforma Tu Chauchera

**Fecha de Ejecución:** 30 de Septiembre de 2026  
**Entorno Evaluado:** Local (`http://localhost:5173`)  
**Versión de Código:** 0.1.0 (Commit HEAD)  
**Evaluador:** Agente Autónomo Especialista en QA y Auditoría Financiera  

---

## Sección 1: Calificar el Producto Actual

### 1.1 Puntuación Global
**Calificación General:** **7.4 / 10** (74 / 100) — *Estado: Viable con Advertencias Operativas (Ready with Warnings)*

La plataforma **Tu Chauchera** demuestra una arquitectura técnica destacable para la gestión financiera local-first con cifrado en reposo (AES-256-GCM + Google Drive `appDataFolder`). Su modelado de amortización de pasivos, refinanciamientos y gestión de compras compartidas (P2P / tarjetas prestadas) se encuentra entre lo más avanzado del segmento personal. No obstante, presenta ausencias estructurales clave en activos patrimoniales, transacciones diarias menores (gastos de cuenta corriente/débito) y automatizaciones bancarias que limitan su usabilidad a usuarios con alto rigor de registro manual.

---

### 1.2 Calificación Desglosada por Rol

#### 1. Daily Money Manager (Operatividad y Carga Diaria): **6.8 / 10**
* **Justificación:**  
  La carga de datos manual es fluida y posee atajos de teclado globales (teclas 1 a 6) para alternar vistas. Sin embargo, existe una fricción crítica: **no existe un módulo de transacciones diarias simples** (débito, efectivo o transferencias directas). Todo egreso debe forzarse como una "Compra con Tarjeta de Crédito" o como una "Obligación Recurrente", lo cual distorsiona la operativa cotidiana para pagos hormiga, consumos en supermercados o transferencias espontáneas. La importación de cartolas en PDF está restringida a solo dos entidades (CMR Falabella y Tenpo), dejando fuera a los principales bancos del país (Banco de Chile, Santander, BCI, Banco Estado, Scotiabank).

#### 2. Financial Planner (Estructura Analítica y Metas): **6.2 / 10**
* **Justificación:**  
  La consistencia matemática entre amortización de pasivos y flujo de caja mensual es exacta y rigurosa en el corto plazo (1 a 12 meses). Sin embargo, **carece totalmente de un módulo de Activos** (cuentas de ahorro, inversiones, APV, vehículos, bienes raíces), imposibilitando el cálculo fundamental de *Patrimonio Neto* ($Activos - Pasivos$). Tampoco cuenta con un módulo de metas financieras (fondo de emergencia, pie hipotecario, jubilación) ni fórmulas de proyección con inflación o rentabilidad real. Adicionalmente, no calcula ni advierte la Carga Financiera (DTI), exhibiendo márgenes netos positivos incluso cuando el usuario compromete más del 50% de sus ingresos líquidos en servicio de deudas.

#### 3. Coach Financiero (UX Conductual, Alertas y Presupuestos): **6.5 / 10**
* **Justificación:**  
  El diseño visual en modo oscuro con acentos esmeralda transmite orden y sobriedad. La funcionalidad de "Pasar a mes siguiente en rojo" y la segregación de compras prestadas evitan la frustración del autoengaño financiero. Sin embargo, la interfaz peca de **alta sobrecarga cognitiva**: la matriz principal exhibe una densidad numérica excesiva sin guías pedagógicas. No existen marcos de presupuestación activos (ej. regla 50/30/20 o base cero), ni sugerencias de amortización inteligente (método bola de nieve vs. avalancha). Frente a situaciones de sobreendeudamiento crítico (ej. tarjetas de crédito sobregiradas al 183% y 265% de su límite en la sesión auditada), la UI no despliega alertas de peligro visibles ni restricciones de gasto.

#### 4. Family Office (Robustez Multi-cuenta y Reportes): **5.8 / 10**
* **Justificación:**  
  La seguridad criptográfica es de nivel institucional: arquitectura zero-knowledge, sin backend central intermediario, con derivación PBKDF2 (100k iteraciones) y almacenamiento en bóveda cifrada privada en Google Drive. No obstante, desde la perspectiva patrimonial y de gestión familiar, la plataforma es mono-entidad (no permite separar patrimonios familiares, conyugales o societarios/SpA). El soporte multi-moneda es puramente cosmético en preferencias: el motor interno fuerza números enteros bajo CLP, ignorando decimales en USD/EUR y unidades indexadas (UF). Además, la trazabilidad contable para auditoría se restringe a un dump JSON sin opciones de reportes ejecutivos en PDF o planillas estructuradas en CSV/Excel.

---

### 1.3 Veredicto de Experiencia de Usuario (UI/UX)
* **Jerarquía Visual:** Muy bien lograda en la barra superior segmentada y en los modales de interacción. La diferenciación por etiquetas de colores en categorías es efectiva.
* **Diseño Responsivo:** Cuenta con menú lateral drawer y un bottom dock flotante para navegación con ergonomía de pulgar (Fitts' Law) en pantallas móviles (<1024px).
* **Accesibilidad (a11y):** Existen deficiencias técnicas detectadas en consola: más de 34 campos de formularios carecen de identificadores `id` y asociaciones explícitas `<label htmlFor="...">`, afectando a lectores de pantalla y herramientas de accesibilidad.

---

## Sección 2: Viabilidad del Producto

### 2.1 Viabilidad Comercial y de Mercado (Product-Market Fit)
* **Propuesta de Valor Diferencial:**  
  Frente a gigantes como Fintonic, Spendee o plantillas en Notion/Excel, Tu Chauchera cuenta con un nicho extraordinariamente potente: **Finanzas Personales Local-First Cifradas con Solución Nativa de Tarjetas Prestadas (P2P)**. En Latinoamérica, el préstamo de cupos de tarjeta de crédito a familiares y amigos representa una fuente común de descontrol financiero; resolver este dolor de raíz sin obligar al usuario a entregar sus credenciales bancarias a servidores de terceros es un diferenciador de mercado real y competitivo.
* **Riesgos Comerciales:**  
  La fricción de requerir cuenta de Google Drive y contraseña maestra local puede reducir la conversión en usuarios no técnicos. Si la carga de transacciones no se automatiza más allá de CMR y Tenpo, el usuario promedio terminará abandonando la herramienta frente a soluciones automatizadas de Open Banking.

### 2.2 Viabilidad Técnica
* **Rendimiento y Front-End:** Excepcional. Desarrollado sobre React 19, TypeScript y Vite, el bundle ejecuta sin caídas de framerate, los modales responden de manera instantánea y no existen latencias de red para la lectura de datos porque el estado vive en memoria con Zustand.
* **Estabilidad del Estado Local:** Sólida. La separación en slices independientes (`obligations`, `income`, `creditCards`, `settings`, `sync`) y la suite automatizada de 303 pruebas unitarias e integración (todas pasando) garantizan estabilidad frente a regresiones.
* **Integración con Google Drive:** Eficiente. Las llamadas a la API de Drive v3 para `appDataFolder` se realizan mediante debounces y cambios pendientes, minimizando peticiones innecesarias y gestionando cuotas de almacenamiento.

### 2.3 Viabilidad de Retención de Usuario
* **Barrera de Esfuerzo Manual:** Alta. Actualmente, registrar cada café, compra de almacén o salida a cenar requiere entrar a un modal de tarjeta o crear una obligación. Sin un mecanismo de ingesta ultrarrápida (widget móvil, captura de comprobantes vía WhatsApp/Telegram o integración de cartolas bancarias universales), la tasa de abandono a los 30 días será significativa en usuarios cotidianos.

---

## Sección 3: Problemas Detectados

### 3.1 Bugs Funcionales y de Lógica

#### BUG-01: Desfase de Zona Horaria (Timezone Boundary Inconsistency)
* **Pantalla / Componente:** `useMatrixComputation.ts`, `MonthlyInstallmentsView.tsx`, `IncomeListView.tsx`, `ObligationFormModal.tsx`.
* **Descripción:**  
  Múltiples componentes calculan el período y fechas actuales ejecutando `new Date().toISOString().slice(0, 7)` o `slice(0, 10)`. En zonas horarias occidentales como Chile (UTC-3 / UTC-4), a partir de las 21:00 horas locales la hora UTC ya corresponde al día siguiente (00:00 UTC). Si esto ocurre a fin de mes (ej. 30 de Septiembre a las 21:01), la aplicación calcula automáticamente el período como `"2026-10"`, desfasando los registros de ingresos, filtros de cuotas y vistas mensuales 24 horas antes de que culmine el mes real.
* **Pasos para reproducir:**
  1. Configurar la hora del sistema en zona horaria UTC-3 a las 21:30 horas del último día de cualquier mes.
  2. Abrir la aplicación y observar el período por defecto en "Flujos & Cuotas" o al registrar un ingreso.
  3. Comprobar que se inicializa en el mes siguiente.

#### BUG-02: Truncamiento Prematuro de Gastos Recurrentes Indefinidos
* **Pantalla / Componente:** `ObligationFormModal.tsx` (`handleSubmit`) y `installmentGenerator.ts`.
* **Descripción:**  
  Al registrar un gasto fijo bajo la opción "Gasto Recurrente Indefinido" (ej. Luz, Arriendo, Suscripciones), el formulario asigna rígidamente `totalInstallments = 12` y `totalAmountCents = installmentAmount * 12`. Como consecuencia, `generateInstallments` genera únicamente 12 cuotas fijas. Al navegar a los meses 13 en adelante en la Matriz o en Flujos de meses futuros, la obligación desaparece silenciosamente, omitiendo el gasto del flujo de caja proyectado.
* **Pasos para reproducir:**
  1. Ir a Obligaciones -> "+ Nueva Obligación".
  2. Seleccionar "Gasto Recurrente" con recurrencia indefinida.
  3. Ir a la Matriz Consolidada y cambiar la proyección a 12 meses, avanzando al mes 13.
  4. Observar que el gasto proyectado cae a cero.

#### BUG-03: Falso Soporte Multi-Moneda en Configuración
* **Pantalla / Componente:** `UserProfileTab.tsx`, `settingsSlice.ts` vs `money.ts` (`formatCLP`).
* **Descripción:**  
  En "Configuración -> Usuario & Preferencias", el usuario puede seleccionar como Moneda Principal: USD, EUR o UF. Sin embargo, al guardar la preferencia, la interfaz continúa invocando de forma omnipresente la función `formatCLP`, renderizando símbolos `$`, separadores de miles con punto y formateando todo como pesos chilenos sin centavos. Además, el tipo central `Money` está diseñado exclusivamente como enteros redondeados (`Math.round`), lo cual corrompe valores decimales si se ingresasen transacciones en UF (ej. 24,52 UF) o dólares con centavos.
* **Pasos para reproducir:**
  1. Ir a Configuración -> Usuario & Preferencias.
  2. Cambiar "Moneda Principal" a `USD` o `UF` y guardar.
  3. Regresar a la Matriz Consolidada o Tarjetas.
  4. Verificar que todas las cifras continúan formateadas estrictamente como `$ CLP`.

#### BUG-04: Riesgo de Parser Fallback en Cartolas Bancarias no Soportadas
* **Pantalla / Componente:** `statementParser.ts` (`parseStatementText`).
* **Descripción:**  
  Si un usuario carga un estado de cuenta en PDF correspondiente a cualquier banco nacional que no sea CMR ni Tenpo (ej. Santander, Banco de Chile, BCI), la función `parseStatementText` ejecuta una cascada de descarte que, al no detectar palabras clave, invoca de manera forzada `parseFalabellaStatementText(rawText)`. Esto genera filas corrompidas, fechas erróneas o transacciones de $0 con nombres de columnas contables en lugar de rechazar amigablemente el archivo advirtiendo que el banco emisor no es compatible.
* **Pasos para reproducir:**
  1. Ir a Tarjetas -> "Importar Cartola".
  2. Pegar texto sin formato extraído de una cartola de Banco de Chile o Santander.
  3. Presionar "Analizar Movimientos".
  4. Observar transacciones basura procesadas con expresiones regulares de CMR.

---

### 3.2 Errores de Consola y Accesibilidad (a11y)
* **Advertencias DOM:**  
  Se detectan 34 advertencias `[issue] A form field element should have an id or name attribute` y 35 advertencias `[issue] No label associated with a form field`. Los formularios en modales (`IncomeModal`, `ObligationFormModal`, `CreditCardPurchasesModal`) utilizan frecuentemente etiquetas `<div>` con texto visual encima de los inputs en lugar de vincular semánticamente `<label htmlFor="fieldId">` e `<input id="fieldId" name="fieldName">`.

---

### 3.3 Fricciones de UX y Usabilidad

#### FRIC-01: Asignación por Defecto de Categoría en Obligaciones
* **Pantalla:** `ObligationFormModal.tsx`.
* **Detalle:** El selector de categoría se inicializa automáticamente con la primera opción alfabética ("Automotriz"). Si un usuario ingresa una cuenta de servicio (ej. "Aguas Andinas") y olvida cambiar el menú desplegable, el gasto queda archivado bajo Automotriz (evidenciado en el dataset real probado, donde Aguas Andinas figuraba bajo Automotriz). Debería exigir selección explícita con un placeholder neutral `Selecciona una categoría...`.

#### FRIC-02: Ausencia de Alertas Visuales ante Sobregiros de Tarjeta
* **Pantalla:** `CreditCardsDashboard.tsx`.
* **Detalle:** Tanto la tarjeta Tenpo ($1.331.931 de deuda vs. cupo de $728.775) como Banco Falabella ($927.199 de deuda vs. cupo de $350.000) superan con creces el límite autorizado. La interfaz únicamente muestra la cifra en texto amarillo/ámbar, sin una insignia de peligro ("Cupo Excedido"), porcentaje de utilización ni advertencia de intereses por sobregiro.

#### FRIC-03: Dificultad para Registrar Pagos Parciales sin Modificar el Plan
* **Pantalla:** `PaymentModal.tsx`.
* **Detalle:** Si bien el modal de pago permite registrar un monto real pagado diferente al programado, la diferencia no ofrece una bifurcación clara sobre cómo tratar el saldo remanente: ¿debe acumularse a la cuota siguiente o extender el plazo final? Actualmente el usuario debe calcularlo mentalmente o forzar un rollover manual.

---

## Sección 4: Mejoras Recomendadas (Priorizadas por Urgencia)

```
┌────────────────────────────────────────────────────────────────────────┐
│                      MATRIZ DE MEJORAS PRIORIZADAS                     │
├──────────────┬────────────────────────┬────────────────────────────────┤
│ PRIORIDAD    │ ÁREA / MÓDULO          │ ACCIÓN RECOMENDADA             │
├──────────────┼────────────────────────┼────────────────────────────────┤
│ 🔴 ALTA      │ Utilidades de Fecha    │ Migrar toISOString a date-fns  │
│ 🔴 ALTA      │ Generador Cuotas       │ Soporte infinito real p/gastos │
│ 🔴 ALTA      │ Importador Cartolas    │ Validación estricta de banco   │
├──────────────┼────────────────────────┼────────────────────────────────┤
│ 🟡 MEDIA     │ Dashboard Tarjetas     │ Insignias de sobregiro y ratios│
│ 🟡 MEDIA     │ Formularios Modales    │ Corrección a11y (labels/ids)   │
│ 🟡 MEDIA     │ Selector Categorías    │ Placeholder obligatorio vacío  │
├──────────────┼────────────────────────┼────────────────────────────────┤
│ 🟢 BAJA      │ Ajustes Regionales     │ Acoplar formatter a preference │
│ 🟢 BAJA      │ Feedback Visual        │ Toasts animados al sincronizar │
└──────────────┴────────────────────────┴────────────────────────────────┘
```

### 4.1 Mejoras Urgentes (Alta Prioridad - Blocker / Lógica Contable)
1. **Sustituir `.toISOString().slice(...)` por `format(date, ...)` de `date-fns`:**
   - *Impacto:* Elimina el desfase nocturno de 24 horas y cambios anticipados de período que alteran la imputación de pagos e ingresos en horario tarde/noche en husos horarios americanos.
2. **Generador Dinámico de Cuotas para Gastos Indefinidos:**
   - *Impacto:* Reemplazar la cota dura de 12 cuotas fijas por un generador lazy/on-demand que proyecte cuotas automáticamente según el rango de meses visualizado en la Matriz.
3. **Validación Estricta de Compatibilidad en Cartolas PDF:**
   - *Impacto:* Si el texto extraído no coincide con las firmas digitales de CMR o Tenpo, mostrar un mensaje de error claro solicitando al usuario utilizar el formato manual o reportar su banco para añadir el parser correspondiente.

### 4.2 Mejoras Medias (Prioridad Media - Usabilidad y Consistencia)
1. **Semántica y Accesibilidad en Formularios:**
   - Asociar todos los `<label>` con sus respectivos inputs mediante `htmlFor` e `id` únicos, limpiando las 69 advertencias del DOM.
2. **Indicador de Estrés Financiero y Sobregiro:**
   - Calcular el porcentaje de uso de cupo en tarjetas: si supera el 100%, renderizar tarjeta con borde rojo y badge "⚠️ Límite Excedido por [Monto]".
3. **Mapeo Inteligente y Categoría Obligatoria:**
   - Inicializar el dropdown de categoría en vacío (`required`), e implementar sugerencia automática según palabras clave (ej. si el usuario escribe "Enel", "Aguas", "Luz" -> sugerir automáticamente "Servicios Básicos").

### 4.3 Mejoras Bajas (Prioridad Baja - Refinamiento Estético)
1. **Sistema de Notificaciones Toasts Globales:**
   - Sustituir alertas nativas del navegador por un componente de Toast no invasivo en la esquina inferior para confirmar acciones como "Obligación guardada", "Cuota pagada" y "Bóveda sincronizada".
2. **Micro-interacciones en la Matriz Consolidada:**
   - Añadir resaltado visual de fila y columna al hacer hover sobre cualquier celda de la tabla para facilitar la lectura de cifras en pantallas grandes.

---

## Sección 5: Funcionalidades (Urgentes y Futuras)

### 5.1 Funcionalidades Urgentes (Imprescindibles para el MVP / Próximo Sprint)
1. **Módulo de Registro Rápido de Gastos Diarios (Caja Chica / Débito):**
   - Un botón flotante `+ Gasto Rápido` en el navbar que permita registrar compras puntuales (Monto, Glosa, Categoría, Cuenta de Origen: Efectivo / Cuenta Corriente) sin vincularlas a un crédito ni crear cuotas.
2. **Exportador Contable Consolidado (CSV y Excel):**
   - Incorporar en "Configuración -> Almacenamiento" la descarga de planillas CSV/XLSX estructuradas con el historial de cuotas pagadas, ingresos percibidos y calendario de vencimientos, facilitando la conciliación bancaria y declaraciones de renta.
3. **Gauge de Carga Financiera (Debt-to-Income / DTI Ratio):**
   - Visualizador en el encabezado de la Matriz o Dashboard que calcule:  
     $$\text{Carga Financiera} = \frac{\text{Compromiso Mensual en Deudas}}{\text{Ingresos Líquidos Mensuales}} \times 100$$
   - Escala semafórica: `< 25%` (Verde / Saludable), `25% - 40%` (Amarillo / Precaución), `> 40%` (Rojo / Sobreendeudamiento Crítico).

---

### 5.2 Funcionalidades Futuras (Roadmap a Mediano / Largo Plazo)
1. **Módulo de Gestión de Activos y Balance Patrimonial:**
   - Registro de activos líquidos (cuentas a la vista, fondos mutuos, depósitos a plazo) y activos fijos (propiedades con tasación comercial, vehículos con tasación fiscal).
   - Cálculo automático de **Patrimonio Neto**:  
     $$\text{Patrimonio Neto} = \sum \text{Activos} - \sum \text{Pasivos (Saldos de Deuda)}$$
2. **Planificador de Metas de Ahorro y Simulación Financiera:**
   - Configuración de metas con capital objetivo y fecha límite.
   - Cálculo del ahorro mensual requerido incorporando inflación estimada y tasa real de rentabilidad.
   - Simulador de escenarios de contingencia: "¿Qué ocurre con mi solvencia si mis ingresos caen un 15% o si una tasa de crédito repacta al alza?".
3. **Estrategias de Desendeudamiento Automatizadas (Bola de Nieve vs. Avalancha):**
   - Módulo que ordene los pasivos activos y simule planes de amortización anticipada:
     * *Método Bola de Nieve:* Priorizar liquidación de deudas de menor saldo para generar victorias psicológicas rápidas.
     * *Método Avalancha:* Priorizar pasivos con mayor costo financiero/interés (CAE) para minimizar el pago total de intereses.
4. **Multi-Entidad y Multi-Moneda Nativo:**
   - Posibilidad de alternar entre espacios de trabajo (ej. "Finanzas Personales", "Familia / Conyugal", "Sociedad / Empresa").
   - Conexión a APIs públicas de tipo de cambio diario (Dólar Observado, UF, Euro del Banco Central de Chile) para valorizar saldos en moneda extranjera y deudas hipotecarias en UF con precisión contable.
