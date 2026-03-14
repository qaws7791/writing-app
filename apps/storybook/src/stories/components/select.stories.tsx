import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Select",
  component: Select,
  parameters: shadcnParameters("select"),
} satisfies Meta<typeof Select>

export default meta

type Story = StoryObj<typeof meta>

const collections = [
  { label: "Pick a collection", value: null },
  { label: "Essays", value: "essays" },
  { label: "Interviews", value: "interviews" },
  { label: "Reviews", value: "reviews" },
]

const locales = [
  { label: "Korean", value: "ko" },
  { label: "English", value: "en" },
  { label: "Japanese", value: "ja" },
]

export const Showcase: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <Select items={collections}>
        <SelectTrigger className="w-60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {collections.map((item) => (
              <SelectItem key={String(item.value)} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select items={locales} multiple defaultValue={["ko", "en"]}>
        <SelectTrigger className="w-60">
          <SelectValue>
            {(value: string[]) =>
              value.length === 0
                ? "Select locales"
                : `${value.length} locales selected`
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Publishing locales</SelectLabel>
            {locales.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Editorial</SelectLabel>
            <SelectItem value="internal-review">
              Internal review only
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
}
