import { expect, test } from "#e2e/test"

import { learnerWebOrigin, readLatestAuthEmail } from "#e2e/auth"

test("학습자가 앱에서 Google OAuth 시작 경계까지 이동한다", async ({
  page,
}) => {
  await page.route("https://accounts.google.com/**", async (route) => {
    await route.fulfill({
      body: '<meta charset="utf-8"><main><h1>Google OAuth E2E 경계</h1></main>',
      contentType: "text/html; charset=utf-8",
      status: 200,
    })
  })
  const socialSignInRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" &&
      request.url().endsWith("/api/auth/sign-in/social")
  )

  await page.goto(`${learnerWebOrigin}/login?next=/app/courses`)
  await expect(
    page.getByRole("button", { name: "이메일로 로그인하기" })
  ).toBeEnabled()
  await page.getByRole("button", { name: "Google로 계속하기" }).click()

  const request = await socialSignInRequest
  expect(request.postDataJSON()).toMatchObject({
    callbackURL: `${learnerWebOrigin}/app/courses`,
    provider: "google",
  })
  await expect(page).toHaveURL(/^https:\/\/accounts\.google\.com\//u)
  await expect(
    page.getByRole("heading", { name: "Google OAuth E2E 경계" })
  ).toBeVisible()
})

test("학습자가 이메일 가입, 확인, 로그인과 비밀번호 재설정을 완료한다", async ({
  page,
}) => {
  const email = "credentials-learner@example.test"
  const password = "Learner-password-123!"

  await page.goto(`${learnerWebOrigin}/login?next=/app/courses`)
  await expect(
    page.getByRole("button", { name: "이메일로 로그인하기" })
  ).toBeEnabled()
  await page.getByRole("tab", { name: "가입" }).click()
  await page.getByLabel("이름").fill("이메일 학습자")
  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호", { exact: true }).fill(password)
  await page.getByRole("button", { name: "이메일로 가입하기" }).click()
  await expect(
    page.getByText(
      "입력한 주소로 확인 메일을 보냈습니다. 이미 가입한 주소라면 로그인해 주세요."
    )
  ).toBeVisible()

  const protectedBeforeVerification = await page.request.get(
    `${learnerWebOrigin}/api/progress`
  )
  expect(protectedBeforeVerification.status()).toBe(401)

  const unverifiedLogin = await page.request.post(
    `${learnerWebOrigin}/api/auth/sign-in/email`,
    {
      data: {
        callbackURL: `${learnerWebOrigin}/app/courses`,
        email,
        password,
      },
    }
  )
  expect(unverifiedLogin.status()).toBe(403)
  await expect(unverifiedLogin.json()).resolves.toMatchObject({
    code: "EMAIL_NOT_VERIFIED",
  })

  const verificationEmail = await readLatestAuthEmail()
  expect(verificationEmail.kind).toBe("verification")
  await page.goto(verificationEmail.callbackUrl)
  await expect(page).toHaveURL(
    `${learnerWebOrigin}/login?next=%2Fapp%2Fcourses&verified=true`
  )
  await expect(
    page.getByText("이메일 확인이 완료되었습니다. 이제 로그인해 주세요.")
  ).toBeVisible()

  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호", { exact: true }).fill(password)
  await Promise.all([
    page.waitForURL(`${learnerWebOrigin}/app/courses`),
    page.getByRole("button", { name: "이메일로 로그인하기" }).click(),
  ])

  const protectedAfterVerification = await page.request.get(
    `${learnerWebOrigin}/api/progress`
  )
  expect(protectedAfterVerification.status()).toBe(200)

  await page.waitForLoadState("networkidle")
  await page.goto(`${learnerWebOrigin}/login`)
  await expect(
    page.getByRole("button", { name: "이메일로 로그인하기" })
  ).toBeEnabled()
  await page.getByRole("button", { name: "비밀번호를 잊으셨나요?" }).click()
  await page.getByLabel("이메일").fill(email)
  await page.getByRole("button", { name: "재설정 링크 받기" }).click()
  await expect(
    page.getByText(
      "가입된 주소라면 비밀번호 재설정 메일을 보냈습니다. 받은편지함을 확인해 주세요."
    )
  ).toBeVisible()

  const resetEmail = await readLatestAuthEmail()
  expect(resetEmail.kind).toBe("password-reset")
  await page.goto(resetEmail.callbackUrl)
  await expect(page).toHaveURL(/\/reset-password\?token=/u)

  const newPassword = "New-learner-password-123!"
  await page.getByLabel("새 비밀번호", { exact: true }).fill(newPassword)
  await page.getByLabel("새 비밀번호 확인").fill(newPassword)
  await page.getByRole("button", { name: "비밀번호 변경하기" }).click()
  await expect(
    page.getByText(
      "비밀번호를 변경했습니다. 모든 기존 로그인은 종료되었습니다."
    )
  ).toBeVisible()

  const protectedAfterReset = await page.request.get(
    `${learnerWebOrigin}/api/progress`
  )
  expect(protectedAfterReset.status()).toBe(401)

  await page.goto(`${learnerWebOrigin}/login?next=/app/courses`)
  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호", { exact: true }).fill(newPassword)
  await Promise.all([
    page.waitForURL(`${learnerWebOrigin}/app/courses`),
    page.getByRole("button", { name: "이메일로 로그인하기" }).click(),
  ])
})
