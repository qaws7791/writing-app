"use client";

import * as React from "react";

import { cn } from "@/registry/luma/lib/utils";
import { Button } from "@/registry/luma/ui/button";
import { Checkbox } from "@/registry/luma/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/registry/luma/ui/field";
import { Input } from "@/registry/luma/ui/input";

/**
 * Split login: brand atmosphere on one side, credentials on the other.
 * Use when the product identity should lead before the form.
 */
export function LoginSplit({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="login-split"
      className={cn("@container min-h-svh w-full bg-background", className)}
      {...props}
    >
      <div className="grid min-h-svh w-full @[56rem]:grid-cols-2">
        <aside className="relative hidden overflow-hidden @[56rem]:flex @[56rem]:flex-col @[56rem]:justify-between @[56rem]:p-12">
          <div
            className="absolute inset-0 bg-[radial-gradient(120%_90%_at_12%_8%,oklch(0.42_0.04_75)_0%,oklch(0.28_0.02_70)_48%,oklch(0.18_0.015_65)_100%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 opacity-[0.18]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(135deg, transparent 40%, oklch(0.92 0.02 85 / 0.35) 41%, transparent 42%), linear-gradient(0deg, transparent 70%, oklch(0.92 0.02 85 / 0.12))",
            }}
          />
          <div className="relative">
            <p className="font-heading text-4xl font-semibold tracking-[-0.05em] text-background">
              Luma
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-background/70">
              콘텐츠가 전경을 차지하는 작업 공간
            </p>
          </div>
          <blockquote className="relative max-w-sm">
            <p className="font-heading text-2xl leading-snug font-medium tracking-[-0.03em] text-balance text-background">
              인터페이스는 콘텐츠보다 앞서지 않는다.
            </p>
            <footer className="mt-5 text-sm text-background/55">Luma Design Language</footer>
          </blockquote>
        </aside>

        <main className="flex flex-col justify-center px-6 py-12 sm:px-10 @[56rem]:px-16">
          <div className="mx-auto w-full max-w-[22.5rem]">
            <div className="mb-10 @[56rem]:hidden">
              <p className="font-heading text-3xl font-semibold tracking-[-0.05em]">Luma</p>
            </div>

            <header className="mb-8">
              <h1 className="font-heading text-2xl font-semibold tracking-[-0.03em]">로그인</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                팀에 이어 작업을 계속하세요.
              </p>
            </header>

            <form className="flex flex-col gap-6" onSubmit={(event) => event.preventDefault()}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="login-split-email">이메일</FieldLabel>
                  <Input
                    id="login-split-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@studio.kr"
                    required
                  />
                </Field>
                <Field>
                  <div className="flex items-baseline justify-between gap-3">
                    <FieldLabel htmlFor="login-split-password">비밀번호</FieldLabel>
                    <a
                      href="#forgot"
                      className="text-xs text-muted-foreground underline decoration-foreground/20 underline-offset-[0.3em] hover:text-foreground hover:decoration-foreground/60"
                    >
                      비밀번호 찾기
                    </a>
                  </div>
                  <Input
                    id="login-split-password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </Field>
                <Field orientation="horizontal">
                  <Checkbox id="login-split-remember" />
                  <FieldLabel htmlFor="login-split-remember" className="font-normal">
                    이 기기에서 로그인 유지
                  </FieldLabel>
                </Field>
              </FieldGroup>

              <Button type="submit" size="lg" className="w-full">
                로그인
              </Button>

              <FieldSeparator>또는</FieldSeparator>

              <Button type="button" variant="outline" size="lg" className="w-full">
                Google로 계속
              </Button>

              <FieldDescription className="text-center">
                계정이 없나요?{" "}
                <a href="#signup" className="text-foreground">
                  회원가입
                </a>
              </FieldDescription>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default LoginSplit;
