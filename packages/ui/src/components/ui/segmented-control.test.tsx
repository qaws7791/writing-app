import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SegmentedControl, SegmentedControlItem } from "./segmented-control"
import { ToggleGroup, ToggleGroupItem } from "./toggle-group"

describe("segmented control", () => {
  it("exposes a single string value to callers", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <SegmentedControl defaultValue="system" onValueChange={onValueChange}>
        <SegmentedControlItem value="light">밝게</SegmentedControlItem>
        <SegmentedControlItem value="dark">어둡게</SegmentedControlItem>
        <SegmentedControlItem value="system">시스템</SegmentedControlItem>
      </SegmentedControl>
    )

    expect(screen.getByRole("button", { name: "시스템" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )

    await user.click(screen.getByRole("button", { name: "어둡게" }))

    expect(onValueChange).toHaveBeenCalledWith("dark")
  })

  it("keeps ToggleGroup array value available for multi-select controls", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <ToggleGroup
        defaultValue={["grammar"]}
        multiple
        onValueChange={onValueChange}
      >
        <ToggleGroupItem value="grammar">문법</ToggleGroupItem>
        <ToggleGroupItem value="style">문체</ToggleGroupItem>
      </ToggleGroup>
    )

    await user.click(screen.getByRole("button", { name: "문체" }))

    expect(onValueChange).toHaveBeenCalledWith(
      ["grammar", "style"],
      expect.any(Object)
    )
  })
})
