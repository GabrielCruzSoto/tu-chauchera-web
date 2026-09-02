# 🚀 Propuesta Integral de Mejoras y Nuevas Funcionalidades: Tu Chauchera Web

**Tu Chauchera** cuenta con una base arquitectónica sólida y diferenciadora: arquitectura *Local-First*, sincronización cifrada de extremo a extremo (**AES-256-GCM**) con **Google Drive**, cero backend centralizado y privacidad absoluta del usuario.

Este documento presenta una hoja de ruta estratégica con **funcionalidades a mejorar** (optimización de lo existente) y **funcionalidades a agregar** (nuevas capacidades de alto valor), priorizadas por impacto y esfuerzo técnico.

---

## 1. 🔄 Funcionalidades Existentes a Mejorar

### 1.1. Sistema de Sincronización y Resiliencia Local-First
* **Resolución visual de conflictos**: Actualmente, si se abre la app en dos dispositivos al mismo tiempo, el merge o guardado en Drive puede sobreescribir o generar inconsistencias. Se debe implementar un visor de conflictos con opción de *merge inteligente* o selección manual (estilo diff).
* **Sincronización en segundo plano con Web Workers**: Mover los cálculos pesados de cifrado/descifrado AES-GCM y llamadas a Google Drive API a un Web Worker dedicado para evitar micro-bloqueos en la interfaz (UI jank).
* **Indicador de guardado offline más granular**: Mostrar al usuario el estado exacto (ej. *"Cambios guardados en memoria local, pendiente sincronización con Drive al recuperar internet"*).
* **Historial de versiones y snapshots**: Permitir restaurar versiones anteriores del archivo cifrado guardado en Google Drive o snapshots automáticos semanales.

### 1.2. Matriz Financiera Consolidada
* **Proyecciones dinámicas configurables**: Poder extender el horizonte de la matriz a 6, 12 o 24 meses vista con cálculo automático de inflación o variaciones proyectadas.
* **Filtros avanzados y agrupación**: Agrupar filas de la matriz no solo por tipo/categoría, sino por medio de pago (tarjeta X, cuenta corriente Y) o estado de pago (pagado, pendiente, vencido).
* **Exportación de datos**: Incorporar exportación nativa a **Excel (.xlsx)**, **CSV** y reporte imprimible en **PDF** con el desglose mensual.
* **Edición rápida inline en la matriz**: Permitir marcar cuotas como pagadas o editar montos directamente haciendo clic sobre la celda en la matriz.

### 1.3. Gestión de Obligaciones y Cuotas
* **Soporte multimoneda (UF, USD, EUR, CLP)**: En países como Chile, muchas deudas y arriendos están en UF. Integrar consulta de valor de UF/USD (con opción de actualización offline/manual o vía API pública) para recalcular montos en moneda local.
* **Reprogramación y prepago de cuotas**: Simular y registrar qué ocurre si se abonan cuotas anticipadas (reducción de cuotas restantes o reducción del monto mensual).
* **Archivado de obligaciones finalizadas**: Separar visualmente las deudas completamente saldadas para mantener limpia la lista activa sin perder el historial.

### 1.4. Gestión de Ingresos
* **Ingresos variables y estacionales**: Permitir modelar ingresos con variación proyectada (ej. comisiones, bonos semestrales, aguinaldos en meses específicos como septiembre/diciembre).
* **Fuentes de ingreso compartidas o familiares**: Posibilidad de etiquetar ingresos por integrante del hogar (ej. *"Ingreso Gabriel"*, *"Ingreso Pareja"*).

---

## 2. ✨ Nuevas Funcionalidades para Agregar

### 2.1. 📊 Presupuestos por Categoría (Budgeting / Regla 50/30/20)
* **Presupuesto base cero o por sobres**: Crear presupuestos mensuales por categoría (ej. Supermercado: $300.000, Salidas: $80.000).
* **Semáforo de consumo**: Barra de progreso visual que indique cuánto se ha consumido del presupuesto mensual y cuánto queda disponible día por día.
* **Recomendación automática de distribución**: Asistente basado en reglas que compare ingresos vs gastos fijos y sugiera cuánto destinar a ahorro, deuda y ocio.

### 2.2. 📈 Módulo de Metas de Ahorro y Fondos de Emergencia (Goals)
* **Objetivos financieros**: Creación de metas con fecha límite y monto objetivo (ej. *"Pie de departamento"*, *"Vacaciones 2027"*, *"Fondo de emergencia 6 meses"*).
* **Aportes periódicos y proyección de cumplimiento**: El sistema calcula cuánto se debe ahorrar mensualmente para alcanzar la meta y descuenta esa liquidez proyectada en la Matriz Financiera.

### 2.3. 💳 Conciliación Bancaria e Importación de Cartolas (CSV / OFX)
* **Importador inteligente de cartolas bancarias**: Subir el archivo CSV/Excel que entrega el banco (Banco de Chile, Santander, BCI, BancoEstado, Falabella, etc.) y parsearlo localmente en el navegador.
* **Mapeo automático por palabras clave**: El sistema reconoce que "Uber Eats" o "Lider" corresponde a la categoría *Alimentación* o a una obligación registrada, facilitando conciliar pagos reales contra lo presupuestado.
* **Privacidad 100% garantizada**: Al procesarse en el cliente (local), ningún extracto bancario viaja a servidores externos.

### 2.4. 🔔 Notificaciones, Alertas de Vencimiento y Recordatorios
* **Alertas de pago inminente**: Notificaciones locales en el navegador o recordatorios cuando una cuota esté a 3 o 5 días de vencer.
* **Integración con Google Calendar**: Sincronizar automáticamente las fechas de vencimiento de las cuotas como eventos en Google Calendar mediante la misma cuenta autenticada.
* **Modo "Día de Pago" (Payday Flow)**: Flujo guiado el día en que se recibe el sueldo para distribuir rápidamente los fondos a todas las obligaciones del mes.

### 2.5. 📱 PWA Completa (Progressive Web App) e Instalación Móvil
* **Soporte Offline total con Service Worker**: Poder consultar y registrar gastos sin conexión en el teléfono o laptop.
* **Autenticación Biométrica (WebAuthn / Passkeys / FaceID / TouchID)**: Reemplazar o complementar la contraseña de la bóveda con la huella o rostro del dispositivo para un desbloqueo ultra rápido.
* **Acceso directo desde pantalla de inicio**: Experiencia nativa en iOS y Android con icono propio y navegación táctil optimizada.

### 2.6. 📉 Dashboard de Métricas y Salud Financiera (Financial Analytics)
* **Patrimonio neto (Net Worth)**: Cálculo en tiempo real de `Activos (Ingresos + Ahorros) - Pasivos (Deuda total restante)`.
* **Ratio de endeudamiento**: Alerta si el pago de cuotas supera el 30%-40% de los ingresos netos.
* **Gráficos interactivos de evolución**: Gráficos de área y barras con el histórico de ingresos vs egresos, tendencia de reducción de deuda y distribución de gastos por categoría.

### 2.7. 🔒 Seguridad, Backup Local y Portabilidad
* **Exportación / Importación manual de Bóveda (JSON cifrado / descifrado)**: Permitir descargar un respaldo `.json` o `.enc` local para guardar en disco duro o transferir sin usar Google Drive.
* **Soporte de otros proveedores de almacenamiento**: Opcionalidad para sincronizar con Dropbox, OneDrive, WebDAV o almacenamiento local en el sistema de archivos (File System Access API).

---

## 3. 🗺️ Matriz de Priorización Recomendada (Roadmap)

| Fase | Funcionalidad | Impacto | Complejidad |
| :--- | :--- | :---: | :---: |
| **Fase 1 (Corto Plazo - Quick Wins)** | Exportación a Excel/CSV/PDF | 🟢 Alto | 🔵 Baja |
| | PWA completa + Offline Service Worker | 🟢 Alto | 🔵 Baja-Media |
| | Soporte básico de UF / Monedas extranjeras | 🟢 Alto | 🔵 Baja |
| | Desbloqueo Biométrico (WebAuthn / FaceID) | 🟢 Alto | 🔵 Media |
| **Fase 2 (Medio Plazo - Core Value)** | Módulo de Presupuestos y Metas de Ahorro | 🟣 Muy Alto | 🟡 Media |
| | Importador de Cartolas CSV de Bancos (Local) | 🟣 Muy Alto | 🟡 Media |
| | Historial de versiones y sincronización en Web Worker | 🟢 Alto | 🟡 Media |
| **Fase 3 (Largo Plazo - Advanced)** | Dashboard de Salud Financiera & Métricas (Net Worth) | 🟢 Alto | 🟡 Media |
| | Integración con Google Calendar para vencimientos | 🟢 Alto | 🔴 Media-Alta |
| | Simulador de Prepago y Refinanciamiento de Deuda | 🟢 Alto | 🟡 Media |

---

## 4. 💡 Conclusión y Próximos Pasos

La gran ventaja competitiva de **Tu Chauchera** es ser una herramienta de finanzas personales **100% privada, transparente y sin suscripciones forzadas ni venta de datos**.

Implementando primero el **soporte offline (PWA)**, la **exportación de datos** y el **desbloqueo biométrico**, la experiencia de uso diario se elevará significativamente. Posteriormente, la incorporación de **presupuestos** e **importador de cartolas bancarias locales** convertirá a la plataforma en una suite financiera completa e integral.
