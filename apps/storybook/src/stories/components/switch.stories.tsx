import type { Meta, StoryObj } from "@storybook/react-vite"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  component: Switch,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["default", "sm"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Switch>

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Switch id="sm-switch" size="sm" />
        <Label htmlFor="sm-switch">Small</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="default-switch" size="default" />
        <Label htmlFor="default-switch">Default</Label>
      </div>
    </div>
  ),
}

export const Checked: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="checked" defaultChecked />
      <Label htmlFor="checked">Enabled</Label>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="disabled" disabled />
      <Label htmlFor="disabled">Disabled</Label>
    </div>
  ),
}
