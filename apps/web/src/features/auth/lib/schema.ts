import {
  AUTH_MESSAGES,
  PASSWORD_MIN_LENGTH,
} from "@/features/auth/lib/constants"
import z from "zod"

export const signInSchema = z.object({
  email: z.email(AUTH_MESSAGES.COMMON.INVALID_EMAIL),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, AUTH_MESSAGES.COMMON.PASSWORD_MIN),
})

export type SignInFormValues = z.infer<typeof signInSchema>
