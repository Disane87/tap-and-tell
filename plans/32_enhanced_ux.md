# Plan 32: Enhanced UX — Freundebuch (Friendship Book)

Multi-step wizard form replacing the basic single-page guest form. Adds "Freundebuch" questions (favorites, fun facts, toggles, connection stories) that make each guestbook entry richer and more personal.

## Phase 1: Data Model ✔

### Types (`app/types/guest.ts`) ✔
- [x] `FavoriteSong` interface — type, title, artist?, url?
- [x] `FavoriteVideo` interface — type, title, url?, videoId?
- [x] `GuestAnswers` interface — all optional Freundebuch fields
- [x] Extended `GuestEntry` with optional `answers?: GuestAnswers`
- [x] Extended `CreateGuestEntryInput` with optional `answers`

### API (`server/routes/api/entries/index.post.ts`) ✔
- [x] Accept `answers` from request body
- [x] Pass through to entry object

## Phase 2: Wizard Composable ✔

### `app/composables/useGuestForm.ts` (full rewrite) ✔
- [x] Module-level `ref()` (no `useState`) — hydration safe
- [x] `WizardFormState` with all 19 fields across 4 steps
- [x] `currentStep`, `direction` refs for navigation
- [x] Per-step validation (Steps 1 and 4 validate; Steps 2 and 3 optional)
- [x] `getSubmitData()` assembles flat fields into structured `GuestAnswers`
- [x] Empty strings/null values omitted from answers payload

## Phase 3: Form Components ✔

### `app/components/form/ToggleChoice.vue` ✔
- [x] Reusable binary toggle (e.g., Coffee vs Tea)
- [x] Two side-by-side buttons, selected one highlighted
- [x] Tapping selected option deselects it

### `app/components/form/StepBasics.vue` (Step 1) ✔
- [x] Name (required) + Photo (optional)
- [x] Uses existing `PhotoUpload.vue`

### `app/components/form/StepFavorites.vue` (Step 2) ✔
- [x] Color, Food, Movie text inputs
- [x] Song: title + artist + URL in bordered card
- [x] Video: title + URL in bordered card
- [x] All fields optional

### `app/components/form/StepFun.vue` (Step 3) ✔
- [x] Superpower, Hidden Talent, Desert Island Items text inputs
- [x] 3 ToggleChoice instances: Coffee/Tea, Night Owl/Early Bird, Beach/Mountains
- [x] All fields optional

### `app/components/form/StepMessage.vue` (Step 4) ✔
- [x] Best Memory, How We Met (optional textareas)
- [x] Message to Host (required textarea)

### `app/components/form/FormWizard.vue` ✔
- [x] Progress bar (4 segments)
- [x] Step counter ("Step 2 of 4") + step label
- [x] Renders step components via `v-if`
- [x] Slide transitions between steps
- [x] Navigation: Back / Skip (optional steps) / Next / Submit
- [x] Card-polaroid styling consistent with existing design

## Phase 4: Display Updates ✔

### `app/components/GuestCard.vue` ✔
- [x] Answer preview badges (max 3) below message
- [x] Toggle emojis, song title, color, superpower as badges
- [x] Truncated text with max-width

### `app/components/EntrySheet.vue` ✔
- [x] "Favorites" section: color, food, movie, song/video mini-cards with links
- [x] "Fun Facts" section: text answers + toggle pills
- [x] "Our Story" section: how we met, best memory

## Phase 5: Integration ✔

### `app/pages/index.vue` ✔
- [x] Replaced `<GuestForm>` with `<FormWizard @submit="handleSubmit" />`
- [x] Removed old `GuestForm.vue` (dead code after wizard replacement)

## Hydration Fixes (bundled with this feature) ✔

- [x] `app/composables/useAdmin.ts` — `useState()` → module-level `ref()`
- [x] `app/composables/useGuests.ts` — `useState()` → module-level `ref()`
