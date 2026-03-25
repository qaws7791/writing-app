"use client"

import Link from "next/link"

import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password"
import { AuthPageShell } from "@/foundation/ui/auth-page-shell"
import { Button } from "@workspace/ui/components/button"
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export default function ForgotPasswordView() {
  const { email, setEmail, error, isPending, submittedEmail, handleSubmit } =
    useForgotPassword()

  return (
    <AuthPageShell
      title="비밀번호 재설정"
      description="가입한 이메일로 재설정 링크를 보내면 새 비밀번호를 설정할 수 있습니다."
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <span>비밀번호가 기억났다면</span>
          <Link
            className="font-medium text-foreground underline"
            href="/sign-in"
          >
            로그인
          </Link>
        </div>
      }
    >
      <CardHeader className="px-0">
        <CardTitle className="text-2xl">재설정 링크 요청</CardTitle>
        <CardDescription>
          링크는 개발 환경에서 추적 가능한 형태로 저장됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {submittedEmail ? (
          <div className="space-y-3 rounded-[1.5rem] border border-foreground/10 bg-muted/60 p-5">
            <p className="text-lg font-semibold">링크를 준비했습니다.</p>
            <p className="text-sm leading-7 text-muted-foreground">
              <strong className="text-foreground">{submittedEmail}</strong>로
              전송된 메일을 확인해 주세요. 개발 환경에서는 API 로그 또는
              테스트용 조회 경로에서 링크를 확인할 수 있습니다.
            </p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">이메일</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </Field>
            </FieldGroup>

            <FieldError>{error}</FieldError>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "링크 생성 중..." : "재설정 링크 보내기"}
            </Button>
          </form>
        )}
      </CardContent>
    </AuthPageShell>
  )
}
