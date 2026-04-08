import { MemoriesRepository } from './memories.repository'
import { CreateMemoryInput, UpdateMemoryInput } from './memories.schemas'

export class MemoriesService {
  constructor(private readonly repo: MemoriesRepository) {}

  listForNpc(npcId: string) {
    return this.repo.findByNpcId(npcId)
  }

  create(npcId: string, data: CreateMemoryInput) {
    return this.repo.create(npcId, data)
  }

  async update(id: string, data: UpdateMemoryInput) {
    const existing = await this.repo.findById(id)
    if (!existing) throw new Error('Memory not found')
    return this.repo.update(id, data)
  }

  async delete(id: string) {
    const existing = await this.repo.findById(id)
    if (!existing) throw new Error('Memory not found')
    return this.repo.delete(id)
  }
}
