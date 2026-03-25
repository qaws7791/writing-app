"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { parseAuthApiError } from "@/features/auth/lib/api-error"
import { authClient } from "@/features/auth/repositories/auth-client"

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
    confirmPassword: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호 확인이 일치하지 않습니다.",
    path: ["confirmPassword"],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

function resolveTokenError(
  errorCode: string | undefined,
  token: string | undefined
): string | null {
  if (errorCode === "INVALID_TOKEN" || errorCode === "invalid_token") {
    return "재설정 링크가 유효하지 않거나 만료되었습니다."
  }

  if (!token) {
    return "재설정 토큰이 없습니다. 이메일의 링크를 다시 열어 주세요."
  }

  return null
}

type UseResetPasswordParams = {
  errorCode?: string
  token?: string
}

export function useResetPassword({ errorCode, token }: UseResetPasswordParams) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const tokenError = resolveTokenError(errorCode, token)

  function onSubmit(data: ResetPasswordFormValues) {
    if (!token) {
      setServerError("재설정 토큰이 없습니다.")
      return
    }

    setServerError(null)

    startTransition(async () => {
      const result = await authClient.resetPassword({
        newPassword: data.password,
        token,
      })

      if (result.error) {
        setServerError(
          parseAuthApiError(result.error)?.message ??
            "비밀번호를 재설정하지 못했습니다."
        )
        return
      }

      setCompleted(true)
      router.prefetch("/sign-in")
    })
  }

  return {
    form,
    serverError,
    isPending,
    completed,
    tokenError,
    onSubmit: form.handleSubmit(onSubmit),
  }
}
