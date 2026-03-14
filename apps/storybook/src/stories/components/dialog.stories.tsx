import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: shadcnParameters("dialog"),
} satisfies Meta<typeof Dialog>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open submission dialog
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit for editorial review</DialogTitle>
          <DialogDescription>
            Share the latest context before handing this draft to the next
            editor.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="dialog-title">Working title</FieldLabel>
            <Input
              id="dialog-title"
              defaultValue="How Quiet Interfaces Improve Focus"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="dialog-notes">Handoff notes</FieldLabel>
            <Textarea
              id="dialog-notes"
              className="min-h-28"
              defaultValue="Flag the introduction for tone review and shorten the third section."
            />
          </Field>
        </FieldGroup>
        <DialogFooter showCloseButton>
          <Button>Send to review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
