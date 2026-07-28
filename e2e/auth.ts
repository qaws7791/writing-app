import { readFile } from "node:fs/promises"
import path from "node:path"

import { expect, type Page } from "@playwright/test"
import { e2eRuntime, readRequiredE2eEnvironment } from "#e2e/runtime"

export const learnerWebOrigin = e2eRuntime.learnerOrigin
export const adminWebOrigin = e2eRuntime.adminOrigin

const adminPassword = "e2e-password-123"
const learnerEmail = "learner@example.com"
const learnerPassword = "e2e-password-123"

export async function loginAdmin(
  page: Page,
  email: string,
  { nextPath = "/" }: { readonly nextPath?: string } = {}
): Promise<void> {
  await page.goto(
    nextPath === "/"
      ? `${adminWebOrigin}/login`
      : `${adminWebOrigin}${nextPath}`
  )
  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호", { exact: true }).fill(adminPassword)
  const loginButton = page.getByRole("button", { name: "로그인" })
  await expect(loginButton).toBeEnabled()
  const [loginResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith("/api/admin/auth/sign-in/email")
    ),
    loginButton.click(),
  ])
  expect(loginResponse.status()).toBe(200)
  await expect(page).toHaveURL(`${adminWebOrigin}${nextPath}`)
  await waitForSettledFrames(page)
}

export async function loginLearner(
  page: Page,
  nextPath = "/app/courses"
): Promise<void> {
  await page.goto(`${learnerWebOrigin}/login?next=${nextPath}`, {
    waitUntil: "networkidle",
  })
  await page.getByLabel("이메일").fill(learnerEmail)
  await page.getByLabel("비밀번호", { exact: true }).fill(learnerPassword)
  const loginButton = page.getByRole("button", {
    name: "이메일로 로그인하기",
  })
  await expect(loginButton).toBeEnabled()
  const [loginResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith("/api/auth/sign-in/email")
    ),
    loginButton.click(),
  ])
  expect(loginResponse.status()).toBe(200)
  await expect(page).toHaveURL(`${learnerWebOrigin}${nextPath}`)
  await page.waitForLoadState("networkidle")
  await waitForSettledFrames(page)
}

async function waitForSettledFrames(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
  )
}

export async function readLatestAuthEmail(): Promise<
  Readonly<{
    callbackUrl: string
    kind: "password-reset" | "verification"
  }>
> {
  const mailboxPath = path.join(
    path.resolve(readRequiredE2eEnvironment("E2E_RUN_ROOT")),
    "auth-email.json"
  )
  const parsed: unknown = JSON.parse(await readFile(mailboxPath, "utf8"))

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("callbackUrl" in parsed) ||
    typeof parsed.callbackUrl !== "string" ||
    !("kind" in parsed) ||
    (parsed.kind !== "password-reset" && parsed.kind !== "verification")
  ) {
    throw new Error("E2E 인증 메일 기록 형식이 올바르지 않습니다.")
  }

  return {
    callbackUrl: parsed.callbackUrl,
    kind: parsed.kind,
  }
}
