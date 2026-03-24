"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

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

  return "비밀번호를 재설정하지 못했습니다."
}

type ResetPasswordViewProps = {
  errorCode?: string
  token?: string
}

export default function ResetPasswordView({
  errorCode,
  token,
}: ResetPasswordViewProps) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [completed, setCompleted] = useState(false)

  const tokenError = useMemo(() => {
    if (errorCode === "INVALID_TOKEN" || errorCode === "invalid_token") {
      return "재설정 링크가 유효하지 않거나 만료되었습니다."
    }

    if (!token) {
      return "재설정 토큰이 없습니다. 이메일의 링크를 다시 열어 주세요."
    }

    return null
  }, [errorCode, token])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
    setIsPending(true)

    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    })

    if (result.error) {
      setError(resolveErrorMessage(result.error))
      setIsPending(false)
      return
    }

    setCompleted(true)
    setIsPending(false)
    router.prefetch("/sign-in")
  }

  return (
    <AuthPageShell
      title="새 비밀번호 설정"
      description="재설정 링크의 토큰을 사용해 새로운 비밀번호를 저장합니다."
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <span>로그인 화면으로 돌아가려면</span>
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
        <CardTitle className="text-2xl">비밀번호 변경</CardTitle>
        <CardDescription>
          완료 후에는 새 비밀번호로 다시 로그인해야 합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {completed ? (
          <div className="space-y-3 rounded-[1.5rem] border border-foreground/10 bg-muted/60 p-5">
            <p className="text-lg font-semibold">변경이 완료되었습니다.</p>
            <p className="text-sm leading-7 text-muted-foreground">
              새 비밀번호로 다시 로그인해 주세요.
            </p>
            <Link
              href="/sign-in"
              className="inline-flex text-sm font-medium text-foreground underline"
            >
              로그인 화면으로 이동
            </Link>
          </div>
        ) : tokenError ? (
          <div className="space-y-3 rounded-[1.5rem] border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
            <p className="font-semibold">{tokenError}</p>
            <p className="leading-7">
              새 링크가 필요하면 비밀번호 재설정 요청을 다시 진행해 주세요.
            </p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">새 비밀번호</FieldLabel>
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
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">
                  새 비밀번호 확인
                </FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="한 번 더 입력"
                  minLength={8}
                  required
                />
                <FieldDescription>
                  두 입력값이 같아야 재설정이 완료됩니다.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <FieldError>{error}</FieldError>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "변경 중..." : "새 비밀번호 저장"}
            </Button>
          </form>
        )}
      </CardContent>
    </AuthPageShell>
  )
}
