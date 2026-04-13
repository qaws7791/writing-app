import type { Meta, StoryObj } from "@storybook/react"

import { Dropdown } from "@workspace/ui/components/dropdown"

const meta = {
  title: "Components/MenuSection",
  component: Dropdown,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Dropdown>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Menu section example (used in Dropdown/Menu)
 */
export const Default: Story = {
  render: () => (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button>Open Menu</button>
      </Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu>
          <Dropdown.Section title="Actions">
            <Dropdown.Item>New</Dropdown.Item>
            <Dropdown.Item>Open</Dropdown.Item>
          </Dropdown.Section>
          <Dropdown.Section title="Edit">
            <Dropdown.Item>Cut</Dropdown.Item>
            <Dropdown.Item>Copy</Dropdown.Item>
            <Dropdown.Item>Paste</Dropdown.Item>
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  ),
}
