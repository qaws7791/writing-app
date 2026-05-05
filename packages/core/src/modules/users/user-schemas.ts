import { z } from "zod"

export const userProfileSchema = z.object({
  email: z.string().email(),
  emailVerified: z.boolean(),
  gardenCardCount: z.number().int(),
  image: z.string().nullable().optional(),
  name: z.string(),
  sentenceCount: z.number().int(),
})
