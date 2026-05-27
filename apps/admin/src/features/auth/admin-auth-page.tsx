"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"

import { requestAdminEmailAuth } from "@/lib/auth/admin-auth-client"
import { getSafeAdminNextPath } from "@/lib/auth/admin-auth-navigation"

interface AdminAuthPageProps {
  authBaseUrl?: string
  nextPath?: string
}

export function AdminAuthPage({ authBaseUrl, nextPath }: AdminAuthPageProps) {
  const router = useRouter()
  const safeNextPath = getSafeAdminNextPath(nextPath)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const pendingRef = React.useRef(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pendingRef.current) {
      return
    }

    pendingRef.current = true
    setErrorMessage(null)
    setPending(true)

    const formData = new FormData(event.currentTarget)
    const result = await requestAdminEmailAuth({
      baseUrl: authBaseUrl,
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    })

    try {
      if (result.status === "error") {
        setErrorMessage(result.message)
        return
      }

      router.replace(safeNextPath)
      router.refresh()
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12 text-foreground">
      <Card variant="outlined" className="w-full max-w-md rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl/8 font-bold tracking-normal">
            관리자 로그인
          </CardTitle>
          <CardDescription>
            운영 계정으로 로그인해 콘텐츠와 사용자를 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="email">이메일</FieldLabel>
                <Input
                  autoComplete="email"
                  id="email"
                  name="email"
                  required
                  type="email"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                <Input
                  autoComplete="current-password"
                  id="password"
                  minLength={8}
                  name="password"
                  required
                  type="password"
                />
              </Field>
            </FieldGroup>

            {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}

            <Button className="h-10 w-full" disabled={pending} type="submit">
              {pending ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
