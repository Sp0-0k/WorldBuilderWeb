# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `frontend/`:

```bash
npm run dev       # start dev server (Vite HMR)
npm run build     # tsc type-check + Vite production build
npm run lint      # ESLint
npm run preview   # preview the production build locally
npx vitest        # run all tests
npx vitest run src/__tests__/EntityEditor.test.tsx  # run a single test file
```

## Architecture

This is a **frontend-only** React + TypeScript app (Vite). There is no backend. The `Plans/` directory contains design docs and the AI-agent prompt used to build the UI.

### Data Layer (`src/data/`)

- `mockData.ts` — TypeScript types (`World`, `Country`, `City`, `POI`, `NPC`, `Database`) and `initialData` seed. `SCHEMA_FIELDS` maps each entity type to its extra fields (beyond `id`, `name`, `description`).
- `MockDataService.ts` — singleton `APIService` that persists to `localStorage` and simulates async latency. All reads/writes go through this service. **The data layer is intentionally abstracted** so the UI never talks to a concrete store directly — this is intended to be swappable with a real API later.

### Entity Hierarchy

The app models a strict 5-level tree: `world → country → city → poi → npc`. Navigation follows this hierarchy — going deeper means navigating into a child entity. Each non-root entity has a `parentId` linking it up one level.

### Routing

Two routes defined in `App.tsx`:
- `/` → `LandingPage` (world selection/creation)
- `/view/:type/:id` → `EntityWorkspace` (entity detail + children)

`EntityWorkspace` is the main view: it fetches the current entity, its full parent chain, its siblings (for the sidebar), and its children. Route params `type` and `id` drive all data fetching.

### Component Structure

```
components/
  layout/
    AppLayout.tsx        — shell with optional navbar slot
    WorkspaceSidebar.tsx — sibling entity list for current level
  primitives/
    FantasyCard.tsx      — card used to display child entities
    StatField.tsx        — single labeled read/edit field
  workspace/
    BreadcrumbHeader.tsx — shows parent chain + current entity name
    EntityEditor.tsx     — read/edit toggle form for entity fields; uses SCHEMA_FIELDS to render type-specific fields
    CreateEntityModal.tsx — modal for creating a child entity
pages/
  LandingPage.tsx
  EntityWorkspace.tsx
```

### Theming

Custom Mantine theme in `src/theme.ts`. Custom color palette: `gold`, `brown`, `deepRed`, `darkGray`, `forestGreen`. Body font is Inter; headings use Cinzel/Playfair Display. Stick to these named colors when adding UI — avoid hardcoded hex values.

### Testing

Tests use Vitest + Testing Library with a jsdom environment (`setupFiles: src/setupTests.ts`). Tests mock `MockDataService` via `vi.mock`. The `EntityEditor` tests verify the read-only / edit-mode toggle behavior, which is a core UX requirement (no accidental edits).
