import type { Meta, StoryObj } from "@storybook/react-vite"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Copy01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@workspace/ui/components/input-group"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Input Group",
  component: InputGroup,
  parameters: shadcnParameters("input-group"),
} satisfies Meta<typeof InputGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <FieldGroup className="max-w-2xl">
      <Field>
        <FieldLabel htmlFor="input-group-search">Search drafts</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="input-group-search"
            placeholder="Search by title or tag"
          />
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label="Submit search">
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel htmlFor="input-group-url">Share link</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id="input-group-url"
            defaultValue="writing.app/features/editorial"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label="Copy share link">
              <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>
          Base UI&apos;s grouped structure keeps spacing, focus, and validation
          aligned.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="input-group-note">Inline note</FieldLabel>
        <InputGroup className="h-auto">
          <InputGroupAddon align="block-start">
            <InputGroupText>Editor note</InputGroupText>
          </InputGroupAddon>
          <InputGroupTextarea
            id="input-group-note"
            className="min-h-24"
            defaultValue="Trim the opening anecdote and move the quote higher."
          />
        </InputGroup>
      </Field>
    </FieldGroup>
  ),
}
