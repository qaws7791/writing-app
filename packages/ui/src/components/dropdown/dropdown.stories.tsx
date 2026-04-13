import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "@workspace/ui/components/button"
import { Dropdown } from "./index"

const meta = {
  title: "Components/Dropdown",
  component: Dropdown,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Dropdown>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default dropdown menu
 */
export const Default: Story = {
  render: () => (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <Button>Menu</Button>
      </Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu>
          <Dropdown.Item>Edit</Dropdown.Item>
          <Dropdown.Item>Delete</Dropdown.Item>
          <Dropdown.Item>Share</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  ),
}

/**
 * Dropdown with sections
 */
export const WithSections: Story = {
  render: () => (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <Button>Actions</Button>
      </Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu>
          <Dropdown.Section title="Edit">
            <Dropdown.Item>Edit</Dropdown.Item>
            <Dropdown.Item>Duplicate</Dropdown.Item>
          </Dropdown.Section>
          <Dropdown.Section title="Danger">
            <Dropdown.Item>Delete</Dropdown.Item>
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  ),
}

/**
 * Dropdown with submenu
 */
export const WithSubmenu: Story = {
  render: () => (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <Button>File</Button>
      </Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu>
          <Dropdown.Item>New</Dropdown.Item>
          <Dropdown.Item>Open</Dropdown.Item>
          <Dropdown.SubmenuTrigger>
            Recent
            <Dropdown.SubmenuIndicator />
          </Dropdown.SubmenuTrigger>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  ),
}
