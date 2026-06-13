import { mkdir, writeFile } from "node:fs/promises"

import { chromium } from "@playwright/test"

const outDir =
  "/Users/mac/github/writing-app/docs/superpowers/evidence/2026-06-14-kwep-ui-parity/course-detail"
const chromePath =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const kwepBaseUrl = process.env.KWEP_BASE_URL ?? "http://127.0.0.1:5173"
const productBaseUrl = process.env.PRODUCT_BASE_URL ?? "http://localhost:3000"

const targets = [
  {
    name: "kwep",
    expected: {
      backPath: "/learn",
      firstLessonPath: "/lesson/c1/l1",
    },
    setup: async (context) => {
      await context.addInitScript(() => {
        localStorage.setItem(
          "k_user",
          JSON.stringify({
            avatar: "✍️",
            email: "learner@kernel.ai",
            joined: "2026.06.14",
            name: "글쓰기 탐험가",
          })
        )
        localStorage.setItem("k_progress", JSON.stringify({}))
        localStorage.setItem(
          "k_streak",
          JSON.stringify({ count: 0, lastDate: "" })
        )
      })
    },
    url: `${kwepBaseUrl}/course/c1`,
  },
  {
    name: "product",
    expected: {
      backPath: "/app/courses",
      firstLessonPath: "/app/lesson",
      firstLessonSearch: "?lesson_id=l1",
    },
    setup: async (context) => {
      await context.addCookies([
        {
          domain: "localhost",
          name: "kwep_session",
          path: "/",
          value: "user-1",
        },
      ])
    },
    url: `${productBaseUrl}/app/courses/c1`,
  },
]

const viewports = [
  { height: 844, name: "390x844", width: 390 },
  { height: 720, name: "1280x720", width: 1280 },
]

const styleProps = [
  "display",
  "position",
  "boxSizing",
  "width",
  "height",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
  "color",
  "backgroundColor",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "borderRadius",
  "opacity",
  "transform",
  "animationName",
  "animationDuration",
  "animationTimingFunction",
  "gap",
  "gridTemplateColumns",
  "gridTemplateRows",
  "alignItems",
  "justifyContent",
  "overflow",
  "overflowX",
  "overflowY",
  "whiteSpace",
  "cursor",
  "objectFit",
  "transitionDuration",
  "transitionProperty",
  "transitionTimingFunction",
]

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
})

const collectPage = (props) => {
  const hasClasses = (element, classes) =>
    classes.every((className) => element.classList.contains(className))
  const root =
    Array.from(document.querySelectorAll("div")).find((element) =>
      hasClasses(element, [
        "min-h-screen",
        "bg-cream",
        "text-charcoal",
        "flex",
        "flex-col",
      ])
    ) ?? document.body
  const rectOf = (element) => {
    const rect = element.getBoundingClientRect()

    return {
      height: Math.round(rect.height),
      width: Math.round(rect.width),
      x: Math.round(rect.x),
      y: Math.round(rect.y),
    }
  }
  const cleanText = (value) => (value ?? "").replace(/\s+/g, " ").trim()
  const attrsOf = (element) =>
    Array.from(element.attributes)
      .map((attribute) => [attribute.name, attribute.value])
      .sort(([left], [right]) => left.localeCompare(right))
  const stylesOf = (element) => {
    const style = getComputedStyle(element)
    const result = {}

    for (const prop of props) {
      result[prop] = style[prop]
    }

    return result
  }
  const visible = (element) => {
    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity) !== 0
    )
  }
  const collect = (selector) =>
    Array.from(root.querySelectorAll(selector)).map((element, index) => ({
      attrs: attrsOf(element),
      className: element.getAttribute("class"),
      index,
      rect: rectOf(element),
      style: element.getAttribute("style"),
      styles: stylesOf(element),
      tag: element.tagName.toLowerCase(),
      text: cleanText(element.textContent),
    }))
  const rootItem = {
    attrs: attrsOf(root),
    className: root.getAttribute("class"),
    index: -1,
    rect: rectOf(root),
    style: root.getAttribute("style"),
    styles: stylesOf(root),
    tag: root.tagName.toLowerCase(),
    text: cleanText(root.textContent),
  }

  return {
    items: [rootItem, ...collect("*")],
    visibleCount:
      Array.from(root.querySelectorAll("*")).filter(visible).length +
      (visible(root) ? 1 : 0),
  }
}

const compare = (kwep, product) => {
  const diffs = []
  const keys = ["tag", "className", "style", "text", "attrs"]
  const count = Math.max(kwep.items.length, product.items.length)

  if (kwep.items.length !== product.items.length) {
    diffs.push({
      area: "items",
      issue: "count",
      kwep: kwep.items.length,
      product: product.items.length,
    })
  }

  if (kwep.visibleCount !== product.visibleCount) {
    diffs.push({
      area: "visibleCount",
      kwep: kwep.visibleCount,
      product: product.visibleCount,
    })
  }

  for (let index = 0; index < count; index += 1) {
    const left = kwep.items[index]
    const right = product.items[index]

    if (!left || !right) {
      diffs.push({ area: "items", index, issue: "missing" })
      continue
    }

    for (const key of keys) {
      if (JSON.stringify(left[key]) !== JSON.stringify(right[key])) {
        diffs.push({
          area: "items",
          index,
          issue: key,
          kwep: left[key],
          product: right[key],
        })
      }
    }

    const rectDelta = Object.fromEntries(
      Object.keys(left.rect).map((key) => [
        key,
        Math.abs(left.rect[key] - right.rect[key]),
      ])
    )

    if (Object.values(rectDelta).some((value) => value > 1)) {
      diffs.push({
        area: "items",
        delta: rectDelta,
        index,
        issue: "rect",
        kwep: left.rect,
        product: right.rect,
      })
    }

    for (const prop of styleProps) {
      if (left.styles[prop] !== right.styles[prop]) {
        diffs.push({
          area: "computed",
          index,
          kwep: left.styles[prop],
          product: right.styles[prop],
          prop,
        })
      }
    }
  }

  return diffs
}

const capture = async (target, viewport) => {
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    viewport: { height: viewport.height, width: viewport.width },
  })
  await target.setup(context)

  const page = await context.newPage()
  await page.goto(target.url, { waitUntil: "networkidle" })
  await page.waitForSelector(".min-h-screen.bg-cream.text-charcoal")
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1200)
  await page.screenshot({
    fullPage: true,
    path: `${outDir}/${target.name}-${viewport.name}-latest.png`,
  })

  const data = await page.evaluate(collectPage, styleProps)
  await page.close()
  await context.close()

  return data
}

const verifyInteractions = async (target) => {
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    viewport: { height: 844, width: 390 },
  })
  await target.setup(context)

  const page = await context.newPage()
  await page.goto(target.url, { waitUntil: "networkidle" })
  await page.waitForSelector(".min-h-screen.bg-cream.text-charcoal")
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1200)

  const unitToggle = page.getByRole("button", {
    name: /문장의 기본기\s*4개 레슨/,
  })
  const unitPanelState = () =>
    unitToggle.evaluate((button) => {
      const panel = button.nextElementSibling

      return {
        height:
          panel instanceof HTMLElement
            ? Math.round(panel.getBoundingClientRect().height)
            : -1,
        rows: panel instanceof HTMLElement ? panel.style.gridTemplateRows : "",
      }
    })
  const firstUnitInitial = await unitPanelState()
  await unitToggle.click()
  await page.waitForTimeout(400)
  const firstUnitClosed = await unitPanelState()
  await unitToggle.click()
  await page.waitForTimeout(400)
  const firstUnitOpen = await unitPanelState()

  await page.getByText("좋은 문장이란 무엇인가", { exact: true }).click()
  await page.waitForTimeout(1200)
  const firstLessonUrl = new URL(page.url())

  await page.goto(target.url, { waitUntil: "networkidle" })
  await page.waitForSelector(".min-h-screen.bg-cream.text-charcoal")
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1200)
  await page.getByRole("button", { exact: true, name: "학습 시작하기" }).click()
  await page.waitForTimeout(1200)
  const ctaUrl = new URL(page.url())

  await page.goto(target.url, { waitUntil: "networkidle" })
  await page.waitForSelector(".min-h-screen.bg-cream.text-charcoal")
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1200)
  await page.getByRole("button", { exact: true, name: "돌아가기" }).click()
  await page.waitForTimeout(1200)
  const backUrl = new URL(page.url())

  await page.close()
  await context.close()

  return {
    backPath: backUrl.pathname,
    ctaPath: ctaUrl.pathname,
    ctaSearch: ctaUrl.search,
    firstLessonPath: firstLessonUrl.pathname,
    firstLessonSearch: firstLessonUrl.search,
    firstUnitClosed,
    firstUnitInitial,
    firstUnitOpen,
  }
}

for (const viewport of viewports) {
  const data = {}

  for (const target of targets) {
    data[target.name] = await capture(target, viewport)
    await writeFile(
      `${outDir}/${target.name}-${viewport.name}-latest.json`,
      JSON.stringify(data[target.name], null, 2)
    )
  }

  const diffs = compare(data.kwep, data.product)

  await writeFile(
    `${outDir}/diff-${viewport.name}-latest.json`,
    JSON.stringify(diffs, null, 2)
  )

  console.log(
    JSON.stringify({
      computedStyleDiffs: diffs.filter((diff) => diff.area === "computed")
        .length,
      itemCount: {
        kwep: data.kwep.items.length,
        product: data.product.items.length,
      },
      rectDiffs: diffs.filter((diff) => diff.issue === "rect").length,
      structuralDiffs: diffs.filter((diff) => diff.area !== "computed").length,
      viewport: viewport.name,
      visibleCount: {
        kwep: data.kwep.visibleCount,
        product: data.product.visibleCount,
      },
    })
  )
}

const interactionResult = Object.fromEntries(
  await Promise.all(
    targets.map(async (target) => [
      target.name,
      await verifyInteractions(target),
    ])
  )
)

await writeFile(
  `${outDir}/interaction-latest.json`,
  JSON.stringify(
    {
      courseDetail: {
        expected: Object.fromEntries(
          targets.map((target) => [target.name, target.expected])
        ),
        result: interactionResult,
      },
    },
    null,
    2
  )
)

const mismatches = []

for (const target of targets) {
  const result = interactionResult[target.name]

  if (result.backPath !== target.expected.backPath) {
    mismatches.push({
      actual: result.backPath,
      expected: target.expected.backPath,
      interaction: "backPath",
      target: target.name,
    })
  }

  if (result.ctaPath !== target.expected.firstLessonPath) {
    mismatches.push({
      actual: result.ctaPath,
      expected: target.expected.firstLessonPath,
      interaction: "ctaPath",
      target: target.name,
    })
  }

  if (
    target.expected.firstLessonSearch !== undefined &&
    result.ctaSearch !== target.expected.firstLessonSearch
  ) {
    mismatches.push({
      actual: result.ctaSearch,
      expected: target.expected.firstLessonSearch,
      interaction: "ctaSearch",
      target: target.name,
    })
  }

  if (result.firstLessonPath !== target.expected.firstLessonPath) {
    mismatches.push({
      actual: result.firstLessonPath,
      expected: target.expected.firstLessonPath,
      interaction: "firstLessonPath",
      target: target.name,
    })
  }

  if (
    target.expected.firstLessonSearch !== undefined &&
    result.firstLessonSearch !== target.expected.firstLessonSearch
  ) {
    mismatches.push({
      actual: result.firstLessonSearch,
      expected: target.expected.firstLessonSearch,
      interaction: "firstLessonSearch",
      target: target.name,
    })
  }

  if (
    result.firstUnitInitial.rows !== "1fr" ||
    result.firstUnitOpen.rows !== "1fr" ||
    result.firstUnitClosed.rows !== "0fr" ||
    result.firstUnitOpen.height <= result.firstUnitClosed.height
  ) {
    mismatches.push({
      interaction: "unitToggle",
      result,
      target: target.name,
    })
  }
}

if (mismatches.length > 0) {
  console.error(JSON.stringify({ mismatches }, null, 2))
  process.exitCode = 1
}

await browser.close()
