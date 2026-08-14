import { expect, test } from "@playwright/test";
import axe from "axe-core";

declare global {
  interface Window {
    axe: Pick<typeof axe, "run">;
  }
}

test("alert dialog는 열린 상태에서도 접근성 위반이 없다", async ({ page }) => {
  await page.goto("/preview/interactions/alert-dialog");
  await page.getByRole("button", { name: "인터랙션 테스트" }).click();
  await expect(page.getByRole("heading", { name: "중요 알림" })).toBeVisible();
  await page.addScriptTag({ content: axe.source });

  const results = await page.evaluate(async () => window.axe.run());

  expect(
    results.violations,
    results.violations.map((violation) => `${violation.id}: ${violation.help}`).join("\n"),
  ).toEqual([]);
});

test("alert dialog를 취소하면 trigger로 focus가 돌아온다", async ({ page }) => {
  await page.goto("/preview/interactions/alert-dialog");
  const trigger = page.getByRole("button", { name: "인터랙션 테스트" });
  await trigger.click();

  await page.getByRole("button", { name: "취소" }).click();

  await expect(page.getByRole("heading", { name: "중요 알림" })).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("popover를 Escape로 닫으면 trigger로 focus가 돌아온다", async ({ page }) => {
  await page.goto("/preview/interactions/popover");
  const trigger = page.getByRole("button", { name: "학습 도움말" });
  await trigger.click();

  await page.keyboard.press("Escape");

  await expect(page.getByText("문장의 중심 찾기")).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("focus한 tab을 Enter로 활성화한다", async ({ page }) => {
  await page.goto("/preview/interactions/tabs");
  const completed = page.getByRole("tab", { name: "완료" });
  await completed.focus();

  await page.keyboard.press("Enter");

  await expect(completed).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("완료한 학습 목록")).toBeVisible();
});

test("compose canvas는 평문을 전달하고 Tab으로 에디터를 나간다", async ({ page }) => {
  await page.goto("/preview/interactions/compose-canvas");
  const editor = page.getByRole("textbox", { name: "본문" });
  await editor.click();
  await page.keyboard.type("첫번째 문단");

  await expect(page.getByTestId("compose-canvas-value")).toHaveText("첫번째 문단");

  await page.keyboard.press("Tab");

  await expect(page.getByTestId("compose-canvas-value")).toHaveText("첫번째 문단");
  await expect(editor).not.toBeFocused();
});
