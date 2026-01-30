# Multi-lingual App ✔

Everything should be translated to multiple languages. English as default but other languages should be selectable.

## Features

- [x] Multi-lingual support for all user-facing text
- [x] Language selection option for users (LanguageSwitcher component)
- [x] Default language setting for the app (browser detection + cookie)
- [x] Supported languages: English (default) and German

## Implementation

- [x] `@nuxtjs/i18n` module installed and configured
- [x] Locale files in `i18n/locales/` (en.json, de.json)
- [x] All pages migrated to use `$t()` translation keys
- [x] All components migrated (forms, cards, sheets, etc.)
- [x] LanguageSwitcher component in header
- [x] Localized date formatting based on locale
