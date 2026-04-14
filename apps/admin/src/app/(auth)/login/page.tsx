import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">글필 어드민</h1>
          <p className="text-sm text-muted">관리자 계정으로 로그인하세요</p>
        </div>
        <div className="rounded-3xl bg-surface p-6 shadow-surface">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
