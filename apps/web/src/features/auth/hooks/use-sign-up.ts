"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { authClient } from "@/features/auth/repositories/auth-client"

const signUpSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요."),
  email: z.email("올바른 이메일 주소를 입력해 주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
})

type SignUpFormValues = z.infer<typeof signUpSchema>

function resolveErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 409
  ) {
    return "이미 가입된 이메일입니다. 로그인하거나 비밀번호 재설정을 사용해 주세요."
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message
  }

  return "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요."
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
        message: resolveErrorMessage(result.error),
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
