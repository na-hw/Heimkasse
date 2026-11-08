# Heimkasse

Personal home & living expense manager — a local-first desktop app.

**Stack:** Next.js (App Router, static export) · TypeScript · CSS Modules · Radix UI · Tauri 2 · SQLite (`tauri-plugin-sql`)

## Prerequisites

- **Node.js** ≥ 20 (tested with 24) and npm
- **Rust** (stable) — install via [rustup](https://rustup.rs):
  `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **macOS:** Xcode Command Line Tools — `xcode-select --install`

## Setup

```bash
npm install
```

## Scripts

| Command                   | What it does                                                               |
| ------------------------- | -------------------------------------------------------------------------- |
| `npm run dev`             | Browser version → http://localhost:3000 (data in IndexedDB)                |
| `npm run tauri:dev`       | Desktop window with hot reload (data in SQLite `heimkasse.db`)             |
| `npm run build`           | Static export of the frontend to `out/`                                    |
| `npm run tauri:build:mac` | macOS app → `src-tauri/target/release/bundle/macos/Heimkasse.app`          |
| `npm run tauri:build`     | All bundle targets for the current OS (`.app` + `.dmg` on macOS)           |
| `npm run check`           | Typecheck + ESLint + unit tests                                            |
| `npm run typecheck`       | TypeScript only                                                            |
| `npm run lint`            | ESLint (incl. jsx-a11y)                                                    |
| `npm run format`          | Prettier                                                                   |
| `npm test`                | Vitest unit/component tests (SQLite via `node:sqlite`, IndexedDB via fake) |
| `npm run test:e2e`        | Playwright against the static build (desktop + mobile viewport)            |

The first `tauri:dev` / build compiles the Rust dependencies and takes a minute or two; later runs are fast.
In development the sidebar shows **Komponenten** (`/design/`), a live gallery of all UI components.

## Project structure

```
src/
  app/                  Routes only (thin pages, error boundaries) — static export
  features/<feature>/   Schemas (Zod), repository, hooks, components per feature
  components/ui/        Design-system components (CSS Modules + Radix)
  components/layout/    App shell, sidebar, bottom nav, command palette
  components/providers/ Query client, storage init, preferences effects
  lib/db/               StorageAdapter, SQLite + IndexedDB adapters, migrations, BaseRepository
  lib/i18n/             i18next setup, fa/de locales, Intl formatters, number parsing
  lib/preferences/      Zustand stores (preferences, UI state)
  lib/validation/       Shared Zod helpers and translatable error messages
  styles/               tokens.css, themes.css, globals.css
src-tauri/              Rust shell: SQL plugin + atomic `db_batch` command, CSP, capabilities
e2e/                    Playwright tests
```

## Conventions

- **No server code.** `output: 'export'` — no API routes, server actions or dynamic SSR. Data access goes through repositories (SQLite in Tauri, IndexedDB in the browser).
- **Styling:** CSS Modules + the design tokens in `src/styles/tokens.css` / `themes.css`. No hard-coded colors or spacing.
- **RTL-ready:** use logical properties only (`margin-inline-start`, `padding-block`, `inset-inline-end`, `inline-size` …), never `left`/`right`/`width`-style physical properties for layout. `<html lang/dir>` follows the language setting (`fa` → `rtl`, `de` → `ltr`); directional icons use `DirectionalIcon`.
- **Theme:** follows `prefers-color-scheme`; can be forced with `<html data-theme="light|dark">`.
- **Accessible primitives:** interactive components are built on `radix-ui`; every list has loading, empty and error states.
- **i18n:** German is the default language, Persian (RTL) is selectable in settings. No hard-coded UI strings; keys are typed, `fa.json` must match `de.json` (checked by TypeScript and tests).

## Database

UI code never touches the database directly: components → hooks (TanStack Query) → repositories → `StorageAdapter`.
In Tauri the adapter opens `heimkasse.db` in the app data directory:

- macOS: `~/Library/Application Support/app.heimkasse.desktop/heimkasse.db`

Migrations are declarative and versioned (`src/lib/db/migrations`, tracked in `schema_version`), run on
startup for both adapters and are idempotent. Money is stored as integer cents, dates as ISO strings, ids as UUIDs.
