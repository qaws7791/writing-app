import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { chromium } from "@playwright/test"

const KWEP_BASE = "http://localhost:5173"
const ADMIN_BASE = "http://localhost:3001"
const OUTPUT_DIR = path.join("output", "playwright", "kwep-admin-compare")

const THEMES = ["light", "dark"]
const VIEWPORT = { name: "desktop", width: 1280, height: 900 }

const SCREENS = [
  {
    id: "login",
    kwepPath: "/admin",
    adminPath: "/login",
    needsAuth: false,
    skipContent: true,
  },
  { id: "dashboard", kwepPath: "/admin", adminPath: "/", needsAuth: true },
  {
    id: "courses",
    kwepPath: "/admin/courses",
    adminPath: "/courses",
    needsAuth: true,
  },
  {
    id: "course-editor",
    kwepPath: "/admin/courses/c1",
    adminPath: "/courses/c1",
    needsAuth: true,
  },
  {
    id: "users",
    kwepPath: "/admin/users",
    adminPath: "/users",
    needsAuth: true,
  },
  {
    id: "user-detail",
    kwepPath: "/admin/users/u001",
    adminPath: "/users/u001",
    needsAuth: true,
    optional: true,
  },
  {
    id: "analytics",
    kwepPath: "/admin/analytics",
    adminPath: "/analytics",
    needsAuth: true,
  },
  {
    id: "settings",
    kwepPath: "/admin/settings",
    adminPath: "/settings",
    needsAuth: true,
  },
  {
    id: "resources",
    kwepPath: "/admin/resources",
    adminPath: "/resources",
    needsAuth: true,
  },
  {
    id: "resource-editor",
    kwepPath: "/admin/resources/r1",
    adminPath: "/resources/r1",
    needsAuth: true,
    optional: true,
  },
  { id: "chat", kwepPath: "/admin/chat", adminPath: "/chat", needsAuth: true },
  {
    id: "lesson-editor",
    kwepPath: "/admin/courses/c1/lessons/l1",
    adminPath: "/courses/c1",
    needsAuth: true,
    kwepOnly: true,
    note: "Kwep 전용 레슨 편집 라우트 — admin은 코스 편집기 내 탭",
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
      .slice(0, 16)

    const navLinks = [...document.querySelectorAll("aside a, nav a")]
      .map((el) => el.textContent?.replace(/\s+/g, " ").trim() ?? "")
      .filter(Boolean)
      .slice(0, 16)

    const buttons = [
      ...document.querySelectorAll("button, a.btn, [data-slot='button']"),
    ]
      .slice(0, 14)
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

    const sidebar = document.querySelector("aside")
    const sidebarStyle = sidebar ? getComputedStyle(sidebar) : null
    const activeNav = document.querySelector(
      "aside a[class*='bg-charcoal'], aside a[class*='bg-primary'], aside a[aria-current='page']"
    )
    const activeNavStyle = activeNav ? getComputedStyle(activeNav) : null

    return {
      htmlClass: html.className,
      colorScheme: htmlStyle.colorScheme,
      title: document.title,
      bodyBackground:
        htmlStyle.backgroundColor !== "rgba(0, 0, 0, 0)"
          ? htmlStyle.backgroundColor
          : bodyStyle.backgroundColor,
      bodyColor: bodyStyle.color,
      sidebarBackground: sidebarStyle?.backgroundColor ?? null,
      activeNavBackground: activeNavStyle?.backgroundColor ?? null,
      activeNavColor: activeNavStyle?.color ?? null,
      headings,
      navLinks,
      buttons,
      tableCount: document.querySelectorAll("table").length,
      cardCount: document.querySelectorAll(
        "[class*='rounded'], [data-slot='card']"
      ).length,
      mainPreview: (document.querySelector("main")?.innerText ?? body.innerText)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500),
    }
  })
}

function compareNavLinks(kwep, admin) {
  const issues = []
  const notes = []

  const kwepNav = kwep.navLinks.filter(
    (t) => !t.includes("앱으로") && !t.includes("로그아웃")
  )
  const adminNav = admin.navLinks.filter(
    (t) => !t.includes("앱으로") && !t.includes("로그아웃")
  )

  const normalize = (label) =>
    label
      .replace(/AI 채팅/g, "AI 에이전트")
      .replace(/글결 관리자/g, "글결 어드민")
      .replace(/글결 운영 콘솔/g, "")
      .trim()

  const kwepSet = new Set(kwepNav.map(normalize).filter(Boolean))
  const adminSet = new Set(adminNav.map(normalize).filter(Boolean))

  const missingInAdmin = [...kwepSet].filter(
    (t) => !adminSet.has(t) && t.length > 1
  )
  const extraInAdmin = [...adminSet].filter(
    (t) => !kwepSet.has(t) && t.length > 1
  )

  if (missingInAdmin.length > 0) {
    issues.push(`사이드바 라벨 누락: ${missingInAdmin.join(", ")}`)
  }
  if (extraInAdmin.length > 0) {
    issues.push(`사이드바 추가 라벨: ${extraInAdmin.join(", ")}`)
  }

  const kwepOrder = kwepNav.map(normalize).filter((t) => t.length > 2)
  const adminOrder = adminNav.map(normalize).filter((t) => t.length > 2)
  if (kwepOrder.length > 0 && adminOrder.length > 0) {
    const shared = kwepOrder.filter((t) => adminOrder.includes(t))
    if (shared.length >= 3) {
      const kwepIdx = shared.map((t) => kwepOrder.indexOf(t))
      const adminIdx = shared.map((t) => adminOrder.indexOf(t))
      const orderMatch = kwepIdx.every((v, i) => v === adminIdx[i])
      if (!orderMatch) {
        issues.push(
          `사이드바 메뉴 순서 불일치 (Kwep: ${kwepOrder.join(" > ")}, Admin: ${adminOrder.join(" > ")})`
        )
      } else {
        notes.push("사이드바 메뉴 순서 일치")
      }
    }
  }

  return { issues, notes }
}

function compareFingerprints(kwep, admin, screenId, options = {}) {
  const issues = []
  const notes = []

  if (options.skipContent) {
    notes.push(
      "인증 화면 — 콘텐츠 비교 생략 (Kwep 패스코드 게이트 vs Admin 이메일/비밀번호)"
    )
    return {
      issues: ["인증 UI 구조 상이 (패스코드 게이트 vs 이메일/비밀번호 폼)"],
      notes,
      pass: false,
    }
  }

  if (kwep.colorScheme !== admin.colorScheme) {
    issues.push(
      `color-scheme 불일치 (Kwep=${kwep.colorScheme}, Admin=${admin.colorScheme})`
    )
  }

  const bgDistance = colorDistance(kwep.bodyBackground, admin.bodyBackground)
  if (bgDistance !== null && bgDistance > 8) {
    issues.push(
      `배경색 차이 (Kwep=${kwep.bodyBackground}, Admin=${admin.bodyBackground}, Δ=${bgDistance.toFixed(1)})`
    )
  } else if (bgDistance !== null && bgDistance > 0) {
    notes.push(`배경색 미세 차이 (Δ=${bgDistance.toFixed(1)})`)
  } else {
    notes.push("배경색 일치")
  }

  if (kwep.sidebarBackground && admin.sidebarBackground) {
    const sidebarDist = colorDistance(
      kwep.sidebarBackground,
      admin.sidebarBackground
    )
    if (sidebarDist !== null && sidebarDist > 8) {
      issues.push(
        `사이드바 배경색 차이 (Kwep=${kwep.sidebarBackground}, Admin=${admin.sidebarBackground}, Δ=${sidebarDist.toFixed(1)})`
      )
    }
  }

  if (kwep.activeNavBackground && admin.activeNavBackground) {
    const activeDist = colorDistance(
      kwep.activeNavBackground,
      admin.activeNavBackground
    )
    if (activeDist !== null && activeDist > 8) {
      issues.push(
        `활성 nav 배경색 차이 (Kwep=${kwep.activeNavBackground}, Admin=${admin.activeNavBackground}, Δ=${activeDist.toFixed(1)})`
      )
    }
  }

  const kwepH1 = kwep.headings.find((h) => h.tag === "h1")
  const adminH1 = admin.headings.find((h) => h.tag === "h1")
  if (kwepH1 && adminH1 && screenId !== "login") {
    if (kwepH1.text !== adminH1.text) {
      issues.push(
        `h1 텍스트 불일치 (Kwep='${kwepH1.text}', Admin='${adminH1.text}')`
      )
    }
    const h1ColorDist = colorDistance(kwepH1.color, adminH1.color)
    if (h1ColorDist !== null && h1ColorDist > 8) {
      issues.push(`h1 색상 차이 (Kwep=${kwepH1.color}, Admin=${adminH1.color})`)
    }
  }

  if (screenId !== "login") {
    const nav = compareNavLinks(kwep, admin)
    issues.push(...nav.issues)
    notes.push(...nav.notes)
  }

  const kwepHeadingTexts = new Set(kwep.headings.map((h) => h.text))
  const adminHeadingTexts = new Set(admin.headings.map((h) => h.text))
  const sharedHeadings = [...kwepHeadingTexts].filter((t) =>
    adminHeadingTexts.has(t)
  )
  if (
    kwep.headings.length > 0 &&
    sharedHeadings.length === 0 &&
    !options.optional
  ) {
    issues.push("공통 heading 없음")
  } else if (sharedHeadings.length > 0) {
    notes.push(`공통 heading ${sharedHeadings.length}개`)
  }

  const kwepWords = new Set(
    kwep.mainPreview.split(" ").filter((w) => w.length > 2)
  )
  const adminWords = new Set(
    admin.mainPreview.split(" ").filter((w) => w.length > 2)
  )
  const shared = [...kwepWords].filter((w) => adminWords.has(w))
  const overlapPct =
    kwepWords.size > 0
      ? Math.round((shared.length / kwepWords.size) * 100)
      : 100

  if (overlapPct < 40 && !options.optional && screenId !== "login") {
    issues.push(`본문 텍스트 유사도 낮음 (${overlapPct}%)`)
  } else {
    notes.push(`본문 텍스트 유사도 ${overlapPct}%`)
  }

  return { issues, notes, pass: issues.length === 0, overlapPct }
}

async function loginKwepAdmin(page) {
  await page.goto(`${KWEP_BASE}/admin`, { waitUntil: "networkidle" })
  const passInput = page.locator('input[type="password"]')
  if (await passInput.isVisible().catch(() => false)) {
    await passInput.fill("glyul-admin")
    await page.getByRole("button", { name: /입장/ }).click()
    await page.waitForURL(/\/admin/)
    await page.waitForTimeout(400)
  }
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

async function captureScreen(page, url, theme) {
  await page.setViewportSize(VIEWPORT)
  await page.emulateMedia({ colorScheme: theme })
  const response = await page.goto(url, {
    waitUntil: "networkidle",
    timeout: 30000,
  })
  await applyTheme(page, theme)
  await page.waitForTimeout(800)
  const fingerprint = await extractFingerprint(page)
  const screenshot = await page.screenshot({ fullPage: true })
  return { fingerprint, screenshot, status: response?.status() ?? 0 }
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const publicKwep = await browser.newPage()
  const publicAdmin = await browser.newPage()
  const authKwep = await browser.newPage()
  const authAdmin = await browser.newPage()

  await loginKwepAdmin(authKwep)
  await loginAdmin(authAdmin)

  const report = {
    generatedAt: new Date().toISOString(),
    kwepBase: KWEP_BASE,
    adminBase: ADMIN_BASE,
    screens: [],
    summary: { pass: 0, fail: 0, skipped: 0 },
  }

  for (const screen of SCREENS) {
    const screenReport = {
      id: screen.id,
      note: screen.note ?? null,
      themes: [],
    }

    for (const theme of THEMES) {
      const kwepUrl = `${KWEP_BASE}${screen.kwepPath}`
      const adminUrl = `${ADMIN_BASE}${screen.adminPath}`
      const pageKwep = screen.needsAuth ? authKwep : publicKwep
      const pageAdmin = screen.needsAuth ? authAdmin : publicAdmin

      const kwepResult = await captureScreen(pageKwep, kwepUrl, theme)
      const adminResult = await captureScreen(pageAdmin, adminUrl, theme)

      const comparison = compareFingerprints(
        kwepResult.fingerprint,
        adminResult.fingerprint,
        screen.id,
        {
          skipContent: screen.skipContent,
          optional: screen.optional,
        }
      )

      if (screen.kwepOnly) {
        comparison.issues = ["Kwep 전용 라우트 — admin에 동등 라우트 없음"]
        comparison.pass = false
        comparison.notes.push(screen.note ?? "")
      }

      if (adminResult.status >= 400 && screen.optional) {
        comparison.issues = comparison.issues.filter(
          (i) => !i.includes("유사도")
        )
        comparison.issues.push(
          `Admin 페이지 HTTP ${adminResult.status} (선택 화면)`
        )
        comparison.pass = false
      }

      const prefix = `${screen.id}-${theme}`
      await writeFile(
        path.join(OUTPUT_DIR, `${prefix}-kwep.png`),
        kwepResult.screenshot
      )
      await writeFile(
        path.join(OUTPUT_DIR, `${prefix}-admin.png`),
        adminResult.screenshot
      )

      screenReport.themes.push({
        theme,
        kwepUrl,
        adminUrl,
        kwepStatus: kwepResult.status,
        adminStatus: adminResult.status,
        comparison,
        kwep: kwepResult.fingerprint,
        admin: adminResult.fingerprint,
      })

      if (screen.kwepOnly) report.summary.skipped += 1
      else if (comparison.pass) report.summary.pass += 1
      else report.summary.fail += 1
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
      const status = theme.comparison.pass ? "PASS" : "FAIL"
      console.log(
        `[${status}] ${screen.id} / ${theme.theme} | ${theme.comparison.issues.join(" | ") || "ok"}`
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
