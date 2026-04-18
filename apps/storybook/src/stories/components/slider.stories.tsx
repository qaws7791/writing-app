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
    <div className="w-80 p-8">
      <Slider defaultValue={[50]} max={100} step={1} />
    </div>
  ),
}

export const Range: Story = {
  render: () => (
    <div className="w-80 p-8">
      <Slider defaultValue={[25, 75]} max={100} step={1} />
    </div>
  ),
}

export const Steps: Story = {
  render: () => (
    <div className="w-80 p-8">
      <Slider defaultValue={[50]} max={100} step={10} />
    </div>
  ),
}
