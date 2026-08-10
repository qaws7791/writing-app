"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowLeftDoubleIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  MoreHorizontalIcon,
  PlusSignIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";

import { cn } from "@/registry/luma/lib/utils";
import { AdminShell } from "@/registry/luma/blocks/admin-shell";
import { AvatarFallback } from "@/registry/luma/ui/avatar";
import { Badge } from "@/registry/luma/ui/badge";
import { Button } from "@/registry/luma/ui/button";
import { Checkbox } from "@/registry/luma/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/luma/ui/dropdown-menu";
import { Input } from "@/registry/luma/ui/input";
import {
  LearnerRecord,
  LearnerRecordAttempts,
  LearnerRecordHeader,
  LearnerRecordMastery,
  LearnerRecordMeta,
  LearnerRecordPath,
  LearnerRecordSection,
  LearnerRecordSectionTitle,
  LearnerRecordSupport,
  LearnerRecordTitle,
} from "@/registry/luma/ui/learner-record";
import {
  Person,
  PersonAvatar,
  PersonDescription,
  PersonInfo,
  PersonName,
} from "@/registry/luma/ui/person";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/luma/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/registry/luma/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/luma/ui/table";

type UserRole = "learner" | "instructor";
type UserStatus = "active" | "invited" | "suspended";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  cohort: string;
  lastActiveAt: string;
  progressLabel: string;
  masteryLabel: string;
  attemptsLabel: string;
  supportLabel: string;
};

const ROLE_LABELS: Record<UserRole, string> = {
  learner: "학습자",
  instructor: "강사",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "활성",
  invited: "초대됨",
  suspended: "정지",
};

const STATUS_BADGE_VARIANT: Record<UserStatus, "success" | "warning" | "destructive"> = {
  active: "success",
  invited: "warning",
  suspended: "destructive",
};

const USERS: UserRow[] = [
  {
    id: "usr-01",
    name: "이서연",
    email: "seoyeon.lee@example.com",
    role: "learner",
    status: "active",
    cohort: "중급 A반",
    lastActiveAt: "2026-08-04",
    progressLabel: "유닛 2 · 레슨 3 진행 중",
    masteryLabel: "주장-근거 연결 · 숙련",
    attemptsLabel: "최근 시도 4회 · 정답률 75%",
    supportLabel: "개입 없음",
  },
  {
    id: "usr-02",
    name: "박민준",
    email: "minjun.park@example.com",
    role: "learner",
    status: "active",
    cohort: "중급 A반",
    lastActiveAt: "2026-08-03",
    progressLabel: "유닛 1 · 레슨 8 완료",
    masteryLabel: "어휘 정밀 읽기 · 진행 중",
    attemptsLabel: "최근 시도 6회 · 정답률 68%",
    supportLabel: "7월 힌트 래더 1회",
  },
  {
    id: "usr-03",
    name: "최지우",
    email: "jiwoo.choi@example.com",
    role: "learner",
    status: "active",
    cohort: "초급 B반",
    lastActiveAt: "2026-07-28",
    progressLabel: "유닛 1 · 레슨 4 정체",
    masteryLabel: "조사 선택 · 취약",
    attemptsLabel: "최근 시도 9회 · 정답률 44%",
    supportLabel: "반복 오답 · 개입 대기",
  },
  {
    id: "usr-04",
    name: "한도윤",
    email: "doyoon.han@example.com",
    role: "learner",
    status: "active",
    cohort: "초급 B반",
    lastActiveAt: "2026-07-20",
    progressLabel: "유닛 1 · 레슨 2 진행 중",
    masteryLabel: "인사 표현 · 숙련",
    attemptsLabel: "최근 시도 2회 · 정답률 90%",
    supportLabel: "7일 이상 미접속",
  },
  {
    id: "usr-05",
    name: "정하린",
    email: "harin.jung@example.com",
    role: "learner",
    status: "invited",
    cohort: "중급 A반",
    lastActiveAt: "—",
    progressLabel: "초대 수락 대기",
    masteryLabel: "아직 측정 없음",
    attemptsLabel: "시도 없음",
    supportLabel: "초대일 2026-08-02",
  },
  {
    id: "usr-06",
    name: "오세훈",
    email: "sehun.oh@example.com",
    role: "instructor",
    status: "active",
    cohort: "중급 A반 · 초급 B반",
    lastActiveAt: "2026-08-04",
    progressLabel: "담당 코호트 2개",
    masteryLabel: "피드백 대기 3건",
    attemptsLabel: "오늘 코칭 2건 발송",
    supportLabel: "개입 큐 1건 검토 중",
  },
  {
    id: "usr-07",
    name: "김나영",
    email: "nayoung.kim@example.com",
    role: "instructor",
    status: "active",
    cohort: "고급 쓰기반",
    lastActiveAt: "2026-08-03",
    progressLabel: "담당 코호트 1개",
    masteryLabel: "루브릭 검토 1건",
    attemptsLabel: "어제 피드백 5건",
    supportLabel: "지원 메모 없음",
  },
  {
    id: "usr-08",
    name: "윤채원",
    email: "chaewon.yoon@example.com",
    role: "learner",
    status: "suspended",
    cohort: "중급 A반",
    lastActiveAt: "2026-06-12",
    progressLabel: "유닛 2 · 접근 정지",
    masteryLabel: "마지막 숙련 · 보통",
    attemptsLabel: "정지 전 시도 3회",
    supportLabel: "정책 위반 · 검토 완료",
  },
  {
    id: "usr-09",
    name: "강이안",
    email: "ian.kang@example.com",
    role: "learner",
    status: "active",
    cohort: "고급 쓰기반",
    lastActiveAt: "2026-08-04",
    progressLabel: "유닛 3 · 레슨 1 진행 중",
    masteryLabel: "논증 구조 · 숙련",
    attemptsLabel: "최근 시도 5회 · 정답률 82%",
    supportLabel: "개입 없음",
  },
  {
    id: "usr-10",
    name: "배수지",
    email: "suzy.bae@example.com",
    role: "learner",
    status: "invited",
    cohort: "초급 B반",
    lastActiveAt: "—",
    progressLabel: "초대 수락 대기",
    masteryLabel: "아직 측정 없음",
    attemptsLabel: "시도 없음",
    supportLabel: "초대일 2026-08-01",
  },
  {
    id: "usr-11",
    name: "신우진",
    email: "woojin.shin@example.com",
    role: "learner",
    status: "active",
    cohort: "중급 A반",
    lastActiveAt: "2026-08-02",
    progressLabel: "유닛 2 · 레슨 1 진행 중",
    masteryLabel: "존댓말 전환 · 진행 중",
    attemptsLabel: "최근 시도 3회 · 정답률 71%",
    supportLabel: "개입 없음",
  },
  {
    id: "usr-12",
    name: "문소희",
    email: "sohee.moon@example.com",
    role: "learner",
    status: "active",
    cohort: "고급 쓰기반",
    lastActiveAt: "2026-08-01",
    progressLabel: "유닛 2 · 레슨 6 완료",
    masteryLabel: "문단 응집 · 숙련",
    attemptsLabel: "최근 시도 7회 · 정답률 79%",
    supportLabel: "동료 피드백 1회",
  },
  {
    id: "usr-13",
    name: "임재현",
    email: "jaehyun.lim@example.com",
    role: "learner",
    status: "active",
    cohort: "초급 B반",
    lastActiveAt: "2026-07-30",
    progressLabel: "유닛 1 · 레슨 5 진행 중",
    masteryLabel: "숫자·날짜 · 진행 중",
    attemptsLabel: "최근 시도 4회 · 정답률 60%",
    supportLabel: "개입 없음",
  },
  {
    id: "usr-14",
    name: "조예린",
    email: "yerin.jo@example.com",
    role: "instructor",
    status: "invited",
    cohort: "미배정",
    lastActiveAt: "—",
    progressLabel: "강사 초대 수락 대기",
    masteryLabel: "담당 코호트 없음",
    attemptsLabel: "활동 없음",
    supportLabel: "초대일 2026-08-03",
  },
  {
    id: "usr-15",
    name: "홍지민",
    email: "jimin.hong@example.com",
    role: "learner",
    status: "suspended",
    cohort: "초급 B반",
    lastActiveAt: "2026-05-18",
    progressLabel: "유닛 1 · 접근 정지",
    masteryLabel: "마지막 숙련 · 초보",
    attemptsLabel: "정지 전 시도 1회",
    supportLabel: "장기 미접속 후 정지",
  },
  {
    id: "usr-16",
    name: "노현우",
    email: "hyunwoo.noh@example.com",
    role: "learner",
    status: "active",
    cohort: "중급 A반",
    lastActiveAt: "2026-08-04",
    progressLabel: "유닛 2 · 레슨 2 진행 중",
    masteryLabel: "듣기 요지 파악 · 진행 중",
    attemptsLabel: "최근 시도 5회 · 정답률 73%",
    supportLabel: "개입 없음",
  },
  {
    id: "usr-17",
    name: "송다은",
    email: "daeun.song@example.com",
    role: "learner",
    status: "active",
    cohort: "고급 쓰기반",
    lastActiveAt: "2026-08-03",
    progressLabel: "유닛 3 · 레슨 2 진행 중",
    masteryLabel: "반박 구성 · 숙련",
    attemptsLabel: "최근 시도 8회 · 정답률 85%",
    supportLabel: "우수 예시 공유 대상",
  },
  {
    id: "usr-18",
    name: "유준호",
    email: "junho.yoo@example.com",
    role: "learner",
    status: "invited",
    cohort: "중급 A반",
    lastActiveAt: "—",
    progressLabel: "초대 수락 대기",
    masteryLabel: "아직 측정 없음",
    attemptsLabel: "시도 없음",
    supportLabel: "초대일 2026-07-29",
  },
  {
    id: "usr-19",
    name: "안서진",
    email: "seojin.ahn@example.com",
    role: "learner",
    status: "active",
    cohort: "초급 B반",
    lastActiveAt: "2026-08-02",
    progressLabel: "유닛 1 · 레슨 6 진행 중",
    masteryLabel: "자기소개 · 숙련",
    attemptsLabel: "최근 시도 3회 · 정답률 88%",
    supportLabel: "개입 없음",
  },
  {
    id: "usr-20",
    name: "권태영",
    email: "taeyoung.kwon@example.com",
    role: "instructor",
    status: "active",
    cohort: "초급 B반",
    lastActiveAt: "2026-08-04",
    progressLabel: "담당 코호트 1개",
    masteryLabel: "피드백 대기 1건",
    attemptsLabel: "오늘 코칭 1건 발송",
    supportLabel: "지원 메모 없음",
  },
  {
    id: "usr-21",
    name: "황예은",
    email: "yeeun.hwang@example.com",
    role: "learner",
    status: "active",
    cohort: "중급 A반",
    lastActiveAt: "2026-07-31",
    progressLabel: "유닛 1 · 레슨 9 진행 중",
    masteryLabel: "연결어 사용 · 진행 중",
    attemptsLabel: "최근 시도 4회 · 정답률 66%",
    supportLabel: "개입 없음",
  },
  {
    id: "usr-22",
    name: "서동혁",
    email: "donghyuk.seo@example.com",
    role: "learner",
    status: "active",
    cohort: "고급 쓰기반",
    lastActiveAt: "2026-08-01",
    progressLabel: "유닛 2 · 레슨 4 진행 중",
    masteryLabel: "예시 구체화 · 진행 중",
    attemptsLabel: "최근 시도 6회 · 정답률 70%",
    supportLabel: "지각 제출 1회",
  },
  {
    id: "usr-23",
    name: "류가은",
    email: "gaeun.ryu@example.com",
    role: "learner",
    status: "suspended",
    cohort: "중급 A반",
    lastActiveAt: "2026-06-02",
    progressLabel: "유닛 2 · 접근 정지",
    masteryLabel: "마지막 숙련 · 보통",
    attemptsLabel: "정지 전 시도 2회",
    supportLabel: "관리자 요청 정지",
  },
  {
    id: "usr-24",
    name: "남지훈",
    email: "jihoon.nam@example.com",
    role: "learner",
    status: "active",
    cohort: "초급 B반",
    lastActiveAt: "2026-08-03",
    progressLabel: "유닛 1 · 레슨 3 진행 중",
    masteryLabel: "기초 어휘 · 숙련",
    attemptsLabel: "최근 시도 5회 · 정답률 77%",
    supportLabel: "개입 없음",
  },
];

const ROLE_FILTER_ITEMS = [
  { label: "전체 역할", value: "all" },
  { label: "학습자", value: "learner" },
  { label: "강사", value: "instructor" },
] as const;

const STATUS_FILTER_ITEMS = [
  { label: "전체 상태", value: "all" },
  { label: "활성", value: "active" },
  { label: "초대됨", value: "invited" },
  { label: "정지", value: "suspended" },
] as const;

const PAGE_SIZE_ITEMS = [10, 20, 30, 50].map((size) => ({
  label: String(size),
  value: String(size),
}));

function getInitials(name: string) {
  return name.trim().slice(0, 1);
}

function createUserColumns(onDetailUser: (user: UserRow) => void): ColumnDef<UserRow>[] {
  return [
    {
      id: "select",
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(Boolean(checked))}
          aria-label="현재 페이지 모두 선택"
          className="size-4 rounded-[0.45rem] after:-inset-1.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
          aria-label={`${row.original.name} 선택`}
          className="size-4 rounded-[0.45rem] after:-inset-1.5"
        />
      ),
    },
    {
      accessorKey: "name",
      header: "사용자",
      cell: ({ row }) => (
        <button
          type="button"
          aria-label={`${row.original.name} 상세 보기`}
          className="min-w-0 max-w-[16rem] rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
          onClick={() => onDetailUser(row.original)}
        >
          <Person>
            <PersonAvatar size="sm">
              <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
            </PersonAvatar>
            <PersonInfo>
              <PersonName>{row.original.name}</PersonName>
              <PersonDescription>{row.original.email}</PersonDescription>
            </PersonInfo>
          </Person>
        </button>
      ),
    },
    {
      accessorKey: "role",
      header: "역할",
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true;
        return row.getValue(id) === value;
      },
      cell: ({ row }) => <Badge variant="secondary">{ROLE_LABELS[row.original.role]}</Badge>,
    },
    {
      accessorKey: "cohort",
      header: "코호트",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.cohort}</span>,
    },
    {
      accessorKey: "status",
      header: "상태",
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true;
        return row.getValue(id) === value;
      },
      cell: ({ row }) => {
        const status = row.original.status;
        return <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
      },
    },
    {
      accessorKey: "lastActiveAt",
      header: "최근 활동",
      sortingFn: (a, b) => {
        const left = a.original.lastActiveAt;
        const right = b.original.lastActiveAt;
        if (left === "—" && right === "—") return 0;
        if (left === "—") return -1;
        if (right === "—") return 1;
        return left.localeCompare(right);
      },
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">{row.original.lastActiveAt}</span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" className="rounded-full" />}
              aria-label={`${user.name} 메뉴 열기`}
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onClick={() => onDetailUser(user)}>기록 보기</DropdownMenuItem>
              {user.status === "invited" ? (
                <DropdownMenuItem>초대 다시 보내기</DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              {user.status === "suspended" ? (
                <DropdownMenuItem>접근 재활성화</DropdownMenuItem>
              ) : (
                <DropdownMenuItem variant="destructive">접근 일시정지</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

function UsersDataTable({ data }: { data: UserRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "lastActiveAt", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [detailUser, setDetailUser] = React.useState<UserRow | null>(null);
  const columns = React.useMemo(() => createUserColumns(setDetailUser), [setDetailUser]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase();
      if (!query) return true;
      const { name, email, id } = row.original;
      return (
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        id.toLowerCase().includes(query)
      );
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = table.getPageCount();
  const roleFilter = (table.getColumn("role")?.getFilterValue() as string | undefined) ?? "all";
  const statusFilter = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "all";
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div data-slot="users-admin-table" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[12rem] flex-1 basis-[12rem]">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="이름·이메일·ID 검색"
              className="h-9 ps-9"
              aria-label="사용자 검색"
            />
          </div>

          <Select
            items={[...ROLE_FILTER_ITEMS]}
            value={roleFilter}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value;
              table.getColumn("role")?.setFilterValue(next === "all" ? undefined : next);
            }}
          >
            <SelectTrigger
              size="sm"
              className="min-w-[12rem] flex-1 basis-[12rem]"
              aria-label="역할 필터"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {ROLE_FILTER_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={[...STATUS_FILTER_ITEMS]}
            value={statusFilter}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value;
              table.getColumn("status")?.setFilterValue(next === "all" ? undefined : next);
            }}
          >
            <SelectTrigger
              size="sm"
              className="min-w-[12rem] flex-1 basis-[12rem]"
              aria-label="상태 필터"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {STATUS_FILTER_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs tabular-nums text-muted-foreground sm:text-sm">
          검색 결과 <span className="font-medium text-foreground">{filteredCount}</span>건
        </p>
      </div>

      {selectedCount > 0 ? (
        <div
          data-slot="users-admin-bulk"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface/60 px-3.5 py-3"
        >
          <p className="text-sm tabular-nums">
            <span className="font-medium text-foreground">{selectedCount}</span>
            <span className="text-muted-foreground">명 선택됨</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm">
              초대 재발송
            </Button>
            <Button type="button" variant="outline" size="sm">
              접근 정지
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => table.resetRowSelection()}
            >
              선택 해제
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-muted-foreground"
                >
                  조건에 맞는 사용자가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
          <span className="whitespace-nowrap">페이지당 행</span>
          <Select
            items={PAGE_SIZE_ITEMS}
            value={String(pageSize)}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value;
              table.setPageSize(Number(next));
            }}
          >
            <SelectTrigger size="sm" className="w-[4.5rem]" aria-label="페이지당 행 개수">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {PAGE_SIZE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <p className="text-xs tabular-nums text-muted-foreground sm:text-sm">
            {pageCount === 0 ? "0 / 0" : `${pageIndex + 1} / ${pageCount}`}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="맨 처음으로 이동"
            >
              <HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={2} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="이전 페이지로 이동"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="다음 페이지로 이동"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="맨 끝으로 이동"
            >
              <HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </div>

      <Sheet
        open={detailUser !== null}
        onOpenChange={(open) => {
          if (!open) setDetailUser(null);
        }}
      >
        <SheetContent side="right" className="gap-0 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>사용자 기록</SheetTitle>
            <SheetDescription>
              {detailUser
                ? `${ROLE_LABELS[detailUser.role]} · ${STATUS_LABELS[detailUser.status]}`
                : "선택한 사용자의 진행과 지원 요약입니다."}
            </SheetDescription>
          </SheetHeader>
          {detailUser ? (
            <div className="overflow-y-auto px-6 py-5">
              <LearnerRecord>
                <LearnerRecordHeader>
                  <LearnerRecordTitle>{detailUser.name}</LearnerRecordTitle>
                  <LearnerRecordMeta>
                    {detailUser.cohort} · {detailUser.id}
                  </LearnerRecordMeta>
                </LearnerRecordHeader>
                <LearnerRecordSection>
                  <LearnerRecordSectionTitle>연락처</LearnerRecordSectionTitle>
                  <LearnerRecordPath>{detailUser.email}</LearnerRecordPath>
                </LearnerRecordSection>
                <LearnerRecordSection>
                  <LearnerRecordSectionTitle>진행</LearnerRecordSectionTitle>
                  <LearnerRecordPath>{detailUser.progressLabel}</LearnerRecordPath>
                </LearnerRecordSection>
                <LearnerRecordSection>
                  <LearnerRecordSectionTitle>숙련</LearnerRecordSectionTitle>
                  <LearnerRecordMastery>{detailUser.masteryLabel}</LearnerRecordMastery>
                  <LearnerRecordAttempts>{detailUser.attemptsLabel}</LearnerRecordAttempts>
                </LearnerRecordSection>
                <LearnerRecordSection>
                  <LearnerRecordSectionTitle>지원</LearnerRecordSectionTitle>
                  <LearnerRecordSupport>{detailUser.supportLabel}</LearnerRecordSupport>
                </LearnerRecordSection>
              </LearnerRecord>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                전체 계정·학습 기록·지원 화면은 user-admin 상세 블록에서 확인할 수 있습니다.
              </p>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * Admin users page: shared shell with a TanStack data table for learner and instructor accounts.
 */
export function UsersAdmin({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <AdminShell
      data-slot="users-admin"
      activeNav="users"
      title="사용자"
      className={cn(className)}
      {...props}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.03em] sm:text-xl">
            사용자 목록
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            역할과 상태로 좁혀 보고, 기록을 열어 확인합니다.
          </p>
        </div>
        <Button type="button" className="w-full shrink-0 sm:w-auto">
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
          사용자 초대
        </Button>
      </div>

      <UsersDataTable data={USERS} />
    </AdminShell>
  );
}

export default UsersAdmin;
