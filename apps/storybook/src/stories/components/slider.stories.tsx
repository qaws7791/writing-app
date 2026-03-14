import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { Label } from "@workspace/ui/components/label"
import { Slider } from "@workspace/ui/components/slider"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Slider",
  component: Slider,
  parameters: shadcnParameters("slider"),
} satisfies Meta<typeof Slider>

export default meta

type Story = StoryObj<typeof meta>

function SliderShowcase() {
  const [temperature, setTemperature] = React.useState([0.3, 0.7])
  const [minValue = 0, maxValue = 0] = temperature

  return (
    <div className="grid max-w-2xl gap-8">
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="slider-temperature">Reading density</Label>
          <span className="text-sm text-muted-foreground">
            {minValue.toFixed(1)} - {maxValue.toFixed(1)}
          </span>
        </div>
        <Slider
          id="slider-temperature"
          value={temperature}
          onValueChange={(value) => setTemperature(value as number[])}
          min={0}
          max={1}
          step={0.1}
        />
      </div>

      <div className="flex items-center gap-8">
        <Slider defaultValue={[55]} max={100} className="max-w-sm" />
        <Slider
          defaultValue={[25]}
          orientation="vertical"
          className="h-40"
          max={100}
        />
      </div>
    </div>
  )
}

export const Showcase: Story = {
  render: () => <SliderShowcase />,
}
