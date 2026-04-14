"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { TextField } from "@workspace/ui/components/text-field"

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
      <TextField
        value={email}
        onChange={setEmail}
        type="email"
        autoComplete="email"
        isRequired
      >
        <Label>이메일</Label>
        <Input fullWidth placeholder="admin@example.com" />
      </TextField>

      <TextField
        value={password}
        onChange={setPassword}
        type="password"
        autoComplete="current-password"
        isRequired
      >
        <Label>비밀번호</Label>
        <Input fullWidth placeholder="••••••••" />
      </TextField>

      {error !== null && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" variant="primary" fullWidth isDisabled={isPending}>
        {isPending ? "로그인 중..." : "로그인"}
      </Button>
    </form>
  )
}
