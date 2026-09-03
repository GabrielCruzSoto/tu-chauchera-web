# Design & Architecture: Login Page Split-View Redesign

## Visual Layout Diagram (Desktop lg+)

```
+---------------------------------------------------------------------------------+
| Ambient Blur Background (Emerald/Teal Glows)                                    |
|                                                                                 |
|   +------------------------------------+   +--------------------------------+   |
|   | LEFT COLUMN (Branding & Pillars)   |   | RIGHT COLUMN (Auth Card)       |   |
|   |                                    |   |                                |   |
|   |  [ LOGO ]                          |   |  +--------------------------+  |   |
|   |  Tu Chauchera                      |   |  | Tu Chauchera (Mobile only)| |   |
|   |  Gestión Financiera Inteligente    |   |  |                          |  |   |
|   |                                    |   |  | State: Google Login /    |  |   |
|   |  [Shield] Privacidad Local-First   |   |  |        Master Password   |  |   |
|   |  [Lock]   Cifrado AES-256          |   |  |                          |  |   |
|   |  [Cloud]  Sincronización Drive     |   |  | [ Continuar con Google ] |  |   |
|   |                                    |   |  +--------------------------+  |   |
|   +------------------------------------+   +--------------------------------+   |
+---------------------------------------------------------------------------------+
```

## Component Breakdown & Architecture
- **Single Component Refactor:** The redesign will be encapsulated within [`src/features/auth/components/LoginPage.tsx`](file:///home/gabrielcruzsoto/Proyectos/Tu-chauchera-web/src/features/auth/components/LoginPage.tsx).
- **Sub-sections inside LoginPage:**
  1. `BackgroundGlow`: Ambient glow effect layer using `pointer-events-none` with soft blur circles.
  2. `BrandHeroSection`: Desktop-only (`hidden lg:flex`) left-hand column rendering the brand story and 3 feature cards.
  3. `AuthCard`: Responsive right-hand card with glassmorphism container and conditional views based on `isAuthenticated`, `isCheckingDrive`, `isFirstUse`, and `isUnlocked`.

## Security & State Integrity
- All existing hooks (`useAuthStore`), OAuth services (`requestGoogleAccessToken`, `fetchGoogleUserProfile`), and master password functions (`setupMasterPassword`, `unlockWithMasterPassword`) remain unchanged.
