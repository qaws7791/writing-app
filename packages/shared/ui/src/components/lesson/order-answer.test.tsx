import { act } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  createDeterministicOrder,
  OrderAnswer,
} from "#ui/components/lesson/order-answer"

describe("ORDER 초기 순서", () => {
  it("같은 seed는 정답과 다른 동일한 순서를 만든다", () => {
    const items = ["첫째", "둘째", "셋째", "넷째"].map((text, index) => ({
      id: `item-${index + 1}`,
      text,
    }))
    const correctItemIds = items.map((item) => item.id)
    const first = createDeterministicOrder(items, correctItemIds, "step-1")
    const second = createDeterministicOrder(items, correctItemIds, "step-1")

    expect(first).toEqual(second)
    expect(first).not.toEqual(items)
  })

  it.each([2, 3, 7, 20])(
    "%i개 항목을 섞어도 각 항목을 정확히 한 번 포함한다",
    (size) => {
      const items = Array.from({ length: size }, (_, index) => ({
        id: `item-${index}`,
        text: `item-${index}`,
      }))
      const shuffled = createDeterministicOrder(
        items,
        items.map((item) => item.id),
        `step-${size}`
      )

      expect(shuffled.map((item) => item.id).sort()).toEqual(
        items.map((item) => item.id).sort()
      )
    }
  )

  it("SSR HTML과 hydration 초기 DOM 순서가 같다", async () => {
    const props = {
      correctItemIds: ["item-1", "item-2", "item-3"],
      items: [
        { id: "item-1", text: "첫째" },
        { id: "item-2", text: "둘째" },
        { id: "item-3", text: "셋째" },
      ],
      seed: "step-hydration",
    }
    const html = renderToString(<OrderAnswer {...props} />)
    const container = document.createElement("div")
    container.innerHTML = html
    const before = container.textContent
    const recoverableErrors: unknown[] = []

    let root: ReturnType<typeof hydrateRoot> | undefined
    await act(async () => {
      root = hydrateRoot(container, <OrderAnswer {...props} />, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      })
    })
    const after = container.textContent ?? ""

    await act(async () => root?.unmount())

    expect(recoverableErrors).toEqual([])
    expect(after).toBe(before)
  })
})
