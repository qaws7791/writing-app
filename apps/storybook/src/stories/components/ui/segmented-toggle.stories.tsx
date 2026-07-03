import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import {
  SegmentedControl,
  SegmentedControlItem,
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui"

const meta = {
  title: "Components/UI/Segmented Toggle",
  parameters: {
    layout: "centered",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const SegmentedControls: Story = {
  render: () => (
    <SegmentedControl defaultValue="system" aria-label="테마">
      <SegmentedControlItem value="light">밝게</SegmentedControlItem>
      <SegmentedControlItem value="dark">어둡게</SegmentedControlItem>
      <SegmentedControlItem value="system">시스템</SegmentedControlItem>
    </SegmentedControl>
  ),
}

export const ToggleGroups: Story = {
  render: () => (
    <ToggleGroup
      defaultValue={["grammar", "style"]}
      multiple
      aria-label="검토 범위"
    >
      <ToggleGroupItem value="grammar">문법</ToggleGroupItem>
      <ToggleGroupItem value="style">문체</ToggleGroupItem>
      <ToggleGroupItem value="structure">구조</ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const Vertical: Story = {
  render: () => (
    <ToggleGroup
      aria-label="정렬"
      className="items-stretch"
      defaultValue={["recent"]}
      orientation="vertical"
    >
      <ToggleGroupItem value="recent">최신순</ToggleGroupItem>
      <ToggleGroupItem value="popular">인기순</ToggleGroupItem>
      <ToggleGroupItem value="name">이름순</ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const Interaction: Story = {
  render: () => (
    <SegmentedControl defaultValue="draft" aria-label="상태">
      <SegmentedControlItem value="draft">초안</SegmentedControlItem>
      <SegmentedControlItem value="published">공개</SegmentedControlItem>
    </SegmentedControl>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const published = canvas.getByRole("button", { name: "공개" })
    await userEvent.click(published)
    await expect(published).toHaveAttribute("aria-pressed", "true")
  },
}
