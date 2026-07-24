import type { Locator, Page } from "@playwright/test"

import {
  adminWebOrigin,
  learnerWebOrigin,
  loginAdmin,
  loginLearner,
} from "#e2e/auth"
import { expect, test } from "#e2e/test"

const disableMotion =
  "*,*::before,*::after{animation:none!important;transition:none!important}"

type CssCustomProperty = `--${string}`

type ContrastPair = Readonly<{
  backgroundToken: CssCustomProperty
  foregroundToken: CssCustomProperty
  minimumRatio: 3 | 4.5
  name: string
}>

const semanticContrastPairs = [
  {
    backgroundToken: "--bg-canvas",
    foregroundToken: "--fg-default",
    minimumRatio: 4.5,
    name: "기본 본문",
  },
  {
    backgroundToken: "--bg-canvas",
    foregroundToken: "--fg-muted",
    minimumRatio: 4.5,
    name: "보조 본문",
  },
  {
    backgroundToken: "--action-primary-bg",
    foregroundToken: "--action-primary-fg",
    minimumRatio: 4.5,
    name: "주요 행동",
  },
  {
    backgroundToken: "--action-selected-bg",
    foregroundToken: "--action-selected-fg",
    minimumRatio: 4.5,
    name: "선택 행동",
  },
  {
    backgroundToken: "--success-bg",
    foregroundToken: "--success-fg",
    minimumRatio: 4.5,
    name: "성공 상태",
  },
  {
    backgroundToken: "--danger-bg",
    foregroundToken: "--danger-fg",
    minimumRatio: 4.5,
    name: "위험 상태",
  },
  {
    backgroundToken: "--info-bg",
    foregroundToken: "--info-fg",
    minimumRatio: 4.5,
    name: "정보 상태",
  },
] as const satisfies readonly ContrastPair[]

const chartContrastPairs = [
  {
    backgroundToken: "--surface",
    foregroundToken: "--chart-1",
    minimumRatio: 3,
    name: "차트 계열 1",
  },
  {
    backgroundToken: "--surface",
    foregroundToken: "--chart-2",
    minimumRatio: 3,
    name: "차트 계열 2",
  },
  {
    backgroundToken: "--surface",
    foregroundToken: "--chart-3",
    minimumRatio: 3,
    name: "차트 계열 3",
  },
  {
    backgroundToken: "--surface",
    foregroundToken: "--chart-4",
    minimumRatio: 3,
    name: "차트 계열 4",
  },
  {
    backgroundToken: "--surface",
    foregroundToken: "--chart-5",
    minimumRatio: 4.5,
    name: "차트 축 텍스트",
  },
  {
    backgroundToken: "--bg-elevated",
    foregroundToken: "--fg-default",
    minimumRatio: 4.5,
    name: "차트 툴팁 본문",
  },
  {
    backgroundToken: "--bg-elevated",
    foregroundToken: "--fg-muted",
    minimumRatio: 4.5,
    name: "차트 툴팁 라벨",
  },
] as const satisfies readonly ContrastPair[]

test("공개 랜딩은 라이트와 다크 테마 시각 계약을 유지한다", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto(learnerWebOrigin)
  await page.addStyleTag({ content: disableMotion })
  await expect(page.locator("html")).toHaveClass(/light/)
  await expectSemanticTokenContrast(page, semanticContrastPairs)
  const featuredCourseImage = page.getByRole("img", {
    name: "글쓰기 첫걸음 30일",
  })
  await expectImageLoaded(featuredCourseImage)
  const landingClip = await readPageClip(page)
  await expect(page).toHaveScreenshot("web-landing-light.png", {
    clip: landingClip,
  })

  await page.emulateMedia({ colorScheme: "dark" })
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expectImageLoaded(featuredCourseImage)
  await expectSemanticTokenContrast(page, semanticContrastPairs)
  await expect(page).toHaveScreenshot("web-landing-dark.png", {
    clip: landingClip,
  })
})

test("학습자 프로필은 라이트와 다크 테마 시각 계약을 유지한다", async ({
  page,
}) => {
  await loginLearner(page, "/app/profile")
  await page.addStyleTag({ content: disableMotion })

  const lightThemeButton = page.getByRole("button", { name: "라이트" })
  await expect(lightThemeButton).toBeEnabled()
  await lightThemeButton.click()
  await expect(page.locator("html")).toHaveClass(/light/)
  await expect(page).toHaveScreenshot("web-profile-light.png", {
    caret: "initial",
  })

  const darkThemeButton = page.getByRole("button", { name: "다크" })
  await expect(darkThemeButton).toBeEnabled()
  await darkThemeButton.click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(page).toHaveScreenshot("web-profile-dark.png", {
    caret: "initial",
  })
})

test("어드민 대시보드는 라이트와 다크 테마 시각 계약을 유지한다", async ({
  page,
}) => {
  await loginAdmin(page, "owner@example.test")
  await page.addStyleTag({ content: disableMotion })

  const themeControls = page
    .getByRole("complementary")
    .getByRole("group", { name: "화면 테마" })

  const lightThemeButton = themeControls.getByRole("button", {
    name: "라이트",
  })
  await expect(lightThemeButton).toBeEnabled()
  await lightThemeButton.click()
  await expect(page.locator("html")).toHaveClass(/light/)
  await expect(page).toHaveScreenshot("admin-dashboard-light.png")

  const darkThemeButton = themeControls.getByRole("button", { name: "다크" })
  await expect(darkThemeButton).toBeEnabled()
  await darkThemeButton.click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(page).toHaveScreenshot("admin-dashboard-dark.png")
})

test("어드민 분석은 라이트와 다크 테마 시각 계약을 유지한다", async ({
  page,
}) => {
  await loginAdmin(page, "owner@example.test", { nextPath: "/analytics" })
  await page.addStyleTag({ content: disableMotion })
  await expect(
    page.getByRole("heading", { exact: true, name: "분석" })
  ).toBeVisible()

  const themeControls = page
    .getByRole("complementary")
    .getByRole("group", { name: "화면 테마" })

  const lightThemeButton = themeControls.getByRole("button", {
    name: "라이트",
  })
  await expect(lightThemeButton).toBeEnabled()
  await lightThemeButton.click()
  await expect(page.locator("html")).toHaveClass(/light/)
  await expectSemanticTokenContrast(page, chartContrastPairs)
  await expect(page).toHaveScreenshot("admin-analytics-light.png")

  const darkThemeButton = themeControls.getByRole("button", { name: "다크" })
  await expect(darkThemeButton).toBeEnabled()
  await darkThemeButton.click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expectSemanticTokenContrast(page, chartContrastPairs)
  await expect(page).toHaveScreenshot("admin-analytics-dark.png")

  await expect(page).toHaveURL(`${adminWebOrigin}/analytics`)
})

async function expectImageLoaded(image: Locator): Promise<void> {
  await image.evaluate((element) => {
    if (element instanceof HTMLImageElement) {
      element.loading = "eager"
    }
  })
  await expect(image).toHaveAttribute("loading", "eager")
  await expect
    .poll(() =>
      image.evaluate(
        (element) =>
          element instanceof HTMLImageElement &&
          element.complete &&
          element.naturalWidth > 0
      )
    )
    .toBe(true)
}

async function readPageClip(page: Page) {
  return page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    width: document.documentElement.scrollWidth,
    x: 0,
    y: 0,
  }))
}

async function expectSemanticTokenContrast(
  page: Page,
  contrastPairs: readonly ContrastPair[]
): Promise<void> {
  const customProperties = [
    ...new Set(
      contrastPairs.flatMap(({ backgroundToken, foregroundToken }) => [
        backgroundToken,
        foregroundToken,
      ])
    ),
  ]
  const resolvedColors = await page.evaluate((tokens) => {
    const rootStyle = getComputedStyle(document.documentElement)
    const probe = document.createElement("span")
    probe.setAttribute("aria-hidden", "true")
    probe.style.cssText = "position:fixed;visibility:hidden;pointer-events:none"
    document.body.append(probe)

    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext("2d", { willReadFrequently: true })

    if (context === null) {
      throw new Error("색상 대비 계산용 canvas context를 만들 수 없습니다.")
    }

    const entries = tokens.map((token) => {
      const value = rootStyle.getPropertyValue(token).trim()

      if (value.length === 0) {
        throw new Error(`CSS custom property ${token}이 계산되지 않았습니다.`)
      }

      probe.style.color = `var(${token})`
      const computed = getComputedStyle(probe).color
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = computed
      context.fillRect(0, 0, 1, 1)
      const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data

      if (alpha !== 255) {
        throw new Error(
          `CSS custom property ${token}은 불투명 색상이 아닙니다.`
        )
      }

      return [
        token,
        {
          blue,
          computed,
          green,
          red,
          value,
        },
      ] as const
    })

    probe.remove()

    return Object.fromEntries(entries) as Record<
      string,
      {
        blue: number
        computed: string
        green: number
        red: number
        value: string
      }
    >
  }, customProperties)

  for (const pair of contrastPairs) {
    const background = resolvedColors[pair.backgroundToken]
    const foreground = resolvedColors[pair.foregroundToken]

    if (background === undefined || foreground === undefined) {
      throw new Error(`${pair.name} 대비 토큰을 읽지 못했습니다.`)
    }

    const ratio = getContrastRatio(foreground, background)
    const evidence = [
      pair.name,
      `${pair.foregroundToken}=${foreground.value} (${foreground.computed})`,
      `${pair.backgroundToken}=${background.value} (${background.computed})`,
    ].join(" / ")

    expect(ratio, evidence).toBeGreaterThanOrEqual(pair.minimumRatio)
  }
}

function getContrastRatio(
  foreground: Readonly<{ blue: number; green: number; red: number }>,
  background: Readonly<{ blue: number; green: number; red: number }>
): number {
  const foregroundLuminance = getRelativeLuminance(foreground)
  const backgroundLuminance = getRelativeLuminance(background)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

function getRelativeLuminance({
  blue,
  green,
  red,
}: Readonly<{ blue: number; green: number; red: number }>): number {
  const normalize = (channel: number) => {
    const value = channel / 255

    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  return (
    0.2126 * normalize(red) +
    0.7152 * normalize(green) +
    0.0722 * normalize(blue)
  )
}
