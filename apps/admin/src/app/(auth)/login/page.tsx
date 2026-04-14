import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">글필 어드민</h1>
          <p className="text-muted-foreground text-sm">
            관리자 계정으로 로그인하세요
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
