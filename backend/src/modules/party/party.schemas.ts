import { z } from 'zod'

export const PartyMemberSchema = z.object({
  name: z.string().min(1),
  level: z.number().int().min(1).max(20).default(1),
  className: z.string().default('Fighter'),
  race: z.string().default(''),
})

export const ReplacePartySchema = z.object({
  members: z.array(PartyMemberSchema),
})

export type ReplacePartyInput = z.infer<typeof ReplacePartySchema>
