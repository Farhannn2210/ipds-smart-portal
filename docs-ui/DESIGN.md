---
name: IPDS Smart Portal Central Sulawesi
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006243'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d57'
  on-tertiary-container: '#bdffdc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.005em
  label-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  label-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  label-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a high-performance, developer-grade enterprise interface for the Integrated Statistical Data Service (IPDS) Smart Portal at BPS Provinsi Sulawesi Tengah. It synthesizes the technical precision of Vercel with the refined micro-interactions and density of Linear.

### Target Audience & Emotional Intent
- **Audience:** Data engineers, regional statisticians, government planners, and administrative analysts who process massive datasets, spatial registries, and official provincial indicators.
- **Perception:** Surgical accuracy, frictionless data digestion, operational calm, and uncompromising reliability. Every interaction should feel immediate, structural, and free of ornamental noise.

### Design Style: Technical Precision Minimalism
- **Monochrome Foundation:** Cool slate canvas, pure white utility planes, and calibrated hair-line borders provide structural layout discipline.
- **Tactile Utility:** Micro-elevations, condensed layout density, and instant visual state feedback convey a modern productivity workspace rather than a generic bureaucratic dashboard.
- **Information Density:** High visual signal-to-noise ratio where monospace numerical styling and strict geometric alignment elevate raw statistics into actionable insight.

## Colors

The palette leverages a crisp cool-light foundation with high-contrast structural text and high-intent electric accents.

### Color Architecture
- **Canvas Base (`#F1F5F9`):** Ground level backing for page framing and structural gutter separations.
- **Surface Pure (`#FFFFFF`):** High-priority operational cards, tables, elevated modals, and action bars.
- **Sub-Surface Tier (`#F8FAFC`):** Table headers, inactive inputs, code blocks, and read-only statistical cells.
- **Micro-Border (`#E2E8F0`):** Single-pixel perimeter boundary separating white cards from cool-light canvas.
- **Primary Text (`#0F172A`):** Deep charcoal delivering WCAG AAA-compliant visual legibility for high-density data.
- **Secondary Text (`#64748B`):** Muted slate for metadata labels, column headers, units of measure, and non-active tooltips.
- **Electric Accent (`#2563EB`):** High-velocity royal cobalt reserved exclusively for active states, primary CTA buttons, selection indicators, and interactive links.
- **System States:**
  - Success/Live Pipeline: Emerald (`#059669`)
  - Warning/Sync Pending: Amber (`#D97706`)
  - Critical/Error: Crimson (`#DC2626`)

## Typography

Typography delivers systematic, non-distracting navigation paired with tabular clarity.

### Family Roles
- **Geist:** Primary typeface for all UI interfaces, titles, structural panels, and documentation. Delivers neutral neo-grotesque legibility with tight kerning.
- **JetBrains Mono:** Dedicated numerical and status typeface. Applied strictly to:
  - Statistical quantities, raw metrics, and delta percentages.
  - API endpoints, query params, latency counters (`42ms`), and timestamp indicators.
  - Global keyboard shortcuts (`⌘K`, `Shift+P`).
  - Metadata badges, regional BPS Wilayah codes (`72.xx`), and server state logs.

### Rules of Usage
- Numerical figures must always enable tabular figures (`font-variant-numeric: tabular-nums`) to preserve column vertical tracking.
- All monospace labels and badges are set in tight, crisp bounding boxes with reduced vertical leading to avoid baseline drift.

## Layout & Spacing

The portal layout adheres to a high-density, multi-column desktop grid configured for tabular visualization and spatial monitoring.

### Grid Engine
- **Desktop (≥ 1280px):** 12-column responsive grid with a fixed collapsible left navigation rail (240px wide). Margins are `1.5rem` (`24px`), column gutters set to `1rem` (`16px`).
- **Tablet (768px – 1279px):** 8-column layout. The primary navigation rail collapses into an icon-only dock (56px wide).
- **Mobile (< 768px):** 4-column single flow with continuous `1rem` outer horizontal margins. Side panels convert into sheet overlays.

### Spatial Discipline
- Razor-sharp structural rhythm: Internal card padding balances `0.75rem` (`space-md`) for high-density tables and `1.25rem` (`space-lg`) for data metric overviews.
- Inline gaps between adjacent indicators (icons, badges, text) utilize micro-spacing: `0.25rem` (`space-xs`) or `0.5rem` (`space-sm`).

## Elevation & Depth

Visual hierarchy is maintained through subtle tonal boundaries and faint diffused drop shadows rather than heavy drop-offs.

### Depth Hierarchy
- **Level 0 (Canvas Base):** Ground color `#F1F5F9`. Flat, zero shadow.
- **Level 1 (Card & Module Layer):** `#FFFFFF` surfaces anchored with a perimeter 1px border (`#E2E8F0`) and an ambient, ultra-diffused shadow:
  - `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02)`
- **Level 2 (Dropdowns, Flyouts & Floating Context Menus):** Pure white background with hairline border `#E2E8F0` and elevated ambient reach:
  - `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`
- **Level 3 (Modals & Command Palettes):** Crisp `#FFFFFF` container with perimeter micro-border `#CBD5E1`, set above an atmospheric light wash backdrop:
  - `backdrop-filter: blur(4px); background-color: rgba(15, 23, 42, 0.15);`
  - Container shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`

## Shapes

The geometric architecture relies on soft industrial rounding (`0.25rem` / `4px`), ensuring maximum data density and clean grid lines.

### Corner Radii Guidelines
- **Base Components (`rounded`, 4px):** Applied to buttons, text inputs, monospace status tags, dropdown triggers, and interactive list items.
- **Containment Units (`rounded-lg`, 8px):** Applied to structural analytical cards, metric grouping widgets, tables, and modal dialogs.
- **Floating Overlays (`rounded-xl`, 12px):** Applied exclusively to global command interfaces (`⌘K` spotlight) and elevated toast frames.
- **Full Radius (`rounded-full`):** Strictly restricted to ping status markers, active presence avatars, and toggle switch handles.

## Components

### Buttons
- **Primary:** Solid `#2563EB` fill, `#FFFFFF` text, `0.25rem` radius. Inset highlight `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16)`. Hover: `#1D4ED8`. Active: `#1E40AF`.
- **Secondary:** `#FFFFFF` fill, `#0F172A` text, 1px border `#E2E8F0`, subtle shadow. Hover: `#F8FAFC`, border color shifts to `#CBD5E1`.
- **Ghost / Subtle:** No border or background. `#64748B` text. Hover: `#F1F5F9`, text shifts to `#0F172A`.

### Status Badges & Chips
- **Monospace Metadata Tags:** Monospaced (`JetBrains Mono`, 11px), uppercase or raw alphanumeric code. Background `#F8FAFC`, border 1px `#E2E8F0`, text `#0F172A`.
- **State Indicator Badges:** Incorporate a 6px circular dot.
  - Active/Online: Emerald dot (`#059669`) with emerald-tinted background (`#ECFDF5`).
  - Pending: Amber dot (`#D97706`) with amber-tinted background (`#FFFBEB`).

### Data Tables & List Views
- **Header:** `#F8FAFC` background, uppercase 11px mono-label (`#64748B`), bottom border 1px `#E2E8F0`.
- **Rows:** Alternating hover state with immediate `#F8FAFC` fill, zero transition lag. Row divider 1px `#F1F5F9`.
- **Data Cells:** Primary metrics set in `JetBrains Mono` aligned right; qualitative descriptors set in `Geist` aligned left.

### Form Inputs & Filters
- **Text Inputs:** `#FFFFFF` background, 1px `#E2E8F0` border, `0.25rem` radius. Height 32px (compact) or 36px (standard). Text `#0F172A`, placeholder `#94A3B8`.
- **Focus Ring:** Explicit 2px electric blue glow (`box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2)`), border `#2563EB`.

### Selection Controls
- **Checkboxes & Radios:** Sharp 14px boxes. Inactive: `#FFFFFF` with 1px `#CBD5E1` border. Active: Solid `#2563EB` with pure white check mark icon.
- **Keyboard Shortcuts:** Keyboard key cap visual (`<kbd>`) using `JetBrains Mono`, background `#F1F5F9`, 1px border `#CBD5E1`, subtle bottom edge depth (`border-bottom-width: 2px`).

### Cards & Analytical Modules
- Pure white `#FFFFFF` surface with continuous 1px `#E2E8F0` border.
- Split-panel architecture: Card headers feature an integrated top sub-bar divided by a horizontal 1px hairline border, segregating title context from data visualizers.