import {
  expect,
  test,
  type APIRequestContext,
  type Page,
  type TestInfo,
} from "@playwright/test"

function createUniqueToken(testInfo: TestInfo) {
  const project = testInfo.project.name
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()
  const title = testInfo.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()

  return `${project}-${title}-${Date.now()}`
}

function createWritingContent(text: string) {
  return {
    content: [
      {
        content: [{ text, type: "text" }],
        type: "paragraph",
      },
    ],
    type: "doc",
  }
}

async function buildApiCookieHeader(page: Page): Promise<string> {
  const cookies = await page.context().cookies("http://127.0.0.1:3010")

  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ")
}

async function createWritingViaApi(
  request: APIRequestContext,
  page: Page,
  input: {
    bodyText?: string
    sourcePromptId?: number
    title?: string
  }
) {
  const cookie = await buildApiCookieHeader(page)
  const response = await request.post("http://127.0.0.1:3010/writings", {
    data: {
      content: input.bodyText
        ? createWritingContent(input.bodyText)
        : undefined,
      sourcePromptId: input.sourcePromptId,
      title: input.title,
    },
    headers: {
      cookie,
    },
  })

  expect(response.ok()).toBeTruthy()
  return response.json()
}

async function autosaveWritingViaApi(
  request: APIRequestContext,
  page: Page,
  writingId: number,
  input: {
    bodyText?: string
    title?: string
  }
) {
  const cookie = await buildApiCookieHeader(page)
  const response = await request.patch(
    `http://127.0.0.1:3010/writings/${writingId}`,
    {
      data: {
        content: input.bodyText
          ? createWritingContent(input.bodyText)
          : undefined,
        title: input.title,
      },
      headers: {
        cookie,
      },
    }
  )

  expect(response.ok()).toBeTruthy()
  return response.json()
}

async function signUpAndLogin(
  page: Page,
  request: APIRequestContext,
  testInfo: TestInfo
) {
  const token = createUniqueToken(testInfo)
  const email = `writer-${token}@example.com`
  const password = "password1234"

  await page.goto("/sign-up")
  await page.getByLabel("이름").fill("테스트 작성자")
  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호").fill(password)
  await page.getByRole("button", { name: "인증 메일 보내기" }).click()

  await expect(page.getByText("인증 메일을 보냈습니다.")).toBeVisible()

  const verificationResponse = await request.get(
    `http://127.0.0.1:3010/dev/auth-emails?kind=verification&email=${encodeURIComponent(email)}`
  )
  const verificationBody = (await verificationResponse.json()) as {
    url: string
  }

  await request.get(verificationBody.url)

  await page.goto("/sign-in?verified=1")
  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호").fill(password)
  await page.getByRole("button", { name: "로그인" }).click()

  await expect(page).toHaveURL(/\/home$/)
}

async function writeBody(page: Page, body: string) {
  const bodyEditor = page.locator("[data-writing-body] .ProseMirror").first()
  await bodyEditor.fill(body)
}

async function writeTitle(page: Page, title: string) {
  const titleEditor = page.getByRole("textbox", { name: "에세이 제목" })

  await titleEditor.fill(title)
}

test("home prompt to editor and resume flow", async ({
  page,
  request,
}, testInfo) => {
  await signUpAndLogin(page, request, testInfo)

  const token = createUniqueToken(testInfo)
  const title = `phase-one-home-${token}`
  const body = `home-body-${token}`

  await page.goto("/home")

  const todayPromptLink = page
    .locator('a[href^="/prompts/"]')
    .filter({ has: page.locator("p") })
    .first()
  await expect(todayPromptLink).toBeVisible()

  const promptTitle = await todayPromptLink.locator("p").textContent()
  const promptHref = await todayPromptLink.getAttribute("href")
  const promptId = Number(promptHref?.match(/\/prompts\/(\d+)/)?.[1])

  expect(promptTitle).toBeTruthy()
  expect(Number.isFinite(promptId)).toBeTruthy()

  await todayPromptLink.click()

  await expect(page).toHaveURL(new RegExp(`/prompts/${promptId}$`))
  await page.getByRole("button", { name: "이 글감으로 글 쓰기" }).click()

  await expect(page).toHaveURL(/\/writing\/\d+$/)
  await expect(page.getByText(promptTitle ?? "").first()).toBeVisible()

  const writingId = Number(page.url().match(/\/writing\/(\d+)$/)?.[1])
  expect(Number.isFinite(writingId)).toBeTruthy()

  await autosaveWritingViaApi(request, page, writingId, {
    bodyText: body,
    title,
  })

  await page.goto(`/writing/${writingId}`)
  await expect(page.getByText(promptTitle ?? "").first()).toBeVisible()
  await expect(
    page.locator("[data-writing-body] .ProseMirror").first()
  ).toContainText(body)

  await page.goto("/writing")
  await expect(page.getByText(title).first()).toBeVisible()

  await page.goto("/home")
  await expect(
    page.locator(`a[href="/writing/${writingId}"]`).first()
  ).toBeVisible()
  await expect(page.getByText(title).first()).toBeVisible()
})

test("prompt discovery search save detail and write flow", async ({
  page,
  request,
}, testInfo) => {
  await signUpAndLogin(page, request, testInfo)

  await page.goto("/prompts")

  await page.getByPlaceholder("주제, 키워드, 감정으로 검색").fill("AI")
  await page.getByRole("button", { name: "기술" }).click()

  const promptLink = page.getByRole("link", {
    name: /AI가 일상에 들어오면서 잃어가는 것은\?/i,
  })
  const saveButton = promptLink.getByLabel(/글감 저장|저장 해제/i)

  await expect(promptLink).toBeVisible()

  const initialLabel = await saveButton.getAttribute("aria-label")
  if (initialLabel === "저장 해제") {
    await saveButton.click()
    await expect(saveButton).toHaveAttribute("aria-label", "글감 저장")
  }

  await saveButton.click()
  await expect(saveButton).toHaveAttribute("aria-label", "저장 해제")

  await promptLink.click()

  await expect(page).toHaveURL(/\/prompts\/6$/)
  await expect(
    page.getByRole("heading", {
      name: "AI가 일상에 들어오면서 잃어가는 것은?",
    })
  ).toBeVisible()

  await page.getByRole("button", { name: "이 글감으로 글 쓰기" }).click()

  await expect(page).toHaveURL(/\/writing\/\d+$/)
  await expect(
    page.getByText("AI가 일상에 들어오면서 잃어가는 것은?").first()
  ).toBeVisible()
})

test("create writing from list and delete it", async ({
  page,
  request,
}, testInfo) => {
  await signUpAndLogin(page, request, testInfo)

  const token = createUniqueToken(testInfo)
  const title = `phase-one-delete-${token}`

  const writing = await createWritingViaApi(request, page, {
    title,
  })

  await page.goto(`/writing/${writing.id}`)

  await page.getByLabel("설정").click()
  await page.getByText("삭제").first().click()

  await expect(page.getByText("이 글을 삭제할까요?")).toBeVisible()
  await page.getByRole("button", { name: "삭제" }).last().click()

  await expect(page).toHaveURL(/\/writing$/)
  await expect(page.getByText(title)).toHaveCount(0)
})

test("reopen existing writing and expose it as latest resume target", async ({
  page,
  request,
}, testInfo) => {
  await signUpAndLogin(page, request, testInfo)

  const token = createUniqueToken(testInfo)
  const title = `phase-one-resume-${token}`
  const initialBody = `resume-initial-${token}`
  const updatedBody = `resume-updated-${token}`

  const writing = await createWritingViaApi(request, page, {
    bodyText: initialBody,
    title,
  })

  await page.goto(`/writing/${writing.id}`)
  await expect(
    page.locator("[data-writing-body] .ProseMirror").first()
  ).toContainText(initialBody)

  await writeBody(page, updatedBody)
  await page.waitForTimeout(3_500)

  await page.goto("/writing")
  await page.locator(`a[href="/writing/${writing.id}"]`).first().click()

  await expect(page).toHaveURL(new RegExp(`/writing/${writing.id}$`))
  await expect(
    page.locator("[data-writing-body] .ProseMirror").first()
  ).toContainText(updatedBody)

  await page.goto("/home")
  await expect(
    page.locator(`a[href="/writing/${writing.id}"]`).first()
  ).toBeVisible()
  await expect(page.getByText(title).first()).toBeVisible()
})

test("creates one writing from rapid title input and keeps updating the same writing", async ({
  page,
  request,
}, testInfo) => {
  await signUpAndLogin(page, request, testInfo)

  const body = `phase-one-body-${createUniqueToken(testInfo)}`

  await page.goto("/writing")
  await page.getByRole("button", { name: /새 글 시작/i }).click()
  await expect(page).toHaveURL(/\/writing\/\d+$/)
  await writeTitle(page, "12345")

  await expect(page).toHaveURL(/\/writing\/\d+$/)
  const writingUrl = page.url()
  await page.waitForTimeout(3_500)

  await page.goto("/writing")
  const matchingWritings = page.locator('a[href^="/writing/"]').filter({
    hasText: "12345",
  })
  await expect(matchingWritings).toHaveCount(1)

  await page.goto(writingUrl)
  await writeBody(page, body)
  await page.waitForTimeout(3_500)

  await page.goto("/writing")
  await expect(matchingWritings).toHaveCount(1)
  await matchingWritings.first().click()

  await expect(
    page.locator("[data-writing-body] .ProseMirror").first()
  ).toContainText(body)
})
