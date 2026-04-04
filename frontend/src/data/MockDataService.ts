import { initialData } from './mockData';
import type { Database, BaseEntity, BaseEntityType, InventoryItem, PartyMember, World, Faction, City, NPC } from './mockData';
import type { IDataService } from './IDataService';

class DataService implements IDataService {
  private data: Database;

  constructor() {
    // Basic local persistence so edits survive soft reloads while in testing.
    const stored = localStorage.getItem('worldBuilderData');
    if (stored) {
      const parsed: Database = JSON.parse(stored);
      // Migrate stored data that predates the inventoryItems collection
      this.data = {
        ...parsed,
        inventoryItems: parsed.inventoryItems ?? [],
        party: parsed.party ?? [],
        pins: parsed.pins ?? [],
        factions: parsed.factions ?? [],
      };
    } else {
      this.data = initialData;
      this.save();
    }
  }

  private save() {
    localStorage.setItem('worldBuilderData', JSON.stringify(this.data));
  }

  // Mimic network delay
  private async delay(ms: number = 200) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getWorlds(): Promise<World[]> {
    await this.delay();
    return this.data.worlds;
  }

  async getEntityByRoute(type: BaseEntityType, id: string): Promise<any | null> {
    await this.delay();
    const collection = this.getCollection(type);
    return collection.find((e: any) => e.id === id) || null;
  }

  async getChildren(_parentType: BaseEntityType, parentId: string, childType: BaseEntityType): Promise<any[]> {
    await this.delay();
    const collection = this.getCollection(childType);
    return collection.filter((e: any) => e.parentId === parentId);
  }

  async updateEntity(type: BaseEntityType, id: string, payload: Partial<any>): Promise<any> {
    await this.delay();
    const collection = this.getCollection(type);
    const index = collection.findIndex((e: any) => e.id === id);
    if (index >= 0) {
      collection[index] = { ...collection[index], ...payload };
      this.save();
      return collection[index];
    }
    throw new Error('Entity not found');
  }

  async createEntity(type: BaseEntityType, payload: Partial<any>): Promise<any> {
    await this.delay();
    const collection = this.getCollection(type);

    const newId = type.charAt(0) + Math.random().toString(36).substring(2, 9);

    const defaults: Record<string, any> = {
      world: { climate: '', magicLevel: '' },
      country: { governmentType: '', economy: '', populationSize: '' },
      city: { populationSize: '', mainExport: '' },
      poi: { dangerLevel: '', keyFeature: '' },
      npc: { role: '', alignment: '', race: '' }
    };

    const newEntity = {
      id: newId,
      type,
      ...(defaults[type] || {}),
      ...payload
    };

    collection.push(newEntity);
    this.save();
    return newEntity;
  }

  // ── Inventory ────────────────────────────────────────────────────────────────

  async getInventory(poiId: string): Promise<InventoryItem[]> {
    await this.delay();
    return this.data.inventoryItems.filter(item => item.poiId === poiId);
  }

  async addInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    await this.delay();
    const newItem: InventoryItem = {
      id: 'inv' + Math.random().toString(36).substring(2, 9),
      ...item,
    };
    this.data.inventoryItems.push(newItem);
    this.save();
    return newItem;
  }

  async updateInventoryItem(id: string, payload: Partial<InventoryItem>): Promise<InventoryItem> {
    await this.delay();
    const index = this.data.inventoryItems.findIndex(i => i.id === id);
    if (index < 0) throw new Error('Inventory item not found');
    this.data.inventoryItems[index] = { ...this.data.inventoryItems[index], ...payload };
    this.save();
    return this.data.inventoryItems[index];
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await this.delay();
    this.data.inventoryItems = this.data.inventoryItems.filter(i => i.id !== id);
    this.save();
  }

  // ── Cascade delete ───────────────────────────────────────────────────────────

  async deleteEntity(type: BaseEntityType, id: string): Promise<void> {
    await this.delay();

    // Collect every descendant ID before touching the arrays
    const toDelete = {
      worlds:    new Set<string>(),
      countries: new Set<string>(),
      cities:    new Set<string>(),
      pois:      new Set<string>(),
      npcs:      new Set<string>(),
    };

    const collect = (t: BaseEntityType, eid: string) => {
      switch (t) {
        case 'world':
          toDelete.worlds.add(eid);
          this.data.countries.filter(c => c.parentId === eid).forEach(c => collect('country', c.id));
          break;
        case 'country':
          toDelete.countries.add(eid);
          this.data.cities.filter(c => c.parentId === eid).forEach(c => collect('city', c.id));
          break;
        case 'city':
          toDelete.cities.add(eid);
          this.data.pois.filter(p => p.parentId === eid).forEach(p => collect('poi', p.id));
          break;
        case 'poi':
          toDelete.pois.add(eid);
          this.data.npcs.filter(n => n.parentId === eid).forEach(n => collect('npc', n.id));
          break;
        case 'npc':
          toDelete.npcs.add(eid);
          break;
      }
    };

    collect(type, id);

    this.data.worlds        = this.data.worlds.filter(e => !toDelete.worlds.has(e.id));
    this.data.countries     = this.data.countries.filter(e => !toDelete.countries.has(e.id));
    this.data.cities        = this.data.cities.filter(e => !toDelete.cities.has(e.id));
    this.data.pois          = this.data.pois.filter(e => !toDelete.pois.has(e.id));
    this.data.npcs          = this.data.npcs.filter(e => !toDelete.npcs.has(e.id));
    // Remove inventory items whose parent POI was deleted
    this.data.inventoryItems = this.data.inventoryItems.filter(i => !toDelete.pois.has(i.poiId));
    // Remove pins for deleted entities
    const allDeleted = new Set([...toDelete.worlds, ...toDelete.countries, ...toDelete.cities, ...toDelete.pois, ...toDelete.npcs]);
    this.data.pins = this.data.pins.filter(id => !allDeleted.has(id));
    // Remove deleted NPCs from faction member lists
    if (toDelete.npcs.size > 0) {
      this.data.factions = this.data.factions.map(f => ({
        ...f,
        members: f.members.filter(m => !toDelete.npcs.has(m.npcId)),
      }));
    }
    // Clear stronghold reference if a city was deleted
    if (toDelete.cities.size > 0) {
      this.data.factions = this.data.factions.map(f =>
        toDelete.cities.has(f.strongholdCityId) ? { ...f, strongholdCityId: '' } : f
      );
    }
    // Remove deleted worlds' factions entirely
    if (toDelete.worlds.size > 0) {
      this.data.factions = this.data.factions.filter(f => !toDelete.worlds.has(f.worldId));
    }

    this.save();
  }

  // ── Party ────────────────────────────────────────────────────────────────────

  async getParty(_worldId: string): Promise<PartyMember[]> {
    await this.delay();
    return this.data.party;
  }

  async saveParty(_worldId: string, members: PartyMember[]): Promise<PartyMember[]> {
    await this.delay();
    this.data.party = members;
    this.save();
    return members;
  }

  // ── Pins ─────────────────────────────────────────────────────────────────────

  async getPins(_worldId: string): Promise<BaseEntity[]> {
    await this.delay();
    const all: BaseEntity[] = [
      ...this.data.worlds, ...this.data.countries,
      ...this.data.cities, ...this.data.pois, ...this.data.npcs
    ];
    return this.data.pins
      .map(id => all.find(e => e.id === id))
      .filter((e): e is BaseEntity => e !== undefined);
  }

  async addPin(_worldId: string, _entityType: string, entityId: string): Promise<void> {
    await this.delay();
    if (!this.data.pins.includes(entityId)) {
      this.data.pins.push(entityId);
      this.save();
    }
  }

  async removePin(_worldId: string, entityId: string): Promise<void> {
    await this.delay();
    this.data.pins = this.data.pins.filter(p => p !== entityId);
    this.save();
  }

  async searchEntities(worldId: string, query: string): Promise<BaseEntity[]> {
    await this.delay();
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const worldCountryIds = new Set(
      this.data.countries.filter(c => c.parentId === worldId).map(c => c.id)
    );
    const worldCityIds = new Set(
      this.data.cities.filter(c => worldCountryIds.has(c.parentId)).map(c => c.id)
    );
    const worldPoiIds = new Set(
      this.data.pois.filter(p => worldCityIds.has(p.parentId)).map(p => p.id)
    );

    const results: BaseEntity[] = [];

    if (worldId.toLowerCase().includes(q) || this.data.worlds.find(w => w.id === worldId)?.name.toLowerCase().includes(q)) {
      const world = this.data.worlds.find(w => w.id === worldId);
      if (world) results.push(world);
    }
    this.data.countries.filter(c => worldCountryIds.has(c.id) && c.name.toLowerCase().includes(q)).forEach(c => results.push(c));
    this.data.cities.filter(c => worldCityIds.has(c.id) && c.name.toLowerCase().includes(q)).forEach(c => results.push(c));
    this.data.pois.filter(p => worldPoiIds.has(p.id) && p.name.toLowerCase().includes(q)).forEach(p => results.push(p));
    this.data.npcs.filter(n => worldPoiIds.has(n.parentId) && n.name.toLowerCase().includes(q)).forEach(n => results.push(n));

    return results.slice(0, 20);
  }

  // ── Reorder inventory items for a POI ────────────────────────────────────────

  async reorderInventory(poiId: string, orderedIds: string[]): Promise<void> {
    // Rebuild the inventoryItems array: POI items in the new order, all others untouched
    const others = this.data.inventoryItems.filter(i => i.poiId !== poiId);
    const reordered = orderedIds
      .map(id => this.data.inventoryItems.find(i => i.id === id))
      .filter((i): i is InventoryItem => i !== undefined);
    this.data.inventoryItems = [...others, ...reordered];
    this.save();
  }

  // ── Bulk replace all inventory for a POI (used by AI generation) ─────────────

  async replaceInventory(poiId: string, items: Omit<InventoryItem, 'id' | 'poiId'>[]): Promise<InventoryItem[]> {
    await this.delay();
    this.data.inventoryItems = this.data.inventoryItems.filter(i => i.poiId !== poiId);
    const newItems: InventoryItem[] = items.map(item => ({
      id: 'inv' + Math.random().toString(36).substring(2, 9),
      poiId,
      ...item,
    }));
    this.data.inventoryItems.push(...newItems);
    this.save();
    return newItems;
  }

  // ── Factions ─────────────────────────────────────────────────────────────────

  async getFactions(worldId: string): Promise<Faction[]> {
    await this.delay();
    return this.data.factions.filter(f => f.worldId === worldId);
  }

  async createFaction(payload: Omit<Faction, 'id'>): Promise<Faction> {
    await this.delay();
    const newFaction: Faction = {
      id: 'f' + Math.random().toString(36).substring(2, 9),
      ...payload,
      members: payload.members ?? [],
    };
    this.data.factions.push(newFaction);
    this.save();
    return newFaction;
  }

  async updateFaction(id: string, payload: Partial<Faction>): Promise<Faction> {
    await this.delay();
    const index = this.data.factions.findIndex(f => f.id === id);
    if (index < 0) throw new Error('Faction not found');
    this.data.factions[index] = { ...this.data.factions[index], ...payload };
    this.save();
    return this.data.factions[index];
  }

  async deleteFaction(id: string): Promise<void> {
    await this.delay();
    this.data.factions = this.data.factions.filter(f => f.id !== id);
    this.data.npcs = this.data.npcs.map(n => ({
      ...n,
      factionIds: (n.factionIds ?? []).filter(fid => fid !== id),
    }));
    this.data.cities = this.data.cities.map(c => ({
      ...c,
      keyFactionIds: (c.keyFactionIds ?? []).filter(fid => fid !== id),
    }));
    this.save();
  }

  async addNPCToFaction(factionId: string, npcId: string, role: string): Promise<void> {
    await this.delay();
    const fIdx = this.data.factions.findIndex(f => f.id === factionId);
    if (fIdx >= 0) {
      const members = this.data.factions[fIdx].members.filter(m => m.npcId !== npcId);
      this.data.factions[fIdx] = { ...this.data.factions[fIdx], members: [...members, { npcId, role }] };
    }
    const nIdx = this.data.npcs.findIndex(n => n.id === npcId);
    if (nIdx >= 0) {
      const fids = new Set(this.data.npcs[nIdx].factionIds ?? []);
      fids.add(factionId);
      this.data.npcs[nIdx] = { ...this.data.npcs[nIdx], factionIds: [...fids] };
    }
    this.save();
  }

  async removeNPCFromFaction(factionId: string, npcId: string): Promise<void> {
    await this.delay();
    const fIdx = this.data.factions.findIndex(f => f.id === factionId);
    if (fIdx >= 0) {
      this.data.factions[fIdx] = {
        ...this.data.factions[fIdx],
        members: this.data.factions[fIdx].members.filter(m => m.npcId !== npcId),
      };
    }
    const nIdx = this.data.npcs.findIndex(n => n.id === npcId);
    if (nIdx >= 0) {
      this.data.npcs[nIdx] = {
        ...this.data.npcs[nIdx],
        factionIds: (this.data.npcs[nIdx].factionIds ?? []).filter(fid => fid !== factionId),
      };
    }
    this.save();
  }

  async getCitiesForWorld(worldId: string): Promise<City[]> {
    await this.delay();
    const countryIds = new Set(
      this.data.countries.filter(c => c.parentId === worldId).map(c => c.id)
    );
    return this.data.cities.filter(c => countryIds.has(c.parentId));
  }

  async getNPCsForWorld(worldId: string): Promise<NPC[]> {
    await this.delay();
    const countryIds = new Set(this.data.countries.filter(c => c.parentId === worldId).map(c => c.id));
    const cityIds = new Set(this.data.cities.filter(c => countryIds.has(c.parentId)).map(c => c.id));
    const poiIds = new Set(this.data.pois.filter(p => cityIds.has(p.parentId)).map(p => p.id));
    return this.data.npcs.filter(n => poiIds.has(n.parentId));
  }

  private getCollection(type: BaseEntityType): any[] {
    switch (type) {
      case 'world': return this.data.worlds;
      case 'country': return this.data.countries;
      case 'city': return this.data.cities;
      case 'poi': return this.data.pois;
      case 'npc': return this.data.npcs;
    }
  }
}

export const APIService = new DataService();
