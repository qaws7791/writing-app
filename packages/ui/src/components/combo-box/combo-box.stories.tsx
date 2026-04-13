import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "@workspace/ui/components/button"
import { ComboBox } from "./index"
import { ListBox } from "@workspace/ui/components/list-box"

const meta = {
  title: "Components/ComboBox",
  component: ComboBox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ComboBox>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default combo box
 */
export const Default: Story = {
  render: () => (
    <ComboBox.Root>
      <ComboBox.InputGroup>
        <input placeholder="Search..." />
        <ComboBox.Trigger asChild>
          <Button size="sm" variant="ghost" isIconOnly>
            ▼
          </Button>
        </ComboBox.Trigger>
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox>
          <ListBox.Item>Option 1</ListBox.Item>
          <ListBox.Item>Option 2</ListBox.Item>
          <ListBox.Item>Option 3</ListBox.Item>
        </ListBox>
      </ComboBox.Popover>
    </ComboBox.Root>
  ),
}
