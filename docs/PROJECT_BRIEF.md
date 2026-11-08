# Project brief – Heimkasse

> The original product/engineering brief (verbatim). The app was first called "Kiseh" and has been renamed to
> **Heimkasse**; German is the default language (see `CLAUDE.md` for decisions made since).

# ROLE

Act as a senior software engineer, software architect, and senior UI/UX designer. You are building "Kiseh", a personal home & living expense manager for someone living in Germany. The project skeleton already exists (Next.js App Router + TypeScript with static export, CSS Modules, Radix UI, Tauri 2, tauri-plugin-sql). Build the complete application on top of it.

# WORKING METHOD (IMPORTANT)

- Work strictly phase by phase (see PHASES). Never start the next phase without my confirmation.
- Before each phase: give a short plan (files to create/change).
- After each phase: run typecheck, lint and tests; fix all errors; then summarize what was built and what I should test manually.
- Never leave TODOs, placeholder logic, or mock data in finished features.
- If something is ambiguous, choose the most reasonable option, state the assumption, and continue.

# CORE PRINCIPLES

- 100% offline and local. No network requests, no analytics, no external fonts or CDNs. All assets bundled.
- The user owns their data: everything can be created, viewed, edited, and deleted. Deletes are soft (trash with undo), plus permanent delete and "delete all data".
- Bilingual: Persian (fa, RTL) and German (de, LTR). Persian is the default. Switching language must be instant, with no reload.
- Mobile-first responsive design. Must work on desktop (macOS, later Windows), web browser, and later iOS/Android via Tauri 2.

# ARCHITECTURE

- Feature-based folder structure:
  src/
  app/ (routes only, thin pages)
  features/<feature>/ (components, hooks, schemas, repository, types per feature)
  components/ui/ (reusable design-system components)
  components/layout/ (app shell, navigation)
  lib/db/ (storage adapters, migrations, query helpers)
  lib/i18n/ (i18n setup, formatters)
  lib/utils/
  styles/ (globals, tokens, themes)
  types/
- Storage abstraction: define a `StorageAdapter` interface and a repository layer per entity. Provide two adapters:
  1. `TauriSqliteAdapter` (tauri-plugin-sql) for desktop and mobile
  2. `BrowserAdapter` (IndexedDB via Dexie) for the web/browser version
     Detect the runtime automatically. UI code must never talk to the database directly, only through repositories and hooks.
- Data fetching and caching: TanStack Query (client-side) wrapping repository calls, with optimistic updates for edit/delete.
- UI state: Zustand (only for UI state such as filters, theme, language).
- Forms: React Hook Form + Zod. Share Zod schemas between forms and repositories.
- Versioned database migrations with a `schema_version` table. Migrations must be idempotent and run on startup.
- Money is stored as integer cents (never floats). Currency is EUR by default. Dates are stored as ISO strings. IDs are UUIDs.
- Every table has `created_at`, `updated_at`, and `deleted_at` (soft delete).

# DATA MODEL

- accounts: name, type (bank, cash, credit card, PayPal), initial_balance_cents, color, icon, archived
- categories: name, name_key (translation key for built-in categories), type (income/expense), parent_id, color, icon, is_system, sort_order
- transactions: account_id, category_id, type (income/expense/transfer), amount_cents, date, payee, note, payment_method, tags, tax_category (nullable), recurring_rule_id, transfer_account_id, import_hash (for duplicate detection)
- recurring_rules: template fields + frequency (weekly/monthly/quarterly/yearly), interval, start_date, end_date, next_run_date, auto_create (bool)
- budgets: category_id, period (monthly), amount_cents, alert_threshold_percent (default 80)
- contracts: name, provider, category_id, amount_cents, billing_frequency, start_date, minimum_term_months, notice_period (value + unit), auto_renew_months, cancellation_date, status, notes, linked recurring_rule_id
- meters: type (electricity, gas, water, heating), unit, meter_number, price_per_unit_cents
- meter_readings: meter_id, date, value, note
- utility_settlements (Nebenkostenabrechnung): year, monthly_prepayment_cents, actual_cost_cents, result (refund/back-payment), notes
- savings_goals: name, target_cents, target_date, color, icon
- goal_contributions: goal_id, amount_cents, date
- attachments: entity_type, entity_id, file_name, mime_type, file_path (stored in the app data folder)
- import_rules: match_field, match_text, category_id, payee_rename
- settings: key/value (language, theme, digit style, week start, currency, first day of the budget month)

Seed built-in categories (using translation keys): Rent (Kaltmiete), Utilities (Nebenkosten), Electricity & Gas, Internet & Phone, Rundfunkbeitrag, Groceries, Transport (Deutschlandticket, fuel), Insurance (health, Haftpflicht, Hausrat, car), Health, Household, Clothing, Leisure, Restaurants, Education, Subscriptions, Gifts, Salary, Other income.

# FEATURES

1. Dashboard: current balance across accounts, this month's income/expense/savings rate, comparison with last month, budget status, upcoming payments (next 14 days), contract cancellation deadlines, top spending categories (chart).
2. Transactions: list with search, filters (date range, account, category, type, amount, tags, tax category), sorting, grouping by day, virtualized for large lists. Create/edit/duplicate/delete; bulk select for delete or category change; undo toast after delete.
3. Categories & accounts: full CRUD, reorder, colors and icons, subcategories, archive instead of delete when used by transactions (with a clear warning).
4. Recurring payments: generate due transactions on app start; show upcoming; pause, skip once, edit future occurrences.
5. Budgets: monthly budgets per category, progress bars, alerts at the threshold and at 100%.
6. Contracts (Verträge): calculate the latest cancellation date from start date, minimum term, notice period, and auto-renewal; remind via local notification (tauri-plugin-notification) 30, 14, and 3 days before.
7. Meter readings & utilities: log readings, calculate consumption and estimated cost, track Nebenkosten prepayments vs settlement.
8. Tax helper: tag transactions with tax categories (Werbungskosten, Home-Office, Handwerkerleistungen, haushaltsnahe Dienstleistungen, Krankheitskosten, Spenden, Versicherungen). Yearly tax report with totals per category, exportable to CSV/PDF.
9. Savings goals: progress, contributions, projected completion date.
10. Bank CSV import: upload a CSV → auto-detect delimiter, encoding (UTF-8 / ISO-8859-1 / Windows-1252), German number format ("1.234,56") and date format ("08.11.2026") → column-mapping step with preview → presets for common German banks (Sparkasse, N26, DKB, ING, Commerzbank) that the user can adjust and save → apply import_rules for auto-categorization → duplicate detection via import_hash → review screen before saving.
11. Attachments: attach receipts (images/PDF) to transactions and contracts; preview; delete.
12. Reports: monthly/yearly by category, trends over time, income vs expense, net worth over time. Every chart has an accessible data table alternative. Export CSV and PDF.
13. Data management (Settings): full JSON backup export/import with validation and version check; automatic backup to a user-chosen folder (desktop); trash view (restore/permanently delete); "Delete all data" behind a double confirmation (the user must type a confirmation word).
14. Settings: language (fa/de), theme (light/dark/system), digit style for Persian (Persian or Latin digits), calendar display for Persian (Gregorian default, optional Jalali display), first day of the week, budget month start day.

# INTERNATIONALIZATION

- Use i18next + react-i18next with typed translation keys (TypeScript must catch missing keys). Translation files: `locales/fa.json`, `locales/de.json`. No hardcoded UI strings anywhere.
- Set `lang` and `dir` on <html> dynamically.
- All numbers, currency, and dates go through central formatters based on `Intl` (`Intl.NumberFormat`, `Intl.DateTimeFormat`): German "1.234,56 €", Persian "۱٬۲۳۴٫۵۶ €" (or Latin digits per setting). Use date-fns with locales; date-fns-jalali for the optional Jalali display.
- Money input must accept both German and Persian digits and decimal separators.
- Use CSS logical properties only. Directional icons (arrows, chevrons) must flip in RTL.
- Fonts bundled locally: Vazirmatn for Persian, Inter for German. Use tabular numbers for amounts.

# DESIGN SYSTEM & UI/UX

- Design tokens as CSS variables: color palette (neutral, primary, success/income, danger/expense, warning, info), spacing scale (4px base), radius, shadows, typography scale, z-index scale, motion durations.
- Light and dark themes with WCAG AA contrast in both. Income and expense must not rely on color alone (use +/− signs and icons).
- Clean, calm, minimal visual style (finance apps should feel trustworthy). Generous white space, clear hierarchy, consistent 8px rhythm.
- App shell: sidebar on desktop (collapsible), bottom navigation on mobile (max 5 items), floating "+" quick-add button on mobile. Respect safe-area insets.
- Quick add: keyboard shortcut (Cmd/Ctrl+N) opens a fast transaction form; Cmd/Ctrl+K opens a command palette for navigation and search.
- Every list has: loading skeletons, a helpful empty state with an action, and an error state with retry.
- Destructive actions use a confirmation dialog; non-destructive ones use undo toasts instead.
- Forms: inline validation, clear error messages in both languages, smart defaults (today's date, last used account), autofocus on the first field.
- Icons: lucide-react. Charts: Recharts, themed with tokens.
- Reusable UI components (components/ui), each typed, documented with JSDoc, and styled with CSS Modules + Radix primitives: Button (variants, sizes, loading), IconButton, Input, Textarea, MoneyInput, NumberInput, Select, Combobox, DatePicker, DateRangePicker, Checkbox, Switch, RadioGroup, FormField (label + hint + error), Dialog, ConfirmDialog, Sheet/Drawer, Popover, Tooltip, DropdownMenu, Tabs, Toast, Card, StatCard, Badge, ProgressBar, Avatar/CategoryIcon, EmptyState, ErrorState, Skeleton, DataTable (sorting, filtering, selection, pagination/virtualization), PageHeader, ChartContainer (with table fallback), CommandPalette.
- Components must be dynamic and composable: driven by props/config, no duplicated markup, no business logic inside UI components.

# ACCESSIBILITY (WCAG 2.2 AA)

- Full keyboard navigation, logical focus order, visible focus styles, focus trapping in dialogs and focus return on close, skip link.
- Semantic HTML first; ARIA only when needed. All inputs have labels; errors are linked with aria-describedby.
- Screen-reader announcements (aria-live) for toasts, saves, and deletions.
- Touch targets at least 44×44px. Respect `prefers-reduced-motion` and `prefers-color-scheme`. Support text zoom up to 200% without layout breaks.
- Amounts read correctly by screen readers (e.g. "minus 45 euros").

# SECURITY & PRIVACY

- Minimal Tauri capabilities/permissions (only what is used). Strict CSP. No remote content.
- Validate all imported files (CSV, JSON backup) with Zod before writing anything.
- Prepare an optional app lock (password) in settings; leave biometric unlock for a later phase but keep the architecture ready.

# CODE QUALITY

- TypeScript strict mode, no `any`, no non-null assertions without a reason.
- ESLint (incl. jsx-a11y) + Prettier. Small, single-responsibility files and functions. Meaningful names. DRY and SOLID.
- Custom hooks for logic (e.g. useTransactions, useBudgets). Pure functions for calculations (balances, budgets, contract deadlines, consumption) in separate modules.
- Tests: Vitest for unit tests of all calculation logic, formatters, CSV parsing, and migrations; React Testing Library for key components; Playwright for the main flows (add/edit/delete transaction, import CSV, backup/restore, language switch).
- Error boundaries per route. Central error handling and user-friendly error messages.
- Performance: virtualized long lists, memoization where measurable, lazy-load charts and heavy pages.

# PHASES

Phase 1 – Foundation: design tokens, themes, fonts, i18n (fa/de, RTL/LTR), formatters, app shell and navigation, UI component library, storage adapters, migrations, repositories, seed data.
Phase 2 – Core: accounts, categories, transactions (full CRUD, filters, bulk actions, undo, trash), recurring payments.
Phase 3 – Insights: dashboard, budgets with alerts, reports and charts with table fallbacks, exports (CSV/PDF).
Phase 4 – Germany features: contracts with cancellation deadline calculation and notifications, meter readings, Nebenkosten, tax helper and yearly tax report, savings goals.
Phase 5 – Data: bank CSV import (mapping, presets, rules, duplicates), attachments, backup/restore, auto-backup, delete all data, settings, app lock.
Phase 6 – Polish: full accessibility audit, performance pass, test coverage for critical logic, macOS build, README with architecture overview and instructions.
