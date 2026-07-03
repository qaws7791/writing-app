import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
} from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@workspace/ui"

const meta = {
  title: "Components/UI/ToggleGroup",
  component: ToggleGroup,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {
  render: () => (
    <ToggleGroup defaultValue={["left"]}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="justify" aria-label="Align justify">
        <AlignJustify className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const Multiple: Story = {
  render: () => (
    <ToggleGroup multiple defaultValue={["bold", "italic"]}>
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <Bold className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <Italic className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        <Underline className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const Outline: Story = {
  render: () => (
    <ToggleGroup variant="outline" defaultValue={["center"]}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Small (sm)</span>
        <ToggleGroup size="sm" defaultValue={["a"]}>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
          <ToggleGroupItem value="c">C</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Default</span>
        <ToggleGroup size="default" defaultValue={["a"]}>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
          <ToggleGroupItem value="c">C</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Large (lg)</span>
        <ToggleGroup size="lg" defaultValue={["a"]}>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
          <ToggleGroupItem value="c">C</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  ),
}

export const Spacing: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">
          Spacing: 0 (Outline, Compact)
        </span>
        <ToggleGroup spacing={0} variant="outline" defaultValue={["b"]}>
          <ToggleGroupItem value="a">왼쪽</ToggleGroupItem>
          <ToggleGroupItem value="b">가운데</ToggleGroupItem>
          <ToggleGroupItem value="c">오른쪽</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Spacing: 4</span>
        <ToggleGroup spacing={4} defaultValue={["b"]}>
          <ToggleGroupItem value="a">옵션 1</ToggleGroupItem>
          <ToggleGroupItem value="b">옵션 2</ToggleGroupItem>
          <ToggleGroupItem value="c">옵션 3</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <ToggleGroup orientation="vertical" defaultValue={["inbox"]}>
      <ToggleGroupItem value="inbox" className="justify-start">
        수신함
      </ToggleGroupItem>
      <ToggleGroupItem value="sent" className="justify-start">
        보낸 보관함
      </ToggleGroupItem>
      <ToggleGroupItem value="trash" className="justify-start">
        휴지통
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">전체 비활성화</span>
        <ToggleGroup disabled defaultValue={["b"]}>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
          <ToggleGroupItem value="c">C</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">
          특정 항목 비활성화
        </span>
        <ToggleGroup defaultValue={["b"]}>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
          <ToggleGroupItem value="c" disabled>
            C (비활성)
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  ),
}

export const Controlled: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState<string[]>(["center"])
    return (
      <div className="flex flex-col items-center gap-4">
        <ToggleGroup
          value={value}
          onValueChange={(val) => val && setValue(val)}
        >
          <ToggleGroupItem value="left">왼쪽 정렬</ToggleGroupItem>
          <ToggleGroupItem value="center">가운데 정렬</ToggleGroupItem>
          <ToggleGroupItem value="right">오른쪽 정렬</ToggleGroupItem>
        </ToggleGroup>
        <span className="text-sm text-muted-foreground">
          선택된 값: {value.join(", ")}
        </span>
      </div>
    )
  },
}
