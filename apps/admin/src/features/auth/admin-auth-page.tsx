"use client"

import { useState, type FormEvent } from "react"
import { ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"

import { requestAdminPasswordLogin } from "@/lib/auth/admin-auth-client"
import { Button } from "@workspace/ui/components/ui/button"
import { Input } from "@workspace/ui/components/ui/input"

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
    <main className="admin-auth-page">
      <section className="admin-auth-card">
        <div className="admin-auth-card__mark">
          <ShieldCheck aria-hidden="true" size={28} />
        </div>
        <span>글결 운영 콘솔</span>
        <h1>관리자 로그인</h1>
        <p>
          콘텐츠, 사용자, 분석, 운영 설정을 관리하려면 관리자 계정으로
          로그인하세요.
        </p>
        <form className="admin-auth-form" onSubmit={handleSubmit}>
          <label>
            이메일
            <Input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            비밀번호
            <Input
              autoComplete="current-password"
              name="password"
              required
              type="password"
            />
          </label>
          {errorMessage === null ? null : (
            <p className="admin-inline-error" role="alert">
              {errorMessage}
            </p>
          )}
          <Button className="w-full" disabled={isSubmitting} type="submit">
            로그인
          </Button>
        </form>
      </section>
    </main>
  )
}
