import { FactionsRepository } from './factions.repository'
import { CreateFactionInput, UpdateFactionInput, AddFactionMemberInput } from './factions.schemas'
import { NotFoundError } from '../../lib/errors'

function normFaction(f: any) {
  return {
    ...f,
    members: f.members.map((m: any) => ({ npcId: m.npcId, role: m.role ?? null })),
  }
}

export class FactionsService {
  constructor(private readonly repo: FactionsRepository) {}

  async listFactions(worldId: string) {
    const factions = await this.repo.findByWorldId(worldId)
    return factions.map(normFaction)
  }

  async getFaction(id: string) {
    const faction = await this.repo.findById(id)
    if (!faction) throw new NotFoundError(`Faction ${id} not found`)
    return normFaction(faction)
  }

  async createFaction(worldId: string, data: CreateFactionInput) {
    const faction = await this.repo.create(worldId, data)
    return normFaction(faction)
  }

  async updateFaction(id: string, data: UpdateFactionInput) {
    await this.getFaction(id)
    const faction = await this.repo.update(id, data)
    return normFaction(faction)
  }

  async deleteFaction(id: string) {
    await this.getFaction(id)
    await this.repo.delete(id)
  }

  async addMember(factionId: string, data: AddFactionMemberInput) {
    await this.getFaction(factionId)
    return this.repo.upsertMember(factionId, data)
  }

  async removeMember(factionId: string, npcId: string) {
    await this.getFaction(factionId)
    await this.repo.removeMember(factionId, npcId)
  }

  async addCityLink(cityId: string, factionId: string) {
    return this.repo.addCityLink(cityId, factionId)
  }

  async removeCityLink(cityId: string, factionId: string) {
    return this.repo.removeCityLink(cityId, factionId)
  }
}
