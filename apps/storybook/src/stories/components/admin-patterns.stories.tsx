import type { Meta, StoryObj } from "@storybook/react-vite"
import { BookOpenIcon } from "@workspace/ui/components/icons"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/ui/empty"
import {
  FilterToolbar,
  FilterToolbarField,
  FilterToolbarLabel,
} from "@workspace/ui/components/ui/filter-toolbar"
import { Input } from "@workspace/ui/components/ui/input"
import { PageHeader } from "@workspace/ui/components/ui/page-header"
import { SectionHeader } from "@workspace/ui/components/ui/section-header"
import { Select } from "@workspace/ui/components/ui/select"
import { StatCard, StatGrid } from "@workspace/ui/components/ui/stat-card"
import { Surface } from "@workspace/ui/components/ui/surface"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table"

const meta = {
  title: "Patterns/Admin",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => (
    <div className="grid gap-5">
      <PageHeader
        title="콘텐츠 관리"
        description="코스를 검색하고 새 강의를 생성하거나 보관합니다."
        actions={<Button>새 코스</Button>}
      />
      <StatGrid aria-label="주요 지표">
        <StatCard
          icon={<BookOpenIcon aria-hidden="true" size={18} />}
          label="콘텐츠"
          value="42"
          detail="활성 강의 8개"
        />
        <StatCard label="총 사용자" value="1,230" detail="최근 7일 활성 42명" />
        <StatCard label="신규 가입" value="+18" detail="오늘 3명" />
        <StatCard label="완료 레슨" value="8,420" detail="누적 완료 수" />
      </StatGrid>
      <FilterToolbar aria-label="코스 필터">
        <FilterToolbarField>
          <FilterToolbarLabel>코스 검색</FilterToolbarLabel>
          <Input aria-label="코스 검색" placeholder="제목 또는 설명 검색" />
        </FilterToolbarField>
        <FilterToolbarField>
          <FilterToolbarLabel>상태</FilterToolbarLabel>
          <Select aria-label="상태" defaultValue="all">
            <option value="all">전체</option>
            <option value="active">active</option>
            <option value="archived">archived</option>
          </Select>
        </FilterToolbarField>
        <Button variant="outline" type="submit">
          필터 적용
        </Button>
      </FilterToolbar>
      <Surface variant="panel">
        <SectionHeader title="코스 목록" description="총 3개 · 1/1 페이지" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">코스</TableHead>
              <TableHead scope="col">카테고리</TableHead>
              <TableHead scope="col">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>문장의 중심 찾기</TableCell>
              <TableCell>입문자를 위한 코스</TableCell>
              <TableCell>active</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Surface>
    </div>
  ),
}

export const EmptyResult: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>표시할 항목이 없습니다</EmptyTitle>
        <EmptyDescription>
          검색어나 필터를 조정해 다시 확인하세요.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline">필터 초기화</Button>
      </EmptyContent>
    </Empty>
  ),
}
