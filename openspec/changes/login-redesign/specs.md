# Specifications: Login Page Split-View Redesign

## Spec 1: Responsive Layout & Grid Breakdown
- **Breakpoint threshold:** `lg` (1024px).
- **Container:** `max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8`.
- **Layout structure on desktop (lg+):**
  - CSS Grid / Flex layout: `grid lg:grid-cols-12 gap-8 lg:gap-12 items-center`.
  - Left column: `lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-8`.
  - Right column: `lg:col-span-6 xl:col-span-5 flex justify-center`.
- **Layout structure on mobile (<1024px):**
  - Single column centered layout with left branding panel hidden or condensed inside the card header.
  - Full width card constrained to `max-w-md w-full`.

## Spec 2: Left Branding & Value Proposition Panel
- **Logo Presentation:**
  - High resolution `public/logo.png` rendered with `w-20 h-20 lg:w-24 lg:h-24` and emerald ambient drop shadow `drop-shadow-[0_0_20px_rgba(52,211,153,0.35)]`.
- **Brand Title & Tagline:**
  - Brand name: `Tu Chauchera` with gradient `bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-200`.
  - Tagline: `Gestión Financiera Inteligente`.
  - Subtitle: `Control total de tus finanzas personales con arquitectura local-first y privacidad absoluta.`
- **Value Proposition Badges (3 items):**
  - Item 1: **Privacidad Local-First** — Icon: Shield/Lock. Description: Tus datos se procesan y almacenan en tu dispositivo, sin servidores intermediarios.
  - Item 2: **Cifrado AES-256** — Icon: Key/Vault. Description: Cifrado simétrico de grado bancario protegido por tu contraseña maestra personal.
  - Item 3: **Sincronización Directa** — Icon: Cloud/Drive. Description: Respaldo cifrado automático en tu propio Google Drive (`appDataFolder`).

## Spec 3: Right Authentication Card & Interactive States
- **Card Styling:**
  - `bg-slate-900/70 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-950/50`.
- **State 1: Unauthenticated (Google OAuth):**
  - Clear heading: "Iniciar Sesión" or "Bienvenido de vuelta".
  - High contrast Google sign-in button with clean hover/active animations, accessible focus ring, and minimum touch target >=44px.
  - Note: "Tus datos se guardan cifrados directamente en tu propio Google Drive."
- **State 2: Authenticated & Checking Drive:**
  - Spinner with "Verificando Google Drive...".
- **State 3: First Use (Create Master Password):**
  - Warning banner with high-visibility icon and clear disclaimer about password recovery.
  - Password and confirm password inputs with clear validation feedback.
  - Submit CTA: "Crear Bóveda Segura".
- **State 4: Returning User (Unlock Vault):**
  - User email pill indicator.
  - Password input with clear placeholder.
  - Submit CTA: "Desbloquear Bóveda".
- **State 5: Unlocked confirmation state:**
  - Success message and lock/logout button.

## Spec 4: Accessibility & Ambient Visuals
- Ambient background: `bg-slate-950` with fixed radial glow spheres (top-left emerald, bottom-right cyan/teal).
- WCAG AA contrast for text elements (`text-slate-200` / `text-slate-300` instead of `text-slate-500` for critical secondary copy).
