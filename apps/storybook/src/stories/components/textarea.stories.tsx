import type { Meta, StoryObj } from "@storybook/react-vite"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof Textarea> = {
  title: "Components/Textarea",
  component: Textarea,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
  },
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {
  args: { placeholder: "Type your message here." },
  render: (args) => <Textarea className="w-[350px]" {...args} />,
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-1.5">
      <Label htmlFor="message">Your message</Label>
      <Textarea placeholder="Type your message here." id="message" />
    </div>
  ),
}

export const WithButton: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Textarea placeholder="Type your message here." />
      <Button>Send message</Button>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Textarea
      placeholder="Type your message here."
      disabled
      className="w-[350px]"
    />
  ),
}
