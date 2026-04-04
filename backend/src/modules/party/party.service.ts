import { PartyRepository } from './party.repository'
import { ReplacePartyInput } from './party.schemas'

export class PartyService {
  constructor(private readonly repo: PartyRepository) {}

  async listParty(worldId: string) {
    return this.repo.findByWorldId(worldId)
  }

  async replaceParty(worldId: string, data: ReplacePartyInput) {
    return this.repo.replace(worldId, data)
  }
}
