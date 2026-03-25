"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { parseAuthApiError } from "@/features/auth/lib/api-error"
import { authClient } from "@/features/auth/repositories/auth-client"
import { SignInFormValues, signInSchema } from "@/features/auth/lib/schema"
import { AUTH_MESSAGES } from "@/features/auth/lib/constants"

type UseSignInParams = {
  errorCode?: string
  verified: boolean
}

export function useSignIn({ errorCode, verified }: UseSignInParams) {
  const router = useRouter()
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const verificationNotice =
    errorCode === "invalid_token"
      ? AUTH_MESSAGES.SIGN_IN.INVALID_TOKEN
      : verified
        ? AUTH_MESSAGES.SIGN_IN.EMAIL_VERIFIED
        : null

  const onSubmit = form.handleSubmit(async (data) => {
    form.clearErrors("root")

    const result = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    })

    if (result.error) {
      form.setError("root", {
        type: "server",
        message:
          parseAuthApiError(result.error)?.message ??
          AUTH_MESSAGES.SIGN_IN.FAILED,
      })
      return
    }

    router.push("/home")
    router.refresh()
  })

  return {
    form,
    onSubmit,
    verificationNotice,
  }
}
