# Frontend Architecture and Data Flow

The frontend is a React + Vite SPA that centers on a routed entity workspace. Users navigate from landing/world selection into entity-specific workspaces where parent context, children, and side systems (pins, inventory, faction data) are loaded and edited.

## UI composition model

The app is initialized with Mantine theming and notifications, then mounted through a router-based shell. The route model is simple:

- `/` landing page
- `/worlds` world management
- `/view/:type/:id` entity workspace

The entity workspace is the central operating screen. It loads the current entity, builds an ancestor chain, fetches child entities, and coordinates editor/modals/sidebar behaviors.

## Auth/session model

The app includes a lightweight frontend auth context used by the landing/login flow. Session state is managed by a frontend-only `AuthContext` model (UI state only), and backend API routes are not protected by auth middleware.

## Data access model

Data access is abstracted behind a shared `IDataService` interface. At runtime, `dataService.ts` chooses between:

- `HttpDataService` (real backend REST API)
- `MockDataService` (mock/local mode)

This allows the UI to remain largely backend-agnostic while preserving the same interaction surface.

## Practical runtime behavior

In workspace routes, the page fetches entity, children, and pin state, then updates local UI state for create/update/delete/pin operations. The same service abstraction handles search, party, factions, and inventory APIs.

Sidebar behavior is also part of the runtime flow:

- Search is debounced and world-scoped.
- The world tree lazily loads descendants and expands ancestors of the active entity.
- Pinned entities are managed from the sidebar and route back into workspace views.
- Settings open in a modal from the sidebar.

## Settings domain behavior

Settings currently cover two major world-scoped systems:

- Party management (member roster, class/level, persisted save state).
- Faction management (CRUD, stronghold city assignment, NPC membership and roles).

## Key references

- Frontend boot + Mantine providers: [frontend/src/main.tsx](../frontend/src/main.tsx#L1-L19)
- Route structure and app shell: [frontend/src/App.tsx](../frontend/src/App.tsx#L1-L22)
- Frontend auth context provider: [frontend/src/contexts/AuthContext.tsx](../frontend/src/contexts/AuthContext.tsx#L1-L34)
- Workspace entity loading and parent-chain logic: [frontend/src/pages/EntityWorkspace.tsx](../frontend/src/pages/EntityWorkspace.tsx#L15-L76)
- Workspace pin loading/toggling: [frontend/src/pages/EntityWorkspace.tsx](../frontend/src/pages/EntityWorkspace.tsx#L78-L97)
- Workspace editor + create modal composition: [frontend/src/pages/EntityWorkspace.tsx](../frontend/src/pages/EntityWorkspace.tsx#L174-L249)
- Sidebar composition (search/tree/pins/settings): [frontend/src/components/layout/WorkspaceSidebar.tsx](../frontend/src/components/layout/WorkspaceSidebar.tsx#L1-L134)
- Debounced search behavior: [frontend/src/components/sidebar/SearchSection.tsx](../frontend/src/components/sidebar/SearchSection.tsx#L1-L67)
- Lazy hierarchy tree loading: [frontend/src/components/sidebar/HierarchyTree.tsx](../frontend/src/components/sidebar/HierarchyTree.tsx#L1-L213)
- Settings page (party + faction orchestration): [frontend/src/pages/SettingsPage.tsx](../frontend/src/pages/SettingsPage.tsx#L1-L201)
- Faction settings details: [frontend/src/pages/FactionSettingsSection.tsx](../frontend/src/pages/FactionSettingsSection.tsx#L1-L318)
- Service mode toggle (`VITE_USE_API`): [frontend/src/data/dataService.ts](../frontend/src/data/dataService.ts#L1-L11)
- Shared service contract: [frontend/src/data/IDataService.ts](../frontend/src/data/IDataService.ts#L1-L50)
- HTTP implementation of the contract: [frontend/src/data/HttpDataService.ts](../frontend/src/data/HttpDataService.ts#L1-L159)
