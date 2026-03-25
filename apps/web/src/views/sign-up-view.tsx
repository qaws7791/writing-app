"use client"

import Link from "next/link"

import { useSignUp } from "@/features/auth/hooks/use-sign-up"
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

export default function SignUpView() {
  const { form, onSubmit, submittedEmail } = useSignUp()

  return (
    <AuthPageShell
      title="계정을 만들고 축적하기"
      description="가입 후 이메일 인증을 마치면 글감 저장과 초안 작성 이력이 계정에 연결됩니다."
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <span>이미 계정이 있다면</span>
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
        <CardTitle className="text-2xl">회원가입</CardTitle>
        <CardDescription>
          가입 직후에는 인증 메일을 확인해야 로그인할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {submittedEmail ? (
          <div className="space-y-3 rounded-[1.5rem] border border-foreground/10 bg-muted/60 p-5">
            <p className="text-lg font-semibold">인증 메일을 보냈습니다.</p>
            <p className="text-sm leading-7 text-muted-foreground">
              <strong className="text-foreground">{submittedEmail}</strong>로
              전송된 링크를 열어 인증을 완료한 뒤 로그인해 주세요. 개발
              환경에서는 API 로그 또는 테스트용 메일 조회 경로로 링크를 확인할
              수 있습니다.
            </p>
            <Link
              href="/sign-in"
              className="inline-flex text-sm font-medium text-foreground underline"
            >
              로그인 화면으로 이동
            </Link>
          </div>
        ) : (
          <form className="space-y-5" noValidate onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">이름</FieldLabel>
                <Input
                  {...form.register("name")}
                  id="name"
                  autoComplete="name"
                  placeholder="필명 또는 이름"
                  aria-invalid={Boolean(form.formState.errors.name)}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>
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
                  autoComplete="new-password"
                  placeholder="8자 이상"
                  aria-invalid={Boolean(form.formState.errors.password)}
                />
                <FieldDescription>
                  검증 메일을 열어야 가입이 활성화됩니다.
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
              {form.formState.isSubmitting
                ? "계정 생성 중..."
                : "인증 메일 보내기"}
            </Button>
          </form>
        )}
      </CardContent>
    </AuthPageShell>
  )
}
