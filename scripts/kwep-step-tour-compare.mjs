import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { chromium } from "@playwright/test"

const KWEP_BASE = "http://localhost:5173"
const ADMIN_BASE = "http://localhost:3001"
const OUTPUT_DIR = path.join("output", "playwright", "kwep-step-tour-compare")

const THEMES = ["light", "dark"]
const VIEWPORT = { width: 1280, height: 900 }

const STEP_TYPES = [
  { kwep: "reading", admin: "READING", id: "reading" },
  { kwep: "compare", admin: "COMPARE", id: "compare" },
  { kwep: "multiple_choice", admin: "MULTIPLE_CHOICE", id: "multiple-choice" },
  { kwep: "fill_blank", admin: "FILL_BLANK", id: "fill-blank" },
  { kwep: "select", admin: "SELECT", id: "select" },
  { kwep: "order", admin: "ORDER", id: "order" },
  { kwep: "match", admin: "MATCH", id: "match" },
  { kwep: "categorize", admin: "CATEGORIZE", id: "categorize" },
  { kwep: "write", admin: "WRITE", id: "write" },
  { kwep: "ai_feedback", admin: "AI_FEEDBACK", id: "ai-feedback" },
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

async function loginAdmin(page) {
  await page.goto(`${ADMIN_BASE}/login`, { waitUntil: "networkidle" })
  await page.locator("#admin-login-email").fill("admin@example.com")
  await page.locator("#admin-login-password").fill("admin1234")
  await page.getByRole("button", { name: /로그인/ }).click()
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15000,
  })
  await page.waitForTimeout(400)
}

async function loginKwep(page) {
  await page.goto(`${KWEP_BASE}/login`, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: /Google로 계속하기/ }).click()
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15000,
  })
  await page.waitForTimeout(400)
}

async function selectKwepStep(page, stepType) {
  await page.goto(`${KWEP_BASE}/tour`, { waitUntil: "networkidle" })
  await page
    .locator("aside button")
    .filter({ hasText: new RegExp(`\\(${stepType}\\)`, "i") })
    .click()
  await page.waitForTimeout(500)
}

async function selectAdminStep(page, stepType) {
  await page.goto(`${ADMIN_BASE}/debug/steps`, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: stepType }).click()
  await page.waitForTimeout(500)
}

const PREVIEW_ROOT = ".max-w-sm.mx-auto .relative.bg-cream.rounded-3xl"

async function interactWithPreview(page, stepId) {
  const root = page.locator(PREVIEW_ROOT)
  const isVisible = await root.isVisible().catch(() => false)
  if (!isVisible) {
    return
  }

  if (stepId === "multiple-choice") {
    const firstChoice = root.locator(".an-fi button[type='button']").first()
    if ((await firstChoice.count()) > 0) {
      await firstChoice.click()
      await page.waitForTimeout(300)
    }
  }
}

async function extractPreviewFingerprint(page, source) {
  return page.evaluate((_src) => {
    const root = document.querySelector(
      ".max-w-sm.mx-auto .relative.bg-cream.rounded-3xl"
    )

    if (!root) {
      return { found: false, error: "preview root not found" }
    }

    const style = getComputedStyle(root)
    const headings = [
      ...root.querySelectorAll("h1, h2, h3, h4, p, label, button, span"),
    ]
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.replace(/\s+/g, " ").trim() ?? "",
        color: getComputedStyle(el).color,
        fontSize: getComputedStyle(el).fontSize,
        fontWeight: getComputedStyle(el).fontWeight,
      }))
      .filter((item) => item.text.length > 0 && item.text.length < 120)
      .slice(0, 24)

    const buttons = [...root.querySelectorAll("button")]
      .map((el) => ({
        text: el.textContent?.replace(/\s+/g, " ").trim() ?? "",
        background: getComputedStyle(el).backgroundColor,
        color: getComputedStyle(el).color,
        borderRadius: getComputedStyle(el).borderRadius,
      }))
      .filter((item) => item.text.length > 0)
      .slice(0, 8)

    const inputs = root.querySelectorAll("input, textarea, select").length
    const interactive = root.querySelectorAll(
      "[role='radio'], [role='checkbox'], [draggable='true']"
    ).length

    return {
      found: true,
      background: style.backgroundColor,
      borderColor: style.borderColor,
      borderRadius: style.borderRadius,
      color: style.color,
      previewText:
        root.textContent?.replace(/\s+/g, " ").trim().slice(0, 800) ?? "",
      headings,
      buttons,
      inputCount: inputs,
      interactiveCount: interactive,
      childCount: root.children.length,
    }
  }, source)
}

function comparePreviewFingerprints(kwep, admin, stepId) {
  const issues = []
  const notes = []

  if (!kwep.found) issues.push(`Kwep 미리보기 영역 없음: ${kwep.error}`)
  if (!admin.found) issues.push(`Admin 미리보기 영역 없음: ${admin.error}`)
  if (!kwep.found || !admin.found) {
    return { issues, notes, pass: false, overlapPct: 0 }
  }

  const bgDist = colorDistance(kwep.background, admin.background)
  if (bgDist !== null && bgDist > 25) {
    issues.push(
      `미리보기 배경색 차이 (Kwep=${kwep.background}, Admin=${admin.background}, Δ=${bgDist.toFixed(1)})`
    )
  } else {
    notes.push(`배경색 유사 (Δ=${bgDist?.toFixed(1) ?? "n/a"})`)
  }

  const borderDist = colorDistance(kwep.borderColor, admin.borderColor)
  if (borderDist !== null && borderDist > 30) {
    issues.push(
      `테두리 색 차이 (Kwep=${kwep.borderColor}, Admin=${admin.borderColor})`
    )
  }

  if (kwep.inputCount !== admin.inputCount) {
    issues.push(
      `입력 필드 수 불일치 (Kwep=${kwep.inputCount}, Admin=${admin.inputCount})`
    )
  }

  const kwepWords = new Set(
    kwep.previewText.split(" ").filter((w) => w.length > 2)
  )
  const adminWords = new Set(
    admin.previewText.split(" ").filter((w) => w.length > 2)
  )
  const shared = [...kwepWords].filter((w) => adminWords.has(w))
  const overlapPct =
    kwepWords.size > 0
      ? Math.round((shared.length / kwepWords.size) * 100)
      : 100

  if (overlapPct < 35) {
    issues.push(
      `미리보기 텍스트 유사도 낮음 (${overlapPct}%) — 샘플 데이터 상이`
    )
  } else if (overlapPct < 60) {
    notes.push(`미리보기 텍스트 유사도 중간 (${overlapPct}%)`)
  } else {
    notes.push(`미리보기 텍스트 유사도 높음 (${overlapPct}%)`)
  }

  const kwepBtnTexts = kwep.buttons
    .map((b) => b.text)
    .sort()
    .join("|")
  const adminBtnTexts = admin.buttons
    .map((b) => b.text)
    .sort()
    .join("|")
  if (kwepBtnTexts !== adminBtnTexts) {
    notes.push(
      `액션 버튼 텍스트 차이 (Kwep=[${kwepBtnTexts}], Admin=[${adminBtnTexts}])`
    )
  }

  const kwepHeadingCount = kwep.headings.filter((h) =>
    ["h1", "h2", "h3"].includes(h.tag)
  ).length
  const adminHeadingCount = admin.headings.filter((h) =>
    ["h1", "h2", "h3"].includes(h.tag)
  ).length
  if (Math.abs(kwepHeadingCount - adminHeadingCount) > 1) {
    notes.push(
      `제목 계층 수 차이 (Kwep h=${kwepHeadingCount}, Admin h=${adminHeadingCount})`
    )
  }

  notes.push(`미리보기 래퍼 구조 동일 (phone frame, ${stepId})`)

  if (stepId === "multiple-choice") {
    const actionLabels = new Set([
      "확인하기",
      "이해했어요",
      "다시 시도",
      "다음",
    ])
    const kwepChoice = kwep.buttons.find(
      (button) => !actionLabels.has(button.text)
    )
    const adminChoice = admin.buttons.find(
      (button) => !actionLabels.has(button.text)
    )

    if (kwepChoice && adminChoice) {
      const choiceBgDist = colorDistance(
        kwepChoice.background,
        adminChoice.background
      )
      if (choiceBgDist !== null && choiceBgDist > 25) {
        issues.push(
          `선택 보기 배경색 차이 (Kwep=${kwepChoice.background}, Admin=${adminChoice.background}, Δ=${choiceBgDist.toFixed(1)})`
        )
      } else {
        notes.push(
          `선택 보기 배경색 유사 (Δ=${choiceBgDist?.toFixed(1) ?? "n/a"})`
        )
      }
    }
  }

  return {
    issues,
    notes,
    pass: issues.length === 0,
    overlapPct,
    bgDistance: bgDist,
  }
}

async function capturePreview(page, source, theme, stepId) {
  await page.setViewportSize(VIEWPORT)
  await page.emulateMedia({ colorScheme: theme })
  await applyTheme(page, theme)
  await interactWithPreview(page, stepId)
  await page.waitForTimeout(600)

  const fingerprint = await extractPreviewFingerprint(page, source)

  const screenshotRect = await page.evaluate(async () => {
    const root = document.querySelector(
      ".max-w-sm.mx-auto .relative.bg-cream.rounded-3xl"
    )
    if (!root) return null
    const rect = root.getBoundingClientRect()
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
  })

  let shot = null
  if (screenshotRect && screenshotRect.width > 0 && screenshotRect.height > 0) {
    shot = await page.screenshot({
      clip: {
        x: Math.max(0, screenshotRect.x),
        y: Math.max(0, screenshotRect.y),
        width: Math.min(screenshotRect.width, VIEWPORT.width),
        height: Math.min(screenshotRect.height, 1200),
      },
    })
  } else {
    shot = await page.screenshot({ fullPage: false })
  }

  return { fingerprint, screenshot: shot }
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const kwepPage = await browser.newPage()
  const adminPage = await browser.newPage()

  await loginAdmin(adminPage)
  await loginKwep(kwepPage)

  const report = {
    generatedAt: new Date().toISOString(),
    kwepUrl: `${KWEP_BASE}/tour`,
    adminUrl: `${ADMIN_BASE}/debug/steps`,
    steps: [],
    summary: { pass: 0, fail: 0, total: 0 },
  }

  for (const step of STEP_TYPES) {
    const stepReport = {
      id: step.id,
      kwepType: step.kwep,
      adminType: step.admin,
      themes: [],
    }

    for (const theme of THEMES) {
      await selectKwepStep(kwepPage, step.kwep)
      await applyTheme(kwepPage, theme)
      const kwepResult = await capturePreview(kwepPage, "kwep", theme, step.id)

      await selectAdminStep(adminPage, step.admin)
      await applyTheme(adminPage, theme)
      const adminResult = await capturePreview(
        adminPage,
        "admin",
        theme,
        step.id
      )

      const comparison = comparePreviewFingerprints(
        kwepResult.fingerprint,
        adminResult.fingerprint,
        step.id
      )

      const prefix = `${step.id}-${theme}`
      await writeFile(
        path.join(OUTPUT_DIR, `${prefix}-kwep.png`),
        kwepResult.screenshot
      )
      await writeFile(
        path.join(OUTPUT_DIR, `${prefix}-admin.png`),
        adminResult.screenshot
      )

      stepReport.themes.push({
        theme,
        comparison,
        kwep: kwepResult.fingerprint,
        admin: adminResult.fingerprint,
      })

      report.summary.total += 1
      if (comparison.pass) report.summary.pass += 1
      else report.summary.fail += 1
    }

    report.steps.push(stepReport)
  }

  await writeFile(
    path.join(OUTPUT_DIR, "report.json"),
    JSON.stringify(report, null, 2),
    "utf8"
  )
  await browser.close()

  console.log(JSON.stringify(report.summary, null, 2))
  for (const step of report.steps) {
    for (const theme of step.themes) {
      const status = theme.comparison.pass ? "PASS" : "FAIL"
      console.log(
        `[${status}] ${step.id} / ${theme.theme} | overlap=${theme.comparison.overlapPct}% | ${theme.comparison.issues.join(" | ") || "ok"}`
      )
    }
  }
  console.log(`\nReport: ${OUTPUT_DIR}`)
  process.exitCode = report.summary.fail > 0 ? 1 : 0
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
