import { createLearnerSession, learnerWebOrigin, loginAdmin } from "#e2e/auth"
import { expect, observeBrowserContext, test } from "#e2e/test"
import { e2eCredentials, e2eLearnerActors } from "#e2e/runtime"

test("학습자가 실제 provider fixture로 핵심 레슨을 완료한다", async ({
  page,
}) => {
  await createLearnerSession(page.context(), {
    email: e2eLearnerActors.releaseProviderLesson.email,
    password: e2eCredentials.learnerPassword,
  })
  await page.goto(`${learnerWebOrigin}/app/courses`)
  await page.getByRole("link", { name: /E2E 상태 전이 코스/ }).click()
  await page.getByRole("link", { name: "학습 시작하기" }).click()
  const firstLessonStartButton = page.getByRole("button", {
    name: "시작하기",
  })
  await expect(firstLessonStartButton).toBeEnabled()
  await firstLessonStartButton.click()

  await page.getByRole("radio", { name: "클라이언트가 채점한다" }).click()
  await page.getByRole("button", { name: "확인하기" }).click()
  await expect(page.getByText("다시 확인해보세요")).toBeVisible()
  await page.getByRole("button", { name: "계속하기" }).click()
  await page.getByRole("radio", { name: "서버가 채점한다" }).click()
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
  await expect(
    page.getByRole("heading", { name: "레슨을 완료했어요!" })
  ).toBeVisible()
})

test("독립 seeded 학습자가 프로필을 수정하고 로그아웃한다", async ({
  page,
}) => {
  await createLearnerSession(page.context(), {
    email: e2eLearnerActors.releaseProfile.email,
    password: e2eCredentials.learnerPassword,
  })
  await page.goto(`${learnerWebOrigin}/app/profile`)
  await expect(
    page.getByRole("heading", { name: e2eLearnerActors.releaseProfile.name })
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
  await protectedPage.goto(`${learnerWebOrigin}/app/profile`)
  await expect(protectedPage).toHaveURL(
    `${learnerWebOrigin}/login?next=%2Fapp%2Fprofile`
  )
})

test("owner 관리자의 삭제 처리가 학습자 세션을 폐기한다", async ({
  browser,
  e2eClientHeaders,
}) => {
  const learnerContext = await browser.newContext({
    extraHTTPHeaders: e2eClientHeaders,
  })
  const learnerDiagnostics = observeBrowserContext(learnerContext)
  await createLearnerSession(learnerContext, {
    email: e2eLearnerActors.releaseDeletion.email,
    password: e2eCredentials.learnerPassword,
  })
  const activeProfile = await learnerContext.request.get(
    `${learnerWebOrigin}/api/profile`
  )
  expect(activeProfile.status()).toBe(200)

  const adminContext = await browser.newContext({
    extraHTTPHeaders: e2eClientHeaders,
  })
  const adminDiagnostics = observeBrowserContext(adminContext)
  const adminPage = await adminContext.newPage()
  await loginAdmin(adminPage, "owner@example.test", {
    nextPath: "/users",
  })

  const learnerRow = adminPage.getByRole("row", {
    name: e2eLearnerActors.releaseDeletion.email,
  })
  await learnerRow.hover()
  await learnerRow.getByRole("button", { name: "삭제 요청" }).click()
  await adminPage.getByRole("button", { name: "삭제 처리" }).click()
  await expect(adminPage.getByText("삭제 요청을 처리했습니다.")).toBeVisible()

  const revokedProfile = await learnerContext.request.get(
    `${learnerWebOrigin}/api/profile`
  )
  expect(revokedProfile.status()).toBe(401)
  const revokedPage = await learnerContext.newPage()
  await revokedPage.goto(`${learnerWebOrigin}/app/profile`)
  await expect(revokedPage).toHaveURL(
    `${learnerWebOrigin}/login?next=%2Fapp%2Fprofile`
  )

  learnerDiagnostics.expectNoIssues()
  adminDiagnostics.expectNoIssues()
  await learnerContext.close()
  await adminContext.close()
})
