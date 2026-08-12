import {
  adminCourseEditorDocumentSchema,
  adminCourseEditorWriteDocumentSchema,
} from "@workspace/contracts/content/admin-courses"
import type { Page } from "@playwright/test"

import {
  adminWebOrigin,
  createLearnerSession,
  learnerWebOrigin,
  loginAdmin,
  loginLearner,
} from "#e2e/auth"
import {
  createE2eAdminContentFixture,
  e2eAdminContentCourseTitle,
  e2eAdminContentReadingTitle,
} from "#e2e/admin-content-fixture"
import { e2eLearnerActors } from "#e2e/runtime"
import { expect, observeBrowserContext, test } from "#e2e/test"

test("학습자가 로그인해 서버가 확정한 레슨 완료를 다시 조회한다", async ({
  page,
}) => {
  await loginLearner(page)
  await page.getByRole("link", { name: /E2E 상태 전이 코스/ }).click()
  await page.getByRole("link", { name: "학습 시작하기" }).click()
  await page.getByRole("button", { name: "시작하기" }).click()

  await page.getByRole("radio", { name: "클라이언트가 채점한다" }).click()
  await page.getByRole("button", { name: "확인하기" }).click()
  await page.getByRole("button", { name: "계속하기" }).click()
  await page.getByRole("radio", { name: "서버가 채점한다" }).click()
  await page.getByRole("button", { name: "확인하기" }).click()
  await page.getByRole("button", { name: "다음으로", exact: true }).click()
  await page.getByRole("radio", { name: "서버가 상태를 계산한다" }).click()
  await page.getByRole("button", { name: "확인하기" }).click()
  await page.getByRole("button", { name: "다음으로", exact: true }).click()

  const completionHeading = page.getByRole("heading", {
    name: "레슨을 완료했어요!",
  })
  await expect(completionHeading).toBeVisible()

  await page.reload()

  await expect(completionHeading).toBeVisible()
})

test("관리자 사이드바 이동 중 현재 본문을 유지한다", async ({ page }) => {
  await loginAdmin(page, "owner@example.test", { nextPath: "/courses" })

  await expectAdminNavigationToKeepContent(page, {
    linkName: "사용자 관리",
    sourceHeading: "콘텐츠 관리",
    sourcePath: "/courses",
    targetHeading: "사용자 관리",
    targetPath: "/users",
  })

  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" })
  await page.setViewportSize({ height: 844, width: 390 })
  await expect(page.locator("html")).toHaveClass(/dark/u)
  await page.getByRole("button", { name: "메뉴 열기" }).click()
  const mobileSidebar = page.getByRole("dialog", { name: "어드민 메뉴" })
  await expect(mobileSidebar).toBeVisible()

  await expectAdminNavigationToKeepContent(page, {
    linkName: "콘텐츠 관리",
    sourcePath: "/users",
    targetHeading: "콘텐츠 관리",
    targetPath: "/courses",
  })

  await expect(mobileSidebar).toBeHidden()
})

test("관리자가 발행한 코스를 별도 학습자가 읽는다", async ({
  browser,
  e2eClientHeaders,
  page,
}) => {
  await loginAdmin(page, "owner@example.test", { nextPath: "/courses" })
  await page.getByRole("button", { name: "새 강의" }).click()
  const courseId = readCreatedCourseId(
    await page
      .getByRole("link", { exact: true, name: "새 강의" })
      .last()
      .getAttribute("href")
  )
  const editorResponse = await page.request.get(
    `${adminWebOrigin}/api/admin/courses/${courseId}/editor`
  )
  expect(editorResponse.status()).toBe(200)
  const editor = adminCourseEditorDocumentSchema.parse(
    await editorResponse.json()
  )
  const saved = await page.request.put(
    `${adminWebOrigin}/api/admin/courses/${courseId}/editor`,
    {
      data: adminCourseEditorWriteDocumentSchema.parse(
        createE2eAdminContentFixture(editor, courseId)
      ),
      headers: {
        "If-Match": `"${editor.editVersion}"`,
        Origin: adminWebOrigin,
      },
    }
  )
  expect(saved.status()).toBe(200)

  await page.goto(`${adminWebOrigin}/courses/${encodeURIComponent(courseId)}`)
  await page.getByRole("button", { name: "초안 발행" }).click()
  await page
    .getByRole("alertdialog", { name: "현재 초안을 발행할까요?" })
    .getByRole("button", { name: "발행하기" })
    .click()
  await expect(page.getByText("리비전 1을 발행했습니다.")).toBeVisible()

  const learnerContext = await browser.newContext({
    extraHTTPHeaders: e2eClientHeaders,
  })
  const diagnostics = observeBrowserContext(learnerContext)
  try {
    await createLearnerSession(learnerContext, {
      email: e2eLearnerActors.releasePublishedActivities.email,
    })
    const learnerPage = await learnerContext.newPage()
    await learnerPage.goto(`${learnerWebOrigin}/app/courses`)
    await learnerPage
      .getByRole("link", { name: new RegExp(e2eAdminContentCourseTitle, "u") })
      .click()
    await learnerPage.getByRole("link", { name: "학습 시작하기" }).click()
    await learnerPage.getByRole("button", { name: "시작하기" }).click()

    await expect(
      learnerPage.getByRole("heading", { name: e2eAdminContentReadingTitle })
    ).toBeVisible()
    await expect(
      learnerPage.getByText("관리자가 발행한 본문입니다.")
    ).toBeVisible()
    diagnostics.expectNoIssues()
  } finally {
    await learnerContext.close()
  }
})

async function expectAdminNavigationToKeepContent(
  page: Page,
  options: Readonly<{
    linkName: string
    sourceHeading?: string
    sourcePath: string
    targetHeading: string
    targetPath: string
  }>
): Promise<void> {
  let releaseRequest = () => {}
  const requestGate = new Promise<void>((resolve) => {
    releaseRequest = resolve
  })
  await page.route(
    (url) =>
      url.pathname === options.targetPath && url.searchParams.has("_rsc"),
    async (route) => {
      await requestGate
      await route.continue()
    },
    { times: 1 }
  )

  const targetLink = page.getByRole("link", { name: options.linkName })
  await targetLink.click({ noWaitAfter: true })

  try {
    await page.waitForTimeout(350)
    await expect(page).toHaveURL(`${adminWebOrigin}${options.sourcePath}`)
    if (options.sourceHeading !== undefined) {
      await expect(
        page.getByRole("heading", { name: options.sourceHeading })
      ).toBeVisible()
    }
    await expect(targetLink.getByText("이동 중", { exact: true })).toHaveCSS(
      "opacity",
      "1"
    )
  } finally {
    releaseRequest()
  }

  await expect(page).toHaveURL(`${adminWebOrigin}${options.targetPath}`)
  await expect(
    page.getByRole("heading", { name: options.targetHeading })
  ).toBeVisible()
}

function readCreatedCourseId(href: string | null): string {
  const match = href?.match(/^\/courses\/([^/?#]+)$/u)
  if (match?.[1] === undefined) {
    throw new Error("생성된 코스 링크에서 course ID를 읽을 수 없습니다.")
  }
  return decodeURIComponent(match[1])
}
