import type { Meta, StoryObj } from "@storybook/react-vite"

import { ContrastPair } from "#storybook/blocks/contrast-pair"
import { StoryMatrix } from "#storybook/blocks/story-matrix"
import { TokenSwatch } from "#storybook/blocks/token-swatch"

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
    <StoryMatrix
      columns={4}
      items={semanticColors.map((color) => ({
        title: color.name,
        children: (
          <TokenSwatch
            background={color.value}
            label={color.name}
            token={color.token}
          />
        ),
      }))}
    />
  ),
}

export const ContrastPairs: Story = {
  render: () => (
    <StoryMatrix
      items={[
        {
          title: "Primary action",
          children: (
            <ContrastPair
              background="var(--action-primary-bg)"
              foreground="var(--action-primary-fg)"
              label="Primary action"
              role="action-primary"
            />
          ),
        },
        {
          title: "Selected",
          children: (
            <ContrastPair
              background="var(--action-selected-bg)"
              foreground="var(--action-selected-fg)"
              label="Selected"
              role="action-selected"
            />
          ),
        },
        {
          title: "Success",
          children: (
            <ContrastPair
              background="var(--success-bg)"
              foreground="var(--success-fg)"
              label="Success"
              role="success"
            />
          ),
        },
        {
          title: "Danger",
          children: (
            <ContrastPair
              background="var(--danger-bg)"
              foreground="var(--danger-fg)"
              label="Danger"
              role="danger"
            />
          ),
        },
      ]}
    />
  ),
}
