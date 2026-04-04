import type {
  BaseEntity, BaseEntityType, City, NPC,
  Faction, InventoryItem, PartyMember, World,
} from './mockData';

/**
 * Shared contract for all data service implementations.
 * Swap between MockDataService (localStorage) and HttpDataService (REST API)
 * by changing the export in dataService.ts.
 */
export interface IDataService {
  // ── Worlds ──────────────────────────────────────────────────────────────────
  getWorlds(): Promise<World[]>;

  // ── Entities ─────────────────────────────────────────────────────────────────
  getEntityByRoute(type: BaseEntityType, id: string): Promise<any | null>;
  getChildren(parentType: BaseEntityType, parentId: string, childType: BaseEntityType): Promise<any[]>;
  createEntity(type: BaseEntityType, payload: Partial<any>): Promise<any>;
  updateEntity(type: BaseEntityType, id: string, payload: Partial<any>): Promise<any>;
  deleteEntity(type: BaseEntityType, id: string): Promise<void>;

  // ── Inventory ────────────────────────────────────────────────────────────────
  getInventory(poiId: string): Promise<InventoryItem[]>;
  addInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem>;
  updateInventoryItem(id: string, payload: Partial<InventoryItem>): Promise<InventoryItem>;
  deleteInventoryItem(id: string): Promise<void>;
  reorderInventory(poiId: string, orderedIds: string[]): Promise<void>;
  replaceInventory(poiId: string, items: Omit<InventoryItem, 'id' | 'poiId'>[]): Promise<InventoryItem[]>;

  // ── Party (per-world) ────────────────────────────────────────────────────────
  getParty(worldId: string): Promise<PartyMember[]>;
  saveParty(worldId: string, members: PartyMember[]): Promise<PartyMember[]>;

  // ── Pins (per-world) ─────────────────────────────────────────────────────────
  getPins(worldId: string): Promise<BaseEntity[]>;
  addPin(worldId: string, entityType: BaseEntityType, entityId: string): Promise<void>;
  removePin(worldId: string, entityId: string): Promise<void>;

  // ── Search ───────────────────────────────────────────────────────────────────
  searchEntities(worldId: string, query: string): Promise<BaseEntity[]>;

  // ── Factions ─────────────────────────────────────────────────────────────────
  getFactions(worldId: string): Promise<Faction[]>;
  createFaction(payload: Omit<Faction, 'id'>): Promise<Faction>;
  updateFaction(id: string, payload: Partial<Faction>): Promise<Faction>;
  deleteFaction(id: string): Promise<void>;
  addNPCToFaction(factionId: string, npcId: string, role: string): Promise<void>;
  removeNPCFromFaction(factionId: string, npcId: string): Promise<void>;
  getCitiesForWorld(worldId: string): Promise<City[]>;
  getNPCsForWorld(worldId: string): Promise<NPC[]>;
}
