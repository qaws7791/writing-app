import type { Meta, StoryObj } from "@storybook/react-vite"

const semanticColors = [
  {
    name: "Canvas",
    token: "--bg-canvas",
    value: "var(--bg-canvas)",
  },
  {
    name: "Surface",
    token: "--bg-surface",
    value: "var(--bg-surface)",
  },
  {
    name: "Elevated",
    token: "--bg-elevated",
    value: "var(--bg-elevated)",
  },
  {
    name: "Primary Action",
    token: "--action-primary-bg",
    value: "var(--action-primary-bg)",
  },
  {
    name: "Selected",
    token: "--action-selected-bg",
    value: "var(--action-selected-bg)",
  },
  {
    name: "Success",
    token: "--success-bg",
    value: "var(--success-bg)",
  },
  {
    name: "Danger",
    token: "--danger-bg",
    value: "var(--danger-bg)",
  },
  {
    name: "Info",
    token: "--info-bg",
    value: "var(--info-bg)",
  },
] as const

const contrastPairs = [
  {
    background: "var(--action-primary-bg)",
    foreground: "var(--action-primary-fg)",
    name: "Primary action",
    role: "action-primary",
  },
  {
    background: "var(--action-selected-bg)",
    foreground: "var(--action-selected-fg)",
    name: "Selected",
    role: "action-selected",
  },
  {
    background: "var(--success-bg)",
    foreground: "var(--success-fg)",
    name: "Success",
    role: "success",
  },
  {
    background: "var(--danger-bg)",
    foreground: "var(--danger-fg)",
    name: "Danger",
    role: "danger",
  },
] as const

const meta = {
  title: "Foundations/Color",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const SemanticTokens: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {semanticColors.map((color) => (
        <section
          className="grid min-h-36 content-between rounded-card border border-border/50 p-5"
          key={color.token}
          style={{
            background: color.value,
            color: "var(--fg-default)",
          }}
        >
          <span className="text-label-sm font-black">{color.token}</span>
          <strong className="text-title-lg">{color.name}</strong>
        </section>
      ))}
    </div>
  ),
}

export const ContrastPairs: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {contrastPairs.map((pair) => (
        <section
          className="grid gap-3 rounded-panel border border-border/50 bg-surface p-surface-padding-md"
          key={pair.role}
        >
          <h3 className="text-title-md font-black">{pair.name}</h3>
          <div
            className="grid gap-2 rounded-panel border border-border/50 p-5"
            style={{
              background: pair.background,
              color: pair.foreground,
            }}
          >
            <span className="text-label-sm font-black">{pair.role}</span>
            <strong className="text-title-md">{pair.name}</strong>
            <p className="text-body-sm font-semibold">
              전경과 배경을 함께 쓰는 semantic pair다.
            </p>
          </div>
        </section>
      ))}
    </div>
  ),
}
