# Plan 34: Guestbook Customization

## Summary

Add a settings UI to the guestbook admin page and apply those settings on guest-facing pages.

## Implemented

- [x] i18n keys for `settings` namespace (EN + DE)
- [x] `AdminColorPicker` component — 8 preset swatches + custom hex input
- [x] `AdminGuestbookSettings` component — welcome message, theme color, moderation toggle, form step toggles
- [x] Settings panel wired into guestbook admin page (`/t/[uuid]/g/[gbUuid]/admin`) with toggle button
- [x] Welcome message applied on all 3 guest landing pages (flat + nested routes)
- [x] Theme color applied via CSS custom property `--color-primary` on all guest pages (auto-cleanup on unmount)
- [x] Form step config: `useGuestForm` supports `enabledSteps` array + `applyFormConfig()` from guestbook settings
- [x] `Wizard.vue` updated to render only enabled steps with correct progress bar and navigation
- [x] Build passes (`pnpm build`)

## Deferred

- [ ] Background/header image upload (needs separate upload endpoint)
- [ ] Preview mode for customization changes
- [ ] Plan-based feature gating (Free vs paid customization limits)
- [ ] Custom labels for form fields
- [ ] Font customization

## Files Created

- `app/components/admin/ColorPicker.vue`
- `app/components/admin/GuestbookSettings.vue`

## Files Modified

- `i18n/locales/en.json` — added `settings` namespace
- `i18n/locales/de.json` — added `settings` namespace
- `app/pages/t/[uuid]/g/[guestbookUuid]/admin.vue` — settings toggle + panel
- `app/pages/g/[id]/index.vue` — apply welcomeMessage, themeColor, formConfig
- `app/pages/t/[uuid]/g/[guestbookUuid].vue` — apply welcomeMessage, themeColor, formConfig
- `app/pages/t/[uuid]/g/[guestbookUuid]/index.vue` — apply welcomeMessage, themeColor, formConfig
- `app/composables/useGuestForm.ts` — enabledSteps, applyFormConfig, computed totalSteps/currentStepIndex
- `app/components/form/Wizard.vue` — render only enabled steps, dynamic progress bar
