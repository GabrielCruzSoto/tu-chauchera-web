# Functional Specification — make-site-responsive

## Change Name
`make-site-responsive`

## Source
Based on: `openspec/changes/make-site-responsive/proposal.md`

---

## Breakpoint Standards

The application SHALL align to the following standard responsive breakpoints:
- **Mobile (`< 640px`)**: Single column flow, bottom sheet or full-screen modals, hamburger/drawer navigation, touch targets ≥ 44×44px.
- **Tablet (`640px – 1023px`, Tailwind `sm` & `md`)**: 2-column grids, compact headers, scroll-assisted dense tables.
- **Desktop (`≥ 1024px`, Tailwind `lg` & `xl`)**: Multi-column grids (3+ cols), persistent horizontal tabs, full matrix grid layout.

---

## Capability 1: responsive-ui (New)

### Requirement: Global Responsive Layout & Navigation
The system MUST provide an adaptive layout container and navigation header that switches seamlessly between desktop horizontal tabs and mobile navigation drawers/menus without layout jitter or horizontal overflow.

#### Scenario: Mobile viewport navigation drawer
- GIVEN a user accessing the app on a screen width < 640px
- WHEN viewing the application header
- THEN the system MUST collapse top-level navigation links into a mobile menu trigger (hamburger button)
- AND the touch target for the trigger MUST be at least 44×44px
- AND clicking the trigger MUST open a responsive navigation drawer displaying all view links and user actions.

#### Scenario: Tablet and desktop viewport navigation
- GIVEN a user on a viewport width ≥ 1024px
- WHEN viewing the top navigation bar
- THEN the system MUST render horizontal navigation tabs inline with active view indicators
- AND the mobile menu trigger MUST be hidden.

---

### Requirement: Financial Matrix Responsive Presentation
The system MUST support both horizontal scrollable matrix presentation with sticky category columns and an alternate mobile card summary view on mobile viewports to prevent table clipping.

#### Scenario: Financial matrix horizontal scroll with pinned categories on tablet/mobile
- GIVEN a user viewing the Financial Matrix on a viewport < 1024px
- WHEN the user scrolls horizontally through future month columns
- THEN the category header column MUST remain sticky on the left
- AND horizontal scroll indicators MUST display visually to indicate scrollability.

#### Scenario: Switching to mobile card view
- GIVEN a user on a mobile viewport (< 640px)
- WHEN the user toggles the matrix display mode to "Card View"
- THEN the system MUST render each category as a stacked summary card with monthly breakdown items
- AND all action buttons within the card MUST maintain a minimum touch target of 44×44px.

---

### Requirement: Responsive Obligations and Installments Lists
The system MUST adapt list views and metric summaries across screen sizes using responsive CSS grids (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) and stacked toolbars on narrow viewports.

#### Scenario: Obligations list grid on mobile vs desktop
- GIVEN a user viewing the Obligations List
- WHEN the viewport width is < 640px
- THEN obligation cards MUST render in a single-column layout with stacked action buttons
- WHEN the viewport width is ≥ 1024px
- THEN obligation cards MUST render in a 3-column grid layout.

#### Scenario: Monthly installments view toolbar stacking
- GIVEN a user viewing Monthly Installments
- WHEN the screen width is < 640px
- THEN the month selector, status filters, and summary metric cards MUST stack vertically with full-width controls
- AND no horizontal clipping or layout shift SHALL occur.

---

### Requirement: Responsive Income Management View
The system MUST adapt the income list, summary metrics bar, and action triggers to stack cleanly on mobile viewports.

#### Scenario: Income summary and list adaptation on mobile
- GIVEN a user on a screen width < 640px
- WHEN navigating to the Income view
- THEN total income and recurring indicators MUST display in a stacked metric banner
- AND the "Add Income" action MUST be fixed or full-width for easy single-thumb tapping.

---

### Requirement: Mobile Modal Dialogs & Touch Form UX
The system MUST render modals as responsive bottom-sheets or full-screen dialogs on mobile viewports (`< 640px`) with scrollable form content and touch-friendly controls.

#### Scenario: Opening modal on mobile screen
- GIVEN a user on a viewport < 640px opening any modal (`ObligationFormModal`, `PaymentModal`, `RenegotiationModal`, `CategorySettingsModal`, `IncomeModal`)
- WHEN the modal is displayed
- THEN the modal container MUST occupy full width / bottom-sheet layout with `inset-x-0 bottom-0` or full viewport coverage
- AND the modal body MUST be vertically scrollable if content exceeds viewport height
- AND form inputs, select dropdowns, and buttons MUST have minimum heights of 44px.

#### Scenario: Opening modal on desktop screen
- GIVEN a user on a viewport ≥ 640px opening a modal
- WHEN the modal is rendered
- THEN it MUST appear as a centered floating dialog box with backdrop overlay and max-width bounds (`max-w-lg` to `max-w-2xl`).

---

### Requirement: Responsive Authentication & Setup Screens
The system MUST scale login, master password setup, and onboarding screens fluidly across mobile, tablet, and desktop screens without clipping or overflow.

#### Scenario: Login screen on small mobile viewport
- GIVEN a user navigating to the Login / Master Password screen on a 375px wide device
- WHEN the page renders
- THEN the login card MUST occupy fluid width with horizontal padding (minimum 16px padding from viewport edges)
- AND all input fields and submit actions MUST be easily tappable without zooming.
