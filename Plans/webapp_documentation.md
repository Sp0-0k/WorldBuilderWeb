# WorldBuilder Backend Integration Documentation

This document outlines the current state of the frontend application's expected data models and API interactions. The backend team should use this as a reference for building out the REST API or GraphQL endpoints necessary to wire up the application data into a real database.

## System Overview

The WorldBuilder application uses a hierarchical graph of entities. Each entity has a specific type, and, with the exception of the root `world` entity, perfectly belongs to a parent.

The hierarchy looks like this:
`World -> Country -> City -> Point of Interest (POI) -> Non-Player Character (NPC)`

Currently, the frontend uses a `DataService` (mocked in LocalStorage) that simulates normal CRUD operations.

---

## Entity Schemas

Every entity inherits from a `BaseEntity` object for its fundamental routing and display data. 

### Base Schema
```typescript
interface BaseEntity {
  id: string;          // UUID preferred
  name: string;        // Max length ~100
  description: string; // Max length ~2000
  type: BaseEntityType;// 'world' | 'country' | 'city' | 'poi' | 'npc'
  parentId?: string;   // Exists on everything except 'world'
}
```

### Specialized Schemas
In addition to the Base Entity parameters, each specific type possesses specialized optional fields. The frontend can send or omit these fields on create/update tasks.

#### World 
`type: 'world'`
* `climate` (string)
* `magicLevel` (string)

#### Country
`type: 'country'`
* `governmentType` (string)
* `economy` (string)
* `populationSize` (string)
* `parentId` (string, points to World.id)

#### City
`type: 'city'`
* `populationSize` (string)
* `mainExport` (string)
* `parentId` (string, points to Country.id)

#### Point of Interest (POI)
`type: 'poi'`
* `dangerLevel` (string)
* `keyFeature` (string)
* `parentId` (string, points to City.id)

#### Non-Player Character (NPC)
`type: 'npc'`
* `role` (string)
* `alignment` (string)
* `race` (string)
* `parentId` (string, points to POI.id)

---

## Expected API Surface

To fully replace the `MockDataService`, the backend should provide endpoints that map to the following functionality.

### 1. Get Root Worlds
When a user arrives at the landing page, they need to see a list of their root universes.
* **Returns**: `Array<World>`
* **Frontend Method**: `getWorlds()`

### 2. Get Entity By Route
When navigating direct links like `/view/city/123`, the app needs to fetch just that specific parent entity to render its details.
* **Params**: `type` (e.g. 'city'), `id`
* **Returns**: Single Entity Object or 404
* **Frontend Method**: `getEntityByRoute(type, id)`

### 3. Get Entity Children
Every time a user opens a Parent context, they need a list of the sub-entities that belong to it so the UI can populate the sidebar navigation and content windows.
* **Params**: `parentType`, `parentId`, `childType`
* **Returns**: Array of Entity Objects (e.g., Get all `NPC`s where parent is a specific `POI`)
* **Frontend Method**: `getChildren(parentType, parentId, childType)`

### 4. Update Entity (PUT/PATCH)
Allows updating an entity's base schema (name/description) or adding/updating its specialized fields.
* **Params**: `type`, `id`
* **Body**: `Partial<Entity>`
* **Returns**: The updated object.
* **Frontend Method**: `updateEntity(type, id, payload)`

### 5. Create Entity (POST)
When a user clicks "Create" in a context window, this endpoint is fired.
* **Body**: 
  * `type`
  * `name`
  * `description`
  * `parentId` (if applicable)
  * ...any specialized fields from the schema maps.
* **Returns**: The newly created object, including its generated ID.
* **Frontend Method**: `createEntity(type, payload)`

---

## Architectural Notes for Backend Team
> [!NOTE] 
> **Dynamic Field Flexibility:** The UI is designed to dynamically display specialized fields. This means the backend should ideally store specialized fields in a flexible way (like a JSONB column in postgres, or dynamic attributes in NoSQL) rather than rigid, strict schemas, so that adding new attributes to the `SCHEMA_FIELDS` map on the frontend is trivial.

> [!WARNING]
> **Orphans:** If a parent entity (e.g. City) is deleted, the backend should handle cascading deletes for POIs and NPCs to avoid orphaned data. The frontend has not built safeguards against navigating to orphaned entities yet.
