import { expect, test, type Page } from "@playwright/test"
import { readFile } from "node:fs/promises"

import { learnerApiOrigin, learnerWebOrigin, loginLearner } from "#e2e/auth"

const adminWebOrigin = "http://127.0.0.1:3101"
const adminApiOrigin = "http://127.0.0.1:4100"
const adminPassword = "e2e-password-123"

test("학습자가 오답, 정답, AI 코칭을 거쳐 레슨과 코스를 완료한다", async ({
  page,
}) => {
  const diagnostics = observeBrowserDiagnostics(page)
  const googleRequests: string[] = []
  const apiRequests: string[] = []

  page.on("request", (request) => {
    const url = request.url()

    if (/google|gstatic/i.test(url)) {
      googleRequests.push(url)
    }
    if (url.startsWith(learnerApiOrigin)) {
      apiRequests.push(url)
    }
  })

  await loginLearner(page)

  const accountMenuTrigger = page.getByRole("button", { name: "계정 메뉴" })
  await expect(accountMenuTrigger).toHaveAttribute("aria-expanded", "false")
  await accountMenuTrigger.click()
  await expect(page.getByRole("menu", { name: "계정 메뉴" })).toBeVisible()
  await expect(page.getByRole("menuitem", { name: "프로필" })).toBeVisible()
  await expect(page.getByRole("menuitem", { name: "로그아웃" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(accountMenuTrigger).toHaveAttribute("aria-expanded", "false")

  await page.getByRole("link", { name: /E2E 상태 전이 코스/ }).click()
  await page.waitForLoadState("networkidle")
  await page.getByRole("link", { name: "학습 시작하기" }).click()
  await page.waitForLoadState("networkidle")
  await page.getByRole("button", { name: "시작하기" }).click()

  await page.getByRole("button", { name: "클라이언트가 채점한다" }).click()
  await page.getByRole("button", { name: "확인하기" }).click()
  await expect(page.getByText("다시 확인해보세요")).toBeVisible()
  await page.getByRole("button", { name: "계속하기" }).click()
  await expect(page.getByRole("button", { name: "확인하기" })).toBeDisabled()
  await page.getByRole("button", { name: "서버가 채점한다" }).click()
  await page.getByRole("button", { name: "확인하기" }).click()
  await expect(page.getByText("완벽해요!")).toBeVisible()
  await page.getByRole("button", { name: "계속하기" }).click()

  await page
    .getByRole("textbox")
    .fill("서버가 모든 학습 상태를 일관되게 계산합니다.")
  await page.getByRole("button", { name: "확인하기" }).click()
  await expect(page.getByText("완벽해요!")).toBeVisible()
  await page.getByRole("button", { name: "계속하기" }).click()

  await page.getByRole("button", { name: "AI 코칭 받기" }).click()
  await expect(
    page.getByText("서버 상태 전이의 장점을 잘 설명했습니다.")
  ).toBeVisible()
  await page.getByRole("button", { name: "다음으로 →", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "레슨을 완료했어요!" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "다음 레슨" })
  ).not.toBeVisible()

  const completedProgressResponse = await page.request.get(
    `${learnerApiOrigin}/progress?status=completed`
  )
  expect(completedProgressResponse.status()).toBe(200)
  const completedProgress = (await completedProgressResponse.json()) as {
    readonly items: readonly {
      readonly id: string
      readonly learning: { readonly status: string }
    }[]
  }
  expect(completedProgress.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "e2e-transition-course",
        learning: expect.objectContaining({ status: "completed" }),
      }),
    ])
  )
  expect(apiRequests.length).toBeGreaterThan(0)
  expect(googleRequests).toEqual([])

  await page.goto(`${learnerWebOrigin}/app/profile`)
  await page.getByRole("button", { name: "로그아웃" }).click()
  await expect(page).toHaveURL(`${learnerWebOrigin}/`)

  const protectedDetailResponse = await page.goto(
    `${learnerWebOrigin}/app/courses/e2e-transition-course`
  )
  expect(protectedDetailResponse?.url()).toBe(
    `${learnerWebOrigin}/login?next=%2Fapp%2Fcourses%2Fe2e-transition-course`
  )
  await expect(page).toHaveTitle("로그인 | 글결")
  expect(diagnostics).toEqual([])
})

test("관리자 owner와 operator 권한을 서버 경계에서 구분한다", async ({
  browser,
}) => {
  test.setTimeout(90_000)
  const ownerContext = await browser.newContext()
  const ownerPage = await ownerContext.newPage()
  const ownerDiagnostics = observeBrowserDiagnostics(ownerPage)
  const targetAdminRequests: string[] = []

  ownerPage.on("request", (request) => {
    const url = request.url()

    if (url.startsWith(adminApiOrigin)) targetAdminRequests.push(url)
  })

  await loginAdmin(ownerPage, "owner@example.test", {
    nextPath: "/courses?page=2",
  })
  await expect(ownerPage).toHaveURL(`${adminWebOrigin}/courses?page=2`)
  expect(
    targetAdminRequests.some((url) =>
      url.startsWith(`${adminApiOrigin}/api/admin/auth/sign-in/email`)
    )
  ).toBe(true)
  await ownerPage.goto(`${adminWebOrigin}/`)
  await expect(
    ownerPage.getByRole("heading", { name: "대시보드" })
  ).toBeVisible()
  expect(await updateNotice(ownerPage, "owner 공지")).toBe(200)
  await ownerPage.goto(`${adminWebOrigin}/courses`)
  await ownerPage.getByLabel("코스 검색").fill("새 강의")
  await ownerPage.getByLabel("코스 검색").press("Enter")
  await expect(ownerPage).toHaveURL(
    /\/courses\?[^#]*query=%EC%83%88\+%EA%B0%95%EC%9D%98/
  )
  await ownerPage.getByLabel("코스 검색").fill("")
  await ownerPage.getByLabel("코스 검색").press("Enter")
  await expect(ownerPage).toHaveURL(/\/courses\?[^#]*query=&/)
  await expect(ownerPage.getByText("5개 결과")).toBeVisible()
  await ownerPage.goto(
    `${adminWebOrigin}/courses?query=&category=&status=active&pageSize=20&page=1`
  )
  await expect(ownerPage).toHaveURL(/[^#]*status=active/)
  await expect(ownerPage.getByRole("combobox", { name: "상태" })).toContainText(
    "활성"
  )
  await ownerPage.goto(
    `${adminWebOrigin}/courses?query=&category=&status=all&pageSize=20&page=1`
  )
  await expect(ownerPage).toHaveURL(/[^#]*status=all/)
  await expect(ownerPage.getByRole("combobox", { name: "상태" })).toContainText(
    "전체 상태"
  )
  await ownerPage.getByRole("button", { name: "새 강의" }).click()
  await expect(ownerPage.getByText("새 코스를 만들었습니다.")).toBeVisible()
  const createdCourseLink = ownerPage.getByRole("link", {
    name: "새 강의",
    exact: true,
  })
  const createdCoursePath = await createdCourseLink.getAttribute("href")
  if (createdCoursePath === null) {
    throw new Error("생성된 코스 링크에 href가 없습니다.")
  }
  await createdCourseLink.click()

  const conflictContext = await browser.newContext({
    storageState: await ownerContext.storageState(),
  })
  const conflictPage = await conflictContext.newPage()
  const conflictDiagnostics = observeBrowserDiagnostics(conflictPage)
  await conflictPage.goto(`${adminWebOrigin}${createdCoursePath}`)
  await expect(conflictPage.getByLabel("제목")).toHaveValue("새 강의")

  await ownerPage.getByLabel("제목").fill("E2E 저장 코스")
  await ownerPage.getByRole("button", { name: "변경 저장" }).click()
  await expect(ownerPage.getByText("코스를 저장했습니다.")).toBeVisible()

  await conflictPage.getByLabel("설명").fill("충돌을 재현하는 로컬 초안")
  await conflictPage.getByRole("button", { name: "변경 저장" }).click()
  await expect(
    conflictPage.getByRole("group", { name: "충돌 해결" })
  ).toBeVisible()
  await conflictPage.getByRole("button", { name: "최신본으로 교체" }).click()
  await expect(conflictPage.getByLabel("제목")).toHaveValue("E2E 저장 코스")
  expect(conflictDiagnostics).toEqual([])
  await conflictContext.close()

  await ownerPage
    .getByLabel("코스 편집 경로")
    .getByRole("link", { name: "콘텐츠 관리" })
    .click()
  const savedCourseRow = ownerPage.getByRole("row", { name: /E2E 저장 코스/ })
  await expect(savedCourseRow).toBeVisible()
  await savedCourseRow.hover()
  await savedCourseRow.getByRole("button", { name: "보관" }).click()
  await ownerPage.getByRole("button", { name: "보관하기" }).click()
  await expect(ownerPage.getByText("코스를 보관했습니다.")).toBeVisible()
  await expect(
    ownerPage
      .getByRole("row", { name: /E2E 저장 코스/ })
      .getByRole("button", { name: "보관" })
  ).toBeDisabled()

  await ownerPage.goto(`${adminWebOrigin}/users`)
  const learnerRow = ownerPage.getByRole("row", {
    name: /learner@example.com/,
  })
  await learnerRow.hover()
  ownerPage.once("dialog", (dialog) => dialog.accept())
  await learnerRow.getByRole("button", { name: "정지" }).click()
  await expect(ownerPage.getByText("사용자를 정지했습니다.")).toBeVisible()
  await expect(learnerRow.getByText("정지", { exact: true })).toBeVisible()
  await learnerRow.hover()
  ownerPage.once("dialog", (dialog) => dialog.accept())
  await learnerRow.getByRole("button", { name: "활성화" }).click()
  await expect(ownerPage.getByText("사용자를 활성화했습니다.")).toBeVisible()
  await expect(learnerRow.getByText("활성", { exact: true })).toBeVisible()

  await ownerPage.goto(`${adminWebOrigin}/resources`)
  const newFolderButton = ownerPage.getByRole("button", { name: "새 폴더" })
  await expect(newFolderButton).toBeEnabled()
  await newFolderButton.focus()
  await ownerPage.keyboard.press("Enter")
  await expect(ownerPage.getByText("새 폴더", { exact: true })).toBeVisible()
  const newDocumentButton = ownerPage.getByRole("button", { name: "새 문서" })
  await newDocumentButton.focus()
  await ownerPage.keyboard.press("Enter")
  await expect(ownerPage).toHaveURL(/\/resources\/[^/]+$/)
  await expect(
    ownerPage.getByRole("textbox", { name: "문서 제목" })
  ).toHaveValue("제목 없음")
  const emptyDocumentUrl = ownerPage.url()
  await ownerPage.locator('input[type="file"]').setInputFiles({
    buffer: Buffer.from("# 한글 제목\n\nE2E resource body", "utf8"),
    mimeType: "text/markdown",
    name: "가져오기-검증.md",
  })
  await ownerPage.waitForURL((url) => url.href !== emptyDocumentUrl)
  await expect(
    ownerPage.getByRole("textbox", { name: "문서 제목" })
  ).toHaveValue("한글 제목")
  const resourceBody = ownerPage.getByLabel("자료 본문")
  await expect(resourceBody).toContainText("E2E resource body")
  await expect(ownerPage.getByText("저장됨", { exact: true })).toBeVisible()
  await ownerPage.reload()
  await expect(ownerPage.getByLabel("자료 본문")).toContainText(
    "E2E resource body"
  )
  await expect(ownerPage.getByText("저장됨", { exact: true })).toBeVisible()
  const [download] = await Promise.all([
    ownerPage.waitForEvent("download"),
    ownerPage.getByRole("button", { name: "내보내기", exact: true }).click(),
  ])
  expect(download.suggestedFilename()).toBe("한글 제목.md")
  const downloadPath = await download.path()
  if (downloadPath === null) {
    throw new Error("다운로드 파일 경로를 확인할 수 없습니다.")
  }
  expect(await readFile(downloadPath, "utf8")).toContain("E2E resource body")
  expect(ownerDiagnostics).toEqual([])
  await ownerContext.close()

  const operatorContext = await browser.newContext({
    viewport: { height: 844, width: 390 },
  })
  const operatorPage = await operatorContext.newPage()
  const operatorDiagnostics = observeBrowserDiagnostics(operatorPage)

  await loginAdmin(operatorPage, "operator@example.test", {
    nextPath: "/users?status=suspended",
  })
  await expect(operatorPage).toHaveURL(
    `${adminWebOrigin}/users?status=suspended`
  )
  await expect(
    operatorPage.getByRole("heading", { name: "사용자 관리" })
  ).toBeVisible()
  await expect(
    operatorPage.getByRole("combobox", { name: "상태" })
  ).toContainText("정지")
  expect(await updateNotice(operatorPage, "operator 공지")).toBe(403)
  expect(operatorDiagnostics).toEqual([])
  await operatorContext.close()
})

async function loginAdmin(
  page: Page,
  email: string,
  { nextPath = "/" }: { readonly nextPath?: string }
): Promise<void> {
  await page.goto(
    nextPath === "/"
      ? `${adminWebOrigin}/login`
      : `${adminWebOrigin}${nextPath}`
  )
  await expect(page.getByLabel("이메일")).toBeVisible()
  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호").fill(adminPassword)
  await page.getByRole("button", { name: "로그인" }).click()

  await page.waitForURL(`${adminWebOrigin}${nextPath}`)
}

async function updateNotice(page: Page, announce: string): Promise<number> {
  const response = await page.request.put(
    `${adminApiOrigin}/api/admin/settings/notice`,
    {
      data: {
        announce,
        banner: "E2E 배너",
      },
      headers: { Origin: adminWebOrigin },
    }
  )

  return response.status()
}

function observeBrowserDiagnostics(page: Page): string[] {
  const diagnostics: string[] = []

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      diagnostics.push(`console.${message.type()}: ${message.text()}`)
    }
  })
  page.on("pageerror", (error) => {
    diagnostics.push(`pageerror: ${error.message}`)
  })
  page.on("response", (response) => {
    if (response.status() >= 500) {
      diagnostics.push(`response ${response.status()}: ${response.url()}`)
    }
  })

  return diagnostics
}
