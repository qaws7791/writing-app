import { adminCourseEditorDocumentSchema } from "@workspace/contracts/content/admin-courses"
import { adminCourseEditorWriteDocumentSchema } from "@workspace/contracts/content/admin-courses"

import {
  adminWebOrigin,
  learnerWebOrigin,
  loginAdmin,
  loginLearner,
} from "#e2e/auth"
import { createE2eAdminContentFixture } from "#e2e/admin-content-fixture"
import { expect, test } from "#e2e/test"
import { e2eLearnerActors } from "#e2e/runtime"

function readCreatedCourseId(href: string | null): string {
  const match = href?.match(/^\/courses\/([^/?#]+)$/u)
  if (match?.[1] === undefined) {
    throw new Error("생성된 코스 링크에서 course ID를 읽을 수 없습니다.")
  }
  return decodeURIComponent(match[1])
}

test("학습자가 로그인해 핵심 레슨을 완료한다", async ({ page }) => {
  await loginLearner(page)
  await page.getByRole("link", { name: /E2E 상태 전이 코스/ }).click()
  await page.getByRole("link", { name: "학습 시작하기" }).click()
  const startButton = page.getByRole("button", { name: "시작하기" })
  await expect(startButton).toBeEnabled()
  await startButton.click()

  await page.getByRole("button", { name: "서버가 채점한다" }).click()
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

  await expect(
    page.getByRole("heading", { name: "레슨을 완료했어요!" })
  ).toBeVisible()
})

test("작성 중인 서버 초안을 새로고침 뒤 복구한다", async ({ page }) => {
  await loginLearner(page, "/app/lesson?lesson_id=e2e-draft-lesson")
  const startButton = page.getByRole("button", { name: "시작하기" })
  const answer = page.getByRole("textbox")
  await expect(startButton).toBeEnabled()
  await startButton.click()

  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      response.url().includes("/draft") &&
      response.ok()
  )
  await answer.fill("PR 새로고침 복구 초안")
  await answer.blur()
  await saved
  await page.reload()

  await expect(page.getByRole("textbox")).toHaveValue("PR 새로고침 복구 초안")
})

test("owner 관리자가 로그인해 새 코스 초안을 발행한다", async ({ page }) => {
  test.setTimeout(60_000)
  await loginAdmin(page, "owner@example.test", { nextPath: "/courses" })
  await page.getByRole("button", { name: "새 강의" }).click()
  const createdCourseHref = await page
    .getByRole("link", { exact: true, name: "새 강의" })
    .last()
    .getAttribute("href")
  const courseId = readCreatedCourseId(createdCourseHref)
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
        createE2eAdminContentFixture(editor)
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
})

test("owner 관리자가 활성 학습자를 정지한다", async ({ page }) => {
  await loginAdmin(page, "owner@example.test", { nextPath: "/users" })
  const learnerRow = page.getByRole("row", {
    name: e2eLearnerActors.prSuspension.email,
  })
  await learnerRow.hover()
  await learnerRow.getByRole("button", { name: "정지" }).click()
  await page
    .getByRole("alertdialog", { name: "사용자 상태 변경 확인" })
    .getByRole("button", { name: "정지 처리" })
    .click()

  await expect(page.getByText("사용자를 정지했습니다.")).toBeVisible()
  await expect(learnerRow.getByText("정지", { exact: true })).toBeVisible()
})

test("관리자 콘솔은 크롤러 색인을 차단한다", async ({ page }) => {
  const robots = await page.request.get(`${adminWebOrigin}/robots.txt`)
  expect(robots.status()).toBe(200)
  expect(await robots.text()).toContain("Disallow: /")

  await page.goto(`${adminWebOrigin}/login`)
  const robotsMeta = page.locator('head meta[name="robots"]')
  await expect(robotsMeta).toHaveAttribute("content", /noindex/u)
  await expect(robotsMeta).toHaveAttribute("content", /nofollow/u)
})

test("학습자 웹은 공개 화면만 색인하고 metadata origin을 설정에서 읽는다", async ({
  page,
}) => {
  const robots = await page.request.get(`${learnerWebOrigin}/robots.txt`)
  expect(robots.status()).toBe(200)
  const robotsBody = await robots.text()
  expect(robotsBody).toContain("Allow: /")
  expect(robotsBody).toContain("Disallow: /app/")
  expect(robotsBody).toContain("Disallow: /login")
  expect(robotsBody).toContain(`${learnerWebOrigin}/sitemap.xml`)

  const sitemap = await page.request.get(`${learnerWebOrigin}/sitemap.xml`)
  expect(sitemap.status()).toBe(200)
  expect(await sitemap.text()).toContain(`<loc>${learnerWebOrigin}</loc>`)
})
