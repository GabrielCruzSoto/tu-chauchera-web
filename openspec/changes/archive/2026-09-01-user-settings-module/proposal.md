# SDD Proposal: Módulo de Configuración del Usuario (`user-settings-module`)

## 1. Executive Summary

El módulo de Configuración del Usuario (`user-settings-module`) proporciona una interfaz centralizada y accesible para gestionar aspectos clave de la experiencia del usuario, personalización de datos y administración de la bóveda en Google Drive para la aplicación **Tu Chauchera Web**.

Este módulo integra:
1. **Mantenedor de Categorías**: CRUD intuitivo para categorías de gastos/obligaciones/ingresos con colores, iconos, identificación de categorías base vs. personalizadas y protección de integridad referencial.
2. **Información y Preferencias del Usuario**: Visualización de cuenta Google conectada y configuración de preferencias regionales/visuales (moneda principal CLP/USD/EUR/UF, formato de fecha, tema oscuro/claro).
3. **Gestión de Datos y Storage en Google Drive**: Visor de estadísticas de espacio ocupado en `appDataFolder`, visor de versión de schema, exportación completa de respaldo en JSON y reseteo seguro de datos.

---

## 2. Problem Statement & Motivation

Actualmente:
- La gestión de categorías está limitada a un modal accesible únicamente desde el formulario de obligaciones, dificultando su administración global y el control de categorías fijas vs personalizadas.
- No existe una vista donde el usuario pueda revisar el estado de su cuenta, sus preferencias visuales y regionales (moneda, formatos) persistidas.
- No hay visibilidad del espacio ocupado por los archivos cifrados en Google Drive (`obligations.enc`, `incomes.enc`, `categories.enc`, `settings.enc`, `meta.json`), ni una forma directa de exportar un respaldo JSON completo o limpiar los datos de forma segura para reiniciar la bóveda.

---

## 3. Scope & Requirements

### 3.1 Mantenedor de Categorías (Category Management)
- **Categorías Base del Sistema**: Identificadas visualmente, con colores predeterminados y opción de personalización.
- **Categorías Personalizadas**: Creación con selector de nombre, color (paleta extendida) e icono representativo.
- **Validación de Uso y Eliminación Segura**:
  - Cálculo en tiempo real de obligaciones asociadas.
  - Bloqueo de eliminación cuando la categoría está asignada a una o más obligaciones activas, mostrando mensaje explicativo.
  - Soporte de edición in-place (nombre y color).

### 3.2 Información del Usuario y Preferencias (User Profile & App Settings)
- **Tarjeta de Cuenta**:
  - Avatar, Nombre completo y Correo electrónico sincronizados desde la sesión de Google OAuth.
  - Estado de seguridad de la Bóveda Cifrada (estado desbloqueado, algoritmo AES-GCM + PBKDF2).
- **Preferencias de la Aplicación**:
  - **Moneda Principal**: CLP ($), USD ($), EUR (€), UF.
  - **Formato de Fecha**: DD/MM/YYYY vs YYYY-MM-DD.
  - **Tema Visual**: Modo Oscuro (predeterminado) / Modo Claro / Seguir Sistema.
  - Persistencia de preferencias en el store y sincronización cifrada en Google Drive (`settings.enc`).

### 3.3 Gestión de Datos y Almacenamiento en Google Drive (Data Storage & Security)
- **Métricas de Almacenamiento**:
  - Consulta del tamaño en bytes/KB de cada archivo en `appDataFolder` (`obligations.enc`, `incomes.enc`, `categories.enc`, `settings.enc`, `meta.json`).
  - Tamaño total acumulado y fecha de última sincronización.
  - Botón de refresco manual de métricas.
- **Versión de Schema**:
  - Indicador de la versión de schema activa (ej. `v1.1.0`) y estado de salud de la estructura de datos.
- **Exportación de Respaldo (Backup JSON)**:
  - Generación instantánea y descarga en el navegador de un archivo `tu-chauchera-backup-YYYY-MM-DD.json` con todos los datos descifrados de la sesión.
- **Reseteo Seguro de Bóveda (Wipe Data)**:
  - Modal crítico de confirmación requiriendo ingresar una frase exacta (ej. `"ELIMINAR MIS DATOS"`).
  - Purgado de archivos en `appDataFolder` de Google Drive y limpieza de stores locales.
  - Cierre de sesión y redirección segura al login.

---

## 4. User Experience & UI Workflow

Se integrará una nueva pestaña en la barra de navegación principal:
- Pestaña: **"⚙️ Configuración"** (Accesible en Navbar de escritorio y Drawer móvil).
- Estructura de la vista:
  - **Header**: Título "Configuración & Bóveda", descripción y estado de conexión.
  - **Sub-navegación / Tabs internos**:
    1. `Categorías`: Mantenedor con listado, badges de color, conteo de uso y formulario de adición/edición.
    2. `Perfil & Preferencias`: Tarjeta de Google User + Formulario de preferencias generales.
    3. `Almacenamiento & Bóveda`: Métricas de Drive, descarga de respaldo, versión de schema y zona de peligro (borrado seguro).

---

## 5. Technical Impact & Dependencies

1. **Routing & Navigation (`src/app/App.tsx`)**:
   - Añadir tab `settings` a `navItems` y renderizado condicional de `<SettingsView />`.
2. **Drive Client (`src/shared/services/driveClient.ts`)**:
   - Añadir método `getStorageStats()` para obtener tamaños y metadatos de los archivos remotos.
   - Añadir método `wipeAllAppData()` para eliminar los archivos de `appDataFolder`.
3. **Stores (`src/features/settings/store/settingsSlice.ts`)**:
   - Store Zustand para preferencias con serialización y sync con `settings.enc`.
4. **Pruebas Unitarias y de Integración**:
   - Tests de componentes para `SettingsView`, `CategoryManagerTab`, `UserProfileTab`, `DataStorageTab`, `WipeConfirmModal`.
   - Tests para `driveClient.getStorageStats` y `backupService`.

---

## 6. Success Criteria
- El usuario puede navegar a la sección de Configuración desde cualquier dispositivo (responsive).
- El usuario puede crear, editar y eliminar categorías de forma segura con feedback inmediato de uso.
- El usuario puede cambiar su moneda y formato de fecha y ver reflejados los cambios de inmediato.
- El usuario puede ver el tamaño real ocupado en su Google Drive y descargar su copia de seguridad en JSON.
- El reseteo seguro purga correctamente Google Drive tras ingresar la frase de validación.
