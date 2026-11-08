---
description: Start the given phase of the Heimkasse brief (e.g. /phase 3)
argument-hint: <phase number>
---

Build **Phase $ARGUMENTS** of Heimkasse.

1. Read `CLAUDE.md` (decisions, conventions, phase status) and the phase description plus all related
   requirements in `docs/PROJECT_BRIEF.md` (features, data model, design, accessibility, code quality).
2. Look at the existing code for the patterns already in place (features, repositories, hooks, UI components)
   and reuse them.
3. Give a short plan (assumptions + files to create/change), then implement it.
4. Commit after every step/component with a short one-line message, without any Co-Authored-By/AI attribution.
5. Finish with `npm run check` and `npm run test:e2e`, fix all failures, update the phase table in `CLAUDE.md`,
   and summarize what was built and what to test manually. Do not start the next phase.
