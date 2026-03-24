"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { AuthPageShell } from "@/foundation/ui/auth-page-shell"
import { authClient } from "@/features/auth/repositories/auth-client"
import { Button } from "@workspace/ui/components/button"
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

function resolveErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message
  }

  return "로그인에 실패했습니다. 입력값을 다시 확인해 주세요."
}

type SignInViewProps = {
  errorCode?: string
  verified: boolean
}

export default function SignInView({ errorCode, verified }: SignInViewProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPending(true)
    setError(null)

    const result = await authClient.signIn.email({
      email,
      password,
    })

    if (result.error) {
      setError(resolveErrorMessage(result.error))
      setIsPending(false)
      return
    }

    router.push("/home")
    router.refresh()
  }

  const verificationNotice =
    errorCode === "invalid_token"
      ? "인증 링크가 유효하지 않거나 만료되었습니다. 다시 가입하거나 새 링크를 요청해 주세요."
      : verified
        ? "이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다."
        : null

  return (
    <AuthPageShell
      title="다시 이어 쓰기"
      description="이메일과 비밀번호로 로그인하면 저장한 글감과 초안을 바로 이어서 볼 수 있습니다."
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <span>계정이 아직 없다면</span>
          <Link
            className="font-medium text-foreground underline"
            href="/sign-up"
          >
            회원가입
          </Link>
          <span>또는</span>
          <Link
            className="font-medium text-foreground underline"
            href="/forgot-password"
          >
            비밀번호 재설정
          </Link>
        </div>
      }
    >
      <CardHeader className="px-0">
        <CardTitle className="text-2xl">로그인</CardTitle>
        <CardDescription>
          인증이 필요한 화면은 로그인 후 접근할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {verificationNotice ? (
            <div className="rounded-2xl border border-foreground/10 bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              {verificationNotice}
            </div>
          ) : null}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">이메일</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">비밀번호</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8자 이상"
                required
              />
              <FieldDescription>
                가입 후 이메일 인증을 완료해야 로그인할 수 있습니다.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <FieldError>{error}</FieldError>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </CardContent>
    </AuthPageShell>
  )
}
