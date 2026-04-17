import type { Meta, StoryObj } from "@storybook/react-vite"

import { Slider } from "@/components/ui/slider"

const meta: Meta<typeof Slider> = {
  title: "Components/Slider",
  component: Slider,
  parameters: { layout: "centered" },
  argTypes: {
    min: { control: { type: "number" } },
    max: { control: { type: "number" } },
    step: { control: { type: "number" } },
  },
}

export default meta
type Story = StoryObj<typeof Slider>

export const Default: Story = {
  render: () => (
    <Slider defaultValue={[50]} max={100} step={1} className="w-[350px]" />
  ),
}

export const Range: Story = {
  render: () => (
    <Slider defaultValue={[25, 75]} max={100} step={1} className="w-[350px]" />
  ),
}

export const Steps: Story = {
  render: () => (
    <Slider defaultValue={[50]} max={100} step={10} className="w-[350px]" />
  ),
}
