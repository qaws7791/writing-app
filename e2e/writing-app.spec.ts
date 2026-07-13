import { expect, test, type Page } from "@playwright/test"
import { base32 } from "@better-auth/utils/base32"
import { createOTP } from "@better-auth/utils/otp"

const learnerWebOrigin = "http://127.0.0.1:3100"
const learnerApiOrigin = "http://127.0.0.1:4100"
const adminWebOrigin = "http://127.0.0.1:3101"
const adminApiOrigin = "http://127.0.0.1:4101"
const adminPassword = "e2e-password-123"

test("학습자가 테스트 로그인 후 레슨을 완료하고 로그아웃한다", async ({
  page,
}) => {
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

  await page.goto(`${learnerWebOrigin}/login?next=/app/courses`)
  await Promise.all([
    page.waitForURL(`${learnerWebOrigin}/app/courses`),
    page.getByRole("button", { name: "테스트 계정으로 계속하기" }).click(),
  ])

  await page.getByRole("link", { name: /글쓰기 첫걸음 30일/ }).click()
  await page.waitForLoadState("networkidle")
  await expect(
    page.getByRole("heading", { name: "글쓰기 첫걸음 30일" })
  ).toBeVisible()
  await page.getByRole("link", { name: "학습 시작하기" }).click()
  await page.waitForLoadState("networkidle")
  await page.getByRole("button", { name: "시작하기" }).click()
  await expect(page.getByRole("button", { name: "이해했어요" })).toBeVisible()
  await page.getByRole("button", { name: "이해했어요" }).click()

  await expect(page.getByRole("heading", { name: "완료!" })).toBeVisible()
  expect(apiRequests.length).toBeGreaterThan(0)
  expect(googleRequests).toEqual([])

  await page.goto(`${learnerWebOrigin}/app/profile`)
  await page.getByRole("button", { name: "로그아웃" }).click()
  await expect(page).toHaveURL(`${learnerWebOrigin}/`)

  await page.goto(`${learnerWebOrigin}/app/courses`)
  await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fcourses$/)
})

test("관리자 owner와 operator 권한을 서버 경계에서 구분한다", async ({
  browser,
}) => {
  const ownerContext = await browser.newContext()
  const ownerPage = await ownerContext.newPage()

  await loginAdmin(ownerPage, "owner@example.test", { enrollMfa: true })
  await expect(
    ownerPage.getByRole("heading", { name: "대시보드" })
  ).toBeVisible()
  expect(await updateNotice(ownerPage, "owner 공지")).toBe(200)
  await ownerContext.close()

  const operatorContext = await browser.newContext()
  const operatorPage = await operatorContext.newPage()

  await loginAdmin(operatorPage, "operator@example.test", { enrollMfa: false })
  await expect(
    operatorPage.getByRole("heading", { name: "대시보드" })
  ).toBeVisible()
  expect(await updateNotice(operatorPage, "operator 공지")).toBe(403)
  await operatorContext.close()
})

async function loginAdmin(
  page: Page,
  email: string,
  { enrollMfa }: { readonly enrollMfa: boolean }
): Promise<void> {
  await page.goto(`${adminWebOrigin}/login`)
  await page.waitForLoadState("networkidle")
  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호").fill(adminPassword)
  await Promise.all([
    page.waitForURL(`${adminWebOrigin}/`),
    page.getByRole("button", { name: "로그인" }).click(),
  ])

  if (!enrollMfa) return

  await page.getByLabel("현재 비밀번호").fill(adminPassword)
  await page.getByRole("button", { name: "인증 앱 등록 시작" }).click()
  const secret =
    (await page.locator("code").first().textContent())?.trim() ?? ""
  await page
    .getByLabel("인증 코드")
    .fill(
      await createOTP(new TextDecoder().decode(base32.decode(secret))).totp()
    )
  await page.getByRole("button", { name: "MFA 등록 완료" }).click()
  await page.getByRole("button", { name: "저장을 완료했어요" }).click()
  await page.waitForURL(`${adminWebOrigin}/`)
}

function updateNotice(page: Page, announce: string): Promise<number> {
  return page.evaluate(
    async ({ adminApiOrigin: apiOrigin, announce: nextAnnounce }) => {
      const response = await fetch(`${apiOrigin}/settings/notice`, {
        body: JSON.stringify({
          announce: nextAnnounce,
          banner: "E2E 배너",
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      })

      return response.status
    },
    { adminApiOrigin, announce }
  )
}
