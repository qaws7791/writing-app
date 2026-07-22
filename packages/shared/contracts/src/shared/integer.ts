import { z } from "zod"

export const nonNegativeIntegerSchema = z.number().int().nonnegative()
export const positiveIntegerSchema = z.number().int().positive()
