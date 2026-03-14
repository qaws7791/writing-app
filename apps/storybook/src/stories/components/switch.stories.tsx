import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Switch } from "@workspace/ui/components/switch"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Switch",
  component: Switch,
  parameters: shadcnParameters("switch"),
} satisfies Meta<typeof Switch>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="grid max-w-xl gap-4">
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="switch-featured">Feature on homepage</FieldLabel>
          <FieldDescription>
            Promote the article in the top editorial slot.
          </FieldDescription>
        </FieldContent>
        <Switch id="switch-featured" defaultChecked />
      </Field>
      <Field orientation="horizontal">
        <FieldLabel htmlFor="switch-compact">Compact mode</FieldLabel>
        <Switch id="switch-compact" size="sm" />
      </Field>
    </div>
  ),
}
