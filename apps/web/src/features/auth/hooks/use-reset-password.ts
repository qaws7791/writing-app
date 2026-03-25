"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { authClient } from "@/features/auth/repositories/auth-client"

function resolveErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message
  }

  return "비밀번호를 재설정하지 못했습니다."
}

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
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  const tokenError = resolveTokenError(errorCode, token)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      setError("재설정 토큰이 없습니다.")
      return
    }

    if (password !== confirmPassword) {
      setError("비밀번호 확인이 일치하지 않습니다.")
      return
    }

    setError(null)

    startTransition(async () => {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (result.error) {
        setError(resolveErrorMessage(result.error))
        return
      }

      setCompleted(true)
      router.prefetch("/sign-in")
    })
  }

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    isPending,
    completed,
    tokenError,
    handleSubmit,
  }
}
