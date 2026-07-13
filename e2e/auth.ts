import type { Page } from "@playwright/test"

export const learnerApiOrigin = "http://127.0.0.1:4100"
export const learnerWebOrigin = "http://127.0.0.1:3100"

export async function loginLearner(
  page: Page,
  nextPath = "/app/courses"
): Promise<void> {
  await page.goto(`${learnerWebOrigin}/login?next=${nextPath}`)
  await Promise.all([
    page.waitForURL(`${learnerWebOrigin}${nextPath}`),
    page.getByRole("button", { name: "테스트 계정으로 계속하기" }).click(),
  ])
}
