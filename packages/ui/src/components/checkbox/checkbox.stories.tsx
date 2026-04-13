import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"

import { Checkbox } from "./index"

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "radio" },
      options: ["primary", "secondary"],
    },
    isDisabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default checkbox
 */
export const Default: Story = {
  render: () => (
    <Checkbox>
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Checkbox.Content>Accept terms and conditions</Checkbox.Content>
    </Checkbox>
  ),
}

/**
 * Checked checkbox
 */
export const Checked: Story = {
  render: () => (
    <Checkbox defaultSelected>
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Checkbox.Content>Option is selected</Checkbox.Content>
    </Checkbox>
  ),
}

/**
 * Disabled checkbox
 */
export const Disabled: Story = {
  render: () => (
    <Checkbox isDisabled>
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Checkbox.Content>Disabled option</Checkbox.Content>
    </Checkbox>
  ),
}

/**
 * Indeterminate checkbox
 */
export const Indeterminate: Story = {
  render: () => (
    <Checkbox isIndeterminate>
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Checkbox.Content>Partially selected</Checkbox.Content>
    </Checkbox>
  ),
}

/**
 * Multiple checkboxes
 */
export const Multiple: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Checkbox>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>Option 1</Checkbox.Content>
      </Checkbox>
      <Checkbox defaultSelected>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>Option 2</Checkbox.Content>
      </Checkbox>
      <Checkbox>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>Option 3</Checkbox.Content>
      </Checkbox>
    </div>
  ),
}

function InteractiveCheckbox() {
  const [isChecked, setIsChecked] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <Checkbox isSelected={isChecked} onChange={setIsChecked}>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>
          {isChecked ? "Checked" : "Unchecked"}
        </Checkbox.Content>
      </Checkbox>
      <p className="text-sm">
        Status: {isChecked ? "Selected" : "Not selected"}
      </p>
    </div>
  )
}

/**
 * Interactive checkbox with state
 */
export const Interactive: Story = {
  render: () => <InteractiveCheckbox />,
}
