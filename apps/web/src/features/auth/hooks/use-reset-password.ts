"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { parseAuthApiError } from "@/features/auth/lib/api-error"
import {
  ERROR_MESSAGES,
  INVALID_TOKEN_CODES,
  PASSWORD_MIN_LENGTH,
  SIGN_IN_PATH,
} from "@/features/auth/lib/constants"
import { authClient } from "@/features/auth/repositories/auth-client"

const resetPasswordSchema = z
  .object({
    password: z.string().min(PASSWORD_MIN_LENGTH, ERROR_MESSAGES.PASSWORD_MIN),
    confirmPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, ERROR_MESSAGES.PASSWORD_MIN),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: ERROR_MESSAGES.PASSWORD_MISMATCH,
    path: ["confirmPassword"],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

type SubmissionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "completed" }

type UseResetPasswordParams = {
  errorCode?: string
  token?: string
}

function resolveTokenError(
  errorCode: string | undefined,
  token: string | undefined
): string | null {
  if (errorCode != null && INVALID_TOKEN_CODES.has(errorCode)) {
    return ERROR_MESSAGES.INVALID_TOKEN
  }
  if (!token) {
    return ERROR_MESSAGES.MISSING_TOKEN
  }
  return null
}

export function useResetPassword({ errorCode, token }: UseResetPasswordParams) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submission, setSubmission] = useState<SubmissionState>({
    status: "idle",
  })

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const tokenError = useMemo(
    () => resolveTokenError(errorCode, token),
    [errorCode, token]
  )

  const onSubmit = useCallback(
    (values: ResetPasswordFormValues) => {
      if (!token) {
        setSubmission({
          status: "error",
          message: ERROR_MESSAGES.MISSING_TOKEN,
        })
        return
      }

      setSubmission({ status: "idle" })

      startTransition(async () => {
        try {
          const { error } = await authClient.resetPassword({
            newPassword: values.password,
            token,
          })

          if (error) {
            setSubmission({
              status: "error",
              message:
                parseAuthApiError(error)?.message ??
                ERROR_MESSAGES.RESET_FAILED,
            })
            return
          }

          setSubmission({ status: "completed" })
          router.prefetch(SIGN_IN_PATH)
        } catch {
          setSubmission({
            status: "error",
            message: ERROR_MESSAGES.RESET_FAILED,
          })
        }
      })
    },
    [token, router]
  )

  return {
    form,
    isPending,
    tokenError,
    state: submission,
    onSubmit: form.handleSubmit(onSubmit),
  }
}
