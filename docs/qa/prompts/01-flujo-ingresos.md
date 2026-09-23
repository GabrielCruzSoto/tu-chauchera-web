# Prompt de QA: Flujo de Gestión de Ingresos (`income`)

## Identidad del Agente
- **Agente:** `agy-agent-qa-web`
- **Módulo Objetivo:** `features/income` (Vista "💵 Ingresos")
- **URL:** `https://alpha.tu-chauchera.cl/`

---

## Instrucciones de Ejecución

Actúa como `agy-agent-qa-web` y ejecuta la prueba de usuario de punta a punta (E2E) sobre el flujo de Ingresos en el ambiente QA:

1. **Precondición y Navegación:**
   - Asegura que la bóveda esté desbloqueada (Google OAuth completado y contraseña maestra ingresada).
   - Navega a la pestaña **"💵 Ingresos"**.

2. **Prueba de Creación (Happy Path):**
   - Haz clic en el botón `+ Agregar Ingreso`.
   - Completa el formulario modal con los siguientes datos:
     - **Descripción:** `Sueldo Principal QA`
     - **Monto (CLP):** `1500000`
     - **Tipo de Ingreso:** `Fijo (Mensual)`
     - **Período / Mes:** Mes en curso
     - **Recurrencia:** Activar la casilla *"Repetir automáticamente en meses sucesivos"*.
   - Haz clic en `Guardar Ingreso`.
   - **Aserción:** Valida que el ingreso aparezca en la lista del mes y que el indicador `"Total Ingresos:"` se actualice inmediatamente a `$1.500.000`.

3. **Prueba de Validación y Casos Borde (Negative / Edge Cases):**
   - Abre nuevamente el modal `+ Agregar Ingreso`.
   - Intenta enviar el formulario dejando la descripción vacía o el monto en 0.
   - **Aserción:** Verifica que el formulario prevenga el submit y muestre feedback accesible.
   - Cierra el modal con el botón `✕` o `Cancelar`.

4. **Navegación Temporal y Proyección:**
   - Haz clic en `Mes siguiente →`.
   - **Aserción:** Constata que el ingreso fijo recurrente se proyecte automáticamente en los meses siguientes con su monto íntegro.
   - Regresa con `← Mes anterior`.

5. **Limpieza e Idempotencia:**
   - Elimina o edita el registro de prueba creado para dejar el estado de la bóveda limpio.
   - Observa que el componente `SyncStatusIndicator` pase al estado *"Drive Sincronizado"*.

6. **Entregables:**
   - Genera un reporte conciso en formato Markdown con el resultado de cada paso, tiempos de respuesta, errores en consola (si los hubiere) y capturas de evidencia.
