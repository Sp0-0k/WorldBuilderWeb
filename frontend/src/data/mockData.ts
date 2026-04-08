export type BaseEntityType = 'world' | 'country' | 'city' | 'poi' | 'npc';

export interface BaseEntity {
  id: string;
  name: string;
  description: string;
  type: BaseEntityType;
}

export interface FactionMember {
  npcId: string;
  role: string;
}

export interface Faction {
  id: string;
  name: string;
  description: string;
  worldId: string;
  strongholdCityId: string;
  powerLevel: string;
  members: FactionMember[];
}

export const SCHEMA_FIELDS: Record<BaseEntityType, string[]> = {
  world: ['climate', 'magicLevel'],
  country: ['governmentType', 'economy', 'populationSize'],
  city: ['populationSize', 'mainExport'],
  poi: ['dangerLevel', 'keyFeature'],
  npc: ['role', 'alignment', 'race', 'personality']
};

export interface NPCMemory {
  id: string;
  content: string;
  createdAt: string; // ISO 8601 string
}

export interface NPC extends BaseEntity {
  type: 'npc';
  role: string;
  alignment: string;
  race: string;
  personality?: string;
  memories?: NPCMemory[];
  parentId: string;
  factionIds?: string[];
}

export interface POI extends BaseEntity {
  type: 'poi';
  dangerLevel: string;
  keyFeature: string;
  parentId: string;
  inventoryEnabled?: boolean;
}

export interface City extends BaseEntity {
  type: 'city';
  populationSize: string;
  mainExport: string;
  parentId: string;
  keyFactionIds?: string[];
}

export interface Country extends BaseEntity {
  type: 'country';
  governmentType: string;
  economy: string;
  populationSize: string;
  parentId: string;
}

export interface World extends BaseEntity {
  type: 'world';
  climate: string;
  magicLevel: string;
}

export interface PartyMember {
  id: string;
  name: string;
  level: number;
  className: string;
  race: string;
}

export interface InventoryItem {
  id: string;
  poiId: string;
  name: string;
  description: string;
  price: string;    // e.g. "5 gp", "2 sp", "priceless"
  rarity: string;   // Common | Uncommon | Rare | Very Rare | Legendary
}

export interface Database {
  worlds: World[];
  countries: Country[];
  cities: City[];
  pois: POI[];
  npcs: NPC[];
  inventoryItems: InventoryItem[];
  party: PartyMember[];
  pins: string[];
  factions: Faction[];
}

export function getChildType(parentType: string): BaseEntityType | null {
  switch (parentType) {
    case 'world': return 'country';
    case 'country': return 'city';
    case 'city': return 'poi';
    case 'poi': return 'npc';
    default: return null;
  }
}

export function getParentType(type: string): BaseEntityType | null {
  if (type === 'country') return 'world';
  if (type === 'city') return 'country';
  if (type === 'poi') return 'city';
  if (type === 'npc') return 'poi';
  return null;
}

export const initialData: Database = {
  worlds: [
    {
      id: "w1",
      name: "Eldoria",
      description: "A sprawling continent composed of magical ley-lines, currently at the brink of a massive geopolitical war.",
      type: "world",
      climate: "Varied, with harsh magical storms",
      magicLevel: "High"
    }
  ],
  countries: [
    {
      id: "c1",
      name: "The Thayrian Empire",
      description: "A magocracy ruled by the council of seven arch-mages. Law is enforced via arcane automatons.",
      governmentType: "Magocracy",
      economy: "Arcane Tech Exports",
      populationSize: "4.5 Million",
      parentId: "w1",
      type: "country"
    },
    {
      id: "c2",
      name: "The Iron Wastes",
      description: "Desolate landscapes populated by scavenger clans and hidden forge-fortresses.",
      governmentType: "Tribal / Warlords",
      economy: "Scavenged Metal & Weapons",
      populationSize: "800,000",
      parentId: "w1",
      type: "country"
    }
  ],
  cities: [
    {
      id: "ct1",
      name: "Oakhaven",
      description: "A bustling metropolitan port on the inner sea of Thayria.",
      populationSize: "150,000",
      mainExport: "Lumber and Ships",
      parentId: "c1",
      type: "city"
    }
  ],
  pois: [
    {
      id: "p1",
      name: "The Rusty Anchor Tavern",
      description: "A lively dockside tavern preferred by smugglers and retired adventurers.",
      dangerLevel: "Medium",
      keyFeature: "Underground Smuggling Ring",
      parentId: "ct1",
      type: "poi",
      inventoryEnabled: true
    }
  ],
  npcs: [
    {
      id: "n1",
      name: "Garrick 'One-Eye' Vance",
      description: "Gruff barkeep missing his left eye. Secretly an informant for the Thieve's Guild.",
      role: "Barkeep",
      alignment: "Chaotic Neutral",
      race: "Human",
      parentId: "p1",
      type: "npc"
    }
  ],
  party: [],
  pins: [],
  factions: [],
  inventoryItems: [
    {
      id: "inv1",
      poiId: "p1",
      name: "Rotgut Whiskey",
      description: "A harsh, unnamed spirit poured from an unlabeled clay jug. Warms the belly and clouds the memory.",
      price: "2 cp",
      rarity: "Common"
    },
    {
      id: "inv2",
      poiId: "p1",
      name: "Smuggler's Map (Partial)",
      description: "A water-stained scrap of vellum showing tunnels beneath the docks. One section has been deliberately torn away.",
      price: "15 gp",
      rarity: "Uncommon"
    },
    {
      id: "inv3",
      poiId: "p1",
      name: "Dockworker's Supper",
      description: "A bowl of thick stew, hard bread, and a wedge of sharp cheese. Humble but filling.",
      price: "3 cp",
      rarity: "Common"
    }
  ]
};
