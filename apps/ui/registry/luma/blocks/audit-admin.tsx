"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, Search01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/registry/luma/lib/utils";
import { AdminShell } from "@/registry/luma/blocks/admin-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/registry/luma/ui/alert-dialog";
import {
  AUDIT_LOG_ENV_LABELS,
  AUDIT_LOG_KIND_LABELS,
  AuditLog,
  AuditLogAction,
  AuditLogActor,
  AuditLogEmpty,
  AuditLogEntry,
  AuditLogEnvironment,
  AuditLogHeader,
  AuditLogKind,
  AuditLogList,
  AuditLogMeta,
  AuditLogTarget,
  AuditLogTime,
  AuditLogTitle,
  type AuditLogEnv,
  type AuditLogKindValue,
} from "@/registry/luma/ui/audit-log";
import { Button } from "@/registry/luma/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/registry/luma/ui/empty";
import { Input } from "@/registry/luma/ui/input";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/registry/luma/ui/sheet";

type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  kind: AuditLogKindValue;
  env: AuditLogEnv;
  dateTime: string;
  relativeTime: string;
  daysAgo: number;
  summary: string;
  restorable: boolean;
};

const INITIAL_ENTRIES: AuditEntry[] = [
  {
    id: "aud-01",
    actor: "이운영",
    action: "중급 읽기 레슨 4를 Live에 게시",
    target: "중급 읽기 · 레슨 4",
    kind: "publish",
    env: "live",
    dateTime: "2026-08-04T09:12:00",
    relativeTime: "35분 전",
    daysAgo: 0,
    summary: "Preview 검수를 통과한 레슨 4를 Live로 승격했습니다. 학습자 경로에 즉시 반영됩니다.",
    restorable: true,
  },
  {
    id: "aud-02",
    actor: "김교사",
    action: "편집자 권한을 박지원에게 부여",
    target: "조직 멤버 · 박지원",
    kind: "permission",
    env: "live",
    dateTime: "2026-08-04T08:40:00",
    relativeTime: "1시간 전",
    daysAgo: 0,
    summary: "역할이 열람에서 편집자로 변경되었습니다. 코스 초안 편집과 Preview 게시가 가능합니다.",
    restorable: false,
  },
  {
    id: "aud-03",
    actor: "시스템",
    action: "AI 힌트 초안 생성",
    target: "설득 글쓰기 · 레슨 2 · 스텝 3",
    kind: "ai",
    env: "sandbox",
    dateTime: "2026-08-03T22:15:00",
    relativeTime: "어제",
    daysAgo: 1,
    summary:
      "모델이 힌트 사다리를 생성했습니다. Sandbox에서만 보관되며 Live에 자동 적용되지 않습니다.",
    restorable: false,
  },
  {
    id: "aud-04",
    actor: "박편집",
    action: "쓰기 기초 루브릭 기준 2 수정",
    target: "쓰기 기초 · 루브릭 v3",
    kind: "content",
    env: "preview",
    dateTime: "2026-08-03T16:05:00",
    relativeTime: "어제",
    daysAgo: 1,
    summary: "‘근거 제시’ 기준의 수준 설명을 구체화했습니다. Preview 채점에만 반영됩니다.",
    restorable: true,
  },
  {
    id: "aud-05",
    actor: "이운영",
    action: "Live 레슨을 이전 버전으로 복원",
    target: "발음 클리닉 · 레슨 1",
    kind: "restore",
    env: "live",
    dateTime: "2026-08-02T19:28:00",
    relativeTime: "2일 전",
    daysAgo: 2,
    summary:
      "오탈자가 포함된 Live 버전을 직전 게시본으로 되돌렸습니다. 복원 자체도 감사 로그에 남습니다.",
    restorable: false,
  },
  {
    id: "aud-06",
    actor: "최감수",
    action: "여행 한국어를 Preview에 게시",
    target: "여행 한국어 · 전체 코스",
    kind: "publish",
    env: "preview",
    dateTime: "2026-08-01T11:50:00",
    relativeTime: "3일 전",
    daysAgo: 3,
    summary: "내부 검수용 Preview 게시입니다. Live 승격 전에는 학습자 경로에 노출되지 않습니다.",
    restorable: true,
  },
  {
    id: "aud-07",
    actor: "시스템",
    action: "예약된 Sandbox 콘텐츠 검증 실행",
    target: "뉴스 읽기 입문 · 검증 배치",
    kind: "ai",
    env: "sandbox",
    dateTime: "2026-07-31T06:00:00",
    relativeTime: "4일 전",
    daysAgo: 4,
    summary:
      "자동 검증이 링크 깨짐 2건과 빈 스텝 1건을 보고했습니다. 조치 대기열로 전달되었습니다.",
    restorable: false,
  },
  {
    id: "aud-08",
    actor: "김교사",
    action: "코호트 배정 마감일 변경",
    target: "2학년 3반 · 중급 읽기",
    kind: "permission",
    env: "live",
    dateTime: "2026-07-30T14:22:00",
    relativeTime: "5일 전",
    daysAgo: 5,
    summary: "제출 마감을 8월 12일로 연장했습니다. 학습자 알림이 재발송되었습니다.",
    restorable: false,
  },
  {
    id: "aud-09",
    actor: "박편집",
    action: "힌트 사다리 문구 수정",
    target: "의견 말하기 · 레슨 3 · 힌트",
    kind: "content",
    env: "test",
    dateTime: "2026-07-28T10:08:00",
    relativeTime: "7일 전",
    daysAgo: 7,
    summary:
      "Test 환경에서 힌트 3단계 문장을 짧게 다듬었습니다. Preview 승격 전 검수가 필요합니다.",
    restorable: true,
  },
  {
    id: "aud-10",
    actor: "이운영",
    action: "운영자 역할에서 열람으로 강등",
    target: "조직 멤버 · 한임시",
    kind: "permission",
    env: "live",
    dateTime: "2026-07-25T17:40:00",
    relativeTime: "10일 전",
    daysAgo: 10,
    summary: "임시 운영 권한이 만료되어 열람으로 변경되었습니다. Live 게시 권한이 제거됩니다.",
    restorable: false,
  },
  {
    id: "aud-11",
    actor: "시스템",
    action: "AI 피드백 샘플 적재",
    target: "피드백 감사 · 샘플 24건",
    kind: "ai",
    env: "preview",
    dateTime: "2026-07-20T09:00:00",
    relativeTime: "15일 전",
    daysAgo: 15,
    summary: "Preview 환경 피드백을 주기 샘플링해 feedback-audit에 적재했습니다.",
    restorable: false,
  },
  {
    id: "aud-12",
    actor: "최감수",
    action: "레슨 빌더 아웃라인 재구성",
    target: "드라마로 듣기 · 레슨 5",
    kind: "content",
    env: "sandbox",
    dateTime: "2026-07-12T13:18:00",
    relativeTime: "23일 전",
    daysAgo: 23,
    summary: "스텝 순서를 듣고→따라 말하기→점검으로 바꿨습니다. Sandbox 초안만 변경되었습니다.",
    restorable: true,
  },
  {
    id: "aud-13",
    actor: "김교사",
    action: "Live 게시 전 검증 실패 무시 사유 기록",
    target: "일상 듣기 연습 · 레슨 8",
    kind: "publish",
    env: "live",
    dateTime: "2026-07-05T20:05:00",
    relativeTime: "30일 전",
    daysAgo: 30,
    summary:
      "미디어 경고 1건을 허용하고 Live 게시했습니다. 사유: 외부 CDN 지연으로 인한 일시 경고.",
    restorable: true,
  },
  {
    id: "aud-14",
    actor: "이운영",
    action: "삭제된 예시 글을 보관본에서 복원",
    target: "설득 글쓰기 · 예시 라이브러리",
    kind: "restore",
    env: "preview",
    dateTime: "2026-06-18T11:30:00",
    relativeTime: "47일 전",
    daysAgo: 47,
    summary: "실수로 제거된 모범 예시를 Preview 보관본에서 되돌렸습니다.",
    restorable: false,
  },
  {
    id: "aud-15",
    actor: "시스템",
    action: "프롬프트 버전 자동 스냅샷",
    target: "코칭 프롬프트 · v12",
    kind: "ai",
    env: "test",
    dateTime: "2026-06-01T03:00:00",
    relativeTime: "64일 전",
    daysAgo: 64,
    summary: "Test 환경 프롬프트 변경이 자동 스냅샷으로 보관되었습니다.",
    restorable: true,
  },
];

const ENV_FILTER_ITEMS = [
  { label: "전체 환경", value: "all" },
  { label: "Sandbox", value: "sandbox" },
  { label: "Test", value: "test" },
  { label: "Preview", value: "preview" },
  { label: "Live", value: "live" },
] as const;

const KIND_FILTER_ITEMS = [
  { label: "전체 유형", value: "all" },
  { label: "게시", value: "publish" },
  { label: "권한", value: "permission" },
  { label: "콘텐츠", value: "content" },
  { label: "AI", value: "ai" },
  { label: "복원", value: "restore" },
] as const;

const PERIOD_FILTER_ITEMS = [
  { label: "최근 7일", value: "7" },
  { label: "최근 30일", value: "30" },
  { label: "최근 90일", value: "90" },
] as const;

const PAGE_SIZE = 8;

const PERIOD_LABELS: Record<string, string> = {
  "7": "최근 7일",
  "30": "최근 30일",
  "90": "최근 90일",
};

function selectValue(value: string | string[] | null | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? undefined);
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="@container grid gap-1 @[36rem]:grid-cols-[6.5rem_minmax(0,1fr)] @[36rem]:gap-4">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-pretty">{children}</dd>
    </div>
  );
}

function AuditAdminContent() {
  const [entries, setEntries] = React.useState(INITIAL_ENTRIES);
  const [query, setQuery] = React.useState("");
  const [envFilter, setEnvFilter] = React.useState("all");
  const [kindFilter, setKindFilter] = React.useState("all");
  const [periodFilter, setPeriodFilter] = React.useState("30");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [restoreOpen, setRestoreOpen] = React.useState(false);

  const q = query.trim().toLowerCase();
  const maxDays = Number(periodFilter);
  const filtered = entries.filter((entry) => {
    if (entry.daysAgo > maxDays) return false;
    if (envFilter !== "all" && entry.env !== envFilter) return false;
    if (kindFilter !== "all" && entry.kind !== kindFilter) return false;
    if (!q) return true;
    return (
      entry.actor.toLowerCase().includes(q) ||
      entry.action.toLowerCase().includes(q) ||
      entry.target.toLowerCase().includes(q)
    );
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pageEntries = filtered.slice(
    safePageIndex * PAGE_SIZE,
    safePageIndex * PAGE_SIZE + PAGE_SIZE,
  );

  const selected = entries.find((entry) => entry.id === selectedId) ?? null;

  React.useEffect(() => {
    setPageIndex(0);
  }, [query, envFilter, kindFilter, periodFilter]);

  function openEntry(entry: AuditEntry) {
    setSelectedId(entry.id);
    setSheetOpen(true);
  }

  function handleRestoreConfirm() {
    if (!selected?.restorable) return;

    const now = new Date().toISOString().slice(0, 19);
    const restored: AuditEntry = {
      id: `aud-restore-${Date.now()}`,
      actor: "이운영",
      action: `${selected.target}를 이전 상태로 복원`,
      target: selected.target,
      kind: "restore",
      env: selected.env,
      dateTime: now,
      relativeTime: "방금",
      daysAgo: 0,
      summary: `"${selected.action}" 시점의 상태로 되돌렸습니다. 복원 기록은 삭제할 수 없습니다.`,
      restorable: false,
    };

    setEntries((prev) => [restored, ...prev]);
    setRestoreOpen(false);
    setSelectedId(restored.id);
    setPageIndex(0);
  }

  return (
    <div data-slot="audit-admin-content" className="flex flex-col gap-4">
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
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="행위자·행동·대상 검색"
              className="h-9 ps-9"
              aria-label="감사 로그 검색"
            />
          </div>

          <Select
            items={[...ENV_FILTER_ITEMS]}
            value={envFilter}
            onValueChange={(value) => {
              const next = selectValue(value);
              if (next) setEnvFilter(next);
            }}
          >
            <SelectTrigger
              size="sm"
              className="min-w-[10rem] flex-1 basis-[10rem]"
              aria-label="환경 필터"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {ENV_FILTER_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={[...KIND_FILTER_ITEMS]}
            value={kindFilter}
            onValueChange={(value) => {
              const next = selectValue(value);
              if (next) setKindFilter(next);
            }}
          >
            <SelectTrigger
              size="sm"
              className="min-w-[10rem] flex-1 basis-[10rem]"
              aria-label="유형 필터"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {KIND_FILTER_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={[...PERIOD_FILTER_ITEMS]}
            value={periodFilter}
            onValueChange={(value) => {
              const next = selectValue(value);
              if (next) setPeriodFilter(next);
            }}
          >
            <SelectTrigger
              size="sm"
              className="min-w-[10rem] flex-1 basis-[10rem]"
              aria-label="기간 필터"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {PERIOD_FILTER_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card">
        <AuditLog className="gap-0 p-3 sm:p-4">
          <AuditLogHeader className="mb-2 px-1">
            <AuditLogTitle>변경 이력</AuditLogTitle>
            <AuditLogMeta>
              {PERIOD_LABELS[periodFilter] ?? "최근 30일"} · {filtered.length}건
            </AuditLogMeta>
          </AuditLogHeader>

          {pageEntries.length ? (
            <AuditLogList>
              {pageEntries.map((entry) => {
                const isSelected = selectedId === entry.id && sheetOpen;
                return (
                  <AuditLogEntry
                    key={entry.id}
                    selected={isSelected}
                    tabIndex={0}
                    aria-label={`${entry.actor}: ${entry.action}`}
                    aria-pressed={isSelected}
                    className="cursor-pointer"
                    onClick={() => openEntry(entry)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openEntry(entry);
                      }
                    }}
                  >
                    <AuditLogActor>{entry.actor}</AuditLogActor>
                    <AuditLogAction>{entry.action}</AuditLogAction>
                    <AuditLogTarget>{entry.target}</AuditLogTarget>
                    <AuditLogKind kind={entry.kind} />
                    <AuditLogEnvironment env={entry.env} />
                    <AuditLogTime dateTime={entry.dateTime}>{entry.relativeTime}</AuditLogTime>
                  </AuditLogEntry>
                );
              })}
            </AuditLogList>
          ) : (
            <AuditLogEmpty>
              <Empty variant="compact">
                <EmptyHeader>
                  <EmptyTitle>조건에 맞는 기록이 없습니다</EmptyTitle>
                  <EmptyDescription>
                    검색어나 환경·유형·기간 필터를 넓혀 다시 살펴보세요.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </AuditLogEmpty>
          )}
        </AuditLog>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs tabular-nums text-muted-foreground sm:text-sm">
          {filtered.length === 0 ? "0 / 0" : `${safePageIndex + 1} / ${pageCount}`}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-xl"
            onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
            disabled={safePageIndex <= 0 || filtered.length === 0}
            aria-label="이전 페이지로 이동"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-xl"
            onClick={() => setPageIndex((prev) => Math.min(pageCount - 1, prev + 1))}
            disabled={safePageIndex >= pageCount - 1 || filtered.length === 0}
            aria-label="다음 페이지로 이동"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </Button>
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setRestoreOpen(false);
        }}
      >
        <SheetContent className="sm:max-w-md" side="right">
          <SheetHeader>
            <SheetTitle>감사 로그 상세</SheetTitle>
            <SheetDescription>
              누가, 언제, 어느 환경에서 무엇을 바꿨는지 확인합니다.
            </SheetDescription>
          </SheetHeader>

          {selected ? (
            <>
              <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <AuditLogKind kind={selected.kind} className="col-start-auto" />
                  <AuditLogEnvironment env={selected.env} />
                </div>

                <dl className="flex flex-col gap-4">
                  <DetailRow label="행위자">{selected.actor}</DetailRow>
                  <DetailRow label="행동">{selected.action}</DetailRow>
                  <DetailRow label="대상">{selected.target}</DetailRow>
                  <DetailRow label="유형">{AUDIT_LOG_KIND_LABELS[selected.kind]}</DetailRow>
                  <DetailRow label="환경">{AUDIT_LOG_ENV_LABELS[selected.env]}</DetailRow>
                  <DetailRow label="시각">
                    <time dateTime={selected.dateTime} className="tabular-nums">
                      {selected.dateTime.replace("T", " ")} · {selected.relativeTime}
                    </time>
                  </DetailRow>
                  <DetailRow label="변경 요약">{selected.summary}</DetailRow>
                  <DetailRow label="복원">
                    {selected.restorable
                      ? "이 시점의 상태로 되돌릴 수 있습니다. Live에서는 확인 후 실행하세요."
                      : "이 기록에서는 복원을 제공하지 않습니다."}
                  </DetailRow>
                </dl>
              </div>

              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                  닫기
                </Button>
                {selected.restorable ? (
                  <Button type="button" onClick={() => setRestoreOpen(true)}>
                    이 시점으로 복원
                  </Button>
                ) : null}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 시점으로 복원할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {selected
                ? `${AUDIT_LOG_ENV_LABELS[selected.env]} 환경의 “${selected.target}”를 선택한 기록 상태로 되돌립니다. 복원 자체도 감사 로그에 남으며, Live에서는 학습자 경로에 바로 반영됩니다.`
                : "선택한 기록을 이전 상태로 되돌립니다."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              variant={selected?.env === "live" ? "destructive" : "default"}
              onClick={handleRestoreConfirm}
            >
              복원 실행
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Admin audit log screen: shared shell with filters, timeline entries, detail sheet, and restore confirm.
 */
export function AuditAdmin({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <AdminShell
      data-slot="audit-admin"
      activeNav="audit"
      title="감사 로그"
      description="게시·권한·AI·복원 이력을 추적합니다"
      className={cn(className)}
      {...props}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.03em] sm:text-xl">
            운영 변경 기록
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            환경과 행위 유형으로 좁혀 보고, 필요한 경우 이전 시점으로 복원합니다.
          </p>
        </div>
      </div>

      <AuditAdminContent />
    </AdminShell>
  );
}

export default AuditAdmin;
