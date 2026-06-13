import { mkdir, writeFile } from "node:fs/promises"

import { chromium } from "@playwright/test"

const outDir =
  "/Users/mac/github/writing-app/docs/superpowers/evidence/2026-06-14-kwep-ui-parity/landing"
const chromePath =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

const targets = [
  {
    name: "kwep",
    routes: { browse: "/learn", start: "/home" },
    url: "http://127.0.0.1:5173/",
  },
  {
    name: "product",
    routes: { browse: "/app/courses", start: "/app" },
    url: "http://localhost:3000/",
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
  "borderRadius",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "opacity",
  "transform",
  "gap",
  "gridTemplateColumns",
  "alignItems",
  "justifyContent",
  "overflow",
  "whiteSpace",
  "filter",
  "backdropFilter",
]

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
})

const collectPage = (props) => {
  const root =
    document.querySelector(
      ".relative.bg-cream.text-charcoal.min-h-screen.overflow-x-hidden"
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

  return {
    buttons: collect("button"),
    headings: collect("h1,h2,h3"),
    images: collect("img").map((image) => ({
      ...image,
      alt: image.attrs.find(([name]) => name === "alt")?.[1] ?? null,
    })),
    sections: collect("section"),
    visibleCount: Array.from(root.querySelectorAll("*")).filter(visible).length,
  }
}

const compareLists = (area, kwep, product, keys) => {
  const diffs = []
  const count = Math.max(kwep.length, product.length)

  if (kwep.length !== product.length) {
    diffs.push({
      area,
      issue: "count",
      kwep: kwep.length,
      product: product.length,
    })
  }

  for (let index = 0; index < count; index += 1) {
    const left = kwep[index]
    const right = product[index]

    if (!left || !right) {
      diffs.push({
        area,
        index,
        issue: "missing",
        kwep: !!left,
        product: !!right,
      })
      continue
    }

    for (const key of keys) {
      if (JSON.stringify(left[key]) !== JSON.stringify(right[key])) {
        diffs.push({
          area,
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
        area,
        delta: rectDelta,
        index,
        issue: "rect",
        kwep: left.rect,
        product: right.rect,
      })
    }
  }

  return diffs
}

const diffCapture = (kwep, product) => [
  ...compareLists("sections", kwep.sections, product.sections, [
    "tag",
    "className",
    "style",
    "text",
  ]),
  ...compareLists("buttons", kwep.buttons, product.buttons, [
    "className",
    "style",
    "text",
    "attrs",
  ]),
  ...compareLists("images", kwep.images, product.images, [
    "alt",
    "className",
    "style",
    "attrs",
  ]),
  ...compareLists("headings", kwep.headings, product.headings, [
    "tag",
    "className",
    "style",
    "text",
  ]),
]

const diffComputedStyles = (kwep, product) => {
  const diffs = []
  const areas = ["sections", "buttons", "images", "headings"]

  for (const area of areas) {
    const count = Math.min(kwep[area].length, product[area].length)

    for (let index = 0; index < count; index += 1) {
      for (const prop of styleProps) {
        if (
          kwep[area][index].styles[prop] !== product[area][index].styles[prop]
        ) {
          diffs.push({
            area,
            index,
            kwep: kwep[area][index].styles[prop],
            product: product[area][index].styles[prop],
            prop,
          })
        }
      }
    }
  }

  return diffs
}

const capture = async (page, target, viewport) => {
  await page.setViewportSize({ height: viewport.height, width: viewport.width })
  await page.goto(target.url, { waitUntil: "networkidle" })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1400)
  await page.screenshot({
    fullPage: true,
    path: `${outDir}/${target.name}-${viewport.name}-latest.png`,
  })

  return page.evaluate(collectPage, styleProps)
}

const collectScrollMetrics = async (page) => {
  const results = []

  for (const y of [0, 3600, 4100, 4800]) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y)
    await page.waitForTimeout(900)
    results.push(
      await page.evaluate(() => {
        const rectOf = (element) => {
          const rect = element.getBoundingClientRect()

          return {
            height: Math.round(rect.height),
            width: Math.round(rect.width),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
          }
        }
        const images = Array.from(
          document.querySelectorAll(".relative.bg-cream img")
        ).map(rectOf)
        const finalHeading = Array.from(document.querySelectorAll("h2")).at(-1)

        return {
          finalHeading: finalHeading ? rectOf(finalHeading) : null,
          images,
          scrollY: Math.round(window.scrollY),
        }
      })
    )
  }

  return results
}

const collectRoutes = async (page, target) => {
  await page.goto(target.url, { waitUntil: "networkidle" })
  await page.waitForTimeout(700)
  await page.getByRole("button", { exact: true, name: "시작하기" }).click()
  await page.waitForTimeout(250)
  const navStartPath = new URL(page.url()).pathname

  await page.goto(target.url, { waitUntil: "networkidle" })
  await page.waitForTimeout(700)
  await page.getByRole("button", { exact: true, name: "코스 둘러보기" }).click()
  await page.waitForTimeout(250)
  const browsePath = new URL(page.url()).pathname

  return { browsePath, expected: target.routes, navStartPath }
}

const page = await browser.newPage()

for (const viewport of viewports) {
  const data = {}

  for (const target of targets) {
    data[target.name] = await capture(page, target, viewport)
    await writeFile(
      `${outDir}/${target.name}-${viewport.name}-latest.json`,
      JSON.stringify(data[target.name], null, 2)
    )
  }

  const attributeDiffs = diffCapture(data.kwep, data.product)
  const computedStyleDiffs = diffComputedStyles(data.kwep, data.product)

  await writeFile(
    `${outDir}/diff-${viewport.name}-latest.json`,
    JSON.stringify(attributeDiffs, null, 2)
  )
  await writeFile(
    `${outDir}/computed-style-diff-${viewport.name}-latest.json`,
    JSON.stringify(computedStyleDiffs, null, 2)
  )

  console.log(
    JSON.stringify({
      attributeDiffs: attributeDiffs.length,
      computedStyleDiffs: computedStyleDiffs.length,
      rectDiffs: attributeDiffs.filter((diff) => diff.issue === "rect").length,
      viewport: viewport.name,
      visibleCount: {
        kwep: data.kwep.visibleCount,
        product: data.product.visibleCount,
      },
    })
  )
}

const interaction = { routes: {}, scroll: {} }

for (const target of targets) {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.goto(target.url, { waitUntil: "networkidle" })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1400)
  interaction.scroll[target.name] = await collectScrollMetrics(page)
  interaction.routes[target.name] = await collectRoutes(page, target)
}

await writeFile(
  `${outDir}/interaction-latest.json`,
  JSON.stringify(interaction, null, 2)
)

await page.close()
await browser.close()
