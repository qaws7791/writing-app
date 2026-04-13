import type { Meta, StoryObj } from "@storybook/react"
import { Radio } from "react-aria-components"

import { RadioGroup } from "./index"

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default radio group
 */
export const Default: Story = {
  render: () => (
    <RadioGroup.Root>
      <Radio value="option1">Option 1</Radio>
      <Radio value="option2">Option 2</Radio>
      <Radio value="option3">Option 3</Radio>
    </RadioGroup.Root>
  ),
}

/**
 * Radio group with default value
 */
export const WithDefault: Story = {
  render: () => (
    <RadioGroup.Root defaultValue="option2">
      <Radio value="option1">First Choice</Radio>
      <Radio value="option2">Second Choice</Radio>
      <Radio value="option3">Third Choice</Radio>
    </RadioGroup.Root>
  ),
}

/**
 * Radio group horizontal
 */
export const Horizontal: Story = {
  render: () => (
    <RadioGroup.Root orientation="horizontal">
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </RadioGroup.Root>
  ),
}

/**
 * Disabled radio group
 */
export const Disabled: Story = {
  render: () => (
    <RadioGroup.Root isDisabled>
      <Radio value="opt1">Disabled 1</Radio>
      <Radio value="opt2">Disabled 2</Radio>
    </RadioGroup.Root>
  ),
}
