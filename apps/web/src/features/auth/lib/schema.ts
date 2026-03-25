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

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, AUTH_MESSAGES.COMMON.PASSWORD_MIN),
    confirmPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, AUTH_MESSAGES.COMMON.PASSWORD_MIN),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: AUTH_MESSAGES.COMMON.PASSWORD_MISMATCH,
    path: ["confirmPassword"],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요."),
  email: z.email("올바른 이메일 주소를 입력해 주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
})

export type SignUpFormValues = z.infer<typeof signUpSchema>
