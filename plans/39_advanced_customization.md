# Plan 39: Advanced Guestbook Customization

## Summary

Extends Plan 34 (basic customization) with advanced per-guestbook customization options. These features allow guestbook owners to tailor the guest experience to their specific event (wedding, corporate event, birthday, etc.).

### Current State (already implemented)

- Welcome message
- Theme color (8 presets + custom hex)
- Background color (12 presets + custom hex)
- Background image upload
- Card styling (color, opacity, blur)
- Title & body font selection (handwritten, display, sans)
- Moderation toggle
- Form step visibility (favorites, fun facts)
- Live preview in settings dialog

### What's Defined but Not Implemented

- `headerImageUrl` — defined in `GuestbookSettings` type, not used in UI
- `customLabels` — defined in `GuestbookSettings` type, not implemented

---

## Priority Levels

- **P0 — High Impact**: Significantly increases value for event-specific use cases.
- **P1 — Medium Impact**: Visual polish and differentiation.
- **P2 — Low Impact**: Nice-to-have refinements.

---

## P0 — High Impact

### 39.1 Custom Questions / Custom Fields

The current form has fixed questions (favorite color, food, movie, superpower, etc.). Event hosts need event-specific questions.

**Examples:**
- Wedding: "How do you know the couple?", "Marriage advice for the newlyweds?"
- Birthday: "Favorite memory with the birthday person?"
- Corporate: "What department are you from?", "One word to describe the event?"

**Implementation:**
- Add `customQuestions` to `GuestbookSettings`:
  ```typescript
  customQuestions?: Array<{
    id: string          // unique ID (nanoid)
    label: string       // question text
    type: 'text' | 'textarea' | 'choice'
    options?: string[]  // for 'choice' type
    required?: boolean
  }>
  ```
- Settings UI: Add/remove/reorder questions with drag handle
- Form wizard: Render custom questions as an additional step (or replace favorites/funFacts)
- Storage: Answers saved in existing `entries.answers` JSONB column under custom IDs
- Display: Show custom answers in GuestCard badges and EntrySheet detail view
- Plan limits: Free (2 custom questions), Pro (10), Business (unlimited)

**Files to change:**
- `app/types/guestbook.ts` — extend `GuestbookSettings`
- `app/components/admin/GuestbookSettings.vue` — custom question editor
- `app/composables/useGuestForm.ts` — dynamic step from custom questions
- `app/components/form/` — new `CustomQuestionsStep.vue`
- `app/components/GuestCard.vue` — render custom answer badges
- `app/components/EntrySheet.vue` — render custom answers in detail view
- `app/components/GuestEntryFullView.vue` — render custom answers

### 39.2 Header Image / Event Logo

`headerImageUrl` is already defined in the type but not wired up. Allows displaying an event logo or hero image on the landing page.

**Implementation:**
- Upload endpoint: reuse pattern from background image upload
- Storage: `{guestbookId}/header.{ext}.enc` (encrypted like background)
- Landing page: Display above or below title, configurable position
- Settings UI: Image upload field in `GuestbookSettings.vue` (similar to `BackgroundPicker`)
- Options: `headerImagePosition: 'above-title' | 'below-title' | 'behind-title'`

**Files to change:**
- `app/components/admin/GuestbookSettings.vue` — header image upload section
- `app/pages/g/[id]/index.vue` — render header image
- `app/components/admin/GuestbookPreview.vue` — preview header image
- `server/routes/api/tenants/[uuid]/guestbooks/[gbUuid]/header.post.ts` — upload
- `server/routes/api/tenants/[uuid]/guestbooks/[gbUuid]/header.delete.ts` — delete
- `server/routes/api/g/[id]/header.get.ts` — serve image

### 39.3 Entry View Layout Options

Currently the view page (`/g/[id]/view`) uses a fixed grid of polaroid cards. Different events benefit from different layouts.

**Layout options:**
- `grid` — current polaroid card grid (default)
- `masonry` — Pinterest-style staggered layout (variable card height based on content)
- `list` — compact list view (photo thumbnail + name + message, more entries visible)
- `timeline` — chronological timeline with date separators and connecting line

**Implementation:**
- Add `viewLayout` to `GuestbookSettings`: `'grid' | 'masonry' | 'list' | 'timeline'`
- Settings UI: Layout selector with visual thumbnails for each option
- View page: Conditional rendering based on `viewLayout`
- New components: `EntryListItem.vue`, `EntryTimeline.vue`, `MasonryGrid.vue`

**Files to change:**
- `app/types/guestbook.ts` — extend `GuestbookSettings`
- `app/components/admin/GuestbookSettings.vue` — layout selector
- `app/pages/g/[id]/view.vue` — conditional layout rendering
- New: `app/components/EntryListItem.vue`
- New: `app/components/EntryTimeline.vue`
- New: `app/components/MasonryGrid.vue`

---

## P1 — Medium Impact

### 39.4 Custom CTA Button Text

The "Write an entry" button text is hardcoded via i18n. Event hosts may want personalized text.

**Examples:**
- "Sign the guestbook"
- "Leave your wishes"
- "Grüße hinterlassen"
- "Say something nice"

**Implementation:**
- Add `ctaButtonText` to `GuestbookSettings` (optional string)
- Landing page: Use `settings.ctaButtonText || $t('landing.cta')`
- Settings UI: Text input with placeholder showing default text
- Preview: Live update of button text

**Files to change:**
- `app/types/guestbook.ts` — extend `GuestbookSettings`
- `app/components/admin/GuestbookSettings.vue` — text input
- `app/components/admin/GuestbookPreview.vue` — show custom text
- `app/pages/g/[id]/index.vue` — apply custom text

### 39.5 Entry Card Style Variants

Different visual styles for entry cards beyond the current polaroid look.

**Card styles:**
- `polaroid` — current style with shadow and slight rotation (default)
- `minimal` — clean, no shadow, subtle border
- `rounded` — larger border-radius, colored background matching theme
- `bordered` — white card with thick colored left/top border matching theme color

**Implementation:**
- Add `cardStyle` to `GuestbookSettings`: `'polaroid' | 'minimal' | 'rounded' | 'bordered'`
- `GuestCard.vue`: Apply variant class based on setting
- CSS: Define `.card-minimal`, `.card-rounded`, `.card-bordered` in `main.css`
- Settings UI: Card style selector with visual preview of each variant

**Files to change:**
- `app/types/guestbook.ts` — extend `GuestbookSettings`
- `app/components/admin/GuestbookSettings.vue` — card style selector
- `app/components/GuestCard.vue` — apply variant class
- `app/assets/css/main.css` — card variant styles

### 39.6 Slideshow Settings per Guestbook

Currently slideshow options (interval, transitions) are hardcoded or user-controlled at runtime. Owners should set defaults.

**Settings:**
- `slideshowInterval` — default auto-advance interval (3, 5, 10, 15, 30 seconds)
- `slideshowTransition` — transition effect (`'fade'` | `'slide'` | `'zoom'`)
- `slideshowShowBadges` — show answer badges overlay (boolean, default true)
- `slideshowShowNames` — show guest names overlay (boolean, default true)

**Implementation:**
- Add slideshow settings to `GuestbookSettings`
- Settings UI: Slideshow section in settings dialog
- Slideshow page: Read settings from guestbook info, use as defaults
- User can still override at runtime via controls

**Files to change:**
- `app/types/guestbook.ts` — extend `GuestbookSettings`
- `app/components/admin/GuestbookSettings.vue` — slideshow section
- `app/pages/g/[id]/slideshow.vue` — apply settings as defaults
- `app/composables/useSlideshow.ts` — accept initial settings

---

## P2 — Low Impact

### 39.7 Forced Color Scheme per Guestbook

Override the guest's system theme for a specific guestbook.

**Options:**
- `'system'` — respect guest's preference (default)
- `'light'` — always light mode
- `'dark'` — always dark mode

**Implementation:**
- Add `colorScheme` to `GuestbookSettings`: `'system' | 'light' | 'dark'`
- Guest pages: Apply `dark` class override on mount, restore on unmount
- Use case: Evening events → force dark mode, daytime events → force light mode

**Files to change:**
- `app/types/guestbook.ts` — extend `GuestbookSettings`
- `app/components/admin/GuestbookSettings.vue` — toggle/select
- `app/pages/g/[id]/index.vue` — apply scheme on mount
- `app/pages/g/[id]/view.vue` — apply scheme on mount
- `app/pages/g/[id]/slideshow.vue` — apply scheme on mount

### 39.8 Social Links / Event Footer

Optional footer section on the landing page with links and text.

**Settings:**
- `footerText` — short text (e.g., "Made with love for Sarah & Tom's wedding")
- `socialLinks` — array of `{ platform: string; url: string }` (Instagram, website, etc.)

**Implementation:**
- Add footer settings to `GuestbookSettings`
- Landing page: Render footer below CTA if configured
- Settings UI: Text input + repeatable link fields
- Icons: Use Iconify for platform icons (Instagram, Twitter/X, Website, YouTube, TikTok)

**Files to change:**
- `app/types/guestbook.ts` — extend `GuestbookSettings`
- `app/components/admin/GuestbookSettings.vue` — footer section
- `app/pages/g/[id]/index.vue` — render footer
- `app/components/admin/GuestbookPreview.vue` — preview footer

---

## Implementation Order

1. **39.4** Custom CTA button text (quick win, minimal changes)
2. **39.2** Header image / event logo (type already exists, reuse background upload pattern)
3. **39.5** Entry card style variants (CSS-only, no API changes)
4. **39.1** Custom questions (largest feature, most impactful)
5. **39.3** Entry view layout options (new components needed)
6. **39.6** Slideshow settings (extend existing composable)
7. **39.7** Forced color scheme (small, self-contained)
8. **39.8** Social links / footer (small, self-contained)

---

## Plan Gating (Monetization)

| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| Welcome message | ✔ | ✔ | ✔ |
| Theme color | ✔ | ✔ | ✔ |
| Background color | ✔ | ✔ | ✔ |
| Background image | — | ✔ | ✔ |
| Card styling (opacity, blur) | — | ✔ | ✔ |
| Font selection | — | ✔ | ✔ |
| Custom CTA text | — | ✔ | ✔ |
| Header image / logo | — | ✔ | ✔ |
| Card style variants | — | ✔ | ✔ |
| Custom questions | — | 5 max | Unlimited |
| View layout options | Grid only | All | All |
| Slideshow settings | — | ✔ | ✔ |
| Forced color scheme | — | — | ✔ |
| Social links / footer | — | ✔ | ✔ |

---

## GuestbookSettings Type (Final)

```typescript
export interface GuestbookSettings {
  // Existing
  moderationEnabled?: boolean
  welcomeMessage?: string
  themeColor?: string
  headerImageUrl?: string
  backgroundColor?: string
  backgroundImageUrl?: string
  formConfig?: {
    steps: { basics: boolean; favorites: boolean; funFacts: boolean; message: boolean }
    fields?: Record<string, boolean>
  }
  cardColor?: string
  cardOpacity?: number
  cardBlur?: number
  titleFont?: 'handwritten' | 'display' | 'sans'
  bodyFont?: 'sans' | 'display' | 'handwritten'
  customLabels?: Record<string, string>

  // New (Plan 39)
  customQuestions?: Array<{
    id: string
    label: string
    type: 'text' | 'textarea' | 'choice'
    options?: string[]
    required?: boolean
  }>
  headerImagePosition?: 'above-title' | 'below-title' | 'behind-title'
  viewLayout?: 'grid' | 'masonry' | 'list' | 'timeline'
  ctaButtonText?: string
  cardStyle?: 'polaroid' | 'minimal' | 'rounded' | 'bordered'
  slideshowInterval?: number
  slideshowTransition?: 'fade' | 'slide' | 'zoom'
  slideshowShowBadges?: boolean
  slideshowShowNames?: boolean
  colorScheme?: 'system' | 'light' | 'dark'
  footerText?: string
  socialLinks?: Array<{ platform: string; url: string }>
}
```
