"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/ui/button"
import { Input } from "@workspace/ui/components/ui/input"
import { Label } from "@workspace/ui/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/sign-in/email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        setError(data?.message ?? "로그인에 실패했습니다.")
        return
      }

      router.push("/home")
    } catch {
      setError("서버에 연결할 수 없습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-6 pt-14 pb-2">
        <Link
          href="/"
          className="text-xs leading-5 font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← 돌아가기
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center px-6 pb-20">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-3xl leading-tight font-semibold text-foreground">
            로그인
          </h1>
          <p className="mt-2 text-base leading-7 text-muted-foreground">
            글필에 다시 오신 것을 환영합니다.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-xs leading-5 text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              variant="default"
              className="mt-2 w-full"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
