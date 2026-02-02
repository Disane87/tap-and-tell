# Tap & Tell Design System

> Emotional, native design language without prominent borders
> Version 1.1 | Last updated: February 2, 2026

## Design Philosophy

**Core Principles:**
- **Emotional & Human**: Handwritten fonts, soft roundings, natural interactions
- **Glassmorphism**: Subtle transparency, backdrop-blur effects instead of hard borders
- **Smooth Transitions**: Fluid animations, no harsh jumps
- **Native Feel**: No white-box aesthetics — organic, breathing UI
- **Breathing Space**: Generous spacing, clear hierarchy without visual aggression

---

## Color Palette

### Brand Colors
```css
--color-primary: #10b981 (Emerald Green)
--color-primary-foreground: #ffffff
```

### Neutral Colors (Light Mode)
```css
--color-background: #ffffff
--color-foreground: #171717
--color-muted: #f5f5f5
--color-muted-foreground: #737373
--color-card: #ffffff
--color-card-foreground: #171717
```

### Neutral Colors (Dark Mode)
```css
--color-background: #0a0a0a
--color-foreground: #fafafa
--color-muted: #262626
--color-muted-foreground: #a3a3a3
--color-card: #171717
--color-card-foreground: #fafafa
```

### Semantic Colors
```css
--color-destructive: #ef4444 (Red)
--color-success: #10b981 (Emerald - same as primary)
--color-warning: #f59e0b (Amber)
```

---

## Typography

### Font Families
- **Sans (Body)**: `'Inter'` — Clean, modern readability
- **Display (Headlines)**: `'DM Sans'` — Bold, distinctive headings
- **Handwritten (Personal)**: `'Caveat'` — Emotional, human accents

### Font Size Hierarchy
```css
text-xs: 0.75rem     /* Labels, Badges */
text-sm: 0.875rem    /* Secondary Text */
text-base: 1rem      /* Body */
text-lg: 1.125rem    /* Lead Text */
text-xl: 1.25rem     /* Section Headers */
text-2xl: 1.5rem     /* Page Titles */
text-3xl: 1.875rem   /* Hero Headlines */
```

### Handwritten Sizes (Caveat Font)
```css
text-xl: Names on cards (20px)
text-2xl: Featured names (24px)
text-3xl: Hero text, large initials (30px)
```

---

## Spacing System

### Base Unit: 4px (0.25rem)
```
gap-1  = 0.25rem (4px)
gap-2  = 0.5rem  (8px)
gap-3  = 0.75rem (12px)
gap-4  = 1rem    (16px)
gap-6  = 1.5rem  (24px)
gap-8  = 2rem    (32px)
gap-12 = 3rem    (48px)
```

### Card Padding
- **Compact Cards**: `p-4` (16px)
- **Standard Cards**: `p-6` (24px)
- **Hero Sections**: `p-8` or `p-12` (32-48px)

---

## Border Radius

**No sharp corners!** Everything is rounded for a soft, native feel.

```css
--radius-sm: 0.5rem   (8px)   /* Buttons, Inputs, small elements */
--radius-lg: 1rem     (16px)  /* Cards, Modal triggers */
--radius-xl: 1.5rem   (24px)  /* Large Cards, Panels */
--radius-2xl: 2rem    (32px)  /* Hero Sections, Modals */
--radius-3xl: 3rem    (48px)  /* Admin Entry Cards */
--radius-full: 9999px         /* Pills, Badges, Avatars */
```

**Default Roundings:**
- Buttons: `rounded-lg` (16px)
- Input fields: `rounded-lg` (16px)
- Small Cards: `rounded-xl` (24px)
- Large Cards: `rounded-2xl` (32px)
- Admin Entry Cards: `rounded-3xl` (48px)
- Badges/Pills: `rounded-full`

---

## Glassmorphism & Cards

### Glass Card Pattern
**No white/hard borders!** Use subtle transparency and blur instead.

```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.18); /* Very subtle! */
  box-shadow:
    0 8px 32px 0 rgba(31, 38, 135, 0.15),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.5);
}
```

### Dark Mode Glass
```css
.dark .glass-card {
  background: rgba(23, 23, 23, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.37),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
}
```

### Selected/Highlighted State
```css
.glass-card-selected {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  box-shadow: 0 8px 32px 0 rgba(16, 185, 129, 0.2);
}
```

---

## Shadows

**Layering system** for visual depth:

```css
/* Subtle - Resting State */
shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)

/* Default - Cards */
shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)

/* Medium - Hover State */
shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1), 0 8px 24px rgba(0, 0, 0, 0.06)

/* Large - Modals, Elevated Elements */
shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12)

/* XL - Hero Cards, Key Elements */
shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.15)
```

**Colored Shadows** (for status badges):
```css
shadow-[0_0_8px_rgba(16,185,129,0.6)]  /* Primary/Success */
shadow-[0_0_8px_rgba(239,68,68,0.6)]   /* Error/Rejected */
shadow-[0_0_8px_rgba(245,158,11,0.6)]  /* Warning/Pending */
```

---

## Status Badges

**Glowing status indicators** with pulsing dot:

### Structure (CSS class approach)
```vue
<!-- Uses ::before pseudo-element for pulsing dot automatically -->
<span class="status-badge status-approved">
  {{ $t('status.approved') }}
</span>
```

### Structure (Inline approach, for custom layouts)
```vue
<span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-md bg-green-500/15 text-green-700 border border-green-500/30">
  <span class="inline-block h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
  {{ $t('status.approved') }}
</span>
```

### Colors & States
```css
/* Approved/Success */
.status-approved {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* Rejected/Error */
.status-rejected {
  background: rgba(244, 63, 94, 0.15);
  color: #dc2626;
  border: 1px solid rgba(244, 63, 94, 0.3);
}

/* Pending/Warning */
.status-pending {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
```

---

## Buttons

### Primary Button (Glassmorphic)
```vue
<Button class="rounded-xl bg-primary/90 backdrop-blur-md hover:bg-primary hover:shadow-lg transition-all">
  {{ label }}
</Button>
```

### Styles
- **Border-Radius**: `rounded-xl` (24px)
- **Padding**: `px-6 py-3`
- **Transparency**: `bg-primary/90` with `backdrop-blur-md`
- **Hover**: `hover:bg-primary hover:shadow-lg hover:-translate-y-0.5`
- **Transition**: `transition-all duration-200`

### Icon Buttons
```vue
<Button variant="ghost" size="icon" class="rounded-full hover:bg-primary/10">
  <Icon />
</Button>
```

---

## Interactions & Animations

### Hover States
```css
/* Subtle lift */
hover:-translate-y-1
hover:shadow-xl
transition-all duration-300

/* Scale effect for photos */
hover:scale-105
transition-transform duration-300
```

### Click/Active States
```css
active:scale-95
transition-transform duration-150
```

### Fade & Slide Transitions
```css
/* For page transitions */
transition: opacity 0.2s ease, transform 0.3s ease-out

/* Smooth fade in/out */
opacity-0 → opacity-100
```

### Pulse Animation
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

## Layout Patterns

### Admin Entry Cards
```vue
<div
  class="flex items-start gap-4 rounded-3xl p-6 transition-all duration-300"
  :class="isSelected
    ? 'bg-primary/10 backdrop-blur-xl border border-primary/30 shadow-lg shadow-primary/20'
    : 'bg-card/70 backdrop-blur-xl border border-border/20 shadow-lg hover:shadow-xl hover:-translate-y-1'"
  style="backdrop-filter: blur(20px) saturate(180%)"
>
  <!-- Content -->
</div>
```

**Key Properties:**
- `rounded-3xl` — Extra large rounding (48px)
- `backdrop-blur-xl` + `saturate(180%)` — Glassmorphism
- `border-border/20` — Very subtle border (20% opacity)
- `hover:-translate-y-1` — Gentle lift on hover
- `transition-all duration-300` — Smooth transition

### Guestbook Cards (Polaroid-Style)
```vue
<div class="card-polaroid">
  <div class="photo-frame mb-4">
    <img :src="photoUrl" class="w-full rounded-lg" />
  </div>
  <h3 class="font-handwritten text-2xl">{{ name }}</h3>
  <p class="text-sm text-muted-foreground">{{ message }}</p>
</div>
```

---

## Tab Navigation

### Glassmorphic Tabs
```vue
<Button
  :variant="active ? 'default' : 'outline'"
  size="sm"
  class="rounded-xl backdrop-blur-md"
>
  <Icon class="mr-1.5 h-3.5 w-3.5" />
  {{ label }}
  <Badge variant="secondary" class="ml-2">{{ count }}</Badge>
</Button>
```

**Styles:**
- Active: `bg-primary text-primary-foreground`
- Inactive: `bg-transparent border border-border/30 hover:bg-muted/50`
- Backdrop: `backdrop-blur-md`

---

## Form Elements

### Input Fields
```vue
<Input
  class="rounded-lg border-border/30 bg-card/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
  :placeholder="$t('placeholder')"
/>
```

### Checkbox
```vue
<Checkbox
  class="rounded-sm border-primary data-[state=checked]:bg-primary"
/>
```

**No hard borders** — use instead:
- `border-border/30` (30% opacity)
- `bg-card/50` (50% transparency)
- `backdrop-blur-sm`

---

## Answer Badges

Colored badges for guest answers (favorites, fun facts):

```css
.answer-badge       /* Base: rounded-full, muted bg, 0.75rem */
.badge-emerald      /* Green: #d1fae5 / dark: #064e3b */
.badge-yellow       /* Yellow: #fef3c7 / dark: #78350f */
.badge-indigo       /* Indigo: #e0e7ff / dark: #312e81 */
.badge-pink         /* Pink: #fce7f3 / dark: #831843 */
.badge-blue         /* Blue: #dbeafe / dark: #1e3a8a */
.badge-orange       /* Orange: #ffedd5 / dark: #7c2d12 */
```

All variants include automatic dark mode inversion.

---

## Bottom Sheet & Form Overlay

```css
.sheet-scroll          /* Thin scrollbar styling */
.sheet-grabber         /* Centered pill handle (2.5rem × 0.375rem) */
.form-sheet-content    /* max-height: 90vh, rounded top corners */
```

---

## Wizard Progress Steps

```css
.progress-step            /* Thin bar (0.25rem), rounded-full */
.progress-step.active     /* Primary color */
.progress-step.completed  /* Primary color */
```

---

## Section Cards

For grouped content (Favorites, Fun Facts):

```css
.section-card    /* Muted background, rounded-xl, p-4 */
.section-title   /* 0.75rem, uppercase, letter-spacing, muted-foreground */
```

---

## Toggle Choice (Binary Options)

```css
.toggle-choice         /* Flex container, gap-2 */
.toggle-choice-btn     /* Bordered pill, hover: primary border */
.toggle-choice-btn.active  /* Primary bg + fg */
```

---

## Landing Page

```css
.landing-gradient   /* Primary gradient: 135deg emerald */
.info-card          /* rounded-2xl, shadow-lg, p-8 */
```

### Admin Bar (Authenticated Owners)
When an authenticated owner visits the guest landing page (`/g/[id]`), a glassmorphic bar appears fixed at the top linking to the admin page:
```vue
<NuxtLink
  v-if="canAdmin"
  :to="`/g/${guestbookId}/admin`"
  class="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2
         border-b border-border/20 bg-card/70 px-4 py-2 text-sm text-foreground
         backdrop-blur-xl transition-colors hover:bg-card/90"
>
  <Settings class="h-4 w-4" />
  {{ t('landing.adminBar') }}
</NuxtLink>
```

### Customizable Card Styles
The landing page info card supports admin-configurable customization:
- **Card color** (`cardColor`): Custom background color with opacity
- **Card opacity** (`cardOpacity`): 0–100% opacity for the card background (default: 70)
- **Card blur** (`cardBlur`): 0–30px backdrop blur (default: 20px)
- **Title font** (`titleFont`): `handwritten` (Caveat), `display` (DM Sans), or `sans` (Inter)
- **Body font** (`bodyFont`): `sans` (Inter), `display` (DM Sans), or `handwritten` (Caveat)
- **Background color** (`backgroundColor`): Custom page background
- **Background image** (`backgroundImageUrl`): Custom background image (cover, centered)

### Live Preview in Settings Dialog
The guestbook settings dialog (`/g/[id]/admin`) uses a two-column layout:
- **Left column**: Scrollable settings form (`AdminGuestbookSettings`)
- **Right column**: Sticky live preview (`AdminGuestbookPreview`) that reactively updates as settings change

The preview component receives `localSettings` via `defineExpose` + template ref pattern, rendering a scaled mini-version of the landing card.

---

## Slide & Fade Transitions

Vue transitions for page changes:

```css
.slide-left-enter-from   /* opacity: 0, translateX(30px) */
.slide-left-leave-to     /* opacity: 0, translateX(-30px) */
.slide-right-enter-from  /* opacity: 0, translateX(-30px) */
.slide-right-leave-to    /* opacity: 0, translateX(30px) */
.fade-enter-from/leave-to  /* opacity: 0, 0.2s ease */
```

---

## Additional Animations

```css
.animate-gentle-pulse  /* 1.5s opacity pulse (1 → 0.6) */
.animate-scale-in      /* 0.3s scale from 0.95 → 1 */
.shimmer               /* Gradient shimmer sweep (2s infinite) */
```

---

## Accessibility

### Focus States
```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Touch Targets
- Minimum: `44x44px` (iOS standard)
- Buttons: at least `h-10` (40px) or `h-12` (48px)
- Icon buttons: `h-10 w-10` (40x40px)

---

## Responsive Design

### Breakpoints
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large Desktop */
```

### Mobile-First
All styles are mobile-first. Desktop adjustments via `md:` or `lg:` prefixes.

---

## Do's and Don'ts

### DO
- Use glassmorphism for cards (`backdrop-blur-xl`)
- Use subtle borders with low opacity (`border-border/20`)
- Large roundings for organic feel (`rounded-3xl`)
- Smooth hover animations (`hover:-translate-y-1`)
- Pulsing dots for status indicators
- Handwritten font for personal elements (names)
- Colored shadows for highlighted elements

### DON'T
- **No prominent white/hard borders!**
- No sharp corners (`border-0` is fine, but keep it rounded)
- No harsh shadows or black-box effects
- No static, flat UI elements
- No high-contrast borders (max 30% opacity)
- No pure-white backgrounds without transparency

---

## Code Examples

### Admin Entry Card (Best Practice)
```vue
<div
  v-for="entry in entries"
  :key="entry.id"
  class="flex items-start gap-4 rounded-3xl p-6 transition-all duration-300"
  :class="selectedIds.has(entry.id)
    ? 'bg-primary/10 backdrop-blur-xl border border-primary/30 shadow-lg shadow-primary/20'
    : 'bg-card/70 backdrop-blur-xl border border-border/20 shadow-lg hover:shadow-xl hover:-translate-y-1'"
  style="backdrop-filter: blur(20px) saturate(180%)"
>
  <!-- Checkbox -->
  <Checkbox :checked="selectedIds.has(entry.id)" />

  <!-- Photo/Avatar -->
  <div class="h-20 w-20 rounded-2xl overflow-hidden shadow-md">
    <img :src="entry.photoUrl" class="w-full h-full object-cover" />
  </div>

  <!-- Content -->
  <div class="flex-1">
    <div class="flex items-center gap-2">
      <h3 class="font-handwritten text-2xl">{{ entry.name }}</h3>

      <!-- Status Badge -->
      <span
        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-md"
        :class="{
          'bg-green-500/15 text-green-700 border border-green-500/30': entry.status === 'approved',
          'bg-red-500/15 text-red-700 border border-red-500/30': entry.status === 'rejected',
          'bg-yellow-500/15 text-yellow-700 border border-yellow-500/30': entry.status === 'pending'
        }"
      >
        <span
          class="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
          :class="{
            'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]': entry.status === 'approved',
            'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]': entry.status === 'rejected',
            'bg-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]': entry.status === 'pending'
          }"
        />
        {{ $t(`status.${entry.status}`) }}
      </span>
    </div>

    <p class="text-sm text-muted-foreground mt-1">{{ entry.message }}</p>
  </div>

  <!-- Actions -->
  <div class="flex gap-1">
    <Button variant="ghost" size="icon" class="rounded-full hover:bg-green-500/10">
      <Check class="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon" class="rounded-full hover:bg-red-500/10">
      <X class="h-4 w-4" />
    </Button>
  </div>
</div>
```

---

## Implementation Checklist

For new components/pages:

- [ ] Glassmorphism applied? (`backdrop-blur-xl`, `bg-card/70`)
- [ ] Borders subtle? (`border-border/20`, max 30% opacity)
- [ ] Large roundings? (`rounded-3xl` for cards, `rounded-xl` for buttons)
- [ ] Hover animations? (`hover:-translate-y-1`, `hover:shadow-xl`)
- [ ] Smooth transitions? (`transition-all duration-300`)
- [ ] Handwritten font for names? (`font-handwritten text-2xl`)
- [ ] Status badges with pulsing dots?
- [ ] Colored shadows on highlights?
- [ ] Focus states defined?
- [ ] Mobile-responsive?

---

## CSS Utility Reference

Complete list of all custom classes in `app/assets/css/main.css`:

| Category | Classes |
|---|---|
| Typography | `.font-handwritten`, `.font-display` |
| Cards | `.glass-card`, `.glass-card-selected`, `.card-polaroid`, `.info-card`, `.section-card` |
| Photos | `.photo-frame` |
| Badges | `.answer-badge`, `.badge-{emerald,yellow,indigo,pink,blue,orange}` |
| Status | `.status-badge`, `.status-approved`, `.status-rejected`, `.status-pending` |
| Buttons | `.action-btn` |
| Form | `.toggle-choice`, `.toggle-choice-btn`, `.progress-step`, `.form-sheet-content` |
| Sheet | `.sheet-scroll`, `.sheet-grabber` |
| Layout | `.section-title`, `.landing-gradient` |
| Navigation | `.nav-arrow`, `.nav-arrow-left`, `.nav-arrow-right`, `.pagination-dot` |
| Animations | `.animate-gentle-pulse`, `.animate-scale-in`, `.shimmer` |
| Transitions | `.slide-left-*`, `.slide-right-*`, `.fade-*` |

---

**Last updated:** February 2, 2026
**Maintainer:** Tap & Tell Development Team
