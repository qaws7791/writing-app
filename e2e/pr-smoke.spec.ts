import {
  adminCourseEditorDocumentSchema,
  adminCourseEditorWriteDocumentSchema,
} from "@workspace/contracts/content/admin-courses"

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

  await page.getByRole("radio", { name: "서버가 채점한다" }).click()
  await page.getByRole("button", { name: "확인하기" }).click()
  await page.getByRole("button", { name: "계속하기" }).click()
  await page
    .getByRole("textbox")
    .fill("서버가 모든 학습 상태를 일관되게 계산합니다.")
  await page.getByRole("button", { name: "확인하기" }).click()
  await page.getByRole("button", { name: "계속하기" }).click()
  await page.getByRole("button", { name: "AI 코칭 받기" }).click()
  await expect(
    page.getByText("서버 상태 전이의 장점을 잘 설명했습니다.")
  ).toBeVisible()
  await page.getByRole("button", { name: "다음으로 →", exact: true }).click()

  const completionHeading = page.getByRole("heading", {
    name: "레슨을 완료했어요!",
  })
  await expect(completionHeading).toBeVisible()

  await page.reload()

  await expect(completionHeading).toBeVisible()
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

function readCreatedCourseId(href: string | null): string {
  const match = href?.match(/^\/courses\/([^/?#]+)$/u)
  if (match?.[1] === undefined) {
    throw new Error("생성된 코스 링크에서 course ID를 읽을 수 없습니다.")
  }
  return decodeURIComponent(match[1])
}
