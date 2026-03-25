"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { parseAuthApiError } from "@/features/auth/lib/api-error"
import { authClient } from "@/features/auth/repositories/auth-client"

const signInSchema = z.object({
  email: z.email("올바른 이메일 주소를 입력해 주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
})

type SignInFormValues = z.infer<typeof signInSchema>

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
      ? "인증 링크가 유효하지 않거나 만료되었습니다. 다시 가입하거나 새 링크를 요청해 주세요."
      : verified
        ? "이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다."
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
          "로그인에 실패했습니다. 입력값을 다시 확인해 주세요.",
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
