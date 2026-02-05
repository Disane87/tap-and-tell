# 📋 Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.12.0](https://github.com/Disane87/tap-and-tell/compare/v1.11.2...v1.12.0) (2026-02-05)


### ✨ Features

* **tests:** enhance guestbook and tenant admin tests for error handling and response validation ([4806033](https://github.com/Disane87/tap-and-tell/commit/48060333b34d1bf2ff87362a3c30a4cc674acf4c))


### 🐛 Bug Fixes

* add missing newline at end of package.json ([a46448c](https://github.com/Disane87/tap-and-tell/commit/a46448c0ce813b11ecff13f62445ca69f91b2c7f))
* update version to 1.11.2 in package.json ([f59ae69](https://github.com/Disane87/tap-and-tell/commit/f59ae69e1ff77510991b0af6e7958fe1987f8fde))

## [1.11.1](https://github.com/Disane87/tap-and-tell/compare/v1.11.0...v1.11.1) (2026-02-05)


### 🐛 Bug Fixes

* move Tailwind dependencies to production deps for Vercel build ([63401b3](https://github.com/Disane87/tap-and-tell/commit/63401b385e3ca4dabeb3e14368f81ab38b951955))

## [1.11.0](https://github.com/Disane87/tap-and-tell/compare/v1.10.0...v1.11.0) (2026-02-05)


### ✨ Features

* integrate 2FA setup dialog and refresh user data after completion ([5b33947](https://github.com/Disane87/tap-and-tell/commit/5b33947678519af91b2da69bcdc1c8a9209ce096))

## [1.10.0](https://github.com/Disane87/tap-and-tell/compare/v1.9.0...v1.10.0) (2026-02-05)


### ✨ Features

* enhance form validation with i18n error messages and improve error handling ([0947392](https://github.com/Disane87/tap-and-tell/commit/0947392611bbbc4a8ee8011c3c33c596dd0ff948))

## [1.9.0](https://github.com/Disane87/tap-and-tell/compare/v1.8.0...v1.9.0) (2026-02-04)


### ✨ Features

* **middleware:** add 2FA enforcement for authenticated admin routes ([69aef2b](https://github.com/Disane87/tap-and-tell/commit/69aef2b7b4d42e5a451fca8b38f8dd8086b69663))

## [1.8.0](https://github.com/Disane87/tap-and-tell/compare/v1.7.1...v1.8.0) (2026-02-04)


### ✨ Features

* **session:** include isAdmin field in user session data ([7950eb5](https://github.com/Disane87/tap-and-tell/commit/7950eb5fc4c7f9cd1bb5cb7726f0195bcb450322))

## [1.7.1](https://github.com/Disane87/tap-and-tell/compare/v1.7.0...v1.7.1) (2026-02-04)


### 🐛 Bug Fixes

* **seed-dev:** add admin privileges to dev user creation ([751df1c](https://github.com/Disane87/tap-and-tell/commit/751df1c27ae05aaaf5ed064459aa5fe89d7a1b74))

## [1.7.0](https://github.com/Disane87/tap-and-tell/compare/v1.6.2...v1.7.0) (2026-02-04)


### ✨ Features

* **switch:** add Switch component with template and logic ([4af631d](https://github.com/Disane87/tap-and-tell/commit/4af631d000f367efec2e1b35f2b0baf0b1012651))

## [1.6.2](https://github.com/Disane87/tap-and-tell/compare/v1.6.1...v1.6.2) (2026-02-04)


### 🐛 Bug Fixes

* **deploy:** update deploy workflow to trigger only on main branch push or manual dispatch ([a4b6f64](https://github.com/Disane87/tap-and-tell/commit/a4b6f64500477badd101be61690cfcb3403c3274))

## [1.6.1](https://github.com/Disane87/tap-and-tell/compare/v1.6.0...v1.6.1) (2026-02-04)


### 🐛 Bug Fixes

* **upload:** add cache-busting timestamps to image URLs on re-upload ([ca1436b](https://github.com/Disane87/tap-and-tell/commit/ca1436bae3e0aa09d26105190aaf11b386a28a2e))

## [1.6.0](https://github.com/Disane87/tap-and-tell/compare/v1.5.0...v1.6.0) (2026-02-04)


### ✨ Features

* **i18n:** update German and English translations for improved clarity and engagement ([39ef83e](https://github.com/Disane87/tap-and-tell/commit/39ef83e9a1e100a293347ed720bb1e894b79e0cd))

## [1.5.0](https://github.com/Disane87/tap-and-tell/compare/v1.4.0...v1.5.0) (2026-02-04)


### ✨ Features

* **beta:** add beta announcement section and localization for beta features ([f6a05dd](https://github.com/Disane87/tap-and-tell/commit/f6a05dd00ee3057d5ed54736869d22301ce3a357))
* **toast:** enhance toast notifications with glassmorphism styling and z-index adjustments ([a328d9b](https://github.com/Disane87/tap-and-tell/commit/a328d9bf18087cc73ecef4639ab38e0732d96239))
* **cookies:** implement GDPR-compliant cookie consent management and UI ([07f411c](https://github.com/Disane87/tap-and-tell/commit/07f411ce5681a3532569f7abeb346c47731fed65))
* **toast:** refactor Sonner component with glassmorphism styling and z-index adjustments ([f000fd6](https://github.com/Disane87/tap-and-tell/commit/f000fd639434b8b48ecc5378d388012ddda4ff01))
* **layout:** remove legacy admin link and associated icon from navigation ([bb33bcf](https://github.com/Disane87/tap-and-tell/commit/bb33bcfd191fb147c339469247aab1cd9387ed51))
* **nfcShop:** update NFC Tag Shop section with "Coming Soon" notice and waitlist functionality ([902cc4f](https://github.com/Disane87/tap-and-tell/commit/902cc4f1fbdfd6706bc4a31dba75ff9e4d643b7e))
* **env:** update NUXT_PUBLIC_SITE_URL to support auto-detection from VERCEL_URL ([eeacc38](https://github.com/Disane87/tap-and-tell/commit/eeacc387b85b371637cfc3da04931f4a0ef1935e))

## [1.4.0](https://github.com/Disane87/tap-and-tell/compare/v1.3.0...v1.4.0) (2026-02-04)


### ✨ Features

* **beta:** enhance beta mode handling and UI visibility ([8719c8e](https://github.com/Disane87/tap-and-tell/commit/8719c8e7aff05f4b2c3d128fc1ead7314025c365))

## [1.3.0](https://github.com/Disane87/tap-and-tell/compare/v1.2.0...v1.3.0) (2026-02-04)


### ✨ Features

* **nuxt:** set nitro preset based on VERCEL environment variable ([9914ae9](https://github.com/Disane87/tap-and-tell/commit/9914ae9832d5e5dcfd51c4dd7331a10c3d165039))

## [1.2.0](https://github.com/Disane87/tap-and-tell/compare/v1.1.0...v1.2.0) (2026-02-04)


### ✨ Features

* **vercel:** enable git deployment configuration ([10163ce](https://github.com/Disane87/tap-and-tell/commit/10163ced6e8242a0bcedfbfd1e093e47f05a48af))

## [1.1.0](https://github.com/Disane87/tap-and-tell/compare/v1.0.0...v1.1.0) (2026-02-04)


### ✨ Features

* **release:** enhance release summary with emojis and links ([cf871b9](https://github.com/Disane87/tap-and-tell/commit/cf871b9bc597165bb7d8a5739af159417def0052))

## 1.0.0 (2026-02-04)


### ✨ Features

* add admin authentication middleware and beta invite management APIs ([d0f8fe2](https://github.com/Disane87/tap-and-tell/commit/d0f8fe2b0efcf6d55a420119caf0166b8afcba5e))
* add API endpoints for managing guestbooks and entries ([7341ec9](https://github.com/Disane87/tap-and-tell/commit/7341ec9b3554df7d97376d4dd703f0085368cb24))
* add API routes for guest entries management and authentication ([4571b47](https://github.com/Disane87/tap-and-tell/commit/4571b478c2b27a50a830e1ca0b58873dcdb61c38))
* add beta access tracking and management tables in database migrations ([75ac042](https://github.com/Disane87/tap-and-tell/commit/75ac04211364cc4ce3632a6dc0cb3a3805adc562))
* **ci:** add CI workflow for automated testing and linting ([fc1beb7](https://github.com/Disane87/tap-and-tell/commit/fc1beb7376a4d4c6bbc088998baca732dd628c78))
* **pwa:** add comprehensive CI, SEO, OpenGraph and iOS compatibility ([975e7bf](https://github.com/Disane87/tap-and-tell/commit/975e7bff547be98e941a3c673a14ac562d9892bf))
* **i18n:** add custom questions section and update settings labels ([9b85a18](https://github.com/Disane87/tap-and-tell/commit/9b85a180c0a276bb86ee273f3a416efd58c50de9))
* add development-only SSL support in Vite configuration ([ac74642](https://github.com/Disane87/tap-and-tell/commit/ac74642666d94b18cbe7b0990f9ba3ff1028e946))
* add environment variable validation plugin for secure configuration ([dd0a40e](https://github.com/Disane87/tap-and-tell/commit/dd0a40e162b5c74c8c96ec7666bdf4e5fbe05e8d))
* add guestbook landing page with swipeable entry view and form submission ([0f28c30](https://github.com/Disane87/tap-and-tell/commit/0f28c3077450768cda17d5e65bcd4477403bd2b2))
* add guestbook landing page, slideshow, and view pages ([390c4e4](https://github.com/Disane87/tap-and-tell/commit/390c4e46ba130cc7057a027f4190d079950d3cf5))
* **hardware:** add independent NFC waves positioning and size ([c794e65](https://github.com/Disane87/tap-and-tell/commit/c794e655c573099104024886d1bcf96175a4a371))
* add initial workspace configuration file for Tap and Tell project ([572db9d](https://github.com/Disane87/tap-and-tell/commit/572db9d9cb35c491692f2822eacdcc2f0fa7d854))
* add optimized pricing model with detailed tiers and revenue projections ([e43b878](https://github.com/Disane87/tap-and-tell/commit/e43b878b14b795d53f946f29edfdf0aa9cfa8de7))
* **hardware:** add parametric frame for sign ([ae14fe2](https://github.com/Disane87/tap-and-tell/commit/ae14fe2f87184ad622bcf21524f67b3e5e82a955))
* **hardware:** add parametric OpenSCAD NFC sign design ([424f76a](https://github.com/Disane87/tap-and-tell/commit/424f76a426fd5bbe61bd3836da02a83c3cf86dd4))
* add production admin user seeding functionality ([83cc68e](https://github.com/Disane87/tap-and-tell/commit/83cc68e343651b7731add887a2b2521b0954fc6f))
* **hardware:** add Python script for multi-color 3MF export ([3248231](https://github.com/Disane87/tap-and-tell/commit/32482317d434ea27304889db63f000856483f7f8))
* add QR code generator and slideshow pages ([c60c649](https://github.com/Disane87/tap-and-tell/commit/c60c6495188c470982d685d2549cfe57780c7c58))
* **hardware:** add stand rotation parameters for all axes ([bbec330](https://github.com/Disane87/tap-and-tell/commit/bbec33022dd4eac4cf5e7b455458eb9c6951bbb1))
* add theme plugin and implement theming concept documentation ([fa975e8](https://github.com/Disane87/tap-and-tell/commit/fa975e8bc8688eaa76bf0c3e32492626d89a407b))
* add Vercel Blob storage driver for production photo storage ([16b6367](https://github.com/Disane87/tap-and-tell/commit/16b63675c1b091ee61fa08d2c731781d38db5310))
* add VS Code devcontainer with PostgreSQL ([d6d298a](https://github.com/Disane87/tap-and-tell/commit/d6d298aab4748621566fa0b3c8c939e7d350df25))
* complete MVP beta readiness tasks ([3b5b57c](https://github.com/Disane87/tap-and-tell/commit/3b5b57cb0f17bd4fc0bc17ec93d9a54515dbc9b8))
* comprehensive security hardening with 2FA, rate limiting, CSRF, audit logging ([e7147bd](https://github.com/Disane87/tap-and-tell/commit/e7147bdae8e861f9ec670d55c68541711b04c745))
* enhance admin bar and card shadow styles for improved visual hierarchy ([707423c](https://github.com/Disane87/tap-and-tell/commit/707423c71239eacf8d1fece140416f720b9c4bc3))
* enhance card shadow effect for improved visual depth ([ca617c7](https://github.com/Disane87/tap-and-tell/commit/ca617c75e232d47a1a7a7b0f2ee1951551f1d616))
* enhance database schema management and integrate storage driver for image handling ([905fa86](https://github.com/Disane87/tap-and-tell/commit/905fa866a8dd5939a8a827880e1d48b359526d5d))
* **hardware:** fully parametric elements + compact stand with slot ([635d3d2](https://github.com/Disane87/tap-and-tell/commit/635d3d2eec5b541dd9aa6b319caa0ec2976c35de))
* GitHub-style API apps with scoped tokens and Bearer auth ([34ef306](https://github.com/Disane87/tap-and-tell/commit/34ef3062275d531978585c097cbf43a7c7113564))
* implement comprehensive analytics system for guestbook statistics ([946b43a](https://github.com/Disane87/tap-and-tell/commit/946b43a7bfee773217e690fb4991b73f96ac1dd7))
* **csrf:** implement CSRF token handling in client plugin ([836bd6f](https://github.com/Disane87/tap-and-tell/commit/836bd6f9c9a14abb1d73674394c49b23a84efb54))
* implement glassmorphism design system ([ab1ee9d](https://github.com/Disane87/tap-and-tell/commit/ab1ee9d63eba60f06e7b57d272af1279dd717d4d))
* implement structured logging across database and migration processes ([e8d589d](https://github.com/Disane87/tap-and-tell/commit/e8d589df56e0914c8a73a8da4b70ea7bb7372e92))
* implement unified upload processing utility and refactor avatar/background/header upload handlers ([84a571c](https://github.com/Disane87/tap-and-tell/commit/84a571c7ee3cd920092bb6d085fe1d807ebb339b))
* implement user authentication and tenant management system ([b26c5fc](https://github.com/Disane87/tap-and-tell/commit/b26c5fc84e408421aab7d9bb0ebd2501713c5a87))
* migrate to PostgreSQL with Row-Level Security and per-tenant photo encryption ([cb13d85](https://github.com/Disane87/tap-and-tell/commit/cb13d855d3724a8f06c34c2f61c9dbfb2f5c76ab))
* **hardware:** minimalist e-ink style stand design ([95f5b25](https://github.com/Disane87/tap-and-tell/commit/95f5b25a90c3ce4d3ae5933a7dd610fef07589c1))
* **hardware:** redesign NFC sign as two-part 45° angled assembly ([3387256](https://github.com/Disane87/tap-and-tell/commit/3387256e9f471e2c877151805dd4c1f72980e46a))
* restructure features section into groups with detailed descriptions and add customization showcase ([6f5a14e](https://github.com/Disane87/tap-and-tell/commit/6f5a14eca9cbcb5136249f08870352753157c891))
* **hardware:** separate NFC pocket parameters from visual ring ([4fc5b83](https://github.com/Disane87/tap-and-tell/commit/4fc5b8328991778792bfc338727302504bd3bad4))
* **hardware:** show sign flat beside stand for printing ([a15e9ba](https://github.com/Disane87/tap-and-tell/commit/a15e9baa2500bca2e8a30c9d68d86907c8e9353e))
* update admin login page with improved authentication flow and UI enhancements ([471a35a](https://github.com/Disane87/tap-and-tell/commit/471a35a1e29e376c3e7ea2de0c4a42481e7a07c3))


### 🐛 Bug Fixes

* correct framework name in Vercel configuration ([923a18b](https://github.com/Disane87/tap-and-tell/commit/923a18bde7e8182eb01225fae70bf517753f3fef))
* **hardware:** correct sign orientation to stand upright ([713ea3b](https://github.com/Disane87/tap-and-tell/commit/713ea3bf41c736f01152fe286aa281ed22f00db0))
* **hardware:** correct slot angle and sign positioning ([cd8975d](https://github.com/Disane87/tap-and-tell/commit/cd8975d3d0e6975188f50c04b4fbcc51860a09fa))
* **hardware:** correct slot cut in stand for sign insertion ([9747dd0](https://github.com/Disane87/tap-and-tell/commit/9747dd055ab67194f3b31a87079c07c52c697a21))
* mark pg as external dependency in Nitro rollup config ([8de3897](https://github.com/Disane87/tap-and-tell/commit/8de38973fa2fe074ce524ae41b5b76d504777ee0))
* **hardware:** position stand in correct standing orientation ([5bacf29](https://github.com/Disane87/tap-and-tell/commit/5bacf29e733ecb4f7bb549da8ac56712801fb224))
* **security:** resolve RLS bypass vulnerabilities and add SQL injection protection ([8c3a3f5](https://github.com/Disane87/tap-and-tell/commit/8c3a3f5f5e69d2df1af98074356d8628b87a1376))
* **hardware:** stand with angled back rest for sign to lean against ([4501d9f](https://github.com/Disane87/tap-and-tell/commit/4501d9f8b0ed0752b154d104d9b6a796a2b901de))


### 📚 Documentation

* **hardware:** add multi-color export instructions ([9f34e6e](https://github.com/Disane87/tap-and-tell/commit/9f34e6e2b4b28a43fc4f178457abe65699298d82))
* **plans:** add Plan 42 for Beta Access System ([f6f264f](https://github.com/Disane87/tap-and-tell/commit/f6f264f4afa375d8c5ac51db552c25c2fe68b3e0))
* consolidate and deduplicate documentation files ([0335058](https://github.com/Disane87/tap-and-tell/commit/03350585bacd18678a3fc79f60e4603eff9b113d))
* create comprehensive README with full project documentation ([e7ae249](https://github.com/Disane87/tap-and-tell/commit/e7ae249829ac8fc01bbdd1052822cf54edb15d64))


### ♻️ Code Refactoring

* adopt Nuxt best practices for database layer ([2bd2f7c](https://github.com/Disane87/tap-and-tell/commit/2bd2f7cc59e59729598b9c54c1e11b8f9d9f5c81))
* **hardware:** update sign parameters and reposition NFC waves icon ([0cbc323](https://github.com/Disane87/tap-and-tell/commit/0cbc32303a0fbf55a87eea1016c0c71db0c1a6f5))
