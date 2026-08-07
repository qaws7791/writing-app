import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "@workspace/ui/components/ui/button"
import {
  FilterToolbar,
  FilterToolbarField,
  FilterToolbarLabel,
} from "@workspace/ui/components/ui/filter-toolbar"
import { Input } from "@workspace/ui/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select"

const statusItems = [
  { label: "전체", value: "all" },
  { label: "공개", value: "published" },
  { label: "보관", value: "archived" },
]

const meta = {
  title: "Components/UI/FilterToolbar",
  component: FilterToolbar,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof FilterToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Anatomy: Story = {
  render: () => (
    <FilterToolbar
      aria-label="코스 필터"
      onSubmit={(event) => event.preventDefault()}
    >
      <FilterToolbarField>
        <FilterToolbarLabel>코스 검색</FilterToolbarLabel>
        <Input name="query" placeholder="코스명 검색…" />
      </FilterToolbarField>
      <FilterToolbarField className="gap-0">
        <FilterToolbarLabel className="sr-only">상태</FilterToolbarLabel>
        <Select aria-label="상태" defaultValue="all" items={statusItems}>
          <SelectTrigger className="w-[140px] font-semibold" variant="outlined">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            {statusItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterToolbarField>
      <Button type="submit" variant="outline">
        필터 적용
      </Button>
    </FilterToolbar>
  ),
}

export const HiddenLabels: Story = {
  tags: ["ci-test"],
  render: () => (
    <FilterToolbar
      aria-label="사용자 필터"
      onSubmit={(event) => event.preventDefault()}
    >
      <FilterToolbarField className="gap-0">
        <FilterToolbarLabel className="sr-only">사용자 검색</FilterToolbarLabel>
        <Input name="query" placeholder="이름 또는 이메일 검색…" />
      </FilterToolbarField>
      <Button type="submit" variant="outline">
        조회
      </Button>
    </FilterToolbar>
  ),
}
