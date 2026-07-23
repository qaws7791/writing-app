import { expect, test } from "@playwright/test"

import { learnerWebOrigin, loginLearner } from "#e2e/auth"

test("UI style seam은 Typography, Markdown, Dialog 시각 계약을 유지한다", async ({
  page,
}) => {
  await loginLearner(page)
  await page.goto(`${learnerWebOrigin}/app/courses/c1`)
  await page.waitForLoadState("networkidle")
  await page.getByRole("link", { name: "학습 시작하기" }).click()
  await page.waitForLoadState("networkidle")
  await page.getByRole("button", { name: "시작하기" }).click()

  await page.addStyleTag({
    content:
      "*,*::before,*::after{animation:none!important;transition:none!important}",
  })
  await expect(
    page.getByRole("heading", { name: "명료성의 원칙" })
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "이해했어요" })).toBeVisible()
  await expect(page).toHaveScreenshot("typography-markdown.png")

  await page.getByRole("button", { name: "나가기" }).click()
  await expect(
    page.getByRole("alertdialog", { name: "학습을 중단할까요?" })
  ).toBeVisible()
  await expect(page).toHaveScreenshot("dialog.png")
})
