import { z } from 'zod'

export const CreateMemoryBody = z.object({
  content: z.string().min(1),
})

export const UpdateMemoryBody = z.object({
  content: z.string().min(1),
  createdAt: z.string().datetime().optional(),
})

export const NpcIdParam = z.object({ npcId: z.string() })
export const MemoryIdParam = z.object({ id: z.string() })

export type CreateMemoryInput = z.infer<typeof CreateMemoryBody>
export type UpdateMemoryInput = z.infer<typeof UpdateMemoryBody>
