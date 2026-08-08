"use client";

import * as React from "react";

import { cn } from "@/registry/luma/lib/utils";
import { Button } from "@/registry/luma/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/registry/luma/ui/field";
import { Input } from "@/registry/luma/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/registry/luma/ui/input-otp";

/**
 * Passwordless login: email first, then one-time code.
 * Use when reducing password friction is the primary auth strategy.
 */
export function LoginOtp({ className, ...props }: React.ComponentProps<"div">) {
  const [step, setStep] = React.useState<"email" | "code">("email");
  const [email, setEmail] = React.useState("you@studio.kr");
  const codeInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (step === "code") codeInputRef.current?.focus();
  }, [step]);

  return (
    <div
      data-slot="login-otp"
      className={cn(
        "relative flex min-h-svh w-full items-center justify-center bg-background",
        className,
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[42vh] bg-[linear-gradient(180deg,oklch(0.93_0.02_145_/_0.55)_0%,transparent_100%)] dark:bg-[linear-gradient(180deg,oklch(0.28_0.02_145_/_0.35)_0%,transparent_100%)]"
        aria-hidden="true"
      />

      <main className="relative w-full max-w-[23rem] px-6 py-16">
        <header className="mb-10">
          <p className="font-heading text-3xl font-semibold tracking-[-0.05em]">Luma</p>
          <h1 className="mt-8 font-heading text-2xl font-semibold tracking-[-0.03em]">
            {step === "email" ? "이메일로 시작" : "코드 확인"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-pretty text-muted-foreground">
            {step === "email"
              ? "비밀번호 없이 로그인 코드를 보내 드립니다."
              : `${email}으로 보낸 6자리 코드를 입력하세요.`}
          </p>
        </header>

        {step === "email" ? (
          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const nextEmail = String(data.get("email") ?? "").trim();
              if (nextEmail) setEmail(nextEmail);
              setStep("code");
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="login-otp-email">업무용 이메일</FieldLabel>
                <Input
                  id="login-otp-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={email}
                  placeholder="you@studio.kr"
                  required
                />
                <FieldDescription>
                  회사 도메인 계정이면 SSO로 이어서 진행할 수 있습니다.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <Button type="submit" size="lg" className="w-full">
              코드 보내기
            </Button>

            <FieldDescription className="text-center">
              비밀번호로 로그인하려면{" "}
              <a href="#password" className="text-foreground">
                여기를 누르세요
              </a>
              .
            </FieldDescription>
          </form>
        ) : (
          <form className="flex flex-col gap-6" onSubmit={(event) => event.preventDefault()}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="login-otp-code">일회용 코드</FieldLabel>
                <InputOTP ref={codeInputRef} maxLength={6} id="login-otp-code">
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <FieldDescription>코드는 10분 후 만료됩니다.</FieldDescription>
              </Field>
            </FieldGroup>

            <Button type="submit" size="lg" className="w-full">
              로그인
            </Button>

            <div className="flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                className="text-muted-foreground underline decoration-foreground/20 underline-offset-[0.3em] hover:text-foreground"
                onClick={() => setStep("email")}
              >
                이메일 변경
              </button>
              <button
                type="button"
                className="text-muted-foreground underline decoration-foreground/20 underline-offset-[0.3em] hover:text-foreground"
              >
                코드 다시 보내기
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default LoginOtp;
