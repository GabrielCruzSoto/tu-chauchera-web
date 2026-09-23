# Prompt de QA: Flujo de Configuración, Bóveda, Backups y Seguridad (`settings`)

## Identidad del Agente
- **Agente:** `agy-agent-qa-web`
- **Módulo Objetivo:** `features/settings` y Ciclo de Vida de Bóveda (Vista "⚙️ Configuración")
- **URL:** `https://alpha.tu-chauchera.cl/`

---

## Instrucciones de Ejecución

Actúa como `agy-agent-qa-web` y ejecuta la prueba de usuario E2E sobre el módulo de Configuración, respaldos y destrucción segura de sesiones:

1. **Precondición y Navegación:**
   - Asegura la bóveda desbloqueada con la cuenta `gabrielcrsoto@gmail.com`.
   - Navega a la pestaña **"⚙️ Configuración"**.

2. **Prueba de Exportación de Backup Cifrado:**
   - Ubica la sección de respaldo / exportación de la bóveda.
   - Haz clic en la opción de descarga de backup.
   - **Aserción:** Valida que el navegador active la descarga de un archivo con formato `.json` o extensión correspondiente, y que su contenido contenga la estructura cifrada AES-256-GCM (sin texto plano legible de los registros financieros).

3. **Auditoría del Estado de Sincronización:**
   - Examina el componente `SyncStatusIndicator` en el encabezado.
   - **Aserción:** Confirma que el estado refleje *"Drive Sincronizado"* junto a la marca temporal de la última sincronización.

4. **Prueba de Bloqueo de Bóveda y Destrucción Criptográfica en Memoria:**
   - Haz clic en el botón global `Bloquear Bóveda` en el header superior.
   - **Aserción de UI:** La aplicación debe desmontar el App Shell inmediatamente y retornar a la vista de desbloqueo/login.
   - **Aserción de Seguridad (Zero-Leak):** Inspecciona a través del entorno de evaluación:
     - `localStorage`
     - `sessionStorage`
     - Ambas estructuras deben estar libres de claves criptográficas (`cryptoKey`), sentinels o contraseñas en texto claro.

5. **Prueba de Re-desbloqueo:**
   - Ingresa nuevamente la contraseña maestra `123456789`.
   - Haz clic en `Desbloquear Bóveda`.
   - **Aserción:** La bóveda debe descifrarse correctamente, recuperando los datos desde Google Drive y restableciendo el acceso a la navegación.

6. **Entregables:**
   - Reporte con verificación del estado de seguridad, integridad del archivo exportado y registro de consola post-bloqueo.
