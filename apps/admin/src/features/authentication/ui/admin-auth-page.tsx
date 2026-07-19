"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition, type FormEvent } from "react"

import { requestAdminPasswordLogin } from "@/features/authentication/api/admin-auth-client"
import type { AdminApiBaseUrl } from "@/shared/config/admin-api-url"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"

export function AdminAuthPage({
  apiBaseUrl,
  learnerWebOrigin,
  nextPath,
}: {
  readonly apiBaseUrl: AdminApiBaseUrl
  readonly learnerWebOrigin: string
  readonly nextPath: string
}) {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, startTransition] = useTransition()

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setErrorMessage(null)
    startTransition(async () => {
      try {
        const result = await requestAdminPasswordLogin(apiBaseUrl, {
          email: String(formData.get("email") ?? ""),
          nextPath,
          password: String(formData.get("password") ?? ""),
        })
        router.replace(result.nextPath)
      } catch {
        setErrorMessage("이메일 또는 비밀번호를 확인하세요.")
      }
    })
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="an-fi w-full max-w-md rounded-4xl bg-surface p-8">
        <div className="mb-4 text-5xl">🔐</div>
        <h1 className="m-0 mb-2 text-[1.75rem] font-bold text-foreground">
          글결 어드민
        </h1>
        <p className="m-0 mb-6 text-[1rem] font-medium text-muted-foreground">
          접근하려면 관리자 계정으로 로그인하세요.
        </p>
        <form className="grid gap-3.5" onSubmit={submitLogin}>
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
            className="w-full rounded-4xl py-4 text-[1.0625rem] font-bold"
            disabled={isSubmitting}
            type="submit"
          >
            로그인
          </Button>
        </form>
        {errorMessage === null ? null : (
          <Alert className="mt-3" role="alert" tone="danger">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <Link
          className="mt-4 block text-center text-[0.875rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
          href={learnerWebOrigin}
        >
          ← 앱으로 돌아가기
        </Link>
      </div>
    </main>
  )
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
        className="rounded-3xl border-4 border-transparent bg-background px-5 py-4 font-medium focus:border-foreground"
        id={`admin-auth-${name}`}
        name={name}
        required
        type={type}
      />
    </Field>
  )
}
