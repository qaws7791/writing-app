import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { chromium } from "@playwright/test"

const KWEP_BASE = "http://localhost:5173"
const WEB_BASE = "http://localhost:3000"
const OUTPUT_DIR = path.join("output", "playwright", "kwep-web-theme-compare")

const THEMES = ["light", "dark"]
const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]

const SCREENS = [
  { id: "landing", kwepPath: "/", webPath: "/", needsAuth: false },
  { id: "login", kwepPath: "/login", webPath: "/login", needsAuth: false },
  { id: "home", kwepPath: "/home", webPath: "/app", needsAuth: true },
  {
    id: "courses",
    kwepPath: "/learn",
    webPath: "/app/courses",
    needsAuth: true,
  },
  {
    id: "course-detail",
    kwepPath: "/course/c1",
    webPath: "/app/courses/c1",
    needsAuth: true,
  },
  {
    id: "profile",
    kwepPath: "/profile",
    webPath: "/app/profile",
    needsAuth: true,
  },
  {
    id: "lesson",
    kwepPath: "/lesson/c1/l1",
    webPath: "/app/lesson?lesson_id=l1",
    needsAuth: true,
  },
]

function parseRgb(color) {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function colorDistance(a, b) {
  const rgbA = parseRgb(a)
  const rgbB = parseRgb(b)
  if (!rgbA || !rgbB) return null
  return Math.sqrt(
    (rgbA[0] - rgbB[0]) ** 2 +
      (rgbA[1] - rgbB[1]) ** 2 +
      (rgbA[2] - rgbB[2]) ** 2
  )
}

async function applyTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem("theme", t)
    const root = document.documentElement
    root.classList.remove("light", "dark")
    if (t === "dark") root.classList.add("dark")
    root.style.colorScheme = t
  }, theme)
}

async function extractFingerprint(page) {
  return page.evaluate(() => {
    const body = document.body
    const html = document.documentElement
    const bodyStyle = getComputedStyle(body)
    const htmlStyle = getComputedStyle(html)

    const headings = [...document.querySelectorAll("h1, h2, h3")]
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.replace(/\s+/g, " ").trim() ?? "",
        color: getComputedStyle(el).color,
      }))
      .filter((item) => item.text.length > 0)
      .slice(0, 12)

    const buttons = [
      ...document.querySelectorAll("button, a.btn, [data-slot='button']"),
    ]
      .slice(0, 12)
      .map((el) => {
        const style = getComputedStyle(el)
        return {
          text: el.textContent?.replace(/\s+/g, " ").trim().slice(0, 48) ?? "",
          backgroundColor: style.backgroundColor,
          borderRadius: style.borderRadius,
          color: style.color,
        }
      })
      .filter((item) => item.text.length > 0)

    return {
      htmlClass: html.className,
      colorScheme: htmlStyle.colorScheme,
      title: document.title,
      bodyBackground:
        htmlStyle.backgroundColor !== "rgba(0, 0, 0, 0)"
          ? htmlStyle.backgroundColor
          : bodyStyle.backgroundColor,
      bodyColor: bodyStyle.color,
      sectionCount: document.querySelectorAll("section").length,
      headings,
      buttons,
      mainPreview: (document.querySelector("main")?.innerText ?? body.innerText)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 300),
    }
  })
}

function compareFingerprints(kwep, web, screenId) {
  const issues = []
  const notes = []

  if (kwep.colorScheme !== web.colorScheme) {
    issues.push(
      `color-scheme 불일치 (Kwep=${kwep.colorScheme}, Web=${web.colorScheme})`
    )
  }

  const bgDistance = colorDistance(kwep.bodyBackground, web.bodyBackground)
  if (bgDistance !== null && bgDistance > 8) {
    issues.push(
      `배경색 차이 (Kwep=${kwep.bodyBackground}, Web=${web.bodyBackground}, Δ=${bgDistance.toFixed(1)})`
    )
  } else if (bgDistance !== null && bgDistance > 0) {
    notes.push(`배경색 미세 차이 (Δ=${bgDistance.toFixed(1)})`)
  } else {
    notes.push("배경색 일치")
  }

  const textDistance = colorDistance(kwep.bodyColor, web.bodyColor)
  if (textDistance !== null && textDistance > 8) {
    issues.push(
      `본문 텍스트색 차이 (Kwep=${kwep.bodyColor}, Web=${web.bodyColor}, Δ=${textDistance.toFixed(1)})`
    )
  }

  const kwepH1 = kwep.headings.find((h) => h.tag === "h1")
  const webH1 = web.headings.find((h) => h.tag === "h1")
  if (kwepH1 && webH1) {
    if (
      kwepH1.text.replace(/\.$/, "") !== webH1.text.replace(/\.$/, "") &&
      screenId !== "home"
    ) {
      issues.push(
        `h1 텍스트 불일치 (Kwep='${kwepH1.text}', Web='${webH1.text}')`
      )
    }
    const h1ColorDist = colorDistance(kwepH1.color, webH1.color)
    if (h1ColorDist !== null && h1ColorDist > 8) {
      issues.push(`h1 색상 차이 (Kwep=${kwepH1.color}, Web=${webH1.color})`)
    }
  }

  const kwepHeadingTexts = new Set(kwep.headings.map((h) => h.text))
  const webHeadingTexts = new Set(web.headings.map((h) => h.text))
  const sharedHeadings = [...kwepHeadingTexts].filter((t) =>
    webHeadingTexts.has(t)
  )
  if (
    kwep.headings.length > 0 &&
    sharedHeadings.length === 0 &&
    screenId !== "lesson"
  ) {
    issues.push("공통 heading 없음")
  } else if (sharedHeadings.length > 0) {
    notes.push(`공통 heading ${sharedHeadings.length}개`)
  }

  if (screenId === "login") {
    const kwepGoogle = kwep.buttons.find((b) => b.text.includes("Google"))
    const webGoogle = web.buttons.find((b) => b.text.includes("Google"))
    if (kwepGoogle && webGoogle) {
      const bgDist = colorDistance(
        kwepGoogle.backgroundColor,
        webGoogle.backgroundColor
      )
      const colorDist = colorDistance(kwepGoogle.color, webGoogle.color)
      if (bgDist !== null && bgDist > 8) {
        issues.push(
          `Google CTA 배경 (Kwep=${kwepGoogle.backgroundColor}, Web=${webGoogle.backgroundColor}, Δ=${bgDist.toFixed(1)})`
        )
      }
      if (colorDist !== null && colorDist > 8) {
        issues.push(
          `Google CTA 텍스트색 (Kwep=${kwepGoogle.color}, Web=${webGoogle.color}, Δ=${colorDist.toFixed(1)})`
        )
      }
    }
    if (
      web.buttons.some((b) => b.text.includes("테스트")) &&
      !kwep.buttons.some((b) => b.text.includes("테스트"))
    ) {
      notes.push("Web 전용: 테스트 계정 버튼 (의도된 차이)")
    }
  }

  return { issues, notes, pass: issues.length === 0 }
}

function compareContentPreview(kwep, web, screenId) {
  const issues = []
  const notes = []

  const kwepWords = new Set(
    kwep.mainPreview.split(" ").filter((w) => w.length > 2)
  )
  const webWords = new Set(
    web.mainPreview.split(" ").filter((w) => w.length > 2)
  )
  const shared = [...kwepWords].filter((w) => webWords.has(w))
  const overlapPct =
    kwepWords.size > 0
      ? Math.round((shared.length / kwepWords.size) * 100)
      : 100

  if (overlapPct < 60 && screenId !== "home") {
    issues.push(`본문 텍스트 유사도 낮음 (${overlapPct}%)`)
  } else {
    notes.push(`본문 텍스트 유사도 ${overlapPct}%`)
  }

  const sizeDelta = Math.abs(kwep.mainPreview.length - web.mainPreview.length)
  if (sizeDelta > 120 && screenId !== "home" && screenId !== "course-detail") {
    notes.push(`본문 길이 차이 ${sizeDelta}자 (데이터/상태 차이 가능)`)
  }

  return { issues, notes, pass: issues.length === 0, overlapPct }
}

async function loginKwep(page) {
  await page.goto(`${KWEP_BASE}/login`, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: /Google/ }).click()
  await page.waitForURL(/\/home/)
}

async function loginWeb(page) {
  await page.goto(`${WEB_BASE}/login`, { waitUntil: "networkidle" })
  const testButton = page.getByRole("button", { name: /테스트 계정/ })
  if (await testButton.isVisible().catch(() => false)) {
    await testButton.click()
    await page.waitForURL(/\/app/)
    return
  }
  throw new Error(
    "테스트 로그인 버튼이 보이지 않습니다. ENABLE_TEST_AUTH=true 확인 필요"
  )
}

async function captureScreen(page, url, viewport, theme) {
  await page.setViewportSize(viewport)
  await page.emulateMedia({ colorScheme: theme })
  await page.goto(url, { waitUntil: "networkidle" })
  await applyTheme(page, theme)
  await page.waitForTimeout(600)
  const fingerprint = await extractFingerprint(page)
  const screenshot = await page.screenshot({ fullPage: true })
  return { fingerprint, screenshot }
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const publicKwep = await browser.newPage()
  const publicWeb = await browser.newPage()
  const authKwep = await browser.newPage()
  const authWeb = await browser.newPage()

  await loginKwep(authKwep)
  await loginWeb(authWeb)

  const report = {
    generatedAt: new Date().toISOString(),
    kwepBase: KWEP_BASE,
    webBase: WEB_BASE,
    screens: [],
    summary: { pass: 0, fail: 0 },
  }

  for (const screen of SCREENS) {
    const screenReport = { id: screen.id, themes: [] }

    for (const theme of THEMES) {
      const themeReport = { theme, viewports: [] }

      for (const viewport of VIEWPORTS) {
        const kwepUrl = `${KWEP_BASE}${screen.kwepPath}`
        const webUrl = `${WEB_BASE}${screen.webPath}`
        const pageKwep = screen.needsAuth ? authKwep : publicKwep
        const pageWeb = screen.needsAuth ? authWeb : publicWeb

        const kwepResult = await captureScreen(
          pageKwep,
          kwepUrl,
          viewport,
          theme
        )
        const webResult = await captureScreen(pageWeb, webUrl, viewport, theme)
        const comparison = compareFingerprints(
          kwepResult.fingerprint,
          webResult.fingerprint,
          screen.id
        )
        const content = compareContentPreview(
          kwepResult.fingerprint,
          webResult.fingerprint,
          screen.id
        )
        comparison.issues.push(...content.issues)
        comparison.notes.push(...content.notes)
        comparison.pass = comparison.issues.length === 0

        const prefix = `${screen.id}-${theme}-${viewport.name}`
        await writeFile(
          path.join(OUTPUT_DIR, `${prefix}-kwep.png`),
          kwepResult.screenshot
        )
        await writeFile(
          path.join(OUTPUT_DIR, `${prefix}-web.png`),
          webResult.screenshot
        )

        themeReport.viewports.push({
          viewport: viewport.name,
          kwepUrl,
          webUrl,
          comparison,
          content,
          kwep: kwepResult.fingerprint,
          web: webResult.fingerprint,
        })

        if (comparison.pass) report.summary.pass += 1
        else report.summary.fail += 1
      }

      screenReport.themes.push(themeReport)
    }

    report.screens.push(screenReport)
  }

  await writeFile(
    path.join(OUTPUT_DIR, "report.json"),
    JSON.stringify(report, null, 2),
    "utf8"
  )
  await browser.close()

  console.log(JSON.stringify(report.summary, null, 2))
  for (const screen of report.screens) {
    for (const theme of screen.themes) {
      for (const vp of theme.viewports) {
        const status = vp.comparison.pass ? "PASS" : "FAIL"
        console.log(
          `[${status}] ${screen.id} / ${theme.theme} / ${vp.viewport} | ${vp.comparison.issues.join(" | ") || "ok"}`
        )
      }
    }
  }
  console.log(`\nReport: ${OUTPUT_DIR}`)
  process.exitCode = report.summary.fail > 0 ? 1 : 0
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
