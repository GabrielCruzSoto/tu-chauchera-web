# Proposal: Login Page Split-View Redesign

## Context & Motivation
The current login interface is functional but visually minimal. On larger screens, the single centered card leaves vast empty space and under-communicates the value proposition and security foundations of Tu Chauchera.

This change transforms `LoginPage.tsx` into a modern, split-view landing and authentication portal with high-impact branding on desktop while retaining a clean, centered experience on mobile.

## Requirements & Scope

### 1. Visual Layout (Responsive Split-View)
- **Desktop (`lg` breakpoint >=1024px):**
  - **Left Column (Branding & Value Proposition):**
    - High-resolution brand logo with subtle glow.
    - Compelling value title: "Tu Chauchera — Gestión Financiera Inteligente".
    - 3 value cards/pills with descriptive icons and clear hierarchy:
      1. **Privacidad Local-First:** Tus datos se procesan en tu navegador sin servidores intermedios.
      2. **Cifrado AES-256:** Bóveda con clave maestra privada, inaccesible para terceros.
      3. **Sincronización Google Drive:** Respaldo automático directo en tu cuenta privada de Google.
  - **Right Column (Access & Vault Management):**
    - Glassmorphism card (`backdrop-blur-xl`, `border-slate-800`, `shadow-2xl`).
    - Dedicated authentication states:
      - Initial OAuth state with high-contrast Google CTA button.
      - First-use master password setup with clear warning banner.
      - Vault unlock with password input and clear feedback.
      - Unlock confirmation state with sign-out / lock action.
- **Mobile & Tablet (<1024px):**
  - Unified centered layout with compact logo at the top of the card.
  - Mobile-optimized tap targets (>=44px) and clear spacing.

### 2. Atmosphere & Visual Polish
- Dark slate background (`bg-slate-950`) with ambient light orbs (`blur-3xl` in emerald and teal tones).
- Elevated typography contrast meeting WCAG AA standards.
- Polished interactive states (hover, focus rings, disabled states, loading spinners).

### 3. Non-Goals
- No changes to encryption cryptography (Web Crypto API, AES-256-GCM logic).
- No changes to Google OAuth token exchange or Google Drive sync protocols.
- No changes to existing authentication store (`useAuthStore`).

## Success Criteria
- [ ] Responsive split-view renders properly on `lg` screens and switches gracefully to single-column on `<lg`.
- [ ] Value proposition pills and logo render with correct contrast and styling.
- [ ] All auth states (Google Login, Drive Check, Setup Master Password, Unlock Vault, Logged In) function without regressions.
- [ ] Existing test suite passes with 100% success rate.
