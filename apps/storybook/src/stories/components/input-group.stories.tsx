import type { Meta, StoryObj } from "@storybook/react-vite"
import { Search, Mail, AtSign } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof InputGroup> = {
  title: "Components/InputGroup",
  component: InputGroup,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof InputGroup>

export const Default: Story = {
  render: () => (
    <InputGroup className="w-[300px]">
      <InputGroupAddon align="inline-start">
        <Search className="size-4 text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search..." />
    </InputGroup>
  ),
}

export const WithButton: Story = {
  render: () => (
    <InputGroup className="w-[350px]">
      <InputGroupInput placeholder="Enter email" type="email" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton>Subscribe</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const WithPrefix: Story = {
  render: () => (
    <InputGroup className="w-[300px]">
      <InputGroupAddon align="inline-start">
        <AtSign className="size-4 text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput placeholder="username" />
    </InputGroup>
  ),
}

export const WithBothAddons: Story = {
  render: () => (
    <InputGroup className="w-[300px]">
      <InputGroupAddon align="inline-start">
        <Mail className="size-4 text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Email address" type="email" />
      <InputGroupAddon align="inline-end">
        <span className="text-xs text-muted-foreground">@gmail.com</span>
      </InputGroupAddon>
    </InputGroup>
  ),
}
