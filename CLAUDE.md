# Heimkasse – guide for Claude

Personal home & living expense manager for someone living in Germany. Local-first desktop app
(Next.js static export + Tauri 2), also runs in the browser.

**The full brief (requirements, data model, features, phases) is in [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md).
Read it before starting a phase.** Decisions below override the brief where they differ.

## Phase status

| Phase                                                           | Status  |
| --------------------------------------------------------------- | ------- |
| 1 Foundation                                                    | ✅ done |
| 2 Core (accounts, categories, transactions, recurring, trash)   | ✅ done |
| 3 Insights (dashboard, budgets, reports, CSV/PDF export)        | ✅ done |
| 4 Germany features (contracts, meters, Nebenkosten, tax, goals) | ✅ done |
| 5 Data (CSV import, attachments, backup, delete all, app lock)  | ✅ done |
| 6 Polish (a11y audit, performance, coverage, build, README)     | open    |

Update this table when a phase is finished.

## Working method (from the user)

- Work strictly phase by phase; never start the next phase without the user's confirmation.
- Before a phase: short plan (files to create/change). After a phase: `npm run check` + `npm run test:e2e`, fix
  everything, then summarize what was built and what to test manually.
- No TODOs, placeholders or mock data in finished features. If ambiguous: choose, state the assumption, continue.
- **Git:** one commit per step/component, short one-line messages (e.g. `feat(ui): add Button`).
  **Never add `Co-Authored-By` or any AI attribution.** Don't push unless asked.
- The user writes Persian or German; reply in the user's language.

## Decisions made so far (override the brief)

- App name is **Heimkasse** (Persian UI also shows "Heimkasse"). Bundle id `app.heimkasse.desktop`, DB `heimkasse.db`.
- **German is the default language**; Persian (RTL) is selectable.
- Soft delete = trash + undo toast (no confirm dialog). Confirm dialogs only for irreversible actions (purge, delete all).
- Accounts/categories in use are **archived instead of deleted**, with an explanatory dialog.
- Reordering via "move up/down" menu actions (keyboard-accessible), not drag & drop.
- Recurring rules: past occurrences since start date are booked immediately on create and on app start; edits apply to
  future occurrences only; resuming a paused rule does not backfill the paused period. Month ends are anchored to the
  start date (31.01. → 28.02. → 31.03.).
- `meters.price_per_unit_millicents` (1/1000 cent) instead of `price_per_unit_cents` – cents are too coarse for ct/kWh.
- `settings` rows have a UUID `id` plus a unique `key`; values are JSON.
- Writes in Tauri go through the custom Rust command `db_batch` (one SQLite transaction), because tauri-plugin-sql's
  pool cannot guarantee BEGIN/COMMIT across calls. Reads use the plugin.
- Mobile bottom nav: 4 destinations (Übersicht, Buchungen, Budgets, Berichte) + "More" sheet; floating "+" quick add.
- Dashboard "this month" and budgets use the **budget month** (`budgetMonthStartDay`); reports use calendar
  months/years. Budgets count the category incl. subcategories; one budget per expense category.
- Budget alerts: toast at the threshold and at 100 %, once per budget/period/level; bookkeeping in the settings row
  `budget_alerts` (`SettingsRepository.getValue/setValue` for internal non-preference values).
- Exports: CSV in German spreadsheet format (`;`, decimal comma, `dd.mm.yyyy`, UTF-8 BOM, formula-injection safe).
  PDF = own minimal writer (`lib/export/pdf.ts`) with canvas-rendered A4 pages (correct Persian shaping/RTL offline;
  text is not selectable). Export content is a format-neutral `ExportDocument`. Desktop saves via
  tauri-plugin-dialog (save) + tauri-plugin-fs (`write-file`, scope = path picked in the dialog); browser downloads.
- Contracts: term end = start + minimum term (anchored to the start date), then renews by `auto_renew_months`; with 0
  it becomes open-ended (cancellable any time with notice, § 309 Nr. 9 BGB). "3 months to 31.12." → deadline 30.09.
  `cancellation_date` = effective end after cancelling. A linked recurring rule can be created with the contract;
  amount/frequency/category edits pass to it (future only), cancelling sets the rule's `end_date`. Deleting a contract
  keeps its rule.
- Contract reminders 30/14/3 days before the deadline: toast + native notification (tauri-plugin-notification),
  checked on start/data change/hourly while the app runs, once per stage (settings row `contract_reminders`).
- Meters: readings may never decrease (validated against neighbours); yearly projection uses the reading closest to
  one year before the latest one. Price input in ct with 3 decimals → millicents.
- Nebenkosten: result = 12 × monthly prepayment − actual (stored in `result_cents`); one settlement per year; suggested
  prepayment = actual / 12 rounded up to whole euros. Meters and settlements share `/utilities/` (tabs).
- Tax report: expenses with a tax category count, income with a tax category (refunds) reduces; calendar year.
- Savings goals: withdrawals are negative contributions; projection from the last 3 months' net average.
- Trash covers contracts, meters, settlements and goals; purging meters/goals also purges readings/contributions.
  Readings and contributions themselves are deleted with an undo toast only (no trash tab).

- CSV import (`/import/`): encoding UTF-8 or Windows-1252 (= ISO-8859-1; own table decoder), delimiter/header row/
  date/decimal detection, signed amounts (+ "invert sign"). Presets identify columns by header name (built-in:
  Sparkasse, N26, DKB, ING, Commerzbank); a preset is detected only if all its main columns exist. User presets live in
  the settings row `import_presets`. Import rules: first match by `sort_order` sets category (only if the type fits)
  and payee rename. `import_hash` = hash of account/date/amount/payee/note + occurrence in the file; known hashes
  (incl. trash) = duplicate, same date+amount manual booking = possible duplicate; both start unselected.
  Saving is one atomic write.
- Attachments: images + PDF ≤ 20 MB, files via `FileStore` (`lib/files`: `$APPDATA/attachments/` in Tauri, separate
  IndexedDB `heimkasse-files` in the browser, memory in tests; `repos.files`). Managed from the row menu of
  transactions/contracts; images previewed as data URLs, PDF/HEIC only saved. Delete = soft delete + undo; files of
  deleted attachments are purged on the next start (`DataMaintenance`); purging a transaction/contract purges its
  attachments + files.
- Backup: JSON `{app, format: 1, schemaVersion, exportedAt, tables, files(base64)}` incl. trash; every row is
  validated with its entity schema before writing; newer schema/format is refused, missing columns of older backups
  get column defaults. Restore replaces everything in one write (`clear` op); device settings `app_lock` and
  `auto_backup` are neither exported nor overwritten.
- Auto-backup (desktop only): folder from the open dialog, kept in the fs scope by tauri-plugin-persisted-scope;
  daily/weekly, keeps the newest N `heimkasse-backup-*.json`; checked on start + hourly.
- Delete all data: typed confirmation word; keeps only preference rows, removes files, re-seeds built-in categories.
  Also the "forgot password" escape on the lock screen.
- App lock: PBKDF2-SHA256 (310k iterations, random salt) in settings row `app_lock`; locked on every start, optional
  auto-lock after inactivity, back-off after 5 failed attempts. Not encryption. `LockMethod` is extensible for
  biometrics later. `LockGate` sits inside `StorageGate`; nothing else mounts while locked.

## Architecture (where things live)

- `src/app/` routes only (thin pages + `error.tsx` per route). Static export, `trailingSlash: true`, no dynamic routes.
- `src/features/<feature>/`: `schemas.ts` (Zod, shared by forms + repository), `repository.ts`, `service.ts` (multi-entity
  operations, atomic via `storage.write(ops)`), pure logic modules with tests, `hooks.ts` (TanStack Query),
  `components/`.
- `src/features/repositories.ts` composition root; `src/features/queryKeys.ts` + `invalidateData()`;
  `src/features/shared/useDataMutation.ts` (optimistic update + error toast + invalidate).
- `src/lib/db/`: `StorageAdapter` interface, SQLite + IndexedDB adapters, declarative migrations (schema is derived from
  migrations – **never edit a released migration, append a new one**), `BaseRepository` (CRUD, softDelete, restore, purge,
  `prepare*` ops for atomic batches).
- `src/lib/i18n/`: `locales/de.json` + `fa.json` must have identical keys (TS + test enforce it). Add keys to both.
  All numbers/money/dates via `useFormat()` (Intl). Money parsing in `parse.ts`.
- `src/components/ui/`: design system (Radix + CSS Modules); `src/components/layout/`: shell, nav (`navigation.ts` is the
  single nav source), command palette.
- Insights: pure aggregations in `features/reports/aggregate.ts`, `features/budgets/status.ts`,
  `features/overview/dashboard.ts`, periods in `lib/utils/period.ts`. Charts (Recharts) live in
  `features/reports/components/charts/` and are lazy-loaded; always wrap them in `ChartContainer` (table fallback).
- Global overlays (quick add, recurring auto-runner, budget alert watcher, reminders, data maintenance) are composed in `src/app/layout.tsx` via `AppShell overlays`.

## Conventions

- Money = integer cents; dates = `YYYY-MM-DD`; timestamps = ISO; ids = UUID. Entity fields are snake_case.
- CSS: tokens only (`src/styles/tokens.css`, `themes.css`), **logical properties only**, 44px touch targets,
  `DirectionalIcon` for arrows/chevrons. Colors for user entities are `ColorKey`s mapped to `--swatch-*`.
- No hard-coded UI strings. Validation messages are translation keys (`lib/validation/messages.ts`).
- Update forms must send only edited fields (create schemas carry defaults like `sort_order`/`archived`).
- Use `useWatch` (not `form.watch`) for React-Compiler compatibility.

## Commands

```bash
npm run dev            # browser (IndexedDB)
npm run tauri:dev      # desktop window (SQLite) – needs port 3000 free
npm run check          # typecheck + eslint + vitest
npm run test:e2e       # Playwright against the static build (desktop + mobile)
npm run tauri:build:mac
npx prettier --write .
```

Rust is installed via rustup (`source ~/.cargo/env` if `cargo` is missing in a shell).
