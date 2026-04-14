import type { IDataService } from './IDataService';
import type {
  BaseEntity, BaseEntityType, City, NPC,
  Faction, InventoryItem, NPCMemory, PartyMember, World,
} from './mockData';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers ?? {});
  const hasBody = options?.body !== undefined && options?.body !== null;
  const isFormDataBody = typeof FormData !== 'undefined' && options?.body instanceof FormData;

  if (hasBody && !isFormDataBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

function post<T>(path: string, body: unknown): Promise<T> {
  return req<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

function patch<T>(path: string, body: unknown): Promise<T> {
  return req<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}

function put<T>(path: string, body: unknown): Promise<T> {
  return req<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}

function del(path: string): Promise<void> {
  return req<void>(path, { method: 'DELETE' });
}

export class HttpDataService implements IDataService {
  // ── Worlds ──────────────────────────────────────────────────────────────────

  getWorlds(): Promise<World[]> {
    return req('/worlds');
  }

  // ── Entities ─────────────────────────────────────────────────────────────────

  getEntityByRoute(type: BaseEntityType, id: string): Promise<BaseEntity | null> {
    return req<BaseEntity>(`/entities/${type}/${id}`).catch(() => null);
  }

  getChildren(parentType: BaseEntityType, parentId: string, childType: BaseEntityType): Promise<BaseEntity[]> {
    return req<BaseEntity[]>(`/entities/${parentType}/${parentId}/children/${childType}`);
  }

  createEntity(type: BaseEntityType, payload: Record<string, unknown>): Promise<BaseEntity> {
    if (type === 'world') return post<BaseEntity>('/worlds', payload);
    return post<BaseEntity>(`/entities/${type}`, payload);
  }

  updateEntity(type: BaseEntityType, id: string, payload: Record<string, unknown>): Promise<BaseEntity> {
    if (type === 'world') return patch<BaseEntity>(`/worlds/${id}`, payload);
    return patch<BaseEntity>(`/entities/${type}/${id}`, payload);
  }

  deleteEntity(type: BaseEntityType, id: string): Promise<void> {
    if (type === 'world') return del(`/worlds/${id}`);
    return del(`/entities/${type}/${id}`);
  }

  // ── Inventory ────────────────────────────────────────────────────────────────

  getInventory(poiId: string): Promise<InventoryItem[]> {
    return req(`/pois/${poiId}/inventory`);
  }

  addInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    const { poiId, ...rest } = item;
    return post(`/pois/${poiId}/inventory`, rest);
  }

  updateInventoryItem(id: string, payload: Partial<InventoryItem>): Promise<InventoryItem> {
    return patch(`/inventory/${id}`, payload);
  }

  deleteInventoryItem(id: string): Promise<void> {
    return del(`/inventory/${id}`);
  }

  reorderInventory(poiId: string, orderedIds: string[]): Promise<void> {
    return put(`/pois/${poiId}/inventory/reorder`, { orderedIds });
  }

  replaceInventory(poiId: string, items: Omit<InventoryItem, 'id' | 'poiId'>[]): Promise<InventoryItem[]> {
    return put(`/pois/${poiId}/inventory/replace`, { items });
  }

  // ── Party ────────────────────────────────────────────────────────────────────

  getParty(worldId: string): Promise<PartyMember[]> {
    return req(`/worlds/${worldId}/party`);
  }

  saveParty(worldId: string, members: PartyMember[]): Promise<PartyMember[]> {
    return put(`/worlds/${worldId}/party`, { members });
  }

  // ── Pins ─────────────────────────────────────────────────────────────────────

  async getPins(worldId: string): Promise<BaseEntity[]> {
    const pins = await req<{ id: string; entityId: string; entityType: BaseEntityType; name: string | null }[]>(
      `/worlds/${worldId}/pins`
    );
    return pins.map(pin => ({
      id: pin.entityId,
      type: pin.entityType,
      name: pin.name ?? '',
      description: '',
    }));
  }

  addPin(worldId: string, entityType: BaseEntityType, entityId: string): Promise<void> {
    return post(`/worlds/${worldId}/pins`, { entityType, entityId });
  }

  removePin(worldId: string, entityId: string): Promise<void> {
    return del(`/worlds/${worldId}/pins/${entityId}`);
  }

  // ── Search ───────────────────────────────────────────────────────────────────

  searchEntities(worldId: string, query: string): Promise<BaseEntity[]> {
    return req(`/search?worldId=${encodeURIComponent(worldId)}&q=${encodeURIComponent(query)}`);
  }

  // ── Factions ─────────────────────────────────────────────────────────────────

  getFactions(worldId: string): Promise<Faction[]> {
    return req(`/worlds/${worldId}/factions`);
  }

  createFaction(payload: Omit<Faction, 'id'>): Promise<Faction> {
    return post(`/worlds/${payload.worldId}/factions`, payload);
  }

  updateFaction(id: string, payload: Partial<Faction>): Promise<Faction> {
    return patch(`/factions/${id}`, payload);
  }

  deleteFaction(id: string): Promise<void> {
    return del(`/factions/${id}`);
  }

  addNPCToFaction(factionId: string, npcId: string, role: string): Promise<void> {
    return post(`/factions/${factionId}/members`, { npcId, role });
  }

  removeNPCFromFaction(factionId: string, npcId: string): Promise<void> {
    return del(`/factions/${factionId}/members/${npcId}`);
  }

  getCitiesForWorld(worldId: string): Promise<City[]> {
    return req(`/worlds/${worldId}/cities`);
  }

  getNPCsForWorld(worldId: string): Promise<NPC[]> {
    return req(`/worlds/${worldId}/npcs`);
  }

  // ── NPC Memories ─────────────────────────────────────────────────────────────

  addNPCMemory(npcId: string, content: string): Promise<NPCMemory> {
    return post(`/npcs/${npcId}/memories`, { content });
  }

  updateNPCMemory(_npcId: string, memoryId: string, content: string, createdAt?: string): Promise<NPCMemory> {
    return patch(`/memories/${memoryId}`, { content, ...(createdAt ? { createdAt } : {}) });
  }

  deleteNPCMemory(_npcId: string, memoryId: string): Promise<void> {
    return del(`/memories/${memoryId}`);
  }
}
