import type { Meta, StoryObj } from "@storybook/react-vite"

import { Textarea } from "@workspace/ui/components/textarea"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  parameters: shadcnParameters("textarea"),
} satisfies Meta<typeof Textarea>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="grid max-w-2xl gap-4">
      <Textarea
        className="min-h-28"
        defaultValue="An editorial product should help readers stay with the text instead of competing for attention."
      />
      <Textarea
        aria-invalid
        defaultValue="This revision note is missing the required context."
      />
      <Textarea disabled defaultValue="Archived notes cannot be edited." />
    </div>
  ),
}
