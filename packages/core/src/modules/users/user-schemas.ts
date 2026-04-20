import { z } from "zod"

export const userProfileSchema = z.object({
  completedJourneyCount: z.number().int(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable().optional(),
  name: z.string(),
  writingCount: z.number().int(),
})
