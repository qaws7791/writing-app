import type { Meta, StoryObj } from "@storybook/react"
import { LinearProgress } from "./linear-progress"
import { CircularProgress } from "./circular-progress"

const linearMeta: Meta<typeof LinearProgress> = {
  title: "Components/LinearProgress",
  component: LinearProgress,
  args: {
    value: 50,
    indeterminate: false,
  },
}

export default linearMeta
type LinearStory = StoryObj<typeof LinearProgress>

export const Determinate: LinearStory = { args: { value: 75 } }
export const Indeterminate: LinearStory = { args: { indeterminate: true } }
export const Zero: LinearStory = { args: { value: 0 } }
export const Complete: LinearStory = { args: { value: 100 } }

export const AllStates: LinearStory = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <LinearProgress value={0} />
      <LinearProgress value={25} />
      <LinearProgress value={50} />
      <LinearProgress value={75} />
      <LinearProgress value={100} />
      <LinearProgress indeterminate />
    </div>
  ),
}

export const CircularDeterminate: StoryObj<typeof CircularProgress> = {
  render: () => (
    <div className="flex items-center gap-4">
      <CircularProgress value={25} size={32} />
      <CircularProgress value={50} size={48} />
      <CircularProgress value={75} size={64} />
      <CircularProgress value={100} size={48} />
    </div>
  ),
}

export const CircularIndeterminate: StoryObj<typeof CircularProgress> = {
  render: () => (
    <div className="flex items-center gap-4">
      <CircularProgress indeterminate size={32} />
      <CircularProgress indeterminate size={48} />
      <CircularProgress indeterminate size={64} />
    </div>
  ),
}
