"use client"

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

  return "비밀번호 재설정 요청에 실패했습니다."
}

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
        setError(resolveErrorMessage(result.error))
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
