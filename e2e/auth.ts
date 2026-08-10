import { expect, type BrowserContext, type Page } from "@playwright/test"
import { e2eCredentials, e2eRuntime } from "#e2e/runtime"

export const learnerWebOrigin = e2eRuntime.learnerOrigin
export const adminWebOrigin = e2eRuntime.adminOrigin

const { adminPassword, learnerEmail, learnerPassword } = e2eCredentials

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
  await page.goto(`${learnerWebOrigin}/login?next=${nextPath}`)
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
  await waitForSettledFrames(page)
}

export async function createLearnerSession(
  context: BrowserContext,
  credentials: Readonly<{
    email?: string
    password?: string
  }> = {}
): Promise<void> {
  const response = await context.request.post(
    `${learnerWebOrigin}/api/auth/sign-in/email`,
    {
      data: {
        callbackURL: `${learnerWebOrigin}/app/courses`,
        email: credentials.email ?? learnerEmail,
        password: credentials.password ?? learnerPassword,
      },
    }
  )

  expect(response.status()).toBe(200)
}

async function waitForSettledFrames(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
  )
}
