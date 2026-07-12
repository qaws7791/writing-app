import type { Meta, StoryObj } from "@storybook/react-vite"

import { ContrastPair } from "#storybook/blocks/contrast-pair"
import { StoryMatrix } from "#storybook/blocks/story-matrix"
import { TokenSwatch } from "#storybook/blocks/token-swatch"

const semanticColors = [
  {
    name: "Canvas",
    token: "--semantic-color-bg-canvas",
    value: "var(--semantic-color-bg-canvas)",
  },
  {
    name: "Surface",
    token: "--semantic-color-bg-surface",
    value: "var(--semantic-color-bg-surface)",
  },
  {
    name: "Elevated",
    token: "--semantic-color-bg-elevated",
    value: "var(--semantic-color-bg-elevated)",
  },
  {
    name: "Primary Action",
    token: "--semantic-color-action-primary-bg",
    value: "var(--semantic-color-action-primary-bg)",
  },
  {
    name: "Selected",
    token: "--semantic-color-action-selected-bg",
    value: "var(--semantic-color-action-selected-bg)",
  },
  {
    name: "Success",
    token: "--semantic-color-success-bg",
    value: "var(--semantic-color-success-bg)",
  },
  {
    name: "Danger",
    token: "--semantic-color-danger-bg",
    value: "var(--semantic-color-danger-bg)",
  },
  {
    name: "Info",
    token: "--semantic-color-info-bg",
    value: "var(--semantic-color-info-bg)",
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
              background="var(--semantic-color-action-primary-bg)"
              foreground="var(--semantic-color-action-primary-fg)"
              label="Primary action"
              role="action-primary"
            />
          ),
        },
        {
          title: "Selected",
          children: (
            <ContrastPair
              background="var(--semantic-color-action-selected-bg)"
              foreground="var(--semantic-color-action-selected-fg)"
              label="Selected"
              role="action-selected"
            />
          ),
        },
        {
          title: "Success",
          children: (
            <ContrastPair
              background="var(--semantic-color-success-bg)"
              foreground="var(--semantic-color-success-fg)"
              label="Success"
              role="success"
            />
          ),
        },
        {
          title: "Danger",
          children: (
            <ContrastPair
              background="var(--semantic-color-danger-bg)"
              foreground="var(--semantic-color-danger-fg)"
              label="Danger"
              role="danger"
            />
          ),
        },
      ]}
    />
  ),
}
