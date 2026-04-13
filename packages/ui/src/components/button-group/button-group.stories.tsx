import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "@workspace/ui/components/button"
import { ButtonGroup } from "./index"

const meta = {
  title: "Components/ButtonGroup",
  component: ButtonGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: { type: "radio" },
      options: ["horizontal", "vertical"],
    },
    fullWidth: {
      control: "boolean",
    },
    isDisabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof ButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default button group
 */
export const Default: Story = {
  render: () => (
    <ButtonGroup.Root>
      <Button variant="outline">Left</Button>
      <Button variant="outline">Middle</Button>
      <Button variant="outline">Right</Button>
    </ButtonGroup.Root>
  ),
}

/**
 * Vertical button group
 */
export const Vertical: Story = {
  render: () => (
    <ButtonGroup.Root orientation="vertical">
      <Button variant="outline">Top</Button>
      <Button variant="outline">Middle</Button>
      <Button variant="outline">Bottom</Button>
    </ButtonGroup.Root>
  ),
}

/**
 * Button group with separator
 */
export const WithSeparator: Story = {
  render: () => (
    <ButtonGroup.Root>
      <Button variant="outline">First</Button>
      <ButtonGroup.Separator />
      <Button variant="outline">Second</Button>
      <Button variant="outline">Third</Button>
    </ButtonGroup.Root>
  ),
}

/**
 * Full width button group
 */
export const FullWidth: Story = {
  render: () => (
    <ButtonGroup.Root fullWidth>
      <Button variant="outline">Option 1</Button>
      <Button variant="outline">Option 2</Button>
      <Button variant="outline">Option 3</Button>
    </ButtonGroup.Root>
  ),
}

/**
 * Disabled button group
 */
export const Disabled: Story = {
  render: () => (
    <ButtonGroup.Root isDisabled>
      <Button variant="outline">Disabled 1</Button>
      <Button variant="outline">Disabled 2</Button>
      <Button variant="outline">Disabled 3</Button>
    </ButtonGroup.Root>
  ),
}
