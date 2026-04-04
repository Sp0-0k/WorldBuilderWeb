import { z } from 'zod'

export const SearchQuerySchema = z.object({
  worldId: z.string().min(1),
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type SearchQuery = z.infer<typeof SearchQuerySchema>
