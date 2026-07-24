import { spawnSync } from "node:child_process"

import {
  devices,
  type BrowserContextOptions,
  type Locator,
  type Page,
} from "@playwright/test"
import { adminContentAssetUploadDtoSchema } from "@workspace/contracts/content/admin-assets"
import {
  adminCourseEditorDocumentSchema,
  adminCourseEditorWriteDocumentSchema,
  type AdminCourseEditorDocument,
} from "@workspace/contracts/content/admin-courses"
import { saveLearnerStepDraftBodySchema } from "@workspace/contracts/learning/learner-transition"

import {
  adminWebOrigin,
  learnerWebOrigin,
  loginAdmin,
  loginLearner,
} from "#e2e/auth"
import { expect, observeBrowserContext, test } from "#e2e/test"
import {
  createE2eAdminContentFixture,
  e2eAdminContentActivityTypes,
  e2eAdminContentCourseTitle,
  e2eAdminContentOrderItems,
  e2eAdminContentReadingTitle,
} from "#e2e/admin-content-fixture"

const imageFile = {
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64"
  ),
  mimeType: "image/png",
  name: "content-image.png",
}
const iPhone16Pro = devices["iPhone 16 Pro"]
const learnerMobileContextOptions = {
  deviceScaleFactor: iPhone16Pro.deviceScaleFactor,
  hasTouch: iPhone16Pro.hasTouch,
  isMobile: iPhone16Pro.isMobile,
  screen: iPhone16Pro.screen,
  userAgent: iPhone16Pro.userAgent,
  viewport: iPhone16Pro.viewport,
} satisfies BrowserContextOptions

test("관리자가 10개 활동과 이미지를 발행하고 기존 학습자는 고정 revision을 사용한다", async ({
  browser,
}) => {
  test.setTimeout(300_000)
  const adminContext = await browser.newContext()
  const adminDiagnostics = observeBrowserContext(adminContext)
  const adminPage = await adminContext.newPage()
  let browserUploadRequestCount = 0

  await adminPage.route("**/api/admin/courses/*/assets", async (route) => {
    browserUploadRequestCount += 1
    await new Promise((resolve) => setTimeout(resolve, 300))
    await route.continue()
  })

  await loginAdmin(adminPage, "owner@example.test", { nextPath: "/courses" })
  await adminPage.getByRole("button", { name: "새 강의" }).click()
  await expect(adminPage.getByText("새 코스를 만들었습니다.")).toBeVisible()
  const createdCourseHref = await adminPage
    .getByRole("link", { exact: true, name: "새 강의" })
    .last()
    .getAttribute("href")
  const createdCourseId = readCreatedCourseId(createdCourseHref)

  const initialEditor = await readAdminCourseEditor(adminPage, createdCourseId)
  const fixture = createE2eAdminContentFixture(initialEditor)
  expect(fixture.units[0]?.lessons[0]?.steps.map((step) => step.type)).toEqual(
    e2eAdminContentActivityTypes
  )
  const fixtureSaveResponse = await adminPage.request.put(
    `${adminWebOrigin}/api/admin/courses/${createdCourseId}/editor`,
    {
      data: adminCourseEditorWriteDocumentSchema.parse(fixture),
      headers: {
        "If-Match": `"${initialEditor.editVersion}"`,
        Origin: adminWebOrigin,
      },
    }
  )
  expect(fixtureSaveResponse.status()).toBe(200)

  await adminPage.goto(
    `${adminWebOrigin}/courses/${encodeURIComponent(createdCourseId)}`
  )
  await adminPage.getByRole("button", { name: "커리큘럼" }).click()
  const stepForms = adminPage.getByRole("list", { name: "스텝 편집 폼" })
  await expect(stepForms.locator(":scope > li")).toHaveCount(10)
  for (const activityType of e2eAdminContentActivityTypes) {
    await expect(
      stepForms.getByText(activityType, { exact: true })
    ).toBeVisible()
  }

  await adminPage.getByRole("button", { name: "강의 정보" }).click()
  await adminPage.setViewportSize({ height: 844, width: 390 })
  const coverField = adminPage.locator('section[aria-label="코스 표지"]')
  await coverField.getByLabel("이미지 파일").setInputFiles(imageFile)
  await coverField.getByRole("button", { name: "이미지 업로드" }).click()
  await expect(
    coverField.getByText("대체 텍스트를 입력해 주세요.")
  ).toBeVisible()
  expect(browserUploadRequestCount).toBe(0)

  await coverField.getByLabel("대체 텍스트").fill("리비전 1 코스 표지")
  const coverUploadResponsePromise = waitForAssetUploadResponse(adminPage)
  await coverField.getByRole("button", { name: "이미지 업로드" }).click()
  await expect(
    coverField.getByRole("progressbar", {
      name: "코스 표지 업로드 진행 중",
    })
  ).toBeVisible()
  const coverUploadResponse = await coverUploadResponsePromise
  expect(coverUploadResponse.status()).toBe(200)
  const coverAsset = adminContentAssetUploadDtoSchema.parse(
    await coverUploadResponse.json()
  )
  await expect(
    coverField.getByRole("img", { name: "리비전 1 코스 표지" })
  ).toBeVisible()
  expect(browserUploadRequestCount).toBe(1)
  expect(await readNaturalImageSize(adminPage, coverAsset.url)).toEqual({
    height: 900,
    width: 1600,
  })

  await adminPage.getByRole("button", { name: "변경 저장" }).click()
  await expect(adminPage.getByText("코스를 저장했습니다.")).toBeVisible()
  await adminPage.reload()
  await expect(
    adminPage.getByRole("img", { name: "리비전 1 코스 표지" })
  ).toBeVisible()
  const coverReloadedEditor = await readAdminCourseEditor(
    adminPage,
    createdCourseId
  )
  expect(coverReloadedEditor.coverAssetId).toBe(coverAsset.id)

  await adminPage.setViewportSize({ height: 720, width: 1280 })
  await adminPage.getByRole("button", { name: "커리큘럼" }).click()
  const readingField = adminPage.locator('section[aria-label="읽기 삽화"]')
  await readingField.getByLabel("이미지 파일").setInputFiles(imageFile)
  await readingField.getByLabel("대체 텍스트").fill("리비전 1 읽기 삽화")
  const readingUploadResponsePromise = waitForAssetUploadResponse(adminPage)
  await readingField.getByRole("button", { name: "이미지 업로드" }).click()
  await expect(
    readingField.getByRole("progressbar", {
      name: "읽기 삽화 업로드 진행 중",
    })
  ).toBeVisible()
  const readingUploadResponse = await readingUploadResponsePromise
  expect(readingUploadResponse.status()).toBe(200)
  const readingAsset = adminContentAssetUploadDtoSchema.parse(
    await readingUploadResponse.json()
  )
  expect(await readNaturalImageSize(adminPage, readingAsset.url)).toEqual({
    height: 1,
    width: 1,
  })
  await adminPage.getByRole("button", { name: "변경 저장" }).click()
  await expect(adminPage.getByText("코스를 저장했습니다.")).toBeVisible()
  await adminPage.reload()
  await adminPage.getByRole("button", { name: "커리큘럼" }).click()
  await expect(
    adminPage.getByRole("img", { name: "리비전 1 읽기 삽화" })
  ).toBeVisible()
  const imageReloadedEditor = await readAdminCourseEditor(
    adminPage,
    createdCourseId
  )
  expect(readReadingStep(imageReloadedEditor).illustrationAssetId).toBe(
    readingAsset.id
  )

  adminPage.once("dialog", (dialog) => dialog.accept())
  await adminPage.getByRole("button", { name: "초안 발행" }).click()
  await expect(adminPage.getByText("리비전 1을 발행했습니다.")).toBeVisible()
  const revisionTwoDraft = await readAdminCourseEditor(
    adminPage,
    createdCourseId
  )
  expect(revisionTwoDraft.revision).toBe(2)

  const publishedApiMutation = await adminPage.request.post(
    `${adminWebOrigin}/api/admin/courses/${createdCourseId}/assets`,
    {
      headers: { Origin: adminWebOrigin },
      multipart: {
        altText: "발행본에 추가할 수 없는 삽화",
        curriculumVersionId: imageReloadedEditor.curriculumVersionId,
        file: imageFile,
        kind: "reading-illustration",
      },
    }
  )
  expect(publishedApiMutation.status()).toBe(409)
  assertPublishedDatabaseMutationRejected(
    imageReloadedEditor.curriculumVersionId
  )

  const learnerContext = await browser.newContext(learnerMobileContextOptions)
  const learnerDiagnostics = observeBrowserContext(learnerContext)
  const learnerPage = await learnerContext.newPage()
  await loginLearner(learnerPage)
  await Promise.all([
    learnerPage.waitForURL(
      `${learnerWebOrigin}/app/courses/${encodeURIComponent(createdCourseId)}`
    ),
    learnerPage
      .getByRole("link", { name: new RegExp(e2eAdminContentCourseTitle) })
      .click(),
  ])
  await learnerPage.waitForLoadState("networkidle")
  const learnerCoverImage = learnerPage.getByRole("img", {
    name: "리비전 1 코스 표지",
  })
  await expect(learnerCoverImage).toBeVisible()
  await expect(learnerCoverImage).toHaveAttribute(
    "src",
    /_next\/image\?url=http%3A%2F%2F127\.0\.0\.1%3A4199%2Fcontent-assets%2F/
  )
  expect(await readRenderedImageWidth(learnerCoverImage)).toBeGreaterThan(0)
  await learnerPage.getByRole("link", { name: "학습 시작하기" }).click()
  const readingOptimizerResponsePromise = learnerPage.waitForResponse(
    (response) =>
      response.url().includes("/_next/image?") &&
      decodeURIComponent(response.url()).includes(readingAsset.url)
  )
  const startButton = learnerPage.getByRole("button", { name: "시작하기" })
  await expect(startButton).toBeEnabled()
  await startButton.click()
  await expect(
    learnerPage.getByText(e2eAdminContentReadingTitle, { exact: true })
  ).toBeVisible()
  await expect(
    learnerPage.getByRole("img", { name: "리비전 1 읽기 삽화" })
  ).toBeVisible()
  const readingOptimizerResponse = await readingOptimizerResponsePromise
  expect(readingOptimizerResponse.status()).toBe(200)
  expect(readingOptimizerResponse.headers()["content-type"]).toMatch(
    /^image\//u
  )
  expect((await readingOptimizerResponse.body()).byteLength).toBeGreaterThan(0)

  await adminPage.goto(
    `${adminWebOrigin}/courses/${encodeURIComponent(createdCourseId)}`
  )
  await adminPage.getByRole("button", { name: "커리큘럼" }).click()
  const revisionTwoReading = adminPage
    .getByRole("article")
    .filter({ hasText: "READING" })
  await revisionTwoReading.getByLabel("제목").fill("리비전 2 이미지 읽기")
  const revisionTwoImageField = revisionTwoReading.locator(
    'section[aria-label="읽기 삽화"]'
  )
  await revisionTwoImageField
    .getByLabel("교체할 이미지 파일")
    .setInputFiles(imageFile)
  await revisionTwoImageField
    .getByLabel("대체 텍스트")
    .fill("리비전 2 읽기 삽화")
  const replacementResponsePromise = waitForAssetUploadResponse(adminPage)
  await revisionTwoImageField
    .getByRole("button", { name: "이미지 교체" })
    .click()
  expect((await replacementResponsePromise).status()).toBe(200)
  await adminPage.getByRole("button", { name: "변경 저장" }).click()
  await expect(adminPage.getByText("코스를 저장했습니다.")).toBeVisible()
  adminPage.once("dialog", (dialog) => dialog.accept())
  await adminPage.getByRole("button", { name: "초안 발행" }).click()
  await expect(adminPage.getByText("리비전 2을 발행했습니다.")).toBeVisible()

  await learnerPage.reload()
  await expect(
    learnerPage.getByText(e2eAdminContentReadingTitle, { exact: true })
  ).toBeVisible()
  await expect(
    learnerPage.getByRole("img", { name: "리비전 1 읽기 삽화" })
  ).toBeVisible()
  await expect(
    learnerPage.getByRole("img", { name: "리비전 2 읽기 삽화" })
  ).toHaveCount(0)

  await completeAllMobileActivityTypes(learnerPage)

  await adminPage.getByRole("button", { name: "강의 정보" }).click()
  await adminPage
    .getByLabel("설명")
    .fill("리비전 3 draft는 발행본과 분리되어 수정됩니다.")
  await adminPage.getByRole("button", { name: "변경 저장" }).click()
  await expect(adminPage.getByText("코스를 저장했습니다.")).toBeVisible()
  await adminPage.reload()
  await expect(adminPage.getByLabel("설명")).toHaveValue(
    "리비전 3 draft는 발행본과 분리되어 수정됩니다."
  )

  await learnerContext.close()
  await adminContext.close()
  learnerDiagnostics.expectNoIssues()
  adminDiagnostics.expectNoIssues()
})

async function completeAllMobileActivityTypes(page: Page): Promise<void> {
  await expectMobileLessonStep(
    page,
    1,
    page.getByText(e2eAdminContentReadingTitle, { exact: true })
  )
  await page.getByRole("button", { exact: true, name: "이해했어요" }).click()

  await expectMobileLessonStep(
    page,
    2,
    page.getByRole("heading", { name: "문장 비교" })
  )
  await page.getByRole("button", { exact: true, name: "이해했어요" }).click()

  await expectMobileLessonStep(
    page,
    3,
    page.getByText("더 명확한 문장을 고르세요.", { exact: true })
  )
  await page.getByRole("button", { name: "명확한 문장" }).click()
  await submitAndContinue(page, "확인하기")

  await expectMobileLessonStep(
    page,
    4,
    page.getByText("핵심 표현을 선택하세요.", { exact: true })
  )
  await page.getByRole("button", { name: "명확해야 합니다" }).click()
  await submitAndContinue(page, "확인하기")

  await expectMobileLessonStep(
    page,
    5,
    page.getByRole("heading", { name: "빈칸을 채워보세요" })
  )
  await page.getByRole("button", { name: "명확" }).click()
  await submitAndContinue(page, "확인하기")

  await expectMobileLessonStep(
    page,
    6,
    page.getByRole("heading", { name: "문장 순서" })
  )
  const orderHandles = page.getByRole("button", {
    name: "드래그하여 순서 변경",
  })
  await expect(orderHandles).toHaveCount(2)
  await expect(page.getByRole("status")).toHaveText("서버에 저장됨")
  const canonicalOrderItemIds = e2eAdminContentOrderItems.map((item) => item.id)
  const initialOrderItemIds = await readOrderActivityItemIds(orderHandles)
  expect(initialOrderItemIds.toSorted()).toEqual(
    canonicalOrderItemIds.toSorted()
  )

  const reversedCanonicalOrderItemIds = canonicalOrderItemIds.toReversed()
  if (sameOrder(initialOrderItemIds, canonicalOrderItemIds)) {
    await moveFirstOrderItemDown(
      page,
      orderHandles,
      reversedCanonicalOrderItemIds
    )
    await moveFirstOrderItemDown(page, orderHandles, canonicalOrderItemIds)
  } else {
    await moveFirstOrderItemDown(page, orderHandles, canonicalOrderItemIds)
  }

  expect(await readOrderActivityItemIds(orderHandles)).toEqual(
    canonicalOrderItemIds
  )
  await submitAndContinue(page, "확인하기")

  await expectMobileLessonStep(
    page,
    7,
    page.getByRole("heading", { name: "문장 쓰기" })
  )
  await page.getByRole("textbox").fill("모바일에서도 명확한 문장을 작성합니다.")
  await submitAndContinue(page, "확인하기")

  await expectMobileLessonStep(
    page,
    8,
    page.getByRole("heading", { name: "AI 코칭" })
  )
  await page.getByRole("button", { name: "AI 코칭 받기" }).click()
  const aiNextButton = page.getByRole("button", {
    exact: true,
    name: "다음으로 →",
  })
  await expect(aiNextButton).toBeEnabled({ timeout: 30_000 })
  await aiNextButton.click()

  await expectMobileLessonStep(
    page,
    9,
    page.getByRole("heading", { name: "표현 연결" })
  )
  await page
    .getByRole("group", { name: "왼쪽 선택지" })
    .getByRole("button", { name: "따라서" })
    .click()
  await page
    .getByRole("group", { name: "오른쪽 선택지" })
    .getByRole("button", { name: "인과" })
    .click()
  await submitAndContinue(page, "확인하기")

  await expectMobileLessonStep(
    page,
    10,
    page.getByRole("heading", { name: "문장 역할 분류" })
  )
  await page.getByRole("button", { name: "주장" }).click()
  await page.getByRole("button", { name: "명확한 문장이 좋다." }).click()
  await page.getByRole("button", { name: "근거" }).click()
  await page.getByRole("button", { name: "독자가 한 번에 이해한다." }).click()
  await submitAndContinue(page, "확인하기")

  await expect(
    page.getByRole("heading", { name: "레슨을 완료했어요!" })
  ).toBeVisible()
}

async function expectMobileLessonStep(
  page: Page,
  stepNumber: number,
  marker: Locator
): Promise<void> {
  const viewport = page.viewportSize()
  expect(viewport).not.toBeNull()
  expect(viewport?.width).toBeLessThanOrEqual(430)
  await expect(marker).toBeVisible()
  await expect(
    page.getByText(`${stepNumber}/10`, { exact: true })
  ).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth
      )
    )
    .toBe(true)

  const actionFooter = page.getByRole("contentinfo", {
    name: "레슨 행동",
  })
  await expect(actionFooter).toBeVisible()
  const footerBox = await actionFooter.boundingBox()
  expect(footerBox).not.toBeNull()
  expect((footerBox?.y ?? 0) + (footerBox?.height ?? 0)).toBeLessThanOrEqual(
    (viewport?.height ?? 0) + 1
  )
}

async function moveFirstOrderItemDown(
  page: Page,
  orderHandles: Locator,
  expectedOrderItemIds: readonly string[]
): Promise<void> {
  const updatedOrderDraft = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      response.url().includes("/steps/e2e-image-order/draft")
  )
  await orderHandles.first().press("ArrowDown")
  await expect
    .poll(() => readOrderActivityItemIds(orderHandles))
    .toEqual(expectedOrderItemIds)

  const response = await updatedOrderDraft
  expect(response.status()).toBe(200)
  const body = saveLearnerStepDraftBodySchema.parse(
    response.request().postDataJSON()
  )
  expect(body.answer).toEqual({
    orderedItemIds: expectedOrderItemIds,
    type: "ORDER",
  })
  await expect(page.getByRole("status")).toHaveText("서버에 저장됨")
}

async function readOrderActivityItemIds(
  orderHandles: Locator
): Promise<readonly string[]> {
  const rows = orderHandles.locator("..")
  const texts = await Promise.all(
    Array.from({ length: await rows.count() }, (_, index) =>
      rows.nth(index).locator("span").last().innerText()
    )
  )
  return texts.map(readOrderActivityItemId)
}

function readOrderActivityItemId(text: string): string {
  const item = e2eAdminContentOrderItems.find(
    (candidate) => candidate.text === text
  )
  if (item === undefined) {
    throw new Error(`알 수 없는 ORDER 활동 항목입니다: ${text}`)
  }
  return item.id
}

function sameOrder(left: readonly string[], right: readonly string[]): boolean {
  return left.every((item, index) => item === right[index])
}

async function submitAndContinue(
  page: Page,
  actionName: "확인하기"
): Promise<void> {
  await page.getByRole("button", { exact: true, name: actionName }).click()
  await expect(page.getByText("완벽해요!", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "계속하기" }).click()
}

async function readAdminCourseEditor(
  page: Page,
  courseId: string
): Promise<AdminCourseEditorDocument> {
  const response = await page.request.get(
    `${adminWebOrigin}/api/admin/courses/${courseId}/editor`
  )
  expect(response.status()).toBe(200)
  return adminCourseEditorDocumentSchema.parse(await response.json())
}

function readReadingStep(editor: AdminCourseEditorDocument) {
  const step = editor.units[0]?.lessons[0]?.steps[0]
  if (step?.type !== "READING") {
    throw new Error("E2E fixture 첫 스텝이 READING이 아닙니다.")
  }
  return step
}

function waitForAssetUploadResponse(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      /\/api\/admin\/courses\/[^/]+\/assets$/u.test(response.url())
  )
}

function readCreatedCourseId(href: string | null): string {
  const match = href?.match(/^\/courses\/([^/?#]+)$/u)
  if (match?.[1] === undefined) {
    throw new Error("생성된 코스 링크에서 course ID를 읽을 수 없습니다.")
  }
  return decodeURIComponent(match[1])
}

async function readNaturalImageSize(
  page: Page,
  url: string
): Promise<{ readonly height: number; readonly width: number }> {
  const response = await page.request.get(url)
  expect(response.ok()).toBe(true)
  const contentType = response.headers()["content-type"]
  expect(contentType).toMatch(/^image\//u)
  const source = `data:${contentType};base64,${(await response.body()).toString("base64")}`

  return page.evaluate(async (imageSource) => {
    const image = new Image()
    image.src = imageSource
    await image.decode()
    return { height: image.naturalHeight, width: image.naturalWidth }
  }, source)
}

async function readRenderedImageWidth(
  image: ReturnType<Page["getByRole"]>
): Promise<number> {
  let width = 0
  await expect
    .poll(async () => {
      width = await image.evaluate((element) =>
        element instanceof HTMLImageElement ? element.naturalWidth : 0
      )
      return width
    })
    .toBeGreaterThan(0)
  return width
}

function assertPublishedDatabaseMutationRejected(
  curriculumVersionId: string
): void {
  const result = spawnSync(
    "bun",
    [
      "apps/api/src/scripts/assert-e2e-published-content-immutable.ts",
      curriculumVersionId,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: process.env,
      windowsHide: true,
    }
  )
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0)
}
