import type { Page } from "@playwright/test"

import { expect, test } from "#e2e/test"

import {
  adminWebOrigin,
  learnerWebOrigin,
  loginAdmin,
  loginLearner,
} from "#e2e/auth"

test("지원 브라우저에서 학습자 테마와 어드민 반응형 shell이 동작한다", async ({
  isMobile,
  page,
}) => {
  test.setTimeout(75_000)
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto(learnerWebOrigin)
  await expect(
    page.getByRole("heading", { name: "생각을 문장으로, 문장을 내 글로." })
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)

  if (isMobile) {
    const publicHeader = page
      .getByRole("navigation", { name: "공개 주요 메뉴" })
      .locator("..")
    await expect(publicHeader).toHaveCSS("position", "static")
    await page.getByRole("contentinfo").scrollIntoViewIfNeeded()
    await expectNoHorizontalOverflow(page)
    await expect(publicHeader).not.toBeInViewport()
  }

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

  const adminPage = await page.context().newPage()
  await loginAdmin(adminPage, "owner@example.test")
  await expect(adminPage).toHaveURL(`${adminWebOrigin}/`)

  if (isMobile) {
    await adminPage.getByRole("button", { name: "메뉴 열기" }).click()
    const drawer = adminPage.getByRole("dialog", { name: "어드민 메뉴" })

    await expect(drawer).toBeVisible()
    await drawer.getByRole("link", { name: "사용자 관리" }).click()
    const activeLearnerRow = adminPage.getByRole("row", {
      name: /learner@example\.com/,
    })
    await activeLearnerRow.hover()
    adminPage.once("dialog", (dialog) => dialog.accept())
    await activeLearnerRow.getByRole("button", { name: "정지" }).click()
    await expect(adminPage.getByText("사용자를 정지했습니다.")).toBeVisible()

    await adminPage.reload()
    const suspendedLearnerRow = adminPage.getByRole("row", {
      name: /learner@example\.com/,
    })
    await suspendedLearnerRow.hover()
    adminPage.once("dialog", (dialog) => dialog.accept())
    await suspendedLearnerRow.getByRole("button", { name: "활성화" }).click()
    await expect(adminPage.getByText("사용자를 활성화했습니다.")).toBeVisible()

    await adminPage.reload()
    const restoredLearnerRow = adminPage.getByRole("row", {
      name: /learner@example\.com/,
    })
    await restoredLearnerRow.hover()
    await expect(
      restoredLearnerRow.getByRole("button", { name: "정지" })
    ).toBeVisible()

    await adminPage.getByRole("button", { name: "메뉴 열기" }).click()
    const restoredDrawer = adminPage.getByRole("dialog", {
      name: "어드민 메뉴",
    })
    await expect(restoredDrawer).toBeVisible()
    await restoredDrawer.getByRole("link", { name: "콘텐츠 관리" }).click()
  } else {
    await adminPage
      .getByRole("navigation", { name: "어드민 주요 메뉴" })
      .getByRole("link", { name: "콘텐츠 관리" })
      .click()
  }

  await expect(adminPage).toHaveURL(`${adminWebOrigin}/courses`)
  await expect(
    adminPage.getByRole("table", { name: "코스 목록" })
  ).toBeVisible()
  await expect(adminPage.locator('[data-slot="table-container"]')).toHaveCSS(
    "overflow-x",
    "auto"
  )

  if (isMobile) {
    await adminPage.getByRole("button", { name: "메뉴 열기" }).click()
  }
  const themeControls = isMobile
    ? adminPage
        .getByRole("dialog", { name: "어드민 메뉴" })
        .getByRole("group", { name: "화면 테마" })
    : adminPage
        .getByRole("complementary")
        .getByRole("group", { name: "화면 테마" })

  const adminDarkThemeButton = themeControls.getByRole("button", {
    name: "다크",
  })
  await expect(adminDarkThemeButton).toBeEnabled()
  await adminDarkThemeButton.click()
  await expect(adminPage.locator("html")).toHaveClass(/dark/)

  await adminPage.goto(
    `${adminWebOrigin}/analytics?direction=desc&page=1&pageSize=10&query=&sort=dropOff`
  )
  await expect(
    adminPage.getByRole("heading", { exact: true, name: "분석" })
  ).toBeVisible()
  const lessonAnalyticsTable = adminPage.getByRole("table", {
    name: "레슨별 성과",
  })
  await expect(lessonAnalyticsTable).toBeVisible()
  const lessonAnalyticsTableContainer = lessonAnalyticsTable.locator("..")
  await expect(lessonAnalyticsTableContainer).toHaveAttribute(
    "data-slot",
    "lesson-analytics-table-container"
  )
  await expect(lessonAnalyticsTableContainer).toHaveCSS("overflow-x", "auto")
  await expect(adminPage.locator("html")).toHaveClass(/dark/)

  const lessonAnalyticsFilter = adminPage.getByRole("form", {
    name: "레슨 분석 필터",
  })
  await lessonAnalyticsFilter.getByLabel("레슨 또는 강의 검색").fill("문장")
  await lessonAnalyticsFilter.getByLabel("페이지당 행").selectOption("20")
  await lessonAnalyticsFilter.getByRole("button", { name: "조회" }).click()
  await expect(adminPage).toHaveURL(
    `${adminWebOrigin}/analytics?direction=desc&page=1&sort=dropOff&query=%EB%AC%B8%EC%9E%A5&pageSize=20`
  )
  await expect(
    adminPage.getByRole("table", { name: "레슨별 성과" })
  ).toBeVisible()
  await adminPage.close()

  if (isMobile) {
    await loginLearner(page, "/app/courses")
  } else {
    await page.goto(`${learnerWebOrigin}/app/courses`)
  }
  await expect(
    page.getByRole("heading", { name: "무엇을 써볼까요?" })
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
