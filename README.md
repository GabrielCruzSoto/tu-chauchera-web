# Tu Chauchera Web 🪙

Aplicación web para la gestión financiera personal, control de ingresos, gastos, deudas y obligaciones financieras.

**Local-first y zero backend:** tus datos se almacenan cifrados en tu propio Google Drive (`appDataFolder`) con AES-256-GCM. La clave se deriva de tu contraseña maestra vía PBKDF2 — ni el servidor ni nadie más puede leer tu información (zero-knowledge).

---

## 🚀 Tecnologías

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Estilos:** Tailwind CSS + Lucide Icons
- **Estado:** Zustand
- **Auth:** Google OAuth 2.0
- **Almacenamiento:** Google Drive (`appDataFolder`) con cifrado AES-256-GCM
- **Tests:** Vitest + Testing Library
- **Deploy:** Vercel

---

## 🛠️ Instalación y Desarrollo

1. **Clonar e instalar dependencias:**
   ```bash
   pnpm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env.local
   # Editar .env.local con tu VITE_GOOGLE_CLIENT_ID
   # (crear credenciales en https://console.cloud.google.com/apis/credentials)
   ```

3. **Iniciar servidor de desarrollo:**
   ```bash
   pnpm dev
   ```

4. **Validaciones de código:**
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

---

## 📐 Estándares de Desarrollo y Flujo de Trabajo

Este proyecto sigue estrictamente el modelo **GitFlow** y la especificación de **Conventional Commits**.

👉 Consulta el documento oficial de reglas en: **[CONTRIBUTING.md](CONTRIBUTING.md)**.
