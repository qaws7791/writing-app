"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? "로그인에 실패했습니다")
        return
      }
      router.replace("/journeys")
    } catch {
      setError("서버에 연결할 수 없습니다")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium">
          이메일
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          placeholder="admin@example.com"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          placeholder="••••••••"
        />
      </div>
      {error !== null && <p className="text-destructive text-sm">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "로그인 중..." : "로그인"}
      </button>
    </form>
  )
}
