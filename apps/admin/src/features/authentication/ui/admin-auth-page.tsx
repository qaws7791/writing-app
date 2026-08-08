"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
} from "react"

import {
  readAdminLoginErrorMessage,
  requestAdminPasswordLogin,
} from "@/features/authentication/api/admin-auth-client"
import type { AdminLoginReason } from "@/features/authentication/model/admin-auth-navigation"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import { Card, CardContent } from "@workspace/ui/components/ui/card"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"

export function AdminAuthPage({
  learnerWebOrigin,
  nextPath,
  reason,
}: {
  readonly learnerWebOrigin: string
  readonly nextPath: string
  readonly reason: AdminLoginReason | null
}) {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    readHydrated,
    readNotHydrated
  )
  const [isSubmitting, startTransition] = useTransition()

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setErrorMessage(null)
    startTransition(async () => {
      try {
        const result = await requestAdminPasswordLogin({
          email: String(formData.get("email") ?? ""),
          nextPath,
          password: String(formData.get("password") ?? ""),
        })
        router.replace(result.nextPath)
      } catch (error) {
        setErrorMessage(readAdminLoginErrorMessage(error))
      }
    })
  }

  return (
    <main className="grid min-h-svh place-items-center bg-background px-6 py-16">
      <Card className="w-full max-w-md" size="lg">
        <CardContent>
          <div
            aria-hidden="true"
            className="mb-8 grid size-11 place-items-center rounded-2xl bg-foreground text-sm font-semibold text-background"
          >
            글
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.03em]">
            글결 어드민
          </h1>
          <p className="mt-2 mb-8 text-sm leading-6 text-muted-foreground">
            접근하려면 관리자 계정으로 로그인하세요.
          </p>
          {reason === null ? null : (
            <Alert className="mb-4" role="status">
              <AlertDescription>
                로그인 세션이 만료되어 다시 로그인해야 합니다. 저장하지 않은
                편집 내용은 복구할 수 없습니다.
              </AlertDescription>
            </Alert>
          )}
          <form className="grid gap-5" onSubmit={submitLogin}>
            <AuthInput
              autoComplete="email"
              label="이메일"
              name="email"
              type="email"
            />
            <AuthInput
              autoComplete="current-password"
              label="비밀번호"
              name="password"
              type="password"
            />
            <Button
              className="w-full"
              disabled={!isHydrated || isSubmitting}
              size="lg"
              type="submit"
            >
              로그인
            </Button>
          </form>
          {errorMessage === null ? null : (
            <Alert className="mt-3" role="alert" variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <Link
            className="mt-6 block text-center text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            href={learnerWebOrigin}
          >
            ← 앱으로 돌아가기
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}

function subscribeToHydration(): () => void {
  return () => {}
}

function readHydrated(): true {
  return true
}

function readNotHydrated(): false {
  return false
}

function AuthInput({
  autoComplete,
  label,
  name,
  type = "text",
}: {
  readonly autoComplete?: string
  readonly label: string
  readonly name: string
  readonly type?: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor={`admin-auth-${name}`}>{label}</FieldLabel>
      <Input
        autoComplete={autoComplete}
        id={`admin-auth-${name}`}
        name={name}
        required
        type={type}
      />
    </Field>
  )
}
