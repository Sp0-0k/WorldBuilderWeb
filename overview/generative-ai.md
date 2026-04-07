# Generative AI Integration Overview

WorldBuilderWeb includes optional AI-assisted content generation for worldbuilding tasks. The current integration is frontend-driven and focused on generating structured fantasy content for:

- POIs (points of interest)
- NPCs
- POI inventories

## Integration model

The frontend `AIService` builds context from the current entity and ancestor chain, constructs prompts, and calls OpenAI’s Responses API. Responses are requested in strict JSON-schema format so generated output fits expected UI fields.

The service also surfaces usage/token diagnostics through UI notifications, which is useful for development visibility and prompt tuning.

Entity creation uses an AI-assisted draft workflow for supported types (POI/NPC): generation pre-fills the create-entity modal, then users review and edit before saving.

## Configuration and runtime notes

- AI is enabled via `VITE_OPENAI_API_KEY` in the frontend environment.
- The service performs direct browser-to-OpenAI calls (acceptable for class/demo use, but not production-ideal).
- Model selection and structured schema constraints are embedded in the AI service.

## Where AI fits in app behavior

The entity workspace is the main orchestration surface that passes entity context and manages edits. AI-generated outputs are designed to slot into that workflow rather than replace manual editing.

For POI inventory generation specifically:

- Inventory generation is available only when POI inventory is enabled.
- If inventory already exists, generation uses an explicit overwrite confirmation modal.
- Party data from world settings is passed to generation so item rarity/pricing can be tuned to party composition and average level.

## Key references

- AI service overview/comments and env key note: [frontend/src/data/AIService.ts](../frontend/src/data/AIService.ts#L1-L16)
- Context-building for world-aware prompts: [frontend/src/data/AIService.ts](../frontend/src/data/AIService.ts#L72-L111)
- Entity generation entrypoint and API key check: [frontend/src/data/AIService.ts](../frontend/src/data/AIService.ts#L113-L128)
- OpenAI Responses API call + model selection (entity): [frontend/src/data/AIService.ts](../frontend/src/data/AIService.ts#L141-L171)
- Inventory generation entrypoint: [frontend/src/data/AIService.ts](../frontend/src/data/AIService.ts#L214-L295)
- OpenAI Responses API call + model selection (inventory): [frontend/src/data/AIService.ts](../frontend/src/data/AIService.ts#L296-L326)
- Token usage notifications: [frontend/src/data/AIService.ts](../frontend/src/data/AIService.ts#L25-L37)
- Workspace data orchestration context: [frontend/src/pages/EntityWorkspace.tsx](../frontend/src/pages/EntityWorkspace.tsx#L36-L76)
- AI-assisted create-entity modal workflow: [frontend/src/components/workspace/CreateEntityModal.tsx](../frontend/src/components/workspace/CreateEntityModal.tsx#L1-L218)
- POI inventory enable toggle + generation trigger: [frontend/src/components/workspace/POIInventoryPanel.tsx](../frontend/src/components/workspace/POIInventoryPanel.tsx#L210-L360)
- Inventory overwrite confirmation + replace flow: [frontend/src/components/workspace/POIInventoryPanel.tsx](../frontend/src/components/workspace/POIInventoryPanel.tsx#L292-L332)
- Party settings used for inventory tailoring: [frontend/src/pages/SettingsPage.tsx](../frontend/src/pages/SettingsPage.tsx#L71-L96)
