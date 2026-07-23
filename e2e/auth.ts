import type { Page } from "@playwright/test"

export const learnerWebOrigin = "http://localhost:3100"

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
