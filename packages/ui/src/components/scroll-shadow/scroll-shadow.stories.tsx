import type { Meta, StoryObj } from "@storybook/react"

import { ScrollShadow } from "./index"

const meta = {
  title: "Components/ScrollShadow",
  component: ScrollShadow,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollShadow>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Scroll shadow with scrollable content
 */
export const Default: Story = {
  render: () => (
    <ScrollShadow.Root className="h-48 w-64 overflow-auto">
      <div className="space-y-4 p-4">
        <p>Item 1</p>
        <p>Item 2</p>
        <p>Item 3</p>
        <p>Item 4</p>
        <p>Item 5</p>
        <p>Item 6</p>
        <p>Item 7</p>
        <p>Item 8</p>
        <p>Item 9</p>
        <p>Item 10</p>
      </div>
    </ScrollShadow.Root>
  ),
}

/**
 * Scroll shadow with list
 */
export const WithList: Story = {
  render: () => (
    <ScrollShadow.Root className="h-64 w-72 overflow-auto rounded border">
      <ul className="space-y-2 p-4">
        <li>List Item 1</li>
        <li>List Item 2</li>
        <li>List Item 3</li>
        <li>List Item 4</li>
        <li>List Item 5</li>
        <li>List Item 6</li>
        <li>List Item 7</li>
        <li>List Item 8</li>
      </ul>
    </ScrollShadow.Root>
  ),
}
