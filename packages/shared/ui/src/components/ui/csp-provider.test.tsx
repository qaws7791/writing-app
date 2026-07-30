import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { UiCspProvider } from "#ui/components/ui/csp-provider"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#ui/components/ui/tabs"

describe("UiCspProvider", () => {
  it("Tabs의 hydration 전 script에 request nonce를 전달한다", () => {
    const html = renderToString(
      <UiCspProvider nonce="request-nonce">
        <Tabs defaultValue="first">
          <TabsList>
            <TabsTrigger value="first">첫 번째</TabsTrigger>
            <TabsTrigger value="second">두 번째</TabsTrigger>
          </TabsList>
          <TabsContent value="first">첫 번째 내용</TabsContent>
          <TabsContent value="second">두 번째 내용</TabsContent>
        </Tabs>
      </UiCspProvider>
    )

    const container = document.createElement("div")
    container.innerHTML = html
    const scripts = [...container.querySelectorAll("script")]

    expect(scripts.length).toBeGreaterThan(0)
    for (const script of scripts) {
      expect(script).toHaveAttribute("nonce", "request-nonce")
    }
  })
})
