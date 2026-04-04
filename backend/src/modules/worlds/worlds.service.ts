import { WorldsRepository } from './worlds.repository'
import { CreateWorldInput, UpdateWorldInput } from './worlds.schemas'
import { NotFoundError } from '../../lib/errors'

export class WorldsService {
  constructor(private readonly repo: WorldsRepository) {}

  async listWorlds() {
    const worlds = await this.repo.findAll()
    return worlds.map((w) => ({ ...w, type: 'world' as const }))
  }

  async getWorld(id: string) {
    const world = await this.repo.findById(id)
    if (!world) throw new NotFoundError(`World ${id} not found`)
    return { ...world, type: 'world' as const }
  }

  async createWorld(data: CreateWorldInput) {
    const world = await this.repo.create(data)
    return { ...world, type: 'world' as const }
  }

  async updateWorld(id: string, data: UpdateWorldInput) {
    await this.getWorld(id)
    const world = await this.repo.update(id, data)
    return { ...world, type: 'world' as const }
  }

  async deleteWorld(id: string) {
    await this.getWorld(id)
    await this.repo.delete(id)
  }

  async listCitiesInWorld(worldId: string) {
    await this.getWorld(worldId)
    const cities = await this.repo.findAllCitiesInWorld(worldId)
    return cities.map((c) => ({
      ...c,
      type: 'city' as const,
      parentId: c.countryId,
    }))
  }

  async listNpcsInWorld(worldId: string) {
    await this.getWorld(worldId)
    const npcs = await this.repo.findAllNpcsInWorld(worldId)
    return npcs.map((n) => ({
      ...n,
      type: 'npc' as const,
      parentId: n.poiId,
      factionIds: [] as string[],
    }))
  }
}
