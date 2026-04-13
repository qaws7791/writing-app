import type { Meta, StoryObj } from "@storybook/react"

import { Checkbox } from "@workspace/ui/components/checkbox"
import { CheckboxGroup } from "./index"

const meta = {
  title: "Components/CheckboxGroup",
  component: CheckboxGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: { type: "radio" },
      options: ["vertical", "horizontal"],
    },
    isDisabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof CheckboxGroup>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default checkbox group
 */
export const Default: Story = {
  render: () => (
    <CheckboxGroup.Root>
      <Checkbox value="option1">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>Option 1</Checkbox.Content>
      </Checkbox>
      <Checkbox value="option2">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>Option 2</Checkbox.Content>
      </Checkbox>
      <Checkbox value="option3">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>Option 3</Checkbox.Content>
      </Checkbox>
    </CheckboxGroup.Root>
  ),
}

/**
 * Horizontal checkbox group
 */
export const Horizontal: Story = {
  render: () => (
    <CheckboxGroup.Root orientation="horizontal">
      <Checkbox value="opt1">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>Opt 1</Checkbox.Content>
      </Checkbox>
      <Checkbox value="opt2">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>Opt 2</Checkbox.Content>
      </Checkbox>
      <Checkbox value="opt3">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>Opt 3</Checkbox.Content>
      </Checkbox>
    </CheckboxGroup.Root>
  ),
}

/**
 * Disabled checkbox group
 */
export const Disabled: Story = {
  render: () => (
    <CheckboxGroup.Root isDisabled>
      <Checkbox value="opt1">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>Option 1</Checkbox.Content>
      </Checkbox>
      <Checkbox value="opt2">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>Option 2</Checkbox.Content>
      </Checkbox>
    </CheckboxGroup.Root>
  ),
}

/**
 * Checkbox group with default values
 */
export const WithDefaults: Story = {
  render: () => (
    <CheckboxGroup.Root defaultValue={["opt1", "opt3"]}>
      <Checkbox value="opt1">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>Option 1</Checkbox.Content>
      </Checkbox>
      <Checkbox value="opt2">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>Option 2</Checkbox.Content>
      </Checkbox>
      <Checkbox value="opt3">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>Option 3</Checkbox.Content>
      </Checkbox>
    </CheckboxGroup.Root>
  ),
}
