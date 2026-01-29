# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tap & Tell is an NFC-enabled digital guestbook application built with Nuxt 3. Guests tap their phone on an NFC tag, which opens the app where they can leave their name, photo, and a personal message.

## Tech Stack

- **Framework**: Nuxt 3 (Vue-based meta-framework)
- **Styling**: Tailwind CSS v4
- **Components**: shadcn-vue (headless UI components)
- **Language**: TypeScript
- **Deployment**: Vercel
- **Mobile Feature**: Web NFC API

## Development Commands

**Package Manager**: This project uses **pnpm**.

Once the project is initialized:

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type check
pnpm exec nuxi typecheck
```

## Implementation Approach

**CRITICAL**: This project follows a sequential implementation plan. All development MUST follow the plans in `/plans` directory in order:

1. Start with `plans/00_overview.md`
2. Follow each plan sequentially (01, 02, 03, etc.)
3. Do NOT skip steps
4. Do NOT invent features not in the plans or PRD

The plans are intentionally minimal - implementation details are left to the developer, but the sequence and scope must be followed.

## Architecture

### Directory Structure (to be created)

- `/app` or `/pages` - Nuxt page components
- `/components` - Reusable Vue components
- `/layouts` - Nuxt layout templates
- `/server/routes` - Nuxt API endpoints
- `/composables` - State management and reusable composition functions
- `/public` - Static assets
- `/types` - TypeScript type definitions

### Core Features

1. **NFC Integration** - Primary entry point via Web NFC API
2. **Guest Submission Form** - Name, photo (camera/upload), message
3. **Guest Card Display** - View all guest entries
4. **Photo Upload** - Camera access and file uploads with validation
5. **Theme System** - Dark and light modes
6. **Animations** - Subtle UI transitions

### Data Flow

- Guest entries are persisted via database (schema defined in plan 02)
- API endpoints in `/server/routes` handle CRUD operations (plan 03)
- State management via Nuxt composables (plan 04)
- NFC tags trigger app opening and guest submission flow (plan 12)

## Implementation Plans

The `/plans` directory contains 15 sequential plans:

- **00-01**: Project initialization
- **02-04**: Backend (database, API, state)
- **05-09**: Frontend (layouts, forms, cards, photos, modals)
- **10-11**: UI polish (theming, animations)
- **12**: NFC integration
- **13**: Testing (manual testing strategy)
- **14**: Deployment to Vercel

## Key Constraints

- Must use Nuxt 3, Tailwind CSS v4, shadcn-vue, and TypeScript
- All documentation and comments in English
- Private/minimal/elegant design aesthetic
- Mobile-first approach (NFC is mobile-only)
- No feature invention beyond PRD and plans

## Mandatory Process Rules

### Build Integrity
- Treat every implementation as if `npm run build` will be executed
- Do not mark any step as completed unless the project would build successfully
- Consider TypeScript, imports, Nuxt conventions, and SSR constraints
- If a build error is likely, stop and explain before proceeding

### Plan Tracking
- After completing a plan file, mark completed steps explicitly
- Use checkmarks (✔) inside the relevant plan file
- Never mark a step as completed unless it is fully implemented

### Plan Maintenance
- If new tasks are discovered during implementation:
  - Add them to the most appropriate existing plan file, OR
  - Create a new numbered plan file if scope is larger
- Never silently implement undocumented work

### Documentation First
- If a change affects architecture, features, or scope:
  - Update the relevant Markdown files first
  - Then proceed with implementation

## Project Memory

- Always read PROJECT_MEMORY.md before implementing changes
- Treat documented issues and rules as hard constraints
- Do not repeat known mistakes
- If unsure, stop and ask before proceeding

### General
- All non-trivial code must be documented
- Documentation is mandatory, not optional
- Code without proper documentation is considered incomplete

### JSDoc Requirements
- Use JSDoc for all:
  - Functions
  - Composables
  - Utilities
  - Server handlers
  - Public-facing helpers
- Every JSDoc block must describe:
  - The intention of the code
  - Expected inputs
  - Outputs
  - Side effects (if any)

### Style
- Documentation must explain *why*, not just *what*
- Avoid redundant comments that repeat the code
- Prefer descriptive JSDoc over inline comments

### Maintenance Rule
- If existing code is modified:
  - Update the corresponding JSDoc
- Outdated documentation is considered a bug