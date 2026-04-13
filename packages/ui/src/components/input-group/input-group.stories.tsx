import type { Meta, StoryObj } from "@storybook/react"

import { InputGroup } from "./index"

const meta = {
  title: "Components/InputGroup",
  component: InputGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof InputGroup>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Input group with prefix
 */
export const WithPrefix: Story = {
  render: () => (
    <InputGroup.Root>
      <InputGroup.Prefix>$</InputGroup.Prefix>
      <InputGroup.Input placeholder="0.00" />
    </InputGroup.Root>
  ),
}

/**
 * Input group with suffix
 */
export const WithSuffix: Story = {
  render: () => (
    <InputGroup.Root>
      <InputGroup.Input placeholder="Search..." />
      <InputGroup.Suffix>🔍</InputGroup.Suffix>
    </InputGroup.Root>
  ),
}

/**
 * Input group with both prefix and suffix
 */
export const WithBoth: Story = {
  render: () => (
    <InputGroup.Root>
      <InputGroup.Prefix>https://</InputGroup.Prefix>
      <InputGroup.Input placeholder="example.com" />
      <InputGroup.Suffix>.com</InputGroup.Suffix>
    </InputGroup.Root>
  ),
}

/**
 * Input group with textarea
 */
export const WithTextArea: Story = {
  render: () => (
    <InputGroup.Root>
      <InputGroup.Prefix>Comment:</InputGroup.Prefix>
      <InputGroup.TextArea placeholder="Enter your comment..." rows={3} />
    </InputGroup.Root>
  ),
}
