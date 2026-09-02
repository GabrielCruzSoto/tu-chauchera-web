# SDD Technical Design: Módulo de Configuración del Usuario (`user-settings-module`)

## 1. Architecture Overview

El módulo de Configuración se diseñará siguiendo la estructura modular orientada a features de la aplicación (`src/features/settings/`), con servicios compartidos en `src/shared/services/`.

```
src/
├── features/
│   ├── settings/
│   │   ├── components/
│   │   │   ├── SettingsView.tsx          # Vista contenedor con navegación por pestañas internas
│   │   │   ├── CategoryManagerTab.tsx    # Mantenedor completo de categorías con feedback de uso
│   │   │   ├── UserProfileTab.tsx        # Perfil Google + Preferencias (moneda, fecha, tema)
│   │   │   ├── DataStorageTab.tsx        # Métricas de Drive, descarga JSON, visor de schema
│   │   │   ├── WipeConfirmModal.tsx      # Modal de confirmación con frase de seguridad
│   │   │   └── StorageStatsCard.tsx      # Tarjeta con métricas de archivos de Drive
│   │   ├── hooks/
│   │   │   ├── useStorageMetrics.ts      # Consulta y caché de métricas de Drive
│   │   │   └── useBackupExport.ts        # Generador de backup JSON
│   │   ├── store/
│   │   │   └── settingsSlice.ts          # Zustand store para preferencias de usuario
│   │   └── index.ts
├── shared/
│   ├── services/
│   │   ├── driveClient.ts                # Extendido con getStorageStats y wipeAppData
│   │   └── backupService.ts              # Serializador y exportador de backup JSON
│   └── types/
│       └── settings.ts                   # Tipos de preferencias y métricas de almacenamiento
```

---

## 2. Component Design & Responsibilities

### 2.1 `SettingsView.tsx`
- Componente principal montado en `App.tsx` al seleccionar la pestaña `settings`.
- Proporciona pestañas secundarias tipo pills:
  1. `Categorías` (Icono 🏷️)
  2. `Perfil & Preferencias` (Icono 👤)
  3. `Almacenamiento & Bóveda` (Icono 💾)
- Control responsive para pantallas pequeñas (scroll horizontal de tabs / full width).

### 2.2 `CategoryManagerTab.tsx`
- Extiende la funcionalidad de `CategorySettingsModal` adaptándola a vista de página completa.
- Incorpora:
  - Formulario de creación/edición con preview de color.
  - Tabla/Lista interactiva con selector de colores (`CATEGORY_PALETTE`).
  - Contador de obligaciones activas asociadas a cada categoría.
  - Alerta explicativa y botón de borrado deshabilitado si la categoría tiene obligaciones activas.

### 2.3 `UserProfileTab.tsx`
- Lee datos de usuario autenticado (`user.email`, `user.name`, `user.picture`) desde `useAuthStore`.
- Muestra el estado de cifrado de la bóveda (AES-GCM 256-bit + PBKDF2 100k iteraciones).
- Formulario de preferencias conectado a `useSettingsStore`:
  - Selector de moneda: `CLP` ($), `USD` (US$), `EUR` (€), `UF` (UF).
  - Selector de formato de fecha: `DD/MM/YYYY`, `YYYY-MM-DD`.
  - Selector de tema: `dark`, `light`, `system`.
- Botón "Guardar Preferencias" con feedback visual toast y guardado local + push a Drive.

### 2.4 `DataStorageTab.tsx` & `StorageStatsCard.tsx`
- Consume `useStorageMetrics()` para listar archivos en `appDataFolder`:
  - `obligations.enc`, `incomes.enc`, `categories.enc`, `settings.enc`, `meta.json`.
- Muestra el tamaño de cada archivo en KB/Bytes, total acumulado y fecha de última modificación.
- Sección de Versión del Schema: Muestra `v1.1.0` (o la leída desde `meta.json`).
- Sección de Respaldo: Botón para descargar el backup JSON completo (`useBackupExport`).
- Zona de Peligro: Botón rojo "Borrar Bóveda y Resetear Datos" que abre `WipeConfirmModal`.

### 2.5 `WipeConfirmModal.tsx`
- Modal de alta prioridad con fondo oscuro y advertencias en rojo.
- Requiere escribir exactamente `ELIMINAR MIS DATOS` en un input controlado.
- Al confirmar:
  1. Invoca `driveClient.wipeAllAppData()`.
  2. Limpia stores (`obligations`, `income`, `settings`, `sync`).
  3. Ejecuta `logout()` cerrando sesión.

---

## 3. Service Layer Enhancements

### 3.1 `DriveClient` Extensions (`src/shared/services/driveClient.ts`)

```typescript
export interface DriveFileStats {
  id: string
  name: string
  sizeBytes: number
  modifiedTime: string
}

// Métodos a incorporar en DriveClient:
async getStorageStats(): Promise<{ totalBytes: number; files: DriveFileStats[] }> {
  // Query: "appDataFolder" in parents and trashed = false
  // Fields: files(id, name, size, modifiedTime)
}

async deleteFile(fileId: string): Promise<void> {
  // DELETE https://www.googleapis.com/drive/v3/files/{fileId}
}

async wipeAllAppData(): Promise<void> {
  // Obtiene todos los archivos de appDataFolder y ejecuta deleteFile en paralelo
  // Limpia el cache interno de fileIdCache
}
```

### 3.2 `BackupService` (`src/shared/services/backupService.ts`)

```typescript
export interface AppBackupPayload {
  exportDate: string
  schemaVersion: string
  appVersion: string
  data: {
    obligations: any
    incomes: any
    categories: any
    settings: any
  }
}

export function generateBackupJson(payload: AppBackupPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `tu-chauchera-backup-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

---

## 4. Integration with App Navigation (`src/app/App.tsx`)

- Actualizar `navItems`:
```typescript
const navItems = [
  { id: "matrix", label: "📊 Matriz Consolidada" },
  { id: "calendar", label: "📅 Flujos & Cuotas" },
  { id: "income", label: "💵 Ingresos" },
  { id: "obligations", label: "💳 Obligaciones (Core)" },
  { id: "settings", label: "⚙️ Configuración" },
] as const
```
- Renderizar `<SettingsView />` cuando `activeTab === "settings"`.

---

## 5. Testing Strategy
1. **Unit Tests**:
   - `settingsSlice.test.ts`: Pruebas de actualización de preferencias y estado inicial.
   - `driveClient.test.ts`: Pruebas de `getStorageStats`, `deleteFile`, `wipeAllAppData` con mocks de `fetch`.
   - `backupService.test.ts`: Pruebas de armado del payload de backup y trigger de descarga.
2. **Component Tests**:
   - `CategoryManagerTab.test.tsx`: Renderizado de categorías, conteo de uso, validación de borrado bloqueado.
   - `UserProfileTab.test.tsx`: Muestra datos de usuario y permite actualizar moneda/tema.
   - `DataStorageTab.test.tsx`: Muestra métricas de Drive y botón de exportación.
   - `WipeConfirmModal.test.tsx`: Bloquea confirmación hasta escribir la frase exacta y ejecuta wipe.
