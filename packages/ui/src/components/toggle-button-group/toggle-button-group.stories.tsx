import type { Meta, StoryObj } from "@storybook/react"

import { ToggleButton } from "@workspace/ui/components/toggle-button"
import { ToggleButtonGroup } from "./index"

const meta = {
  title: "Components/ToggleButtonGroup",
  component: ToggleButtonGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: { type: "radio" },
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof ToggleButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default toggle button group
 */
export const Default: Story = {
  render: () => (
    <ToggleButtonGroup.Root defaultSelectedKeys={["list"]}>
      <ToggleButton value="grid">Grid</ToggleButton>
      <ToggleButton value="list">List</ToggleButton>
      <ToggleButton value="table">Table</ToggleButton>
    </ToggleButtonGroup.Root>
  ),
}

/**
 * Vertical toggle button group
 */
export const Vertical: Story = {
  render: () => (
    <ToggleButtonGroup.Root orientation="vertical" defaultSelectedKeys={["b"]}>
      <ToggleButton value="a">Option A</ToggleButton>
      <ToggleButton value="b">Option B</ToggleButton>
      <ToggleButton value="c">Option C</ToggleButton>
    </ToggleButtonGroup.Root>
  ),
}

/**
 * Toggle button group with separator
 */
export const WithSeparator: Story = {
  render: () => (
    <ToggleButtonGroup.Root defaultSelectedKeys={["bold"]}>
      <ToggleButton value="bold">B</ToggleButton>
      <ToggleButton value="italic">I</ToggleButton>
      <ToggleButton value="underline">U</ToggleButton>
      <ToggleButtonGroup.Separator />
      <ToggleButton value="code">Code</ToggleButton>
    </ToggleButtonGroup.Root>
  ),
}
