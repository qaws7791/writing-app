import type { Meta, StoryObj } from "@storybook/react-vite"
import { BookOpenIcon } from "@workspace/ui/components/icons"

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  PageHeader,
  SectionHeader,
  StatCard,
  StatGrid,
  Surface,
} from "@workspace/ui"

const meta = {
  title: "Patterns/Page Structure",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Headers: Story = {
  render: () => (
    <div className="grid max-w-5xl gap-8">
      <PageHeader
        title="콘텐츠 관리"
        description="코스와 레슨의 공개 상태를 검토하고 새 콘텐츠를 만든다."
        actions={
          <>
            <Button variant="outline">내보내기</Button>
            <Button>새 코스</Button>
          </>
        }
      />
      <Surface variant="panel">
        <SectionHeader
          title="최근 코스"
          description="최근 수정된 코스 3개"
          actions={
            <Button size="sm" variant="outline">
              전체 보기
            </Button>
          }
        />
        <p className="text-body-sm font-semibold text-muted-foreground">
          SectionHeader는 패널이나 테이블 위에서 사용한다.
        </p>
      </Surface>
    </div>
  ),
}

export const Stats: Story = {
  render: () => (
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
  ),
}

export const Tables: Story = {
  render: () => (
    <Surface variant="panel">
      <SectionHeader title="코스 목록" description="총 3개" />
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
            <TableCell>입문</TableCell>
            <TableCell>active</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>근거 문장 만들기</TableCell>
            <TableCell>기초</TableCell>
            <TableCell>draft</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Surface>
  ),
}

export const EmptyResults: Story = {
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
