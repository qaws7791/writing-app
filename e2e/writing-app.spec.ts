import { learnerWebOrigin, loginAdmin, loginLearner } from "#e2e/auth"
import { installAiFeedbackFailures } from "#e2e/ai-feedback-fixture"
import { expect, observeBrowserContext, test } from "#e2e/test"

test("학습자가 AI retry·quota 뒤 프로필 이름을 수정하고 로그아웃한다", async ({
  page,
}) => {
  test.setTimeout(120_000)
  await loginLearner(page)
  await page.getByRole("link", { name: /E2E 상태 전이 코스/ }).click()
  await page.waitForLoadState("networkidle")
  await page.getByRole("link", { name: "학습 시작하기" }).click()
  const firstLessonStartButton = page.getByRole("button", {
    name: "시작하기",
  })
  await expect(firstLessonStartButton).toBeEnabled()
  await firstLessonStartButton.click()

  await page.getByRole("button", { name: "클라이언트가 채점한다" }).click()
  await page.getByRole("button", { name: "확인하기" }).click()
  await expect(page.getByText("다시 확인해보세요")).toBeVisible()
  await page.getByRole("button", { name: "계속하기" }).click()
  await page.getByRole("button", { name: "서버가 채점한다" }).click()
  await page.getByRole("button", { name: "확인하기" }).click()
  await expect(page.getByText("완벽해요!")).toBeVisible()
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
  await page.getByRole("button", { name: "다음 레슨" }).click()

  const nextLessonStartButton = page.getByRole("button", { name: "시작하기" })
  await expect(nextLessonStartButton).toBeEnabled()
  await nextLessonStartButton.click()
  await page.getByRole("textbox").fill("AI 코칭 실패 뒤에도 학습을 계속합니다.")
  await page.getByRole("button", { name: "확인하기" }).click()
  await page.getByRole("button", { name: "계속하기" }).click()
  await installAiFeedbackFailures(page, ["provider", "quota"])

  await page.getByRole("button", { name: "AI 코칭 받기" }).click()
  await expect(
    page.getByRole("alert").getByText("AI 코칭을 잠시 불러오지 못했습니다.")
  ).toBeVisible()
  await page.getByRole("button", { name: "AI 코칭 다시 시도" }).click()
  await expect(
    page
      .getByRole("alert")
      .getByText("오늘의 AI 코칭 요청 한도를 모두 사용했습니다.")
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "AI 코칭 다시 시도" })
  ).toHaveCount(0)
  await page.getByRole("button", { name: "피드백 없이 계속하기" }).click()
  await page.getByRole("button", { name: "다음으로 →", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "레슨을 완료했어요!" })
  ).toBeVisible()

  const completedProgressResponse = await page.request.get(
    `${learnerWebOrigin}/api/progress?status=completed`
  )
  expect(completedProgressResponse.status()).toBe(200)
  await expect(completedProgressResponse.json()).resolves.toMatchObject({
    items: expect.arrayContaining([
      expect.objectContaining({ id: "e2e-transition-course" }),
    ]),
  })

  await page.evaluate((profileUrl) => {
    window.location.assign(profileUrl)
  }, `${learnerWebOrigin}/app/profile`)
  await page.waitForURL(`${learnerWebOrigin}/app/profile`)
  await expect(
    page.getByRole("heading", { name: "글쓰기 탐험가" })
  ).toBeVisible()
  await page.getByRole("button", { name: "표시 이름 수정" }).click()
  await page.getByLabel("표시 이름", { exact: true }).fill("릴리스 학습자")
  await page.getByRole("button", { name: "이름 저장" }).click()
  await expect(
    page.getByRole("heading", { name: "릴리스 학습자" })
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "릴리스 학습자" })
  ).toBeVisible()

  await page.getByRole("button", { name: "로그아웃" }).click()
  await expect(page).toHaveURL(`${learnerWebOrigin}/`)
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "생각을 문장으로"
  )
  const protectedPage = await page.context().newPage()
  await protectedPage.goto(
    `${learnerWebOrigin}/app/courses/e2e-transition-course`
  )
  await expect(protectedPage).toHaveURL(
    `${learnerWebOrigin}/login?next=%2Fapp%2Fcourses%2Fe2e-transition-course`
  )
})

test("owner 관리자의 삭제 처리가 학습자 세션을 폐기한다", async ({
  browser,
}) => {
  const learnerContext = await browser.newContext()
  const learnerDiagnostics = observeBrowserContext(learnerContext)
  const learnerPage = await learnerContext.newPage()
  await loginLearner(learnerPage, "/app/profile")

  const adminContext = await browser.newContext()
  const adminDiagnostics = observeBrowserContext(adminContext)
  const adminPage = await adminContext.newPage()
  await loginAdmin(adminPage, "owner@example.test", {
    nextPath: "/users",
  })

  const learnerRow = adminPage.getByRole("row", {
    name: /learner@example.com/,
  })
  await learnerRow.hover()
  await learnerRow.getByRole("button", { name: "삭제 요청" }).click()
  await adminPage.getByRole("button", { name: "삭제 처리" }).click()
  await expect(adminPage.getByText("삭제 요청을 처리했습니다.")).toBeVisible()

  const revokedProfile = await learnerPage.request.get(
    `${learnerWebOrigin}/api/profile`
  )
  expect(revokedProfile.status()).toBe(401)
  const revokedPage = await learnerContext.newPage()
  await revokedPage.goto(`${learnerWebOrigin}/app/profile`)
  await expect(revokedPage).toHaveURL(
    `${learnerWebOrigin}/login?next=%2Fapp%2Fprofile`
  )

  await learnerContext.close()
  await adminContext.close()
  learnerDiagnostics.expectNoIssues()
  adminDiagnostics.expectNoIssues()
})
