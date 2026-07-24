import { z } from "zod"
import { adminIdSchema } from "#contracts/identity/admin-ids"

export const adminSessionDtoSchema = z.object({
  admin: z.object({
    email: z.email(),
    id: adminIdSchema,
    name: z.string().min(1).max(200),
  }),
})

export type AdminSessionDto = z.infer<typeof adminSessionDtoSchema>
