import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  parameters: { layout: "centered" },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "url"],
    },
    disabled: { control: "boolean" },
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: { placeholder: "Email" },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
}

export const WithButton: Story = {
  render: () => (
    <div className="flex w-full max-w-sm items-center gap-2">
      <Input type="email" placeholder="Email" />
      <Button type="submit">Subscribe</Button>
    </div>
  ),
}

export const File: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-1.5">
      <Label htmlFor="picture">Picture</Label>
      <Input id="picture" type="file" />
    </div>
  ),
}

export const Disabled: Story = {
  args: { placeholder: "Email", disabled: true },
}
