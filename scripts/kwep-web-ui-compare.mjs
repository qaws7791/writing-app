import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { chromium } from "@playwright/test"

const KWEP_BASE = "http://localhost:5173"
const WEB_BASE = "http://localhost:3000"
const OUTPUT_DIR = path.join("output", "playwright", "kwep-web-compare")

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
      }))
      .filter((item) => item.text.length > 0)
      .slice(0, 12)

    const buttons = [
      ...document.querySelectorAll("button, a.btn, [data-slot='button']"),
    ]
      .slice(0, 10)
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

    const navLinks = [...document.querySelectorAll("header a, nav a")]
      .map((el) => el.textContent?.replace(/\s+/g, " ").trim() ?? "")
      .filter(Boolean)
      .slice(0, 12)

    return {
      title: document.title,
      bodyBackground:
        htmlStyle.backgroundColor !== "rgba(0, 0, 0, 0)"
          ? htmlStyle.backgroundColor
          : bodyStyle.backgroundColor,
      bodyColor: bodyStyle.color,
      rootBackground: htmlStyle.backgroundColor,
      sectionCount: document.querySelectorAll("section").length,
      headings,
      buttons,
      navLinks,
      hasGoogleCta: buttons.some((button) => button.text.includes("Google")),
      hasBrand: headings.some((heading) => heading.text.includes("글결")),
      mainPreview: (document.querySelector("main")?.innerText ?? body.innerText)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 400),
    }
  })
}

function compareFingerprints(kwep, web, screenId) {
  const issues = []
  const notes = []

  if (kwep.hasBrand !== web.hasBrand) {
    issues.push(
      `브랜드 '글결' 표시 불일치 (Kwep=${kwep.hasBrand}, Web=${web.hasBrand})`
    )
  }

  const bgDistance = colorDistance(kwep.bodyBackground, web.bodyBackground)
  if (bgDistance !== null && bgDistance > 18) {
    issues.push(
      `배경색 차이 큼 (Kwep=${kwep.bodyBackground}, Web=${web.bodyBackground}, distance=${bgDistance.toFixed(1)})`
    )
  } else if (bgDistance !== null) {
    notes.push(`배경색 유사 (distance=${bgDistance.toFixed(1)})`)
  }

  const kwepH1 =
    kwep.headings.find((heading) => heading.tag === "h1")?.text ?? ""
  const webH1 = web.headings.find((heading) => heading.tag === "h1")?.text ?? ""
  if (
    kwepH1 &&
    webH1 &&
    kwepH1.replace(/\.$/, "") !== webH1.replace(/\.$/, "") &&
    screenId !== "home"
  ) {
    issues.push(`h1 텍스트 불일치 (Kwep='${kwepH1}', Web='${webH1}')`)
  }

  if (
    screenId === "landing" &&
    Math.abs(kwep.sectionCount - web.sectionCount) > 2
  ) {
    issues.push(
      `랜딩 섹션 수 차이 (Kwep=${kwep.sectionCount}, Web=${web.sectionCount})`
    )
  }

  if (screenId === "login") {
    if (kwep.hasGoogleCta !== web.hasGoogleCta) {
      issues.push("Google CTA 존재 여부 불일치")
    }
    const kwepCta = kwep.buttons.find((button) =>
      button.text.includes("Google")
    )
    const webCta = web.buttons.find((button) => button.text.includes("Google"))
    if (kwepCta && webCta) {
      if (
        kwepCta.borderRadius &&
        webCta.borderRadius &&
        kwepCta.borderRadius !== webCta.borderRadius &&
        !kwepCta.borderRadius.includes("999") &&
        !webCta.borderRadius.includes("999")
      ) {
        notes.push(
          `Google CTA border-radius (Kwep=${kwepCta.borderRadius}, Web=${webCta.borderRadius})`
        )
      }
    }
  }

  const kwepHeadingTexts = new Set(kwep.headings.map((heading) => heading.text))
  const webHeadingTexts = new Set(web.headings.map((heading) => heading.text))
  const sharedHeadings = [...kwepHeadingTexts].filter((text) =>
    webHeadingTexts.has(text)
  )
  if (
    kwep.headings.length > 0 &&
    sharedHeadings.length === 0 &&
    screenId !== "lesson"
  ) {
    issues.push("공통 heading 텍스트 없음")
  } else if (sharedHeadings.length > 0) {
    notes.push(`공통 heading ${sharedHeadings.length}개`)
  }

  return { issues, notes, pass: issues.length === 0 }
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

async function captureScreen(page, url, viewport) {
  await page.setViewportSize(viewport)
  await page.goto(url, { waitUntil: "networkidle" })
  await page.waitForTimeout(800)
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

  const viewports = [
    { name: "desktop", width: 1280, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]

  const report = {
    generatedAt: new Date().toISOString(),
    kwepBase: KWEP_BASE,
    webBase: WEB_BASE,
    screens: [],
    summary: { pass: 0, fail: 0 },
  }

  for (const screen of SCREENS) {
    const screenReport = { id: screen.id, viewports: [] }

    for (const viewport of viewports) {
      const kwepUrl = `${KWEP_BASE}${screen.kwepPath}`
      const webUrl = `${WEB_BASE}${screen.webPath}`

      const pageKwep = screen.needsAuth ? authKwep : publicKwep
      const pageWeb = screen.needsAuth ? authWeb : publicWeb

      const kwepResult = await captureScreen(pageKwep, kwepUrl, viewport)
      const webResult = await captureScreen(pageWeb, webUrl, viewport)
      const comparison = compareFingerprints(
        kwepResult.fingerprint,
        webResult.fingerprint,
        screen.id
      )

      const prefix = `${screen.id}-${viewport.name}`
      await writeFile(
        path.join(OUTPUT_DIR, `${prefix}-kwep.png`),
        kwepResult.screenshot
      )
      await writeFile(
        path.join(OUTPUT_DIR, `${prefix}-web.png`),
        webResult.screenshot
      )

      screenReport.viewports.push({
        viewport: viewport.name,
        kwepUrl,
        webUrl,
        comparison,
        kwep: kwepResult.fingerprint,
        web: webResult.fingerprint,
      })

      if (comparison.pass) {
        report.summary.pass += 1
      } else {
        report.summary.fail += 1
      }
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
    for (const viewport of screen.viewports) {
      const status = viewport.comparison.pass ? "PASS" : "FAIL"
      console.log(
        `[${status}] ${screen.id} (${viewport.viewport}) issues=${viewport.comparison.issues.join(" | ") || "none"}`
      )
      if (viewport.comparison.notes.length > 0) {
        console.log(`  notes: ${viewport.comparison.notes.join(" | ")}`)
      }
    }
  }

  console.log(`\nScreenshots and report: ${OUTPUT_DIR}`)
  process.exitCode = report.summary.fail > 0 ? 1 : 0
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
