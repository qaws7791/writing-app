"use client"

import { useState, useTransition } from "react"

import { parseAuthApiError } from "@/features/auth/lib/api-error"
import { authClient } from "@/features/auth/repositories/auth-client"

export function useForgotPassword() {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const redirectTo = `${window.location.origin}/reset-password`
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo,
      })

      if (result.error) {
        setError(
          parseAuthApiError(result.error)?.message ??
            "비밀번호 재설정 요청에 실패했습니다."
        )
        return
      }

      setSubmittedEmail(email)
    })
  }

  return {
    email,
    setEmail,
    error,
    isPending,
    submittedEmail,
    handleSubmit,
  }
}
