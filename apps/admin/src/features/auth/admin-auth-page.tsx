"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition, type FormEvent } from "react"

import { requestAdminPasswordLogin } from "@/lib/auth/admin-auth-client"
import { readLearnerWebOrigin } from "@/runtime-config"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"

const learnerWebOrigin = readLearnerWebOrigin()

export function AdminAuthPage({ nextPath }: { readonly nextPath: string }) {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")

    setErrorMessage(null)
    startTransition(async () => {
      try {
        const redirectPath = await requestAdminPasswordLogin({
          email,
          nextPath,
          password,
        })

        router.replace(redirectPath)
      } catch {
        setErrorMessage("이메일 또는 비밀번호를 확인하세요.")
      }
    })
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="an-fi w-full max-w-md rounded-4xl bg-surface p-8">
        <div className="mb-4 text-5xl">🔐</div>
        <h1
          className="m-0 mb-2 text-[1.75rem] font-bold text-foreground"
          id="admin-login-title"
        >
          글결 어드민
        </h1>
        <p className="m-0 mb-6 text-[1rem] font-medium text-muted-foreground">
          접근하려면 관리자 계정으로 로그인하세요.
        </p>
        <form className="grid gap-3.5" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="admin-login-email">이메일</FieldLabel>
            <Input
              autoComplete="email"
              className="rounded-3xl border-4 border-transparent bg-background px-5 py-4 font-medium focus:border-foreground"
              id="admin-login-email"
              name="email"
              required
              type="email"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="admin-login-password">비밀번호</FieldLabel>
            <Input
              autoComplete="current-password"
              className="rounded-3xl border-4 border-transparent bg-background px-5 py-4 font-medium focus:border-foreground"
              id="admin-login-password"
              name="password"
              required
              type="password"
            />
          </Field>
          {errorMessage === null ? null : (
            <Alert role="alert" tone="danger">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <Button
            className="w-full rounded-4xl py-4 text-[1.0625rem] font-bold"
            disabled={isSubmitting}
            type="submit"
          >
            로그인
          </Button>
        </form>
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
