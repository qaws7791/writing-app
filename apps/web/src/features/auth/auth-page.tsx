"use client"

import * as React from "react"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"

import { requestGoogleAuth } from "@/lib/auth/auth-client"
import { getSafeNextPath } from "@/lib/auth/auth-navigation"

interface AuthPageProps {
  authBaseUrl?: string
  nextPath?: string
}

export function AuthPage({ authBaseUrl, nextPath }: AuthPageProps) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [googlePending, setGooglePending] = React.useState(false)
  const safeNextPath = getSafeNextPath(nextPath)

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
            로그인
          </CardTitle>
          <CardDescription>
            Google 계정으로 로그인하고 학습을 이어가세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage ? (
            <p className="text-sm/6 text-destructive">{errorMessage}</p>
          ) : null}

          <Button
            className="w-full"
            disabled={googlePending}
            onClick={handleGoogleAuth}
            size="lg"
            type="button"
            variant="outline"
          >
            <span
              aria-hidden="true"
              className="flex size-5 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-foreground"
            >
              G
            </span>
            {googlePending ? "Google로 이동 중..." : "Google로 계속하기"}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
