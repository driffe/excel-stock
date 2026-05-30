# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`excel-stock` is a stock tracker with a **spreadsheet (Excel-like) web UI**. Rows are tickers, columns are quote fields, and the grid supports inline editing, keyboard navigation, and copy/paste. Quotes refresh on an interval from a pluggable provider.

**Stack:** Vite + React + TypeScript, [`react-datasheet-grid`](https://react-datasheet-grid.netlify.app/) for the Excel-like grid. Quote data comes through a provider adapter — a built-in **mock** provider (random walk, zero config) or **Finnhub** live data.

## Commands

```bash
npm install            # install deps
npm run dev            # start dev server (http://localhost:5173)
npm run build          # typecheck (tsc -b) + production build to dist/
npm run preview        # serve the production build
npm run typecheck      # type-check only, no emit
npm run lint           # eslint
```

There is no test runner wired up yet. If you add tests, prefer Vitest (integrates with Vite) and document the single-test invocation here.

## Configuration

Copy `.env.example` to `.env`. Without it the app runs on the mock provider.

- `VITE_QUOTE_PROVIDER` — `mock` (default) or `finnhub`
- `VITE_FINNHUB_API_KEY` — required only for `finnhub`
- `VITE_REFRESH_MS` — quote poll interval (default 15000)

## Architecture

Data flows one direction: **symbols → quotes → rows → grid**.

- `src/types.ts` — `Quote` (normalized across providers) and `StockRow` (a `Quote` plus the editable `symbol`).
- `src/api/provider.ts` — the `QuoteProvider` interface. Every data source implements `getQuote(symbol)` and returns a normalized `Quote`.
- `src/api/mock.ts`, `src/api/finnhub.ts` — provider implementations. `src/api/index.ts` (`getProvider()`) selects one from env at startup. **To add a provider, implement `QuoteProvider` and register it there — nothing else should need to know which provider is active.**
- `src/hooks/useQuotes.ts` — owns polling. Given the symbol list, it fetches quotes on `VITE_REFRESH_MS` and returns a `symbol → Quote` map.
- `src/components/StockGrid.tsx` — the spreadsheet. The **symbol column is the only editable one**; price/change/etc. columns are read-only and rendered from the merged quote. Editing rows changes the symbol list, which re-keys polling.
- `src/App.tsx` — holds the symbol list (source of truth), wires `useQuotes`, derives display rows, renders the grid + header.

Key invariant: the symbol list is the single source of truth for what's tracked. The grid edits it; the hook reads it; quote data is always merged in for display and never edited directly.

---

# Operating Principles

## Workflow Orchestration

### 1. Plan First
- Enter plan mode for any non-trivial task (3+ steps or architectural decisions).
- If something goes sideways, STOP and re-plan immediately — don't keep pushing.
- Plan verification steps, not just the build.
- Write detailed specs upfront to reduce ambiguity.

### 2. Subagent Strategy
- Use subagents liberally to keep the main context window clean.
- Offload research, exploration, and parallel analysis to subagents.
- For complex problems, throw more compute at it via subagents.
- One task per subagent for focused execution.

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern.
- Write rules for yourself that prevent the same mistake.
- Ruthlessly iterate on these lessons until the mistake rate drops.
- Review lessons at session start.

### 4. Verification Before Done
- Never mark a task complete without proving it works.
- Diff behavior between main and your changes when relevant.
- Ask yourself: "Would a staff engineer approve this?"
- Run the app, check logs, demonstrate correctness.

### 5. Demand Elegance (Balanced)
- For non-trivial changes, pause and ask "is there a more elegant way?"
- If a fix feels hacky, implement the elegant solution instead.
- Skip this for simple, obvious fixes — don't over-engineer.
- Challenge your own work before presenting it.

### 6. Autonomous Bug Fixing
- Given a bug report: just fix it. Don't ask for hand-holding.
- Point at logs, errors, failing tests — then resolve them.
- Aim for zero context-switching required from the user.

## Task Management

1. **Plan First** — write the plan to `tasks/todo.md` with checkable items.
2. **Verify Plan** — check in before starting implementation.
3. **Track Progress** — mark items complete as you go.
4. **Explain Changes** — high-level summary at each step.
5. **Document Results** — add a review section to `tasks/todo.md`.
6. **Capture Lessons** — update `tasks/lessons.md` after corrections.

## Core Principles

- **Simplicity First** — make every change as simple as possible; touch minimal code.
- **No Laziness** — find root causes; no temporary fixes; senior-developer standards.
- **Minimal Impact** — changes should only touch what's necessary; avoid introducing bugs.
