"use client"

import Link from "next/link"

import { useSignIn } from "@/features/auth/hooks/use-sign-in"
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

type SignInViewProps = {
  errorCode?: string
  verified: boolean
}

export default function SignInView({ errorCode, verified }: SignInViewProps) {
  const { form, onSubmit, verificationNotice } = useSignIn({
    errorCode,
    verified,
  })

  return (
    <AuthPageShell
      title="다시 이어 쓰기"
      description="이메일과 비밀번호로 로그인하면 저장한 글감과 글을 바로 이어서 볼 수 있습니다."
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <span>계정이 아직 없다면</span>
          <Link
            className="font-medium text-foreground underline"
            href="/sign-up"
          >
            회원가입
          </Link>
          <span>또는</span>
          <Link
            className="font-medium text-foreground underline"
            href="/forgot-password"
          >
            비밀번호 재설정
          </Link>
        </div>
      }
    >
      <CardHeader className="px-0">
        <CardTitle className="text-2xl">로그인</CardTitle>
        <CardDescription>
          인증이 필요한 화면은 로그인 후 접근할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form className="space-y-5" noValidate onSubmit={onSubmit}>
          {verificationNotice ? (
            <div className="rounded-2xl border border-foreground/10 bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              {verificationNotice}
            </div>
          ) : null}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">이메일</FieldLabel>
              <Input
                {...form.register("email")}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                aria-invalid={Boolean(form.formState.errors.email)}
              />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">비밀번호</FieldLabel>
              <Input
                {...form.register("password")}
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="8자 이상"
                aria-invalid={Boolean(form.formState.errors.password)}
              />
              <FieldDescription>
                가입 후 이메일 인증을 완료해야 로그인할 수 있습니다.
              </FieldDescription>
              <FieldError errors={[form.formState.errors.password]} />
            </Field>
          </FieldGroup>

          <FieldError errors={[form.formState.errors.root]} />

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </CardContent>
    </AuthPageShell>
  )
}
