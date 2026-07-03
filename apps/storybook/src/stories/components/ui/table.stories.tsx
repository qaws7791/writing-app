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
} from "@workspace/ui"

const meta = {
  title: "Components/UI/Table",
  component: Table,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "결제 완료",
    totalAmount: "₩250,000",
    paymentMethod: "신용카드",
  },
  {
    invoice: "INV002",
    paymentStatus: "대기 중",
    totalAmount: "₩150,000",
    paymentMethod: "페이코",
  },
  {
    invoice: "INV003",
    paymentStatus: "결제 실패",
    totalAmount: "₩350,000",
    paymentMethod: "계좌이체",
  },
  {
    invoice: "INV004",
    paymentStatus: "결제 완료",
    totalAmount: "₩450,000",
    paymentMethod: "신용카드",
  },
  {
    invoice: "INV005",
    paymentStatus: "결제 완료",
    totalAmount: "₩550,000",
    paymentMethod: "카카오페이",
  },
]

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>최근 결제된 송장 목록입니다.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">송장 번호</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>결제 수단</TableHead>
          <TableHead className="text-right font-semibold">금액</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className="text-right font-mono">
              {invoice.totalAmount}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>총합계</TableCell>
          <TableCell className="text-right font-bold font-mono">
            ₩1,750,000
          </TableCell>
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
