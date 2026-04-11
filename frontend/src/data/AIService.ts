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
import type { AnyEntity, InventoryItem, NPC, NPCMemory, PartyMember, POI } from './mockData';

interface OpenAIUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}

interface OpenAIErrorBody {
  error?: { message?: string };
}

export type GeneratedEntity = Record<string, string>;
export type GeneratedInventoryItem = Omit<InventoryItem, 'id' | 'poiId'>;

// ── Usage notification ────────────────────────────────────────────────────────

function showUsageNotification(label: string, usage: OpenAIUsage | null | undefined) {
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
  entity: AnyEntity | null;   // the direct parent (e.g. city when creating a POI)
  parentChain: AnyEntity[];   // ancestors above the parent [world, country, ...]
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
    switch (node.type) {
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
    const err = await response.json().catch(() => ({})) as OpenAIErrorBody;
    throw new Error(err?.error?.message ?? `OpenAI request failed: ${response.status}`);
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
      description: 'The requested number of inventory items for this location',
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
 * `count` controls how many new items to generate (default 5).
 * `existingItems` is passed so the AI avoids duplicating items already in inventory.
 */
export async function generateInventory(
  poi: POI,
  context: AncestorContext,
  party: PartyMember[] = [],
  count: number = 5,
  existingItems: GeneratedInventoryItem[] = [],
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
- Return EXACTLY the number of items requested by the user.\
- Match the inventory to the location's function, culture, and economic level.\
- Do NOT duplicate any item that already exists in the inventory (existing items will be listed in the user message if any are present).\
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

  const existingBlock = existingItems.length > 0
    ? `\n### Existing Inventory (DO NOT duplicate these)\n${existingItems.map(i => `- ${i.name} (${i.rarity}): ${i.description}`).join('\n')}\n`
    : '';

  const userMessage = `${ancestorBlock}

**Location — ${poi.name}**
${poi.description}
Danger Level: ${poi.dangerLevel || 'unspecified'} | Key Feature: ${poi.keyFeature || 'unspecified'}
${partyBlock}${existingBlock}
Generate EXACTLY ${count} NEW item${count !== 1 ? 's' : ''} that would realistically be found or sold at this location. Do not repeat any existing items listed above.`;

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
    const err = await response.json().catch(() => ({})) as OpenAIErrorBody;
    throw new Error(err?.error?.message ?? `OpenAI request failed: ${response.status}`);
  }

  const data = await response.json();

  showUsageNotification('inventory generation', data.usage);

  const raw: string = data?.output?.[0]?.content?.[0]?.text;
  if (!raw) throw new Error('Unexpected response shape from OpenAI Responses API.');

  const parsed = JSON.parse(raw) as { items: GeneratedInventoryItem[] };
  return parsed.items;
}

// ── Audio Transcription ───────────────────────────────────────────────────────

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) throw new Error('OpenAI API key not found.');

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'gpt-4o-mini-transcribe');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    // No Content-Type header — the browser sets it automatically with the multipart boundary.
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as OpenAIErrorBody)?.error?.message ?? `Transcription request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.text ?? '';
}

// ── NPC Response Validator ────────────────────────────────────────────────────

// Returns null if the response is approved, or a feedback string describing the violation.
async function validateNPCResponse(
  draft: string,
  npc: NPC,
  contextBlock: string,
  lastUserMessage: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const systemPrompt = `You are a consistency checker for a tabletop RPG NPC dialogue system. \
Your job is to detect factual overreach in a draft NPC response — nothing else.

A violation is exactly one of these three things:
1. KNOWLEDGE SCOPE: The NPC claims specific knowledge that their role and physical location \
would not plausibly give them. A village innkeeper does not know what happened in the capital \
last week. A blacksmith does not know the names of distant nobles or secret guild dealings. \
General rumors and obvious regional news are fine — specific details about far-off or secret \
events are not.
2. ANACHRONISM: The NPC references concepts, objects, or phrases inconsistent with the \
established technology and magic level of the world as described in the World Context.
3. WORLD-FACT CONTRADICTION: The NPC states something that directly contradicts a named fact \
in the World Context below (wrong government type, wrong climate, wrong city name, etc.).

The following are NOT violations:
- Creative elaboration, invented rumors, or speculation framed as uncertain ("I heard that...", "They say...")
- Personality, dialect, mannerisms, and in-character voice
- Mistakes or ignorance that fit the character's knowledge level
- Any detail not explicitly contradicted by the World Context

If the response contains no violations, output only the word: APPROVED
If it contains a violation, output a single concise sentence describing exactly what is wrong \
and what the NPC should avoid. Do not rewrite the response. Do not add headers or preamble.`;

    const userMessage = `### NPC Character
Name: ${npc.name}
Race: ${npc.race || 'Unknown'}
Role: ${npc.role || 'Unknown'}
Alignment: ${npc.alignment || 'Unknown'}

${contextBlock}

### User Message That Prompted This Response (context only)
${lastUserMessage}

### Draft NPC Response to Validate
${draft}`;

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
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    showUsageNotification('NPC validation', data.usage);

    const trimmed = (data?.output?.[0]?.content?.[0]?.text ?? '').trim();
    return (!trimmed || trimmed === 'APPROVED') ? null : trimmed;
  } catch {
    return null;
  }
}

// ── NPC Chat ─────────────────────────────────────────────────────────────────

export async function chatWithNPCTurn(
  npc: NPC,
  history: { role: 'user' | 'assistant'; content: string }[],
  parentChain: AnyEntity[],
  inventory: InventoryItem[] = [],
  party: PartyMember[] = [],
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) throw new Error('OpenAI API key not found.');

  const memoriesList = (npc.memories ?? [])
    .map((m: NPCMemory) => `- ${m.content}`)
    .join('\n') || 'None yet.';

  const inventoryBlock = inventory.length > 0
    ? `\n### Location Inventory\nThese are the items available at your location. You know about them and can discuss, sell, or reference them naturally.\n${inventory.map(i => `- ${i.name} (${i.rarity}, ${i.price}): ${i.description}`).join('\n')}`
    : '';

  const partyBlock = party.length > 0
    ? `\n### The Party\nYou are speaking with a group of adventurers, not a single person. From what you can observe, the group includes:\n${party.map(m => `- A ${m.race || 'unknown-race'} ${m.className}`).join('\n')}\nYou do not know any of their names unless they tell you during conversation. React to them as a group. If an adventurer gives you a name, use it — but do not invent names for them.`
    : '';

  const contextBlock = buildContextBlock({ entity: parentChain[parentChain.length - 1], parentChain: parentChain.slice(0, -1) });
  const lastUserMessage = history[history.length - 1]?.content ?? '';

  const systemPrompt = `You are roleplaying as ${npc.name}, a character in a fantasy world. \
Stay in character at all times. Speak and respond exactly as this character would, using their \
voice, mannerisms, and knowledge. Do not break character or acknowledge being an AI. \
Keep your response short and conversational. Avoid lists and other non-prose. \
The person you are having a conversation with is talking with you face to face. \
Never ask more than one question at once. Do not needlessly reference names of locations or your own name. \
Do not use flowery language unless your character has that as a personality or quirk. When asked simple questions
answer simply. Do not use modern expressions or terms.

### Character
Name: ${npc.name}
Race: ${npc.race || 'Unknown'}
Role: ${npc.role || 'Unknown'}
Alignment: ${npc.alignment || 'Unknown'}
Description: ${npc.description || ''}
Personality & Quirks: ${npc.personality || 'Not specified.'}

### Memories (things this character remembers)
${memoriesList}
${inventoryBlock}
${partyBlock}
${contextBlock}`;

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
        ...history,
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as OpenAIErrorBody)?.error?.message ?? `OpenAI request failed: ${response.status}`);
  }

  const data = await response.json();
  showUsageNotification('NPC chat', data.usage);

  const text: string = data?.output?.[0]?.content?.[0]?.text;
  if (!text) throw new Error('Unexpected response shape from OpenAI Responses API.');

  const feedback = await validateNPCResponse(text, npc, contextBlock, lastUserMessage, apiKey);
  if (!feedback) return text;

  // Validator found an issue — retry once with the draft and feedback injected so the NPC
  // agent can self-correct while keeping its own voice.
  const retryResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.4-nano',
      input: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'assistant', content: text },
        { role: 'user', content: `[INTERNAL CORRECTION — not part of the conversation] Your previous response was flagged: ${feedback} Please respond again to the original message, correcting only that issue and otherwise staying fully in character.` },
      ],
    }),
  });

  if (!retryResponse.ok) return text;

  const retryData = await retryResponse.json();
  showUsageNotification('NPC retry', retryData.usage);

  const corrected: string = retryData?.output?.[0]?.content?.[0]?.text;
  if (!corrected) return text;

  // Second validation pass — if the retry still fails, return a safe in-character fallback
  // rather than letting a hallucinated response through.
  const secondFeedback = await validateNPCResponse(corrected, npc, contextBlock, lastUserMessage, apiKey);
  if (!secondFeedback) return corrected;

  return `I wouldn't know anything about that, I'm afraid.`;
}

export async function summarizeConversation(
  npc: NPC,
  history: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) throw new Error('OpenAI API key not found.');

  const transcript = history
    .map(m => `${m.role === 'user' ? 'Adventurer' : npc.name}: ${m.content}`)
    .join('\n');

  const systemPrompt = `You are ${npc.name}. The transcript below is a conversation between you and a group of adventurers. \
Write a 2–3 sentence diary entry strictly from ${npc.name}'s own first-person perspective — what YOU said, felt, or learned. \
Do not write from the adventurers' point of view. \
If any adventurer gave you their name during the conversation (even if it might be a fake name), include it — record names exactly as they were given to you. \
Be specific. Write only the diary entry — no title, no preamble.`;

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
        { role: 'user', content: transcript },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as OpenAIErrorBody)?.error?.message ?? `OpenAI request failed: ${response.status}`);
  }

  const data = await response.json();
  showUsageNotification('conversation summary', data.usage);

  const text: string = data?.output?.[0]?.content?.[0]?.text;
  if (!text) throw new Error('Unexpected response shape from OpenAI Responses API.');
  return text;
}
