import { z } from 'zod'

export const PartyMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  notes: z.string().optional(),
})

export const ReplacePartySchema = z.object({
  members: z.array(PartyMemberSchema),
})

export type ReplacePartyInput = z.infer<typeof ReplacePartySchema>
