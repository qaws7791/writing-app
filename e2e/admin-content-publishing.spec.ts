import { spawnSync } from "node:child_process"

import {
  devices,
  type BrowserContextOptions,
  type Locator,
  type Page,
} from "@playwright/test"
import { adminContentAssetUploadDtoSchema } from "@workspace/contracts/content/admin-assets"
import {
  adminCourseDetailDtoSchema,
  adminCourseEditorDocumentSchema,
  adminCourseEditorWriteDocumentSchema,
  type AdminCourseEditorDocument,
  type AdminCourseEditorWriteDocument,
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

type OrderItem = Readonly<{ id: string; text: string }>

interface AdminContentDraft {
  readonly courseId: string
  readonly document: AdminCourseEditorWriteDocument
}

interface PublishedAdminContent {
  readonly courseId: string
  readonly orderItems: readonly OrderItem[]
  readonly orderStepId: string
  readonly readingAssetUrl: string
}

test.describe.configure({ mode: "parallel" })

test("관리자가 10개 활동과 이미지를 저장하고 첫 revision을 발행한다", async ({
  browser,
}) => {
  test.setTimeout(300_000)
  const adminContext = await browser.newContext()
  const adminDiagnostics = observeBrowserContext(adminContext)
  const adminPage = await adminContext.newPage()

  await loginAdmin(adminPage, "owner@example.test", { nextPath: "/courses" })
  const fixture = await createAdminContentDraft(adminPage, "publish")
  const { courseId } = fixture
  await adminPage.goto(
    `${adminWebOrigin}/courses/${encodeURIComponent(courseId)}`
  )
  await adminPage.getByRole("button", { name: "커리큘럼" }).click()
  const stepForms = adminPage.getByRole("list", { name: "스텝 편집 폼" })
  for (const activityType of e2eAdminContentActivityTypes) {
    await expect(
      stepForms.getByText(activityType, { exact: true })
    ).toBeVisible()
  }

  await adminPage.getByRole("button", { name: "강의 정보" }).click()
  await adminPage.setViewportSize({ height: 844, width: 390 })
  const coverField = adminPage.locator('section[aria-label="코스 표지"]')
  await coverField.getByLabel("이미지 파일").setInputFiles(imageFile)
  await coverField.getByLabel("대체 텍스트").fill("리비전 1 코스 표지")
  await coverField.getByRole("button", { name: "이미지 업로드" }).click()
  await expect(
    coverField.getByRole("img", { name: "리비전 1 코스 표지" })
  ).toBeVisible()

  await adminPage.getByRole("button", { name: "변경 저장" }).click()
  await expect(adminPage.getByText("코스를 저장했습니다.")).toBeVisible()
  await adminPage.reload()
  await expect(
    adminPage.getByRole("img", { name: "리비전 1 코스 표지" })
  ).toBeVisible()
  const coverReloadedEditor = await readAdminCourseEditor(adminPage, courseId)
  const coverAsset = coverReloadedEditor.assets.find(
    (asset) => asset.id === coverReloadedEditor.coverAssetId
  )
  expect(coverAsset).toMatchObject({
    altText: "리비전 1 코스 표지",
    kind: "course-cover",
  })
  if (coverAsset === undefined)
    throw new Error("코스 표지가 저장되지 않았습니다.")
  expect(await readNaturalImageSize(adminPage, coverAsset.url)).toEqual({
    height: 900,
    width: 1600,
  })

  await adminPage.setViewportSize({ height: 720, width: 1280 })
  await adminPage.getByRole("button", { name: "커리큘럼" }).click()
  const readingField = adminPage.locator('section[aria-label="읽기 삽화"]')
  await readingField.getByLabel("이미지 파일").setInputFiles(imageFile)
  await readingField.getByLabel("대체 텍스트").fill("리비전 1 읽기 삽화")
  await readingField.getByRole("button", { name: "이미지 업로드" }).click()
  await expect(
    readingField.getByRole("img", { name: "리비전 1 읽기 삽화" })
  ).toBeVisible()
  await adminPage.getByRole("button", { name: "변경 저장" }).click()
  await expect(adminPage.getByText("코스를 저장했습니다.")).toBeVisible()
  await adminPage.reload()
  await adminPage.getByRole("button", { name: "커리큘럼" }).click()
  await expect(
    adminPage.getByRole("img", { name: "리비전 1 읽기 삽화" })
  ).toBeVisible()
  const imageReloadedEditor = await readAdminCourseEditor(adminPage, courseId)
  const readingAssetId =
    readReadingStep(imageReloadedEditor).illustrationAssetId
  const readingAsset = imageReloadedEditor.assets.find(
    (asset) => asset.id === readingAssetId
  )
  expect(readingAsset).toMatchObject({
    altText: "리비전 1 읽기 삽화",
    kind: "reading-illustration",
  })
  if (readingAsset === undefined) {
    throw new Error("읽기 삽화가 저장되지 않았습니다.")
  }
  expect(await readNaturalImageSize(adminPage, readingAsset.url)).toEqual({
    height: 1,
    width: 1,
  })

  await adminPage.getByRole("button", { name: "초안 발행" }).click()
  await adminPage
    .getByRole("alertdialog", { name: "현재 초안을 발행할까요?" })
    .getByRole("button", { name: "발행하기" })
    .click()
  await expect(adminPage.getByText("리비전 1을 발행했습니다.")).toBeVisible()
  const revisionTwoDraft = await readAdminCourseEditor(adminPage, courseId)
  expect(revisionTwoDraft.revision).toBe(2)

  const publishedApiMutation = await adminPage.request.post(
    `${adminWebOrigin}/api/admin/courses/${courseId}/assets`,
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
  adminDiagnostics.expectNoIssues()
  await adminContext.close()
})

test("새 발행 뒤에도 기존 학습자는 시작한 revision에 고정된다", async ({
  browser,
}) => {
  test.setTimeout(300_000)
  const adminContext = await browser.newContext()
  const adminDiagnostics = observeBrowserContext(adminContext)
  const adminPage = await adminContext.newPage()
  await loginAdmin(adminPage, "owner@example.test", { nextPath: "/courses" })
  const fixture = await createPublishedAdminContent(adminPage, "revision")
  const { courseId, readingAssetUrl } = fixture
  const learnerContext = await browser.newContext(learnerMobileContextOptions)
  const learnerDiagnostics = observeBrowserContext(learnerContext)
  const learnerPage = await learnerContext.newPage()
  await loginLearner(learnerPage)
  await learnerPage.goto(
    `${learnerWebOrigin}/app/courses/${encodeURIComponent(courseId)}`
  )
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
      decodeURIComponent(response.url()).includes(readingAssetUrl)
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
    `${adminWebOrigin}/courses/${encodeURIComponent(courseId)}`
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
  await revisionTwoImageField
    .getByRole("button", { name: "이미지 교체" })
    .click()
  await expect(
    revisionTwoImageField.getByRole("img", {
      name: "리비전 2 읽기 삽화",
    })
  ).toBeVisible()
  await adminPage.getByRole("button", { name: "변경 저장" }).click()
  await expect(adminPage.getByText("코스를 저장했습니다.")).toBeVisible()
  await adminPage.getByRole("button", { name: "초안 발행" }).click()
  await adminPage
    .getByRole("alertdialog", { name: "현재 초안을 발행할까요?" })
    .getByRole("button", { name: "발행하기" })
    .click()
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

  learnerDiagnostics.expectNoIssues()
  adminDiagnostics.expectNoIssues()
  await learnerContext.close()
  await adminContext.close()
})

test("학습자가 모바일에서 10개 활동 유형을 완료한다", async ({ browser }) => {
  test.setTimeout(300_000)
  const adminContext = await browser.newContext()
  const adminDiagnostics = observeBrowserContext(adminContext)
  const adminPage = await adminContext.newPage()
  await loginAdmin(adminPage, "owner@example.test", { nextPath: "/courses" })
  const fixture = await createPublishedAdminContent(adminPage, "activities")
  adminDiagnostics.expectNoIssues()
  await adminContext.close()

  const learnerContext = await browser.newContext(learnerMobileContextOptions)
  const learnerDiagnostics = observeBrowserContext(learnerContext)
  const learnerPage = await learnerContext.newPage()
  await loginLearner(
    learnerPage,
    `/app/courses/${encodeURIComponent(fixture.courseId)}`
  )
  await learnerPage.getByRole("link", { name: "학습 시작하기" }).click()
  const startButton = learnerPage.getByRole("button", { name: "시작하기" })
  await expect(startButton).toBeEnabled()
  await startButton.click()
  await completeAllMobileActivityTypes(learnerPage, fixture)
  learnerDiagnostics.expectNoIssues()
  await learnerContext.close()
})

async function createAdminContentDraft(
  page: Page,
  idNamespace: string
): Promise<AdminContentDraft> {
  const createResponse = await page.request.post(
    `${adminWebOrigin}/api/admin/courses`,
    { headers: { Origin: adminWebOrigin } }
  )
  expect(createResponse.status()).toBe(200)
  const course = adminCourseDetailDtoSchema.parse(await createResponse.json())
  const initialEditor = await readAdminCourseEditor(page, course.id)
  const document = createE2eAdminContentFixture(initialEditor, idNamespace)
  expect(document.units[0]?.lessons[0]?.steps.map((step) => step.type)).toEqual(
    e2eAdminContentActivityTypes
  )
  const saveResponse = await page.request.put(
    `${adminWebOrigin}/api/admin/courses/${course.id}/editor`,
    {
      data: adminCourseEditorWriteDocumentSchema.parse(document),
      headers: {
        "If-Match": `"${initialEditor.editVersion}"`,
        Origin: adminWebOrigin,
      },
    }
  )
  expect(saveResponse.status()).toBe(200)
  return { courseId: course.id, document }
}

async function createPublishedAdminContent(
  page: Page,
  idNamespace: string
): Promise<PublishedAdminContent> {
  const draft = await createAdminContentDraft(page, idNamespace)
  const editor = await readAdminCourseEditor(page, draft.courseId)
  const coverAsset = await uploadContentAsset(page, {
    altText: "리비전 1 코스 표지",
    courseId: draft.courseId,
    curriculumVersionId: editor.curriculumVersionId,
    kind: "course-cover",
  })
  const readingAsset = await uploadContentAsset(page, {
    altText: "리비전 1 읽기 삽화",
    courseId: draft.courseId,
    curriculumVersionId: editor.curriculumVersionId,
    kind: "reading-illustration",
  })
  const editorWithAssets = await readAdminCourseEditor(page, draft.courseId)
  const { assets: _assets, ...currentDocument } = editorWithAssets
  const document = adminCourseEditorWriteDocumentSchema.parse({
    ...currentDocument,
    coverAssetId: coverAsset.id,
    units: currentDocument.units.map((unit) => ({
      ...unit,
      lessons: unit.lessons.map((lesson) => ({
        ...lesson,
        steps: lesson.steps.map((step) =>
          step.type === "READING"
            ? { ...step, illustrationAssetId: readingAsset.id }
            : step
        ),
      })),
    })),
  })
  const saveResponse = await page.request.put(
    `${adminWebOrigin}/api/admin/courses/${draft.courseId}/editor`,
    {
      data: document,
      headers: {
        "If-Match": `"${editorWithAssets.editVersion}"`,
        Origin: adminWebOrigin,
      },
    }
  )
  expect(saveResponse.status()).toBe(200)
  const savedEditor = await readAdminCourseEditor(page, draft.courseId)
  const publishResponse = await page.request.post(
    `${adminWebOrigin}/api/admin/courses/${draft.courseId}/publish`,
    {
      headers: {
        "If-Match": `"${savedEditor.editVersion}"`,
        Origin: adminWebOrigin,
      },
    }
  )
  expect(publishResponse.status()).toBe(200)

  const lesson = document.units[0]?.lessons[0]
  const orderStep = lesson?.steps.find((step) => step.type === "ORDER")
  if (lesson === undefined || orderStep?.type !== "ORDER") {
    throw new Error("E2E 관리자 콘텐츠 fixture 구조가 올바르지 않습니다.")
  }
  const orderItems = orderStep.items.map((text, index) => {
    const id = orderStep.itemIds[index]
    if (id === undefined) {
      throw new Error("E2E ORDER fixture 항목 ID가 없습니다.")
    }
    return { id, text }
  })
  return {
    courseId: draft.courseId,
    orderItems,
    orderStepId: orderStep.id,
    readingAssetUrl: readingAsset.url,
  }
}

async function uploadContentAsset(
  page: Page,
  input: Readonly<{
    altText: string
    courseId: string
    curriculumVersionId: string
    kind: "course-cover" | "reading-illustration"
  }>
) {
  const response = await page.request.post(
    `${adminWebOrigin}/api/admin/courses/${input.courseId}/assets`,
    {
      headers: { Origin: adminWebOrigin },
      multipart: {
        altText: input.altText,
        curriculumVersionId: input.curriculumVersionId,
        file: imageFile,
        kind: input.kind,
      },
    }
  )
  expect(response.status()).toBe(200)
  return adminContentAssetUploadDtoSchema.parse(await response.json())
}

async function completeAllMobileActivityTypes(
  page: Page,
  fixture: PublishedAdminContent
): Promise<void> {
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
  const canonicalOrderItemIds = fixture.orderItems.map((item) => item.id)
  const initialOrderItemIds = await readOrderActivityItemIds(
    orderHandles,
    fixture.orderItems
  )
  expect(initialOrderItemIds.toSorted()).toEqual(
    canonicalOrderItemIds.toSorted()
  )

  const reversedCanonicalOrderItemIds = canonicalOrderItemIds.toReversed()
  if (sameOrder(initialOrderItemIds, canonicalOrderItemIds)) {
    await moveFirstOrderItemDown(
      page,
      orderHandles,
      reversedCanonicalOrderItemIds,
      fixture.orderStepId,
      fixture.orderItems
    )
    await moveFirstOrderItemDown(
      page,
      orderHandles,
      canonicalOrderItemIds,
      fixture.orderStepId,
      fixture.orderItems
    )
  } else {
    await moveFirstOrderItemDown(
      page,
      orderHandles,
      canonicalOrderItemIds,
      fixture.orderStepId,
      fixture.orderItems
    )
  }

  expect(
    await readOrderActivityItemIds(orderHandles, fixture.orderItems)
  ).toEqual(canonicalOrderItemIds)
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
  expectedOrderItemIds: readonly string[],
  orderStepId: string,
  orderItems: readonly OrderItem[]
): Promise<void> {
  const updatedOrderDraft = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      response.url().includes(`/steps/${encodeURIComponent(orderStepId)}/draft`)
  )
  await orderHandles.first().press("ArrowDown")
  await expect
    .poll(() => readOrderActivityItemIds(orderHandles, orderItems))
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
  orderHandles: Locator,
  orderItems: readonly OrderItem[]
): Promise<readonly string[]> {
  const rows = orderHandles.locator("..")
  const texts = await Promise.all(
    Array.from({ length: await rows.count() }, (_, index) =>
      rows.nth(index).locator("span").last().innerText()
    )
  )
  return texts.map((text) => readOrderActivityItemId(text, orderItems))
}

function readOrderActivityItemId(
  text: string,
  orderItems: readonly OrderItem[]
): string {
  const item = orderItems.find((candidate) => candidate.text === text)
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
      "apps/api/src/test-support/assert-e2e-published-content-immutable.ts",
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
