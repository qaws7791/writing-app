"use client"

import * as React from "react"
import Link from "next/link"
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

import {
  requestEmailAuth,
  requestGoogleAuth,
  type AuthMode,
} from "@/lib/auth/auth-client"
import { getSafeNextPath } from "@/lib/auth/auth-navigation"

interface AuthPageProps {
  authBaseUrl?: string
  mode: AuthMode
  nextPath?: string
}

const authCopy = {
  login: {
    alternateAction: "회원가입",
    alternateHref: "/signup",
    description: "계정으로 로그인하고 학습을 이어가세요.",
    submitLabel: "로그인",
    title: "로그인",
  },
  signup: {
    alternateAction: "로그인",
    alternateHref: "/login",
    description: "계정을 만들고 글쓰기 학습을 시작하세요.",
    submitLabel: "회원가입",
    title: "회원가입",
  },
} satisfies Record<AuthMode, Record<string, string>>

export function AuthPage({ authBaseUrl, mode, nextPath }: AuthPageProps) {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const [googlePending, setGooglePending] = React.useState(false)
  const safeNextPath = getSafeNextPath(nextPath)
  const copy = authCopy[mode]

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setPending(true)

    const formData = new FormData(event.currentTarget)
    const result = await requestEmailAuth({
      baseUrl: authBaseUrl,
      email: String(formData.get("email") ?? ""),
      mode,
      name: String(formData.get("name") ?? ""),
      password: String(formData.get("password") ?? ""),
    })

    setPending(false)

    if (result.status === "error") {
      setErrorMessage(result.message)
      return
    }

    router.replace(safeNextPath)
    router.refresh()
  }

  async function handleGoogleAuth() {
    setErrorMessage(null)
    setGooglePending(true)

    try {
      await requestGoogleAuth({
        baseUrl: authBaseUrl,
        callbackPath: safeNextPath,
      })
    } catch {
      setGooglePending(false)
      setErrorMessage("Google 로그인 요청에 실패했습니다.")
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12 text-foreground">
      <Card variant="outlined" className="w-full max-w-md rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl/8 font-bold tracking-normal">
            {copy.title}
          </CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <FieldGroup className="gap-4">
              {mode === "signup" ? (
                <Field>
                  <FieldLabel htmlFor="name">이름</FieldLabel>
                  <Input
                    autoComplete="name"
                    id="name"
                    name="name"
                    required
                    type="text"
                  />
                </Field>
              ) : null}
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
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  id="password"
                  minLength={8}
                  name="password"
                  required
                  type="password"
                />
              </Field>
            </FieldGroup>

            {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}

            <Button
              className="w-full"
              disabled={pending || googlePending}
              size="lg"
              type="submit"
            >
              {pending ? "처리 중..." : copy.submitLabel}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs/5 text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>또는</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            className="w-full"
            disabled={pending || googlePending}
            onClick={handleGoogleAuth}
            size="lg"
            type="button"
            variant="outline"
          >
            <span className="flex size-5 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-foreground">
              G
            </span>
            {googlePending ? "Google로 이동 중..." : "Google로 계속하기"}
          </Button>

          <p className="m-0 mt-6 text-center text-sm/6 text-muted-foreground">
            <span>
              {mode === "login" ? "계정이 없나요?" : "이미 계정이 있나요?"}
            </span>{" "}
            <Link
              className="font-semibold text-primary underline-offset-4 hover:underline"
              href={`${copy.alternateHref}?next=${encodeURIComponent(safeNextPath)}`}
            >
              {copy.alternateAction}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
