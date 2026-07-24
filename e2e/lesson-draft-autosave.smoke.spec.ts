import { expect, test, observeBrowserContext } from "#e2e/test"

import { learnerLessonResponseSchema } from "@workspace/contracts/learning/learner-api"

import { learnerWebOrigin, loginLearner } from "#e2e/auth"

test("서버 초안을 새로고침, 다른 기기, 재로그인 뒤에도 복구한다", async ({
  browser,
  page,
}, testInfo) => {
  test.setTimeout(90_000)
  await loginLearner(page)
  const courseLink = page.getByRole("link", { name: /E2E 초안 복구 코스/ })
  const courseHref = await courseLink.getAttribute("href")
  if (courseHref === null) {
    throw new Error("초안 복구 코스 링크에 이동 경로가 없습니다.")
  }
  await Promise.all([
    page.waitForURL(new URL(courseHref, learnerWebOrigin).toString()),
    courseLink.click(),
  ])
  await page.waitForLoadState("networkidle")
  const startLink = page.getByRole("link", { name: "학습 시작하기" })
  const startHref = await startLink.getAttribute("href")
  if (startHref === null) {
    throw new Error("학습 시작 링크에 이동 경로가 없습니다.")
  }
  await Promise.all([
    page.waitForURL(new URL(startHref, learnerWebOrigin).toString()),
    startLink.click(),
  ])

  const startButton = page.getByRole("button", { name: "시작하기" })
  const answer = page.getByRole("textbox")
  await expect(startButton.or(answer)).toBeVisible()
  if (await startButton.isVisible()) {
    await expect(startButton).toBeEnabled()
    await startButton.click()
  }

  const lessonPath = `${new URL(page.url()).pathname}${new URL(page.url()).search}`
  const firstDraft = `${testInfo.project.name} 새로고침 복구 초안`
  const latestDraft = `${testInfo.project.name} 다른 기기 최신 초안`

  await expect(answer).toBeVisible()
  const firstDraftSaved = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      response.url().includes("/draft") &&
      response.ok()
  )
  await answer.fill(firstDraft)
  await firstDraftSaved
  await expect(page.getByRole("status")).toHaveText("서버에 저장됨")

  await page.reload()
  await expect(page.getByRole("textbox")).toHaveValue(firstDraft)

  const otherDevice = await browser.newContext()
  const otherDeviceDiagnostics = observeBrowserContext(otherDevice)
  const otherDevicePage = await otherDevice.newPage()
  await loginLearner(otherDevicePage, lessonPath)
  await expect(otherDevicePage.getByRole("textbox")).toHaveValue(firstDraft)

  const serverLessonResponse = await otherDevicePage.request.get(
    `${learnerWebOrigin}/api/lessons/e2e-draft-lesson`
  )
  expect(serverLessonResponse.ok()).toBe(true)
  const serverLesson = learnerLessonResponseSchema.parse(
    await serverLessonResponse.json()
  )
  const serverDraft = serverLesson.drafts.find(
    (draft) => draft.stepId === "e2e-draft-lesson-write"
  )
  expect(serverDraft).toBeDefined()

  const latestDraftResponse = await otherDevicePage.request.put(
    `${learnerWebOrigin}/api/learning/lessons/e2e-draft-lesson/steps/e2e-draft-lesson-write/draft`,
    {
      data: {
        answer: { text: latestDraft, type: "WRITE" },
        expectedCurriculumVersionId: serverLesson.version.curriculumVersionId,
        expectedVersion: serverDraft?.version ?? null,
      },
      headers: { Origin: learnerWebOrigin },
    }
  )
  expect(latestDraftResponse.ok()).toBe(true)
  await otherDevice.close()
  otherDeviceDiagnostics.expectNoIssues()

  await page.bringToFront()
  await page.evaluate(() => window.dispatchEvent(new Event("focus")))
  await expect(page.getByRole("textbox")).toHaveValue(latestDraft)

  await page.goto(`${learnerWebOrigin}/app/profile`)
  await page.getByRole("button", { name: "로그아웃" }).click()
  await expect(page).toHaveURL(`${learnerWebOrigin}/`)

  await loginLearner(page, lessonPath)
  await expect(page.getByRole("textbox")).toHaveValue(latestDraft)
})
