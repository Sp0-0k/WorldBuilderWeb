import { z } from 'zod'

const optionalCityId = z.string().optional().transform(v => v === '' ? undefined : v)

export const CreateFactionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  powerLevel: z.string().optional(),
  strongholdCityId: optionalCityId,
})

export const UpdateFactionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  powerLevel: z.string().optional(),
  strongholdCityId: optionalCityId.nullable(),
})

export const AddFactionMemberSchema = z.object({
  npcId: z.string().min(1),
  role: z.string().optional(),
})

export type CreateFactionInput = z.infer<typeof CreateFactionSchema>
export type UpdateFactionInput = z.infer<typeof UpdateFactionSchema>
export type AddFactionMemberInput = z.infer<typeof AddFactionMemberSchema>
