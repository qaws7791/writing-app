import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"

import { Switch } from "./index"

const meta = {
  title: "Components/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isDisabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default switch
 */
export const Default: Story = {
  render: () => (
    <Switch.Root>
      <Switch.Control>
        <Switch.Thumb>
          <Switch.Icon />
        </Switch.Thumb>
      </Switch.Control>
      <Switch.Content>Enable feature</Switch.Content>
    </Switch.Root>
  ),
}

/**
 * Switch checked by default
 */
export const Checked: Story = {
  render: () => (
    <Switch.Root defaultSelected>
      <Switch.Control>
        <Switch.Thumb>
          <Switch.Icon />
        </Switch.Thumb>
      </Switch.Control>
      <Switch.Content>Feature enabled</Switch.Content>
    </Switch.Root>
  ),
}

/**
 * Disabled switch
 */
export const Disabled: Story = {
  render: () => (
    <Switch.Root isDisabled>
      <Switch.Control>
        <Switch.Thumb>
          <Switch.Icon />
        </Switch.Thumb>
      </Switch.Control>
      <Switch.Content>Disabled switch</Switch.Content>
    </Switch.Root>
  ),
}

function InteractiveSwitch() {
  const [isOn, setIsOn] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <Switch.Root isSelected={isOn} onChange={setIsOn}>
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
        <Switch.Content>
          {isOn ? "Switch is ON" : "Switch is OFF"}
        </Switch.Content>
      </Switch.Root>
      <p className="text-sm">Status: {isOn ? "Enabled" : "Disabled"}</p>
    </div>
  )
}

/**
 * Interactive switch
 */
export const Interactive: Story = {
  render: () => <InteractiveSwitch />,
}

/**
 * Multiple switches
 */
export const Multiple: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Switch.Root>
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
        <Switch.Content>Notifications</Switch.Content>
      </Switch.Root>
      <Switch.Root defaultSelected>
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
        <Switch.Content>Dark Mode</Switch.Content>
      </Switch.Root>
      <Switch.Root>
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon />
          </Switch.Thumb>
        </Switch.Control>
        <Switch.Content>Analytics</Switch.Content>
      </Switch.Root>
    </div>
  ),
}
