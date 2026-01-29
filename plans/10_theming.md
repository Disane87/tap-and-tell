# Plan 10: Theming System

Implementation of the "Tangible Digital" theme system per `10_theming_concept.md`.

## Phase 1: Foundation ✔

### CSS Custom Properties & Color Modes ✔
- [x] Setup Tailwind v4 `@theme` block with all design tokens
- [x] Dawn Mode (Light): Cream background, charcoal text, terracotta primary, sage secondary
- [x] Dusk Mode (Dark): Deep navy background, pearl text, coral primary, dusty blue secondary
- [x] All shadcn-vue semantic color slots mapped (background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring)

### Typography System ✔
- [x] Google Fonts loaded via `<link>` preconnect in nuxt.config.ts
- [x] Display font: Inter (headers)
- [x] Body font: DM Sans (body text)
- [x] Handwritten font: Caveat (guest names — guestbook authenticity)
- [x] CSS variables: `--font-display`, `--font-body`, `--font-handwritten`
- [x] Utility classes: `.font-handwritten`, `.font-display`
- [x] Base styles: html uses body font, h1-h6 use display font

### Spacing & Layout Utilities ✔
- [x] Border radius scale: sm (0.375rem), md (0.5rem), lg (0.75rem), xl (1rem)
- [x] Organic shadow scale: sm, md, lg, xl (soft rgba shadows)
- [x] Dark mode shadow overrides (deeper shadows)

## Phase 2: Components ✔

### Guest Card ✔
- [x] Polaroid-inspired card styling (`.card-polaroid`)
- [x] Soft shadow lift on hover
- [x] Photo has subtle border (`.photo-frame`)
- [x] Name in handwritten font (Caveat)
- [x] Message in clean sans-serif (DM Sans)
- [x] Timestamp in smaller, muted text

### Form Inputs ✔
- [x] Guest form uses card-polaroid styling
- [x] Display font for form heading
- [x] Descriptive subtitle text
- [x] Error state with destructive color

### Photo Upload ✔
- [x] Photo preview uses `.photo-frame` styling
- [x] Camera/upload buttons with outline variant

### Entry Sheet ✔
- [x] Handwritten font for guest name in sheet title
- [x] Photo frame styling in full view
- [x] Full date format display

## Phase 3: Dynamic Features ✔

### Theme Toggle ✔
- [x] Three-mode toggle: Light → Dark → System (cycling)
- [x] Icons: Sun (light), Moon (dark), Monitor (system)
- [x] ARIA label for accessibility
- [x] Wrapped in `<ClientOnly>` to prevent hydration mismatch

### Theme Composable (SSR-safe) ✔
- [x] `useTheme()` composable with `ref` (not `useState`) to avoid SSR payload serialization
- [x] `setTheme()`, `toggleTheme()`, `initTheme()` functions
- [x] localStorage persistence
- [x] System preference detection via `matchMedia`
- [x] Listener for system preference changes

### Hydration Safety ✔
- [x] Inline `<script>` in `<head>` applies `dark` class before first paint (FOUC prevention)
- [x] Client plugin (`theme.client.ts`) initializes theme state before component mount
- [x] ThemeToggle wrapped in `<ClientOnly>` (never SSR-rendered)
- [x] Theme refs are plain `ref()` not `useState()` — no SSR payload mismatch

### Smooth Theme Transitions ✔
- [x] `.transition-theme` class on layout root
- [x] Transitions background-color, color, border-color, box-shadow on theme change

## Phase 4: Polish ✔

### Motion System ✔
- [x] Custom easing curves: `--ease-natural`, `--ease-gentle`, `--ease-bounce`
- [x] Duration tokens: instant (100ms), quick (200ms), normal (300ms), slow (500ms)
- [x] Page transitions: fade-in + slide-up on enter, fade-out on leave
- [x] Card animations: scale-in entrance
- [x] Stagger animations for list items (7 levels)
- [x] Gentle pulse keyframe for loading states

### Accessibility ✔
- [x] `prefers-reduced-motion: reduce` disables all animations/transitions
- [x] Focus-visible indicators: 3px accent outline with 2px offset
- [x] Font smoothing for crisp rendering
- [x] Deep navy dark mode (not pure black) to reduce eye strain
- [x] ARIA labels on theme toggle

### Layout ✔
- [x] Frosted glass header: `bg-card/80 backdrop-blur-sm`
- [x] Subtle border: `border-border/60`
- [x] Container max-width with consistent padding
- [x] Navigation links with muted-foreground → foreground hover transition
