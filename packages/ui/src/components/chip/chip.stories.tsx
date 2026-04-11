import type { Meta, StoryObj } from "@storybook/react"
import { Chip } from "./chip"

const meta: Meta<typeof Chip> = {
  title: "Components/Chip",
  component: Chip,
  args: {
    children: "Chip",
    variant: "assist",
    selected: false,
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["assist", "filter", "input", "suggestion"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Chip>

export const Assist: Story = { args: { variant: "assist" } }
export const Filter: Story = { args: { variant: "filter" } }
export const FilterSelected: Story = {
  args: { variant: "filter", selected: true },
}
export const Input: Story = { args: { variant: "input" } }
export const InputWithDelete: Story = {
  args: { variant: "input", onDelete: () => {} },
}
export const Suggestion: Story = { args: { variant: "suggestion" } }
export const Disabled: Story = { args: { disabled: true } }

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Chip variant="assist">Assist</Chip>
      <Chip variant="filter">Filter</Chip>
      <Chip variant="filter" selected>
        Filter Selected
      </Chip>
      <Chip variant="input" onDelete={() => {}}>
        Input
      </Chip>
      <Chip variant="suggestion">Suggestion</Chip>
    </div>
  ),
}
