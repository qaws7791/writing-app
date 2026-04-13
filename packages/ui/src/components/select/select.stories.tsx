import type { Meta, StoryObj } from "@storybook/react"

import { ListBox } from "@workspace/ui/components/list-box"
import { Select } from "./index"

const meta = {
  title: "Components/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default select
 */
export const Default: Story = {
  render: () => (
    <Select.Root>
      <Select.Trigger>
        <Select.Value placeholder="Select an option..." />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item>Option 1</ListBox.Item>
          <ListBox.Item>Option 2</ListBox.Item>
          <ListBox.Item>Option 3</ListBox.Item>
        </ListBox>
      </Select.Popover>
    </Select.Root>
  ),
}

/**
 * Select with default value
 */
export const WithDefault: Story = {
  render: () => (
    <Select.Root defaultSelectedKey="opt2">
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item key="opt1">First Option</ListBox.Item>
          <ListBox.Item key="opt2">Second Option</ListBox.Item>
          <ListBox.Item key="opt3">Third Option</ListBox.Item>
        </ListBox>
      </Select.Popover>
    </Select.Root>
  ),
}

/**
 * Disabled select
 */
export const Disabled: Story = {
  render: () => (
    <Select.Root isDisabled>
      <Select.Trigger>
        <Select.Value placeholder="Disabled..." />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item>Option 1</ListBox.Item>
          <ListBox.Item>Option 2</ListBox.Item>
        </ListBox>
      </Select.Popover>
    </Select.Root>
  ),
}
