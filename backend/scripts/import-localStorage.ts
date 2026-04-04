/**
 * Import localStorage worldBuilderData into MySQL.
 *
 * Usage:
 *   npx ts-node scripts/import-localStorage.ts <path-to-export.json> [--party-world=<oldWorldId>]
 *
 * How to get your export:
 *   1. Open the app in the browser
 *   2. Open DevTools → Application → Local Storage → localhost
 *   3. Copy the value of "worldBuilderData"
 *   4. Paste it into a file (e.g. export.json) and pass that file path here
 *
 * The script will:
 *   - Remap all short IDs (e.g. "w1", "ct1") to proper UUIDs
 *   - Import worlds, countries, cities, POIs, NPCs, inventory, factions, pins, party
 *   - Skip records that already exist (idempotent by name+parent match is NOT done;
 *     run only once on a fresh database)
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

// ── Types matching the frontend Database shape ────────────────────────────────

interface OldWorld {
  id: string; name: string; description: string;
  climate?: string; magicLevel?: string;
}
interface OldCountry {
  id: string; name: string; description: string; parentId: string;
  governmentType?: string; economy?: string; populationSize?: string;
}
interface OldCity {
  id: string; name: string; description: string; parentId: string;
  populationSize?: string; mainExport?: string; keyFactionIds?: string[];
}
interface OldPOI {
  id: string; name: string; description: string; parentId: string;
  dangerLevel?: string; keyFeature?: string; inventoryEnabled?: boolean;
}
interface OldNPC {
  id: string; name: string; description: string; parentId: string;
  role?: string; alignment?: string; race?: string; factionIds?: string[];
}
interface OldInventoryItem {
  id: string; poiId: string; name: string; description: string;
  price?: string; rarity?: string;
}
interface OldPartyMember {
  id: string; name: string; level: number; className: string;
}
interface OldFaction {
  id: string; name: string; description: string; worldId: string;
  powerLevel?: string; strongholdCityId?: string;
  members: Array<{ npcId: string; role: string }>;
}
interface OldDatabase {
  worlds: OldWorld[];
  countries: OldCountry[];
  cities: OldCity[];
  pois: OldPOI[];
  npcs: OldNPC[];
  inventoryItems: OldInventoryItem[];
  party: OldPartyMember[];
  pins: string[];
  factions: OldFaction[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uuid(): string {
  return crypto.randomUUID()
}

function parseArgs() {
  const args = process.argv.slice(2)
  const filePath = args.find(a => !a.startsWith('--')) ?? null
  const partyWorldArg = args.find(a => a.startsWith('--party-world='))
  const partyWorldOldId = partyWorldArg ? partyWorldArg.split('=')[1] : null
  return { filePath, partyWorldOldId }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { filePath, partyWorldOldId: partyWorldOldId_cli } = parseArgs()

  if (!filePath || !fs.existsSync(path.resolve(filePath))) {
    console.error('Usage: npx ts-node scripts/import-localStorage.ts <export.json> [--party-world=<oldWorldId>]')
    process.exit(1)
  }

  const raw = fs.readFileSync(path.resolve(filePath), 'utf-8')
  const db: OldDatabase = JSON.parse(raw)

  // Validate top-level shape
  const required = ['worlds', 'countries', 'cities', 'pois', 'npcs']
  for (const key of required) {
    if (!Array.isArray((db as any)[key])) {
      console.error(`Invalid export: missing or non-array field "${key}"`)
      process.exit(1)
    }
  }

  console.log(`\nImporting:`)
  console.log(`  ${db.worlds.length} worlds`)
  console.log(`  ${db.countries.length} countries`)
  console.log(`  ${db.cities.length} cities`)
  console.log(`  ${db.pois.length} POIs`)
  console.log(`  ${db.npcs.length} NPCs`)
  console.log(`  ${(db.inventoryItems ?? []).length} inventory items`)
  console.log(`  ${(db.factions ?? []).length} factions`)
  console.log(`  ${(db.pins ?? []).length} pins`)
  console.log(`  ${(db.party ?? []).length} party members`)

  // Build old-id → new-uuid map for everything
  const idMap = new Map<string, string>()
  const newId = (oldId: string): string => {
    if (!idMap.has(oldId)) idMap.set(oldId, uuid())
    return idMap.get(oldId)!
  }

  // Pre-register all IDs so cross-references resolve in any order
  for (const e of [
    ...db.worlds, ...db.countries, ...db.cities,
    ...db.pois, ...db.npcs, ...(db.inventoryItems ?? []),
    ...(db.factions ?? []), ...(db.party ?? []),
  ]) {
    newId(e.id)
  }

  // Build a lookup: old entity id → entity type (needed for pins)
  const oldIdToType = new Map<string, string>()
  db.worlds.forEach(e => oldIdToType.set(e.id, 'world'))
  db.countries.forEach(e => oldIdToType.set(e.id, 'country'))
  db.cities.forEach(e => oldIdToType.set(e.id, 'city'))
  db.pois.forEach(e => oldIdToType.set(e.id, 'poi'))
  db.npcs.forEach(e => oldIdToType.set(e.id, 'npc'))

  // Build a lookup: old entity id → old world id (for pins)
  const oldIdToWorldId = new Map<string, string>()
  const countryToWorld = new Map<string, string>()
  const cityToCountry = new Map<string, string>()
  const poiToCity = new Map<string, string>()
  const npcToPoi = new Map<string, string>()

  db.worlds.forEach(w => oldIdToWorldId.set(w.id, w.id))
  db.countries.forEach(c => { countryToWorld.set(c.id, c.parentId); oldIdToWorldId.set(c.id, c.parentId) })
  db.cities.forEach(c => {
    cityToCountry.set(c.id, c.parentId)
    const wId = countryToWorld.get(c.parentId) ?? ''
    oldIdToWorldId.set(c.id, wId)
  })
  db.pois.forEach(p => {
    poiToCity.set(p.id, p.parentId)
    const wId = oldIdToWorldId.get(cityToCountry.get(p.parentId) ?? '') ?? ''
    oldIdToWorldId.set(p.id, wId)
  })
  db.npcs.forEach(n => {
    npcToPoi.set(n.id, n.parentId)
    const wId = oldIdToWorldId.get(poiToCity.get(n.parentId) ?? '') ?? ''
    oldIdToWorldId.set(n.id, wId)
  })

  // Determine which world to assign party members to
  let partyWorldOldId: string
  if (partyWorldOldId_cli) {
    if (!idMap.has(partyWorldOldId_cli)) {
      console.error(`--party-world="${partyWorldOldId_cli}" not found in worlds list`)
      process.exit(1)
    }
    partyWorldOldId = partyWorldOldId_cli
  } else {
    if (db.worlds.length > 1) {
      console.warn(`\nMultiple worlds found. Party will be assigned to "${db.worlds[0].name}" (${db.worlds[0].id}).`)
      console.warn(`Use --party-world=<oldId> to choose a different world.\n`)
    }
    partyWorldOldId = db.worlds[0]?.id ?? ''
  }

  const prisma = new PrismaClient()

  try {
    console.log('\nStarting import (single transaction)...')

    await prisma.$transaction(async (tx) => {
      // 1. Worlds
      for (const w of db.worlds) {
        await tx.world.create({
          data: {
            id: newId(w.id),
            name: w.name,
            description: w.description ?? null,
            climate: w.climate ?? null,
            magicLevel: w.magicLevel ?? null,
          },
        })
      }
      console.log(`  ✓ ${db.worlds.length} worlds`)

      // 2. Countries
      for (const c of db.countries) {
        await tx.country.create({
          data: {
            id: newId(c.id),
            worldId: newId(c.parentId),
            name: c.name,
            description: c.description ?? null,
            governmentType: c.governmentType ?? null,
            economy: c.economy ?? null,
            populationSize: c.populationSize ?? null,
          },
        })
      }
      console.log(`  ✓ ${db.countries.length} countries`)

      // 3. Cities
      for (const c of db.cities) {
        await tx.city.create({
          data: {
            id: newId(c.id),
            countryId: newId(c.parentId),
            name: c.name,
            description: c.description ?? null,
            populationSize: c.populationSize ?? null,
            mainExport: c.mainExport ?? null,
          },
        })
      }
      console.log(`  ✓ ${db.cities.length} cities`)

      // 4. POIs
      for (const p of db.pois) {
        await tx.pOI.create({
          data: {
            id: newId(p.id),
            cityId: newId(p.parentId),
            name: p.name,
            description: p.description ?? null,
            dangerLevel: p.dangerLevel ?? null,
            keyFeature: p.keyFeature ?? null,
            inventoryEnabled: p.inventoryEnabled ?? false,
          },
        })
      }
      console.log(`  ✓ ${db.pois.length} POIs`)

      // 5. NPCs
      for (const n of db.npcs) {
        await tx.nPC.create({
          data: {
            id: newId(n.id),
            poiId: newId(n.parentId),
            name: n.name,
            description: n.description ?? null,
            role: n.role ?? null,
            alignment: n.alignment ?? null,
            race: n.race ?? null,
          },
        })
      }
      console.log(`  ✓ ${db.npcs.length} NPCs`)

      // 6. Inventory items
      const inventoryItems = db.inventoryItems ?? []
      for (const item of inventoryItems) {
        // Guard: skip if parent POI wasn't imported (orphaned item)
        if (!idMap.has(item.poiId)) {
          console.warn(`  ⚠ Skipping orphaned inventory item "${item.name}" (poiId ${item.poiId} not found)`)
          continue
        }
        await tx.inventoryItem.create({
          data: {
            id: newId(item.id),
            poiId: newId(item.poiId),
            name: item.name,
            description: item.description ?? null,
            price: item.price ?? '',
            rarity: item.rarity ?? 'Common',
            sortOrder: inventoryItems.indexOf(item),
          },
        })
      }
      console.log(`  ✓ ${inventoryItems.length} inventory items`)

      // 7. Factions (create faction rows first, then junction rows)
      const factions = db.factions ?? []
      for (const f of factions) {
        const strongholdId = f.strongholdCityId && idMap.has(f.strongholdCityId)
          ? newId(f.strongholdCityId)
          : null
        await tx.faction.create({
          data: {
            id: newId(f.id),
            worldId: newId(f.worldId),
            name: f.name,
            description: f.description ?? null,
            powerLevel: f.powerLevel ?? null,
            strongholdCityId: strongholdId,
          },
        })
      }
      console.log(`  ✓ ${factions.length} factions`)

      // 8. FactionMembers (NPC <-> Faction junction)
      let memberCount = 0
      for (const f of factions) {
        for (const m of f.members ?? []) {
          if (!idMap.has(m.npcId)) {
            console.warn(`  ⚠ Skipping faction member npcId ${m.npcId} (not found)`)
            continue
          }
          await tx.factionMember.create({
            data: {
              factionId: newId(f.id),
              npcId: newId(m.npcId),
              role: m.role ?? null,
            },
          })
          memberCount++
        }
      }
      console.log(`  ✓ ${memberCount} faction memberships`)

      // 9. CityFactions (City <-> Faction junction from city.keyFactionIds)
      let cityFactionCount = 0
      for (const c of db.cities) {
        for (const oldFactionId of c.keyFactionIds ?? []) {
          if (!idMap.has(oldFactionId)) continue
          await tx.cityFaction.create({
            data: {
              cityId: newId(c.id),
              factionId: newId(oldFactionId),
            },
          })
          cityFactionCount++
        }
      }
      console.log(`  ✓ ${cityFactionCount} city–faction links`)

      // 10. Pins
      const pins = db.pins ?? []
      let pinCount = 0
      const seenPins = new Set<string>() // worldId+entityId
      for (const oldEntityId of pins) {
        const entityType = oldIdToType.get(oldEntityId)
        const oldWorldId = oldIdToWorldId.get(oldEntityId)
        if (!entityType || !oldWorldId || !idMap.has(oldEntityId) || !idMap.has(oldWorldId)) {
          console.warn(`  ⚠ Skipping pin for unknown entity ${oldEntityId}`)
          continue
        }
        const key = `${oldWorldId}|${oldEntityId}`
        if (seenPins.has(key)) continue
        seenPins.add(key)
        await tx.pin.create({
          data: {
            worldId: newId(oldWorldId),
            entityType,
            entityId: newId(oldEntityId),
          },
        })
        pinCount++
      }
      console.log(`  ✓ ${pinCount} pins`)

      // 11. Party members
      const party = db.party ?? []
      if (party.length > 0 && partyWorldOldId && idMap.has(partyWorldOldId)) {
        for (const m of party) {
          await tx.partyMember.create({
            data: {
              id: newId(m.id),
              worldId: newId(partyWorldOldId),
              name: m.name,
              level: m.level ?? 1,
              className: m.className ?? 'Fighter',
            },
          })
        }
        console.log(`  ✓ ${party.length} party members (assigned to world "${partyWorldOldId}")`)
      } else if (party.length > 0) {
        console.warn(`  ⚠ Skipping ${party.length} party members — no valid world to assign them to`)
      }
    })

    console.log('\n✅ Import complete!\n')
  } catch (err) {
    console.error('\n❌ Import failed (transaction rolled back):')
    console.error(err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
