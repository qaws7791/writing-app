import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Markdown } from "#ui/components/ui/markdown"

describe("Markdown", () => {
  it("GFM 표와 안전한 링크·이미지를 읽기 전용으로 렌더링한다", () => {
    render(
      <Markdown>{`| 이름 | 값 |
| --- | --- |
| 자료 | 1 |

[외부](https://example.com) [내부](/resources)

![설명](https://example.com/image.png)`}</Markdown>
    )

    expect(screen.getByRole("table")).toBeVisible()
    expect(screen.getByRole("link", { name: "외부" })).toHaveAttribute(
      "rel",
      "noopener noreferrer"
    )
    expect(screen.getByRole("link", { name: "내부" })).not.toHaveAttribute(
      "target"
    )
    expect(screen.getByRole("img", { name: "설명" })).toHaveAttribute(
      "referrerpolicy",
      "no-referrer"
    )
  })

  it("허용하지 않는 링크와 이미지 프로토콜을 DOM에 반영하지 않는다", () => {
    const { container } = render(
      <Markdown>{`[HTTP](http://example.com)

![설명](http://example.com/image.png)`}</Markdown>
    )

    expect(screen.queryByRole("link", { name: "HTTP" })).not.toBeInTheDocument()
    expect(container.querySelector("img")).toBeNull()
    expect(screen.getByText("HTTP")).toBeVisible()
  })
})
