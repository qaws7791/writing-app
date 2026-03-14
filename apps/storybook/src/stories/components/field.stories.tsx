import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Field",
  component: Field,
  parameters: shadcnParameters("field"),
} satisfies Meta<typeof Field>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="grid gap-8 lg:grid-cols-2">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="field-title">Title</FieldLabel>
          <Input
            id="field-title"
            defaultValue="A quieter interface for longer reading"
          />
          <FieldDescription>
            Keep the headline concise enough to scan at a glance.
          </FieldDescription>
        </Field>
        <Field data-invalid>
          <FieldLabel htmlFor="field-summary">Summary</FieldLabel>
          <Textarea
            id="field-summary"
            aria-invalid
            className="min-h-24"
            defaultValue="This summary is intentionally too long and needs a tighter editorial pass."
          />
          <FieldError
            errors={[{ message: "Summary should be under 140 characters." }]}
          />
        </Field>
      </FieldGroup>

      <FieldSet>
        <FieldLegend variant="label">Publishing preferences</FieldLegend>
        <FieldDescription>
          Use grouped fields when related controls belong to the same decision.
        </FieldDescription>
        <FieldGroup className="gap-4">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="field-comments">Reader comments</FieldLabel>
              <FieldDescription>
                Allow discussion beneath the piece.
              </FieldDescription>
            </FieldContent>
            <Switch id="field-comments" defaultChecked />
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="field-newsletter">
                Newsletter slot
              </FieldLabel>
              <FieldDescription>
                Feature this article in tomorrow&apos;s digest.
              </FieldDescription>
            </FieldContent>
            <Switch id="field-newsletter" />
          </Field>
        </FieldGroup>
      </FieldSet>
    </div>
  ),
}
