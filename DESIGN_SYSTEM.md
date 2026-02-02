# Tap & Tell Design System

> Emotionale, native Design-Sprache ohne prominente Borders
> Version 1.0 | Letzte Aktualisierung: 2. Februar 2026

## Design-Philosophie

**Kernprinzipien:**
- **Emotional & Menschlich**: Handgeschriebene Fonts, weiche Rundungen, natürliche Interaktionen
- **Glassmorphismus**: Subtile Transparenz, Backdrop-Blur-Effekte statt harter Borders
- **Sanfte Übergänge**: Fließende Animationen, keine harten Sprünge
- **Native Feel**: Keine White-Box-Aesthetik, sondern organische, atmende UI
- **Breathing Space**: Großzügige Abstände, klare Hierarchie ohne visuelle Aggression

---

## Farb-Palette

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

## Typografie

### Font Families
- **Sans (Body)**: `'Inter'` - Klare, moderne Lesbarkeit
- **Display (Headlines)**: `'DM Sans'` - Markante Überschriften
- **Handwritten (Personal)**: `'Caveat'` - Emotionale, menschliche Akzente

### Font-Größen Hierarchie
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
text-xl: Namen in Karten (20px)
text-2xl: Featured Namen (24px)
text-3xl: Hero Text, große Initialen (30px)
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

**Keine harten Ecken!** Alles ist gerundet für ein weiches, natives Gefühl.

```css
--radius-sm: 0.5rem   (8px)   /* Buttons, Inputs, kleine Elemente */
--radius-lg: 1rem     (16px)  /* Cards, Modal-Trigger */
--radius-xl: 1.5rem   (24px)  /* Large Cards, Panels */
--radius-2xl: 2rem    (32px)  /* Hero Sections, Modals */
--radius-3xl: 3rem    (48px)  /* Admin Entry Cards */
--radius-full: 9999px         /* Pills, Badges, Avatare */
```

**Standard-Rundungen:**
- Buttons: `rounded-lg` (16px)
- Input-Felder: `rounded-lg` (16px)
- Kleine Cards: `rounded-xl` (24px)
- Große Cards: `rounded-2xl` (32px)
- Admin Entry Cards: `rounded-3xl` (48px)
- Badges/Pills: `rounded-full`

---

## Glassmorphismus & Cards

### Glass Card Pattern
**Keine weißen Borders!** Stattdessen subtile Transparenz und Blur.

```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.18); /* Sehr subtil! */
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

**Layering-System** für visuelle Tiefe:

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

**Colored Shadows** (für Status-Badges):
```css
shadow-[0_0_8px_rgba(16,185,129,0.6)]  /* Primary/Success */
shadow-[0_0_8px_rgba(239,68,68,0.6)]   /* Error/Rejected */
shadow-[0_0_8px_rgba(245,158,11,0.6)]  /* Warning/Pending */
```

---

## Status Badges

**Glowing Status Indicators** mit pulsierendem Dot:

### Structure
```vue
<span class="status-badge status-approved">
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
- **Transparency**: `bg-primary/90` mit `backdrop-blur-md`
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
/* Subtile Anhebung */
hover:-translate-y-1
hover:shadow-xl
transition-all duration-300

/* Scale-Effekt für Fotos */
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
/* Für Seiten-Übergänge */
transition: opacity 0.2s ease, transform 0.3s ease-out

/* Sanftes Ein/Ausblenden */
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

## Layout-Patterns

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

**Key-Properties:**
- `rounded-3xl` - Extra große Rundung (48px)
- `backdrop-blur-xl` + `saturate(180%)` - Glassmorphismus
- `border-border/20` - Sehr subtile Border (20% Opazität)
- `hover:-translate-y-1` - Sanftes Anheben
- `transition-all duration-300` - Smooth Transition

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

**Keine harten Borders**, sondern:
- `border-border/30` (30% Opazität)
- `bg-card/50` (50% Transparenz)
- `backdrop-blur-sm`

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
- Minimum: `44x44px` (iOS Standard)
- Buttons: mindestens `h-10` (40px) oder `h-12` (48px)
- Icon-Buttons: `h-10 w-10` (40x40px)

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
Alle Styles sind mobile-first. Desktop-Anpassungen via `md:` oder `lg:` Prefixes.

---

## Do's and Don'ts

### ✅ DO
- Verwende Glassmorphismus für Cards (`backdrop-blur-xl`)
- Nutze subtile Borders mit geringer Opazität (`border-border/20`)
- Große Roundings für organisches Gefühl (`rounded-3xl`)
- Sanfte Hover-Animationen (`hover:-translate-y-1`)
- Pulsierende Dots für Status-Anzeigen
- Handwritten Font für persönliche Elemente (Namen)
- Colored Shadows für wichtige Elemente

### ❌ DON'T
- **Keine prominenten weißen/harten Borders!**
- Keine scharfen Ecken (`border-0` ist ok, aber dann bitte gerundet)
- Keine harten Schatten oder Black-Box-Effekte
- Keine statischen, flachen UI-Elemente
- Keine zu hohen Kontraste bei Borders (max 30% Opazität)
- Keine Pure-White Backgrounds ohne Transparenz

---

## Code-Beispiele

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

## Implementierungs-Checkliste

Bei neuen Komponenten/Pages:

- [ ] Glassmorphismus verwendet? (`backdrop-blur-xl`, `bg-card/70`)
- [ ] Borders subtil? (`border-border/20`, max 30% Opazität)
- [ ] Große Roundings? (`rounded-3xl` für Cards, `rounded-xl` für Buttons)
- [ ] Hover-Animationen? (`hover:-translate-y-1`, `hover:shadow-xl`)
- [ ] Transitions sanft? (`transition-all duration-300`)
- [ ] Handwritten Font für Namen? (`font-handwritten text-2xl`)
- [ ] Status-Badges mit pulsierenden Dots?
- [ ] Colored Shadows bei Highlights?
- [ ] Focus-States definiert?
- [ ] Mobile-Responsive?

---

**Aktualisiert:** Februar 2026
**Maintainer:** Tap & Tell Development Team
