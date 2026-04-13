import type { Meta, StoryObj } from "@storybook/react"

import { ProgressBar } from "./index"

const meta = {
  title: "Components/ProgressBar",
  component: ProgressBar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100 },
    },
  },
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default progress bar at 60%
 */
export const Default: Story = {
  render: () => (
    <ProgressBar value={60} minValue={0} maxValue={100}>
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
      <ProgressBar.Output />
    </ProgressBar>
  ),
}

/**
 * Progress bar at different levels
 */
export const Stages: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <div>
        <p className="mb-2 text-sm">25%</p>
        <ProgressBar value={25} minValue={0} maxValue={100}>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
      <div>
        <p className="mb-2 text-sm">50%</p>
        <ProgressBar value={50} minValue={0} maxValue={100}>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
      <div>
        <p className="mb-2 text-sm">75%</p>
        <ProgressBar value={75} minValue={0} maxValue={100}>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
      <div>
        <p className="mb-2 text-sm">100%</p>
        <ProgressBar value={100} minValue={0} maxValue={100}>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
    </div>
  ),
}

/**
 * Progress bar with label
 */
export const WithLabel: Story = {
  render: () => (
    <div className="w-80">
      <p className="mb-2 text-sm">Loading: 70%</p>
      <ProgressBar value={70} minValue={0} maxValue={100}>
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  ),
}
