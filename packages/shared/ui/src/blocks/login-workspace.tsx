"use client"

import * as React from "react"

import { cn } from "#ui/lib/utils"
import { Button } from "#ui/components/primitives/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "#ui/components/primitives/field"
import { Input } from "#ui/components/primitives/input"

/**
 * Workspace / SSO login for B2B products.
 * Use when organization context comes before personal credentials.
 */
export function LoginWorkspace({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [mode, setMode] = React.useState<"workspace" | "sso">("workspace")

  return (
    <div
      data-slot="login-workspace"
      className={cn("@container min-h-svh w-full", className)}
      {...props}
    >
      <div className="grid min-h-svh w-full @[56rem]:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-r bg-surface @[56rem]:block">
          <div
            className="absolute inset-0 bg-[radial-gradient(90%_70%_at_0%_0%,oklch(0.9_0.03_145_/_0.55)_0%,transparent_55%),radial-gradient(70%_60%_at_100%_100%,oklch(0.88_0.02_75_/_0.4)_0%,transparent_50%)]"
            aria-hidden="true"
          />
          <div className="relative flex h-full flex-col justify-between p-12">
            <p className="font-heading text-3xl font-semibold tracking-[-0.05em]">
              Luma
            </p>
            <div className="max-w-md">
              <p className="font-heading text-3xl leading-snug font-semibold tracking-[-0.04em] text-balance">
                팀 워크스페이스로 바로 들어가세요.
              </p>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                조직 도메인과 SSO를 먼저 확인한 뒤, 구성원 계정으로 이어집니다.
                개인 비밀번호보다 회사 정책을 앞세웁니다.
              </p>
              <dl className="mt-10 grid gap-5 text-sm">
                <div>
                  <dt className="font-medium tracking-[-0.01em]">
                    단일 로그인
                  </dt>
                  <dd className="mt-1 text-muted-foreground">
                    Okta, Google Workspace, Azure AD
                  </dd>
                </div>
                <div>
                  <dt className="font-medium tracking-[-0.01em]">
                    역할 기반 접근
                  </dt>
                  <dd className="mt-1 text-muted-foreground">
                    편집자, 검토자, 관리자 권한 유지
                  </dd>
                </div>
              </dl>
            </div>
            <p className="text-xs tracking-[0.04em] text-muted-foreground uppercase">
              Enterprise access
            </p>
          </div>
        </section>

        <main className="flex flex-col justify-center bg-background px-6 py-14 sm:px-10 @[56rem]:px-16">
          <div className="mx-auto w-full max-w-[23rem]">
            <div className="mb-8 @[56rem]:hidden">
              <p className="font-heading text-3xl font-semibold tracking-[-0.05em]">
                Luma
              </p>
            </div>

            <header className="mb-8">
              <h1 className="font-heading text-2xl font-semibold tracking-[-0.03em]">
                워크스페이스 로그인
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                조직 URL 또는 회사 이메일로 시작하세요.
              </p>
            </header>

            <div
              role="tablist"
              aria-label="로그인 방식"
              className="mb-7 grid grid-cols-2 gap-1 rounded-2xl border border-border/70 bg-muted/40 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "workspace"}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  mode === "workspace"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setMode("workspace")}
              >
                워크스페이스
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "sso"}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  mode === "sso"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setMode("sso")}
              >
                SSO
              </button>
            </div>

            {mode === "workspace" ? (
              <form
                className="flex flex-col gap-6"
                onSubmit={(event) => event.preventDefault()}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="login-workspace-slug">
                      워크스페이스 URL
                    </FieldLabel>
                    <div className="flex items-center gap-2">
                      <Input
                        id="login-workspace-slug"
                        name="workspace"
                        autoComplete="organization"
                        placeholder="acme"
                        className="flex-1"
                        required
                      />
                      <span className="shrink-0 text-sm text-muted-foreground">
                        .luma.app
                      </span>
                    </div>
                    <FieldDescription>
                      관리자에게 받은 팀 주소를 입력하세요.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
                <Button type="submit" size="lg" className="w-full">
                  워크스페이스 열기
                </Button>
              </form>
            ) : (
              <form
                className="flex flex-col gap-6"
                onSubmit={(event) => event.preventDefault()}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="login-workspace-sso-email">
                      회사 이메일
                    </FieldLabel>
                    <Input
                      id="login-workspace-sso-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      required
                    />
                    <FieldDescription>
                      등록된 도메인이면 회사 IdP로 이동합니다.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
                <Button type="submit" size="lg" className="w-full">
                  SSO로 계속
                </Button>
              </form>
            )}

            <FieldSeparator className="my-7">또는</FieldSeparator>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
            >
              개인 계정으로 로그인
            </Button>

            <FieldDescription className="mt-6 text-center">
              새 조직을 만드나요?{" "}
              <a href="#create-workspace" className="text-foreground">
                워크스페이스 생성
              </a>
            </FieldDescription>
          </div>
        </main>
      </div>
    </div>
  )
}

export default LoginWorkspace
