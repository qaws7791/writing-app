import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"

import { SwitchGroup } from "./index"

const meta = {
  title: "Components/SwitchGroup",
  component: SwitchGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: { type: "radio" },
      options: ["vertical", "horizontal"],
    },
  },
} satisfies Meta<typeof SwitchGroup>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default vertical switch group
 */
export const Default: Story = {
  render: () => (
    <SwitchGroup>
      <Switch>
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
        <Switch.Content>Allow notifications</Switch.Content>
      </Switch>
      <Switch>
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
        <Switch.Content>Marketing emails</Switch.Content>
      </Switch>
      <Switch defaultSelected>
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
        <Switch.Content>Dark mode</Switch.Content>
      </Switch>
    </SwitchGroup>
  ),
}

/**
 * Horizontal switch group
 */
export const Horizontal: Story = {
  render: () => (
    <SwitchGroup orientation="horizontal">
      <Switch>
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
        <Switch.Content>Notifications</Switch.Content>
      </Switch>
      <Switch>
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
        <Switch.Content>Marketing</Switch.Content>
      </Switch>
      <Switch>
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
        <Switch.Content>Analytics</Switch.Content>
      </Switch>
    </SwitchGroup>
  ),
}

/**
 * Switch group with labels using the Label component
 */
export const WithLabels: Story = {
  render: () => (
    <SwitchGroup>
      <Switch>
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
        <Label className="text-sm">Allow notifications</Label>
      </Switch>
      <Switch defaultSelected>
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
        <Label className="text-sm">Subscribe to newsletter</Label>
      </Switch>
      <Switch>
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
        <Label className="text-sm">Receive marketing updates</Label>
      </Switch>
    </SwitchGroup>
  ),
}

function FormExample() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const entries = Array.from(formData.entries())
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n")

    alert(`Form submitted:\n${entries || "(no values)"}`)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <SwitchGroup>
        <Switch name="notifications" value="on">
          <Switch.Control>
            <Switch.Thumb>
              <Switch.Icon />
            </Switch.Thumb>
          </Switch.Control>
          <Switch.Content>Enable notifications</Switch.Content>
        </Switch>
        <Switch defaultSelected name="newsletter" value="on">
          <Switch.Control>
            <Switch.Thumb>
              <Switch.Icon />
            </Switch.Thumb>
          </Switch.Control>
          <Switch.Content>Subscribe to newsletter</Switch.Content>
        </Switch>
        <Switch name="marketing" value="on">
          <Switch.Control>
            <Switch.Thumb>
              <Switch.Icon />
            </Switch.Thumb>
          </Switch.Control>
          <Switch.Content>Receive marketing updates</Switch.Content>
        </Switch>
      </SwitchGroup>
      <Button size="sm" type="submit" variant="primary">
        Save preferences
      </Button>
    </form>
  )
}

/**
 * Switch group inside a form
 */
export const Form: Story = {
  render: () => <FormExample />,
}
