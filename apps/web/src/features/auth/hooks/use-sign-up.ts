"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { parseAuthApiError } from "@/features/auth/lib/api-error"
import { authClient } from "@/features/auth/repositories/auth-client"
import { SignUpFormValues, signUpSchema } from "@/features/auth/lib/schema"
import { AUTH_MESSAGES } from "@/features/auth/lib/constants"

function resolveSignUpError(error: unknown): string {
  const parsed = parseAuthApiError(error)
  if (parsed?.status === 409) {
    return AUTH_MESSAGES.SIGN_UP.ALREADY_EXISTS
  }
  return parsed?.message ?? AUTH_MESSAGES.SIGN_UP.FAILED
}

export function useSignUp() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    form.clearErrors("root")

    const callbackURL = `${window.location.origin}/sign-in?verified=1`
    const result = await authClient.signUp.email({
      callbackURL,
      email: data.email,
      name: data.name,
      password: data.password,
    })

    if (result.error) {
      form.setError("root", {
        type: "server",
        message: resolveSignUpError(result.error),
      })
      return
    }

    setSubmittedEmail(data.email)
  })

  return {
    form,
    onSubmit,
    submittedEmail,
  }
}
