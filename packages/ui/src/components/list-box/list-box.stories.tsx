import type { Meta, StoryObj } from "@storybook/react"

import { ListBox } from "./index"

const meta = {
  title: "Components/ListBox",
  component: ListBox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ListBox>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default list box
 */
export const Default: Story = {
  render: () => (
    <ListBox.Root>
      <ListBox.Item>Option 1</ListBox.Item>
      <ListBox.Item>Option 2</ListBox.Item>
      <ListBox.Item>Option 3</ListBox.Item>
    </ListBox.Root>
  ),
}

/**
 * List box with sections
 */
export const WithSections: Story = {
  render: () => (
    <ListBox.Root>
      <ListBox.Section title="Group 1">
        <ListBox.Item>Item 1</ListBox.Item>
        <ListBox.Item>Item 2</ListBox.Item>
      </ListBox.Section>
      <ListBox.Section title="Group 2">
        <ListBox.Item>Item 3</ListBox.Item>
        <ListBox.Item>Item 4</ListBox.Item>
      </ListBox.Section>
    </ListBox.Root>
  ),
}

/**
 * List box with selection
 */
export const Selectable: Story = {
  render: () => (
    <ListBox.Root selectionMode="single">
      <ListBox.Item>Select Option 1</ListBox.Item>
      <ListBox.Item>Select Option 2</ListBox.Item>
      <ListBox.Item>Select Option 3</ListBox.Item>
    </ListBox.Root>
  ),
}
