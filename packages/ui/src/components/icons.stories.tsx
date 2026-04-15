import type { Meta, StoryObj } from "@storybook/react"

import {
  CloseIcon,
  DangerIcon,
  ExternalLinkIcon,
  IconChevronDown,
  IconChevronRight,
  IconSearch,
  InfoIcon,
  SuccessIcon,
  WarningIcon,
} from "./icons"

const meta = {
  title: "Components/Icons",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/**
 * All available icons in the ui package
 */
export const AllIcons: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6">
      {[
        { label: "CloseIcon", icon: <CloseIcon /> },
        {
          label: "ExternalLinkIcon",
          icon: <ExternalLinkIcon width={16} height={16} />,
        },
        { label: "InfoIcon", icon: <InfoIcon /> },
        { label: "WarningIcon", icon: <WarningIcon /> },
        { label: "DangerIcon", icon: <DangerIcon /> },
        { label: "SuccessIcon", icon: <SuccessIcon /> },
        { label: "IconSearch", icon: <IconSearch /> },
        { label: "IconChevronDown", icon: <IconChevronDown /> },
        { label: "IconChevronRight", icon: <IconChevronRight /> },
      ].map(({ label, icon }) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded border">
            {icon}
          </div>
          <span className="text-xs text-muted">{label}</span>
        </div>
      ))}
    </div>
  ),
}

/**
 * Icons at different sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      {[12, 16, 20, 24, 32].map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <InfoIcon width={size} height={size} />
          <span className="text-xs text-muted">{size}px</span>
        </div>
      ))}
    </div>
  ),
}

/**
 * Icons with color via currentColor inheritance
 */
export const Colors: Story = {
  render: () => (
    <div className="flex gap-6">
      <InfoIcon className="text-blue-500" width={24} height={24} />
      <WarningIcon className="text-yellow-500" width={24} height={24} />
      <DangerIcon className="text-red-500" width={24} height={24} />
      <SuccessIcon className="text-green-500" width={24} height={24} />
    </div>
  ),
}

/**
 * Semantic status icons
 */
export const StatusIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        {
          label: "Info",
          icon: <InfoIcon className="text-blue-500" />,
          color: "text-blue-500",
        },
        {
          label: "Warning",
          icon: <WarningIcon className="text-yellow-500" />,
          color: "text-yellow-500",
        },
        {
          label: "Danger",
          icon: <DangerIcon className="text-red-500" />,
          color: "text-red-500",
        },
        {
          label: "Success",
          icon: <SuccessIcon className="text-green-500" />,
          color: "text-green-500",
        },
      ].map(({ label, icon, color }) => (
        <div key={label} className="flex items-center gap-2">
          {icon}
          <span className={`text-sm ${color}`}>{label}</span>
        </div>
      ))}
    </div>
  ),
}
