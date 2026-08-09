import {
  expect,
  test as playwrightTest,
  type BrowserContext,
  type Page,
} from "@playwright/test"

import { deriveE2eClientIp } from "#scripts/e2e-client-ip"

export { expect }

const clientIpByTestId = new Map<string, string>()
const reservedClientIps = new Set<string>()

export const test = playwrightTest.extend<{
  browserDiagnostics: void
  e2eClientHeaders: Readonly<Record<string, string>>
}>({
  browserDiagnostics: [
    async ({ context, e2eClientHeaders }, use) => {
      await context.setExtraHTTPHeaders(e2eClientHeaders)
      const diagnostics = observeBrowserContext(context)
      await use()
      diagnostics.expectNoIssues()
    },
    { auto: true },
  ],
  async e2eClientHeaders({}, use, testInfo) {
    await use({
      "x-writing-app-client-ip": reserveE2eClientIp(testInfo.testId),
    })
  },
})

function reserveE2eClientIp(testId: string): string {
  const existingAddress = clientIpByTestId.get(testId)
  if (existingAddress !== undefined) return existingAddress

  const address = deriveE2eClientIp(testId, reservedClientIps)
  clientIpByTestId.set(testId, address)
  reservedClientIps.add(address)
  return address
}

export function observeBrowserContext(context: BrowserContext) {
  const messages: string[] = []
  const observedPages = new WeakSet<Page>()
  const observePage = (page: Page) => {
    if (observedPages.has(page)) return
    observedPages.add(page)

    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        messages.push(`console.${message.type()}: ${message.text()}`)
      }
    })
    page.on("pageerror", (error) => {
      messages.push(`pageerror: ${error.message}`)
    })
  }

  context.pages().forEach(observePage)
  context.on("page", observePage)

  return {
    expectNoIssues() {
      expect(messages).toEqual([])
    },
  }
}
