"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
          className="text-sm font-medium text-on-surface-low transition-colors hover:text-on-surface"
        >
          ← 돌아가기
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center px-6 pb-20">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-on-surface">
            로그인
          </h1>
          <p className="mt-2 text-base text-on-surface-low">
            글필에 다시 오신 것을 환영합니다.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-on-surface-low"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="rounded-2xl border border-outline/30 bg-surface-container-low px-4 py-3.5 text-base text-on-surface transition-colors outline-none placeholder:text-on-surface-lowest focus:border-on-surface-low focus:ring-1 focus:ring-on-surface-low"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-on-surface-low"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="rounded-2xl border border-outline/30 bg-surface-container-low px-4 py-3.5 text-base text-on-surface transition-colors outline-none placeholder:text-on-surface-lowest focus:border-on-surface-low focus:ring-1 focus:ring-on-surface-low"
              />
            </div>

            {error && (
              <p className="text-sm text-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-semibold text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
