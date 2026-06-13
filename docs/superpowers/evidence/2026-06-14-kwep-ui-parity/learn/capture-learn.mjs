import { mkdir, writeFile } from "node:fs/promises"

import { chromium } from "@playwright/test"

const outDir =
  "/Users/mac/github/writing-app/docs/superpowers/evidence/2026-06-14-kwep-ui-parity/learn"
const chromePath =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

const targets = [
  {
    name: "kwep",
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
    url: "http://127.0.0.1:5173/learn",
  },
  {
    name: "product",
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
    url: "http://localhost:3000/app/courses",
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
  "alignItems",
  "justifyContent",
  "overflow",
  "overflowX",
  "whiteSpace",
  "cursor",
  "objectFit",
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

const verifyInteraction = async (target) => {
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
  await page.getByRole("button", { exact: true, name: "문법 심화" }).click()
  await page.waitForTimeout(200)
  const activeText = await page
    .locator(".bg-charcoal.text-cream")
    .first()
    .textContent()
  await page
    .locator(".cursor-pointer")
    .filter({ hasText: "문장의 기본 문법" })
    .click()
  await page.waitForTimeout(1200)

  const path = new URL(page.url()).pathname
  await page.close()
  await context.close()

  return {
    activeCategory: activeText?.trim(),
    path,
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
      await verifyInteraction(target),
    ])
  )
)

await writeFile(
  `${outDir}/interaction-latest.json`,
  JSON.stringify(
    {
      categoryAndCourseCard: {
        expected: {
          kwep: {
            activeCategory: "문법 심화",
            path: "/course/c2",
          },
          product: {
            activeCategory: "문법 심화",
            path: "/app/courses/c2",
          },
        },
        result: interactionResult,
      },
    },
    null,
    2
  )
)

await browser.close()
