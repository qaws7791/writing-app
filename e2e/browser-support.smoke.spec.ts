import type { Page } from "@playwright/test"

import { expect, test } from "#e2e/test"

import {
  adminWebOrigin,
  learnerWebOrigin,
  loginAdmin,
  loginLearner,
} from "#e2e/auth"

test("지원 브라우저에서 공개 화면이 viewport를 넘지 않는다", async ({
  page,
}) => {
  await page.goto(learnerWebOrigin)
  await expect(
    page.getByRole("heading", { name: "생각을 문장으로, 문장을 내 글로." })
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await page.getByRole("contentinfo").scrollIntoViewIfNeeded()
  await expectNoHorizontalOverflow(page)
})

test("학습자 테마 선택이 새로고침 후에도 유지된다", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" })
  await loginLearner(page, "/app/profile")

  const html = page.locator("html")
  await expect(html).toHaveClass(/dark/)
  const lightThemeButton = page.getByRole("button", { name: "라이트" })
  await expect(lightThemeButton).toBeEnabled()
  await lightThemeButton.click()
  await expect(html).toHaveClass(/light/)
  await page.reload()
  await expect(html).toHaveClass(/light/)
  const systemThemeButton = page.getByRole("button", { name: "시스템" })
  await expect(systemThemeButton).toBeEnabled()
  await systemThemeButton.click()
  await expect(html).toHaveClass(/dark/)
})

test("관리자 반응형 navigation으로 콘텐츠 목록에 이동한다", async ({
  isMobile,
  page,
}) => {
  await loginAdmin(page, "owner@example.test")
  await expect(page).toHaveURL(`${adminWebOrigin}/`)

  if (isMobile) {
    await page.getByRole("button", { name: "메뉴 열기" }).click()
    const drawer = page.getByRole("dialog", { name: "어드민 메뉴" })
    await expect(drawer).toBeVisible()
    await drawer.getByRole("link", { name: "콘텐츠 관리" }).click()
  } else {
    await page
      .getByRole("navigation", { name: "어드민 주요 메뉴" })
      .getByRole("link", { name: "콘텐츠 관리" })
      .click()
  }

  await expect(page).toHaveURL(`${adminWebOrigin}/courses`)
  await expect(page.getByRole("table", { name: "코스 목록" })).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test("관리자 분석 필터가 URL과 결과 표에 반영된다", async ({ page }) => {
  await loginAdmin(page, "owner@example.test", {
    nextPath: "/analytics",
  })
  await page.goto(
    `${adminWebOrigin}/analytics?direction=desc&page=1&pageSize=10&query=&sort=dropOff`
  )
  await expect(page).toHaveURL(
    `${adminWebOrigin}/analytics?direction=desc&page=1&pageSize=10&query=&sort=dropOff`
  )
  await expect(
    page.getByRole("heading", { exact: true, name: "분석" })
  ).toBeVisible()
  await expect(
    page.getByRole("table", {
      name: "레슨별 성과",
    })
  ).toBeVisible()

  const lessonAnalyticsFilter = page.getByRole("form", {
    name: "레슨 분석 필터",
  })
  await lessonAnalyticsFilter.getByLabel("레슨 또는 강의 검색").fill("문장")
  await lessonAnalyticsFilter.getByLabel("페이지당 행").selectOption("20")
  await lessonAnalyticsFilter.getByRole("button", { name: "조회" }).click()

  await expect(page).toHaveURL(
    `${adminWebOrigin}/analytics?direction=desc&page=1&sort=dropOff&query=%EB%AC%B8%EC%9E%A5&pageSize=20`
  )
  await expect(
    page.getByRole("table", {
      name: "레슨별 성과",
    })
  ).toBeVisible()
})

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth
      )
    )
    .toBe(true)
}
