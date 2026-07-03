"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { requestAdminPasswordLogin } from "@/lib/auth/admin-auth-client"
import { ShieldCheckIcon } from "@workspace/ui/components/icons"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"
import { Surface } from "@workspace/ui/components/ui/surface"

export function AdminAuthPage({ nextPath }: { readonly nextPath: string }) {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const redirectPath = await requestAdminPasswordLogin({
        email,
        nextPath,
        password,
      })

      router.replace(redirectPath)
    } catch {
      setErrorMessage("이메일 또는 비밀번호를 확인하세요.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <Surface
        aria-labelledby="admin-login-title"
        className="grid w-full max-w-[420px] justify-items-center gap-3 p-9 text-center"
        variant="panel"
      >
        <div className="grid size-14 place-items-center rounded-control bg-accent text-accent-foreground">
          <ShieldCheckIcon aria-hidden="true" size={28} />
        </div>
        <span className="text-label-sm font-black text-muted-foreground">
          글결 운영 콘솔
        </span>
        <h1 className="m-0 text-heading-md font-black" id="admin-login-title">
          관리자 로그인
        </h1>
        <p className="m-0 mb-2 text-body-sm font-semibold text-muted-foreground">
          콘텐츠, 사용자, 분석, 운영 설정을 관리하려면 관리자 계정으로
          로그인하세요.
        </p>
        <form className="grid w-full gap-3.5 text-left" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="admin-login-email">이메일</FieldLabel>
            <Input
              autoComplete="email"
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
          <Button className="w-full" disabled={isSubmitting} type="submit">
            로그인
          </Button>
        </form>
      </Surface>
    </main>
  )
}
