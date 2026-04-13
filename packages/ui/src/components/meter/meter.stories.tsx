import type { Meta, StoryObj } from "@storybook/react"

import { Meter } from "./index"

const meta = {
  title: "Components/Meter",
  component: Meter,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100 },
    },
  },
} satisfies Meta<typeof Meter>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default meter at 60%
 */
export const Default: Story = {
  render: () => (
    <Meter value={60} minValue={0} maxValue={100}>
      <Meter.Track>
        <Meter.Fill />
      </Meter.Track>
      <Meter.Output />
    </Meter>
  ),
}

/**
 * Meter at different levels
 */
export const Levels: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <div>
        <p className="mb-2 text-sm">20%</p>
        <Meter value={20} minValue={0} maxValue={100}>
          <Meter.Track>
            <Meter.Fill />
          </Meter.Track>
        </Meter>
      </div>
      <div>
        <p className="mb-2 text-sm">50%</p>
        <Meter value={50} minValue={0} maxValue={100}>
          <Meter.Track>
            <Meter.Fill />
          </Meter.Track>
        </Meter>
      </div>
      <div>
        <p className="mb-2 text-sm">80%</p>
        <Meter value={80} minValue={0} maxValue={100}>
          <Meter.Track>
            <Meter.Fill />
          </Meter.Track>
        </Meter>
      </div>
    </div>
  ),
}

/**
 * Meter with output text
 */
export const WithOutput: Story = {
  render: () => (
    <Meter value={75} minValue={0} maxValue={100}>
      <Meter.Track>
        <Meter.Fill />
      </Meter.Track>
      <Meter.Output />
    </Meter>
  ),
}
