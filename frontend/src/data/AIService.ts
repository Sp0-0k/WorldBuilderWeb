/**
 * AIService — wraps OpenAI Responses API for entity generation.
 *
 * The caller supplies:
 *  - entityType: 'poi' | 'npc'
 *  - userPrompt: the brief description the user typed
 *  - context: the full ancestor chain (world → country → city [→ poi for npcs])
 *
 * Returns a plain object whose keys match SCHEMA_FIELDS[entityType] plus
 * the shared BaseEntity fields (name, description).
 *
 * NOTE: The API key is read from the VITE_OPENAI_API_KEY env variable.
 * This is fine for a class project, but should be proxied through a
 * backend server in any production deployment.
 */

import { notifications } from '@mantine/notifications';
import type { BaseEntityType, InventoryItem, PartyMember } from './mockData';

export type GeneratedEntity = Record<string, string>;
export type GeneratedInventoryItem = Omit<InventoryItem, 'id' | 'poiId'>;

// ── Usage notification ────────────────────────────────────────────────────────

function showUsageNotification(label: string, usage: any) {
  if (!usage) return;
  const input  = usage.input_tokens  ?? '?';
  const output = usage.output_tokens ?? '?';
  const total  = usage.total_tokens  ?? (typeof input === 'number' && typeof output === 'number' ? input + output : '?');
  notifications.show({
    title: `[Debug] Token usage — ${label}`,
    message: `Input: ${input} · Output: ${output} · Total: ${total}`,
    color: 'darkGray',
    autoClose: 80000,
  });
}

interface AncestorContext {
  entity: any;          // the direct parent (e.g. city when creating a POI)
  parentChain: any[];   // ancestors above the parent [world, country, ...]
}

// ── JSON schemas for structured output ───────────────────────────────────────

const POI_SCHEMA = {
  type: 'object',
  properties: {
    name:        { type: 'string', description: 'The name of the point of interest' },
    description: { type: 'string', description: 'A vivid 2–3 sentence description' },
    dangerLevel: { type: 'string', description: 'e.g. Low, Medium, High, Lethal' },
    keyFeature:  { type: 'string', description: 'The single most memorable feature or secret of this location' },
  },
  required: ['name', 'description', 'dangerLevel', 'keyFeature'],
  additionalProperties: false,
} as const;

const NPC_SCHEMA = {
  type: 'object',
  properties: {
    name:        { type: 'string', description: 'Full name of the NPC' },
    description: { type: 'string', description: 'A vivid 2–3 sentence description of their appearance and personality' },
    role:        { type: 'string', description: 'Their occupation or role in the world, e.g. Blacksmith, Spy, Merchant' },
    alignment:   { type: 'string', description: 'D&D alignment, e.g. Lawful Good, Chaotic Neutral' },
    race:        { type: 'string', description: 'Their race, e.g. Human, Elf, Dwarf' },
  },
  required: ['name', 'description', 'role', 'alignment', 'race'],
  additionalProperties: false,
} as const;

// ── Context prompt builder ───────────────────────────────────────────────────

function buildContextBlock(context: AncestorContext): string {
  // parentChain is ordered from outermost to innermost ancestor.
  // e.g. for POI:  parentChain=[world, country],  entity=city
  // e.g. for NPC:  parentChain=[world, country, city], entity=poi
  const all = [...context.parentChain, context.entity];

  const lines: string[] = ['### World Context\n'];

  for (const node of all) {
    if (!node) continue;
    const type: BaseEntityType = node.type;

    switch (type) {
      case 'world':
        lines.push(`**World — ${node.name}**`);
        lines.push(node.description);
        lines.push(`Climate: ${node.climate || 'unspecified'} | Magic Level: ${node.magicLevel || 'unspecified'}`);
        break;
      case 'country':
        lines.push(`\n**Country — ${node.name}**`);
        lines.push(node.description);
        lines.push(`Government: ${node.governmentType || 'unspecified'} | Economy: ${node.economy || 'unspecified'} | Population: ${node.populationSize || 'unspecified'}`);
        break;
      case 'city':
        lines.push(`\n**City — ${node.name}**`);
        lines.push(node.description);
        lines.push(`Population: ${node.populationSize || 'unspecified'} | Main Export: ${node.mainExport || 'unspecified'}`);
        break;
      case 'poi':
        lines.push(`\n**Location — ${node.name}**`);
        lines.push(node.description);
        lines.push(`Danger Level: ${node.dangerLevel || 'unspecified'} | Key Feature: ${node.keyFeature || 'unspecified'}`);
        break;
    }
  }

  return lines.join('\n');
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function generateEntity(
  entityType: 'poi' | 'npc',
  userPrompt: string,
  context: AncestorContext,
): Promise<GeneratedEntity> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error(
      'OpenAI API key not found. Set VITE_OPENAI_API_KEY in your .env file.',
    );
  }

  const schema = entityType === 'poi' ? POI_SCHEMA : NPC_SCHEMA;
  const label  = entityType === 'poi' ? 'point of interest' : 'NPC (non-player character)';

  const contextBlock = buildContextBlock(context);

  const systemPrompt = `You are a creative Dungeons & Dragons worldbuilding assistant for D&D 5.5e. \
Your task is to generate a single ${label} that fits authentically within the provided world context. \
Match the tone, culture, and history of the setting. Be specific and evocative — avoid generic fantasy tropes.`;

  const userMessage = `${contextBlock}

### User Request
${userPrompt}

Generate a ${label} that satisfies the request above and feels like it genuinely belongs in this world.`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.4-nano',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: `${entityType}_generation`,
          schema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as any)?.error?.message ?? `OpenAI request failed: ${response.status}`,
    );
  }

  const data = await response.json();

  showUsageNotification(`${entityType} generation`, data.usage);

  // Responses API: output[0].content[0].text
  const raw: string = data?.output?.[0]?.content?.[0]?.text;
  if (!raw) {
    throw new Error('Unexpected response shape from OpenAI Responses API.');
  }

  return JSON.parse(raw) as GeneratedEntity;
}

// ── Inventory generation ─────────────────────────────────────────────────────

const INVENTORY_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      description: 'Between 5 and 8 inventory items for this location',
      items: {
        type: 'object',
        properties: {
          name:        { type: 'string', description: 'Item name' },
          description: { type: 'string', description: 'One sentence describing the item and its use or lore' },
          price:       { type: 'string', description: 'Cost in D&D currency, e.g. "5 gp", "2 sp", "10 cp"' },
          rarity:      { type: 'string', enum: ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary'] },
        },
        required: ['name', 'description', 'price', 'rarity'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
} as const;

/**
 * Generate a thematic inventory for a POI.
 * `poi` is the POI entity itself; `context` provides its ancestor chain.
 * `party` is optional — when provided the AI tailors items to party level/composition.
 */
export async function generateInventory(
  poi: any,
  context: AncestorContext,
  party: PartyMember[] = [],
): Promise<GeneratedInventoryItem[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Set VITE_OPENAI_API_KEY in your .env file.');
  }

  // Build a context block from the POI's ancestors (parentChain = [world, country, city])
  const ancestorBlock = buildContextBlock(context);

  // Build the optional party block
  let partyBlock = '';
  if (party.length > 0) {
    const avgLevel = Math.round(party.reduce((s, m) => s + m.level, 0) / party.length);
    const memberList = party
      .map(m => `- ${m.name || 'Unnamed'} — Level ${m.level} ${m.className}`)
      .join('\n');
    partyBlock = `\n### Adventuring Party (Average Level ${avgLevel})\n${memberList}\n\nTailor item selection, rarity, and pricing to suit this party's level and class composition. A Level 1 party should see mostly common, affordable gear; a high-level party warrants rarer, more powerful options at correspondingly higher prices.`;
  }

  const systemPrompt = `You are a creative Dungeons & Dragons worldbuilding assistant for D&D 5.5e. Your task is to generate an INVENTORY for a location, returned strictly according to the provided schema.
CRITICAL: The meaning of "inventory" depends on the type of location.
LOCATION-AWARE INVENTORY RULES:

- Shops: \
  Inventory consists of goods for sale (equipment, gear, tools, etc.). \
  Include a mix of mostly mundane items with a small number of interesting or magical items. \
  You may include up to two homebrewed items. \

- Taverns, inns, and food-based locations: \
  Inventory consists of menu items (food and drink) and simple services.\
  These should make up AT LEAST 80% of the items.\
  Items must be mundane and non-magical.\
  Examples: meals, drinks, lodging, simple offerings.\

- Libraries, temples, or public spaces:\
  Inventory consists of services, access, or small mundane objects relevant to the location.\
  Avoid magical items unless extremely appropriate.\

STRICT RULES:\
- Always return between 5 and 8 items.\
- Match the inventory to the location's function, culture, and economic level.\
- For taverns and similar locations:\
  - Do NOT generate magical items, enchanted gear, or combat equipment.\
  - At most ONE item may be unusual, and it must still be non-magical.\
- Do NOT default to weapons, potions, or adventuring gear unless the location clearly supports it.\

PRICING GUIDELINES: \

- Use appropriate D&D 5.5e pricing based on item type and location wealth. \
- Food and drink should typically be priced in cp or sp, rarely gp. \
- Services (like lodging) may cost sp or gp depending on quality. \

General 5.5e (2024 DMG) Magic Item Pricing Guidelines (shops only): \
- Common: 100 gp\
- Uncommon: 500 gp\
- Rare: 5,000 gp\
- Very Rare: 50,000 gp\
- Legendary: 500,000 gp\

RARITY USAGE:

- For mundane items (especially food/drink), use "Common".
- Only assign higher rarity if the item genuinely warrants it AND fits the location type.
- Taverns should almost always produce only "Common" items.

STYLE:

- Keep descriptions to one sentence.
- Focus on sensory detail, practicality, and cultural flavor rather than power.`;

  const userMessage = `${ancestorBlock}

**Location — ${poi.name}**
${poi.description}
Danger Level: ${poi.dangerLevel || 'unspecified'} | Key Feature: ${poi.keyFeature || 'unspecified'}
${partyBlock}
Generate an inventory of 5–8 items that would realistically be found or sold at this location.`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.4-nano',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'inventory_generation',
          schema: INVENTORY_SCHEMA,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as any)?.error?.message ?? `OpenAI request failed: ${response.status}`,
    );
  }

  const data = await response.json();

  showUsageNotification('inventory generation', data.usage);

  const raw: string = data?.output?.[0]?.content?.[0]?.text;
  if (!raw) throw new Error('Unexpected response shape from OpenAI Responses API.');

  const parsed = JSON.parse(raw) as { items: GeneratedInventoryItem[] };
  return parsed.items;
}
