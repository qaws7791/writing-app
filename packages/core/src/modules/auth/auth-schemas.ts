import { z } from "zod"

export const authenticatedSessionSchema = z.object({
  createdAt: z.union([z.string(), z.date()]),
  expiresAt: z.union([z.string(), z.date()]),
  id: z.string(),
  ipAddress: z.string().nullable().optional(),
  token: z.string(),
  updatedAt: z.union([z.string(), z.date()]),
  userAgent: z.string().nullable().optional(),
  userId: z.string(),
})

export const authenticatedUserSchema = z.object({
  email: z.string(),
  emailVerified: z.boolean(),
  id: z.string(),
  image: z.string().nullable().optional(),
  name: z.string(),
})

export const meResponseSchema = z.object({
  session: authenticatedSessionSchema,
  user: authenticatedUserSchema,
})

export const authEmailMessageSchema = z.object({
  email: z.string(),
  kind: z.enum(["password-reset", "verification"]),
  sentAt: z.string(),
  token: z.string(),
  url: z.string(),
})

export const authEmailQuerySchema = z.object({
  email: z.string().email(),
  kind: z.enum(["password-reset", "verification"]),
})
