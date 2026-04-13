"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { TextField } from "@workspace/ui/components/text-field"

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
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="px-6 pt-14 pb-2">
        <Link
          href="/"
          className="text-on-surface-low hover:text-on-surface text-sm font-medium transition-colors"
        >
          ← 돌아가기
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center px-6 pb-20">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-on-surface text-3xl font-semibold tracking-tight">
            로그인
          </h1>
          <p className="text-on-surface-low mt-2 text-base">
            글필에 다시 오신 것을 환영합니다.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
            <TextField value={email} onChange={setEmail} isRequired>
              <Label>이메일</Label>
              <Input
                type="email"
                autoComplete="email"
                placeholder="example@email.com"
              />
            </TextField>

            <TextField value={password} onChange={setPassword} isRequired>
              <Label>비밀번호</Label>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="비밀번호를 입력하세요"
              />
            </TextField>

            {error && (
              <p className="text-error text-sm" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              isDisabled={isLoading}
              variant="primary"
              fullWidth
              className="mt-2"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
