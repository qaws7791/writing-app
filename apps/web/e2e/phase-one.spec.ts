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

function createDraftContent(text: string) {
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

async function createDraftViaApi(
  request: APIRequestContext,
  input: {
    bodyText?: string
    sourcePromptId?: number
    title?: string
  }
) {
  const response = await request.post("http://127.0.0.1:3010/drafts", {
    data: {
      content: input.bodyText ? createDraftContent(input.bodyText) : undefined,
      sourcePromptId: input.sourcePromptId,
      title: input.title,
    },
  })

  expect(response.ok()).toBeTruthy()
  return response.json()
}

async function writeBody(page: Page, body: string) {
  const bodyEditor = page.locator("[data-writing-body] .ProseMirror").first()
  await bodyEditor.fill(body)
}

test("home prompt to editor and resume flow", async ({
  page,
  request,
}, testInfo) => {
  const token = createUniqueToken(testInfo)
  const title = `phase-one-home-${token}`
  const body = `home-body-${token}`

  await page.goto("/")

  await expect(
    page.getByRole("link", { name: /최근에 내 생각이 바뀐 순간은\?/i })
  ).toBeVisible()

  await page
    .getByRole("link", { name: /최근에 내 생각이 바뀐 순간은\?/i })
    .click()

  await expect(page).toHaveURL(/\/prompts\/1$/)
  await page.getByRole("link", { name: "이 글감으로 글 쓰기" }).click()

  await expect(page).toHaveURL(/\/write\/new\?prompt=1$/)
  await expect(
    page.getByText("최근에 내 생각이 바뀐 순간은?").first()
  ).toBeVisible()

  const draft = await createDraftViaApi(request, {
    bodyText: body,
    sourcePromptId: 1,
    title,
  })

  await page.goto(`/write/${draft.id}`)
  await expect(
    page.getByText("최근에 내 생각이 바뀐 순간은?").first()
  ).toBeVisible()
  await expect(
    page.locator("[data-writing-body] .ProseMirror").first()
  ).toContainText(body)

  await page.goto("/write")
  await expect(page.getByText(title).first()).toBeVisible()

  await page.goto("/")
  await expect(
    page.locator(`a[href="/write/${draft.id}"]`).first()
  ).toBeVisible()
  await expect(page.getByText(title).first()).toBeVisible()
})

test("prompt discovery search save detail and write flow", async ({ page }) => {
  await page.goto("/prompts")

  await page.getByPlaceholder("주제, 키워드, 감정으로 검색").fill("AI")
  await page.getByRole("button", { name: "기술" }).click()

  const promptLink = page.getByRole("link", {
    name: /AI가 일상에 들어오면서 잃어가는 것은\?/i,
  })
  const saveButton = page.getByRole("button", {
    name: /글감 저장|저장 해제/i,
  })

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

  await page.getByRole("link", { name: "이 글감으로 글 쓰기" }).click()

  await expect(page).toHaveURL(/\/write\/new\?prompt=6$/)
  await expect(
    page.getByText("AI가 일상에 들어오면서 잃어가는 것은?").first()
  ).toBeVisible()
})

test("create draft from list and delete it", async ({
  page,
  request,
}, testInfo) => {
  const token = createUniqueToken(testInfo)
  const title = `phase-one-delete-${token}`

  const draft = await createDraftViaApi(request, {
    title,
  })

  await page.goto(`/write/${draft.id}`)

  await page.getByLabel("설정").click()
  await page.getByText("삭제").first().click()

  await expect(page.getByText("이 글을 삭제할까요?")).toBeVisible()
  await page.getByRole("button", { name: "삭제" }).last().click()

  await expect(page).toHaveURL(/\/write$/)
  await expect(page.getByText(title)).toHaveCount(0)
})

test("reopen existing draft and expose it as latest resume target", async ({
  page,
  request,
}, testInfo) => {
  const token = createUniqueToken(testInfo)
  const title = `phase-one-resume-${token}`
  const initialBody = `resume-initial-${token}`
  const updatedBody = `resume-updated-${token}`

  const draft = await createDraftViaApi(request, {
    bodyText: initialBody,
    title,
  })

  await page.goto(`/write/${draft.id}`)
  await expect(
    page.locator("[data-writing-body] .ProseMirror").first()
  ).toContainText(initialBody)

  await writeBody(page, updatedBody)
  await page.waitForTimeout(1_500)

  await page.goto("/write")
  await page.locator(`a[href="/write/${draft.id}"]`).first().click()

  await expect(page).toHaveURL(new RegExp(`/write/${draft.id}$`))
  await expect(
    page.locator("[data-writing-body] .ProseMirror").first()
  ).toContainText(updatedBody)

  await page.goto("/")
  await expect(
    page.locator(`a[href="/write/${draft.id}"]`).first()
  ).toBeVisible()
  await expect(page.getByText(title).first()).toBeVisible()
})
