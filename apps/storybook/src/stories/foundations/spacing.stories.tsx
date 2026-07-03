import type { Meta, StoryObj } from "@storybook/react-vite"

const spacingTokens = [
  { className: "w-1", label: "1", token: "spacing-1" },
  { className: "w-2", label: "2", token: "spacing-2" },
  { className: "w-3", label: "3", token: "spacing-3" },
  { className: "w-4", label: "4", token: "spacing-4" },
  { className: "w-6", label: "6", token: "spacing-6" },
  { className: "w-8", label: "8", token: "spacing-8" },
  { className: "w-10", label: "10", token: "spacing-10" },
  { className: "w-12", label: "12", token: "spacing-12" },
] as const

const meta = {
  title: "Foundations/Spacing",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Scale: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-3">
      {spacingTokens.map((item) => (
        <div
          className="grid grid-cols-[7rem_1fr] items-center gap-4"
          key={item.token}
        >
          <span className="text-label-sm font-bold text-muted-foreground">
            {item.token}
          </span>
          <div className="flex items-center gap-3">
            <span className={`${item.className} block h-6 bg-accent`} />
            <span className="text-caption font-bold text-muted-foreground/70">
              {item.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  ),
}
