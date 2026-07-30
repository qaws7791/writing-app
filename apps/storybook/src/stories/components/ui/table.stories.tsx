import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@workspace/ui/components/ui/table"

const meta = {
  title: "Components/UI/Table",
  component: Table,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

const courses = [
  {
    category: "입문",
    id: "COURSE-001",
    lessons: 24,
    status: "active",
    title: "문장의 중심 찾기",
    units: 6,
  },
  {
    category: "입문",
    id: "COURSE-002",
    lessons: 18,
    status: "active",
    title: "근거를 쌓는 단락 쓰기",
    units: 5,
  },
  {
    category: "심화",
    id: "COURSE-003",
    lessons: 32,
    status: "archived",
    title: "설명문 구조 설계",
    units: 8,
  },
  {
    category: "심화",
    id: "COURSE-004",
    lessons: 12,
    status: "active",
    title: "초안 다듬기 연습",
    units: 4,
  },
]

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>관리자 코스 목록입니다.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]" scope="col">
            코스 ID
          </TableHead>
          <TableHead scope="col">강의명</TableHead>
          <TableHead scope="col">카테고리</TableHead>
          <TableHead scope="col">상태</TableHead>
          <TableHead className="text-right font-semibold" scope="col">
            레슨
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course) => (
          <TableRow key={course.id}>
            <TableCell className="font-mono">{course.id}</TableCell>
            <TableCell className="font-medium">{course.title}</TableCell>
            <TableCell>{course.category}</TableCell>
            <TableCell>{course.status}</TableCell>
            <TableCell className="text-right font-mono">
              {course.lessons}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={4}>총 레슨</TableCell>
          <TableCell className="text-right font-bold font-mono">86</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
}

export const Striped: Story = {
  render: () => (
    <Table>
      <TableCaption>
        행별로 번갈아 가며 배경색이 입혀진 스타일의 테이블입니다.
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">학습 ID</TableHead>
          <TableHead>수강생 이름</TableHead>
          <TableHead>진행률</TableHead>
          <TableHead className="text-right">최근 활동일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className="odd:bg-muted/30">
          <TableCell className="font-mono">STUD-001</TableCell>
          <TableCell className="font-medium">김철수</TableCell>
          <TableCell>85%</TableCell>
          <TableCell className="text-right">2026-06-30</TableCell>
        </TableRow>
        <TableRow className="odd:bg-muted/30">
          <TableCell className="font-mono">STUD-002</TableCell>
          <TableCell className="font-medium">이영희</TableCell>
          <TableCell>42%</TableCell>
          <TableCell className="text-right">2026-06-29</TableCell>
        </TableRow>
        <TableRow className="odd:bg-muted/30">
          <TableCell className="font-mono">STUD-003</TableCell>
          <TableCell className="font-medium">박민수</TableCell>
          <TableCell>99%</TableCell>
          <TableCell className="text-right">2026-06-30</TableCell>
        </TableRow>
        <TableRow className="odd:bg-muted/30">
          <TableCell className="font-mono">STUD-004</TableCell>
          <TableCell className="font-medium">최지원</TableCell>
          <TableCell>12%</TableCell>
          <TableCell className="text-right">2026-06-25</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}
