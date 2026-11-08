# Kiseh (کیسه)

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

| Command                   | What it does                                                             |
| ------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`             | Next.js dev server in the browser → http://localhost:3000 (no DB)        |
| `npm run tauri:dev`       | Starts Next.js + opens the app in a Tauri window (hot reload, DB on)     |
| `npm run build`           | Static export of the frontend to `out/`                                  |
| `npm run tauri:build:mac` | Builds the macOS app → `src-tauri/target/release/bundle/macos/Kiseh.app` |
| `npm run tauri:build`     | Builds all bundle targets for the current OS (`.app` + `.dmg` on macOS)  |
| `npm run lint`            | TypeScript type check                                                    |

The first `tauri:dev` / build compiles the Rust dependencies and takes a minute or two; later runs are fast.

## Project structure

```
src/
  app/            Next.js App Router (layout, pages) — static export only
  components/     UI components (one folder per component + .module.css)
  styles/         globals.css: reset, design tokens, light/dark theme
  lib/db/         SQLite connection helper (getDb / closeDb)
  types/          Shared TypeScript types
src-tauri/
  src/lib.rs      Tauri builder, plugins (sql, log)
  capabilities/   Permissions granted to the webview
  tauri.conf.json App/window/bundle configuration
```

## Conventions

- **No server code.** `output: 'export'` — no API routes, server actions or dynamic SSR. All data access goes through Tauri plugins/commands.
- **Styling:** CSS Modules + the CSS variables in `src/styles/globals.css`. No hard-coded colors or spacing.
- **RTL-ready:** use logical properties only (`margin-inline-start`, `padding-block`, `inset-inline-end`, `inline-size` …), never `left`/`right`/`width`-style physical properties for layout. `<html dir>` will follow the locale (`fa` → `rtl`, `de`/`en` → `ltr`).
- **Theme:** follows `prefers-color-scheme`; can be forced with `<html data-theme="light|dark">`.
- **Accessible primitives:** build interactive components on `radix-ui` (installed, not used yet).

## Database

`src/lib/db/index.ts` opens `kiseh.db` in the app data directory:

- macOS: `~/Library/Application Support/app.kiseh.desktop/kiseh.db`

```ts
import { getDb } from "@/lib/db";

const db = await getDb();
const rows = await db.select("SELECT 1");
```

The database is only available inside the Tauri window — in the plain browser (`npm run dev`) the helper throws. No tables exist yet; schema & migrations will be added with the first feature.
