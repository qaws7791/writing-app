"use client";

import { BookOpen01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Badge } from "@workspace/ui/components/ui/badge";
import { Button } from "@workspace/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@workspace/ui/components/ui/field";
import { Input } from "@workspace/ui/components/ui/input";
import { Progress, ProgressLabel, ProgressValue } from "@workspace/ui/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table";

type CompositionPreviewProps = { kind: "admin" | "course-management"; story: string };

const adminStatusItems = [
  { label: "전체", value: "all" },
  { label: "활성", value: "active" },
  { label: "보관", value: "archived" },
];

const metrics = [
  { detail: "활성 강의 8개", icon: true, label: "콘텐츠", value: "42" },
  { detail: "최근 7일 활성 42명", label: "총 사용자", value: "1,230" },
  { detail: "오늘 3명", label: "신규 가입", value: "+18" },
  { detail: "누적 완료 수", label: "완료 레슨", value: "8,420" },
];

function AdminOverview() {
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em]">콘텐츠 관리</h1>
          <p className="text-sm text-muted-foreground">
            코스를 확인하고 새 강의를 생성하거나 보관합니다.
          </p>
        </div>
        <Button>새 코스</Button>
      </header>
      <section aria-label="주요 지표" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <Card size="sm" variant="muted">
              <CardContent>
                <div className="mb-2 flex items-center gap-2 text-foreground/75">
                  {metric.icon && (
                    <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={1.8} className="size-4.5" />
                  )}
                  <span className="text-xs font-semibold">{metric.label}</span>
                </div>
                <strong className="font-heading text-2xl font-semibold">{metric.value}</strong>
                <p className="mt-1 text-xs text-foreground/75">{metric.detail}</p>
              </CardContent>
            </Card>
          </article>
        ))}
      </section>
      <form
        aria-label="코스 필터"
        className="flex flex-wrap items-end gap-3 rounded-3xl bg-muted p-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <Field className="w-auto">
          <FieldLabel htmlFor="admin-pattern-status">상태</FieldLabel>
          <Select defaultValue="all" items={adminStatusItems}>
            <SelectTrigger id="admin-pattern-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {adminStatusItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button variant="outline" type="submit">
          필터 적용
        </Button>
      </form>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>코스 목록</h2>
          </CardTitle>
          <CardDescription>총 3개 · 1/1 페이지</CardDescription>
        </CardHeader>
        <CardContent>
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
                <TableCell>
                  <Badge variant="success">활성</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>표시할 항목이 없습니다</EmptyTitle>
        <EmptyDescription>필터를 조정해 다시 확인하세요.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline">필터 초기화</Button>
      </EmptyContent>
    </Empty>
  );
}

function CourseCard() {
  return (
    <section className="grid gap-4 rounded-4xl border bg-background p-6">
      <h3 className="font-heading text-xl font-semibold">Course Card</h3>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>문장의 중심 찾기</h2>
          </CardTitle>
          <CardDescription>12분 학습 · 입문 코스</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={62}>
            <ProgressLabel>진행률</ProgressLabel>
            <ProgressValue />
          </Progress>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="outline">검토</Button>
          <Button>이어 하기</Button>
        </CardFooter>
      </Card>
    </section>
  );
}

function CourseForm() {
  return (
    <form
      className="grid max-w-4xl gap-4 rounded-4xl border bg-background p-6 md:grid-cols-[1fr_12rem_auto] md:items-end"
      onSubmit={(event) => event.preventDefault()}
    >
      <Field>
        <FieldLabel htmlFor="recipe-title">코스 제목</FieldLabel>
        <Input id="recipe-title" placeholder="제목" />
        <FieldDescription>작은 viewport에서는 한 열로 쌓입니다.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="recipe-status">상태</FieldLabel>
        <Select
          defaultValue="draft"
          items={[
            { label: "초안", value: "draft" },
            { label: "공개", value: "published" },
          ]}
        >
          <SelectTrigger id="recipe-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">초안</SelectItem>
            <SelectItem value="published">공개</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Button type="submit">저장</Button>
    </form>
  );
}

export default function CompositionPreview({ kind, story }: CompositionPreviewProps) {
  if (kind === "admin") return story === "EmptyResult" ? <AdminEmpty /> : <AdminOverview />;
  return story === "ResponsiveForm" ? <CourseForm /> : <CourseCard />;
}
