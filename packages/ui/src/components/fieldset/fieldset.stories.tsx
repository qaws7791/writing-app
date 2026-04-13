import type { Meta, StoryObj } from "@storybook/react"

import { Fieldset } from "./index"
import { Label } from "@workspace/ui/components/label"
import { Input } from "@workspace/ui/components/input"

const meta = {
  title: "Components/Fieldset",
  component: Fieldset,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Fieldset>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default fieldset
 */
export const Default: Story = {
  render: () => (
    <Fieldset.Root>
      <Fieldset.Legend>Personal Information</Fieldset.Legend>
      <Fieldset.FieldGroup>
        <Label>Name</Label>
        <Input placeholder="Enter your name" />
      </Fieldset.FieldGroup>
      <Fieldset.FieldGroup>
        <Label>Email</Label>
        <Input placeholder="Enter your email" />
      </Fieldset.FieldGroup>
    </Fieldset.Root>
  ),
}

/**
 * Fieldset with actions
 */
export const WithActions: Story = {
  render: () => (
    <Fieldset.Root>
      <Fieldset.Legend>Account Settings</Fieldset.Legend>
      <Fieldset.FieldGroup>
        <Label>Username</Label>
        <Input placeholder="Enter username" />
      </Fieldset.FieldGroup>
      <Fieldset.Actions>
        <button>Cancel</button>
        <button>Save Changes</button>
      </Fieldset.Actions>
    </Fieldset.Root>
  ),
}
