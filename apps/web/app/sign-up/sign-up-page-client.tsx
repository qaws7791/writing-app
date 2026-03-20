"use client"

import Link from "next/link"
import { useState } from "react"

import { AuthPageShell } from "@/components/auth-page-shell"
import { authClient } from "@/lib/auth-client"
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

  return "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요."
}

export default function SignUpPageClient() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsPending(true)

    const callbackURL = `${window.location.origin}/sign-in?verified=1`
    const result = await authClient.signUp.email({
      callbackURL,
      email,
      name,
      password,
    })

    if (result.error) {
      setError(resolveErrorMessage(result.error))
      setIsPending(false)
      return
    }

    setSubmittedEmail(email)
    setIsPending(false)
  }

  return (
    <AuthPageShell
      title="계정을 만들고 축적하기"
      description="가입 후 이메일 인증을 마치면 글감 저장과 초안 작성 이력이 계정에 연결됩니다."
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <span>이미 계정이 있다면</span>
          <Link
            className="font-medium text-foreground underline"
            href="/sign-in"
          >
            로그인
          </Link>
        </div>
      }
    >
      <CardHeader className="px-0">
        <CardTitle className="text-2xl">회원가입</CardTitle>
        <CardDescription>
          가입 직후에는 인증 메일을 확인해야 로그인할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {submittedEmail ? (
          <div className="space-y-3 rounded-[1.5rem] border border-foreground/10 bg-muted/60 p-5">
            <p className="text-lg font-semibold">인증 메일을 보냈습니다.</p>
            <p className="text-sm leading-7 text-muted-foreground">
              <strong className="text-foreground">{submittedEmail}</strong>로
              전송된 링크를 열어 인증을 완료한 뒤 로그인해 주세요. 개발
              환경에서는 API 로그 또는 테스트용 메일 조회 경로로 링크를 확인할
              수 있습니다.
            </p>
            <Link
              href="/sign-in"
              className="inline-flex text-sm font-medium text-foreground underline"
            >
              로그인 화면으로 이동
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">이름</FieldLabel>
                <Input
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="필명 또는 이름"
                  required
                />
              </Field>
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="8자 이상"
                  minLength={8}
                  required
                />
                <FieldDescription>
                  검증 메일을 열어야 가입이 활성화됩니다.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <FieldError>{error}</FieldError>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "계정 생성 중..." : "인증 메일 보내기"}
            </Button>
          </form>
        )}
      </CardContent>
    </AuthPageShell>
  )
}
