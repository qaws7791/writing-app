import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: shadcnParameters("spinner"),
} satisfies Meta<typeof Spinner>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Spinner />
      <Spinner className="size-5" />
      <Button disabled>
        <Spinner data-icon="inline-start" />
        Publishing
      </Button>
    </div>
  ),
}
