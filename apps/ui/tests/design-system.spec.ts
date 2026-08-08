import { expect, test } from "@playwright/test";
import axe from "axe-core";

import inventory from "../src/lib/design-system-inventory.json" with { type: "json" };

declare global {
  interface Window {
    axe: Pick<typeof axe, "run">;
  }
}

const ciModules = inventory.modules.filter((module) => module.hasCiTest);

test.describe("실행 가능한 디자인 시스템 문서", () => {
  for (const module of ciModules) {
    test(`${module.title} render와 접근성`, async ({ page }) => {
      const target =
        module.title === "Foundations/Color"
          ? module.stories.find((story) => story.exportName === "ContrastPairs")!
          : module.stories[0];
      const [path, hash] = target.destination.split("#");

      await page.goto(path);
      const contract = page.locator(`#${hash}`);
      await expect(contract).toBeVisible();
      await expect(contract.locator("[data-preview-loading]")).toHaveCount(0);
      await page.addScriptTag({ content: axe.source });
      const results = await page.evaluate(
        async (selector) => window.axe.run({ include: [[selector]] }),
        `#${hash}`,
      );

      expect(
        results.violations,
        results.violations.map((violation) => `${violation.id}: ${violation.help}`).join("\n"),
      ).toEqual([]);
    });
  }
});

test.describe("Keyboard와 상태 전이", () => {
  test("accordion을 펼친다", async ({ page }) => {
    await page.goto("/preview/interactions/accordion");
    await page.getByRole("button", { name: "확인할 항목" }).click();
    await expect(page.getByText("클릭하면 표시되는 내용이다.")).toBeVisible();
  });

  test("alert dialog를 열고 취소한다", async ({ page }) => {
    await page.goto("/preview/interactions/alert-dialog");
    const trigger = page.getByRole("button", { name: "인터랙션 테스트" });
    await trigger.click();
    await expect(page.getByRole("heading", { name: "중요 알림" })).toBeVisible();
    await page.getByRole("button", { name: "취소" }).click();
    await expect(page.getByRole("heading", { name: "중요 알림" })).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("dialog를 열고 취소한다", async ({ page }) => {
    await page.goto("/preview/interactions/dialog");
    const trigger = page.getByRole("button", { name: "프로필 수정" });
    await trigger.click();
    await expect(page.getByRole("heading", { name: "프로필을 수정할까요?" })).toBeVisible();
    await page.getByRole("button", { name: "취소" }).click();
    await expect(page.getByRole("heading", { name: "프로필을 수정할까요?" })).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("dropdown menu item을 선택하면 menu를 닫는다", async ({ page }) => {
    await page.goto("/preview/interactions/dropdown-menu");
    await page.getByRole("button", { name: "메뉴 열기" }).click();
    const profile = page.getByRole("menuitem", { name: "프로필" });
    await expect(profile).toBeVisible();
    await page.getByRole("menuitem", { name: "설정" }).click();
    await expect(profile).toBeHidden();
  });

  test("오류 field의 설명과 invalid 상태를 연결한다", async ({ page }) => {
    await page.goto("/preview/interactions/field");
    const input = page.getByRole("textbox", { name: "제목" });
    await expect(input).toHaveAccessibleDescription(
      /저장 전 사용자에게 보이는 이름을 확인한다\.[\s\S]*제목은 비워둘 수 없다\./u,
    );
    await expect(input).toHaveAttribute("aria-invalid", "true");
  });

  test("popover를 Escape로 닫고 trigger에 focus를 돌려준다", async ({ page }) => {
    await page.goto("/preview/interactions/popover");
    const trigger = page.getByRole("button", { name: "학습 도움말" });
    await trigger.click();
    await expect(page.getByText("문장의 중심 찾기")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText("문장의 중심 찾기")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("progress의 이름과 현재 값을 노출한다", async ({ page }) => {
    await page.goto("/preview/interactions/progress");
    await expect(page.getByRole("progressbar", { name: "전체 코스 진행률" })).toHaveAttribute(
      "aria-valuenow",
      "58",
    );
  });

  test("select option을 선택한다", async ({ page }) => {
    await page.goto("/preview/interactions/select");
    const trigger = page.getByRole("combobox", { name: "상태" });
    await trigger.click();
    await page.getByRole("option", { name: "공개" }).click();
    await expect(trigger).toContainText("공개");
  });

  test("tab을 Enter로 활성화한다", async ({ page }) => {
    await page.goto("/preview/interactions/tabs");
    const completed = page.getByRole("tab", { name: "완료" });
    await completed.focus();
    await page.keyboard.press("Enter");
    await expect(completed).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("완료한 학습 목록")).toBeVisible();
  });
});

test("theme, motion과 5개 viewport로 격리 미리보기를 바꾼다", async ({ page }) => {
  await page.goto("/docs/components/button");

  const theme = page.getByRole("combobox", { name: "미리보기 테마" });
  const motion = page.getByRole("combobox", { name: "미리보기 모션" });
  const viewport = page.getByRole("combobox", { name: "미리보기 뷰포트" });
  const frame = page.getByTitle(/Button .* 미리보기/u);

  await expect(viewport.locator("option")).toHaveText([
    "Mobile S · 360×800",
    "Mobile L · 430×932",
    "Tablet · 834×1112",
    "Desktop · 1280×900",
    "Wide · 1440×1000",
  ]);

  await theme.selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/dark/u);
  await expect(frame).toHaveAttribute("src", /theme=dark&motion=full/u);

  await motion.selectOption("reduced");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(frame).toHaveAttribute("src", /theme=dark&motion=reduced/u);

  await viewport.selectOption("wide");
  await expect(page.getByLabel("1440×1000 CSS px 미리보기 영역")).toBeVisible();
  await expect(frame).toHaveAttribute("width", "1440");
  await expect(frame).toHaveAttribute("height", "1000");
});
