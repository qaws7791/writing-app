"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons"

import { cn } from "#ui/lib/utils"
import { AdminShell } from "#ui/blocks/admin-shell"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#ui/components/ui/alert-dialog"
import {
  AuditLog,
  AuditLogAction,
  AuditLogActor,
  AuditLogEntry,
  AuditLogEnvironment,
  AuditLogHeader,
  AuditLogKind,
  AuditLogList,
  AuditLogMeta,
  AuditLogTarget,
  AuditLogTime,
  AuditLogTitle,
} from "#ui/components/ui/audit-log"
import { AvatarFallback } from "#ui/components/ui/avatar"
import { Badge } from "#ui/components/ui/badge"
import { Button } from "#ui/components/ui/button"
import {
  Cadence,
  CadenceDay,
  CadenceHeader,
  CadenceHint,
  CadenceSummary,
  CadenceTitle,
  CadenceWeek,
} from "#ui/components/ui/cadence"
import {
  CohortAssignment,
  CohortAssignmentDeadline,
  CohortAssignmentHeader,
  CohortAssignmentMembers,
  CohortAssignmentMeta,
  CohortAssignmentTargets,
  CohortAssignmentTitle,
  CohortMember,
  CohortTarget,
  CohortTargetLabel,
  CohortTargetTitle,
} from "#ui/components/ui/cohort-assignment"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#ui/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "#ui/components/ui/field"
import { Input } from "#ui/components/ui/input"
import {
  InterventionItem,
  InterventionItemActions,
  InterventionItemEvidence,
  InterventionItemName,
  InterventionItemReason,
  InterventionQueue,
  InterventionQueueHeader,
  InterventionQueueList,
  InterventionQueueMeta,
  InterventionQueueTitle,
} from "#ui/components/ui/intervention-queue"
import {
  LearnerRecord,
  LearnerRecordAttempts,
  LearnerRecordHeader,
  LearnerRecordMastery,
  LearnerRecordMeta,
  LearnerRecordPath,
  LearnerRecordSection,
  LearnerRecordSectionTitle,
  LearnerRecordSubmissions,
  LearnerRecordSupport,
  LearnerRecordTitle,
} from "#ui/components/ui/learner-record"
import {
  Mastery,
  MasteryBadge,
  MasteryDescription,
  MasteryHeader,
  MasteryLabel,
  MasteryStages,
} from "#ui/components/ui/mastery"
import {
  Person,
  PersonAvatar,
  PersonDescription,
  PersonInfo,
  PersonName,
} from "#ui/components/ui/person"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#ui/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#ui/components/ui/tabs"

type UserRole = "learner" | "instructor"
type UserStatus = "active" | "invited" | "suspended"

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "활성",
  invited: "초대됨",
  suspended: "정지",
}

const STATUS_BADGE_VARIANT: Record<
  UserStatus,
  "success" | "warning" | "destructive"
> = {
  active: "success",
  invited: "warning",
  suspended: "destructive",
}

const ROLE_ITEMS = [
  { label: "학습자", value: "learner" },
  { label: "강사", value: "instructor" },
] as const

const STATUS_ITEMS = [
  { label: "활성", value: "active" },
  { label: "초대됨", value: "invited" },
  { label: "정지", value: "suspended" },
] as const

const USER = {
  id: "usr-01",
  name: "이서연",
  email: "seoyeon.lee@example.com",
  role: "learner" as UserRole,
  status: "active" as UserStatus,
  cohort: "중급 A반",
  lastActiveAt: "2026-08-04",
  progressLabel: "유닛 2 · 레슨 3 진행 중",
  masteryLabel: "주장-근거 연결 · 숙련",
  attemptsLabel: "최근 시도 4회 · 정답률 75%",
  submissionsLabel: "설득문 v2 · 8월 1일 · 루브릭 3.4",
  supportLabel: "개입 없음 · 힌트 래더 1회 사용",
}

function AccountPanel({
  role,
  status,
  cohort,
  onRoleChange,
  onStatusChange,
  onCohortChange,
}: {
  role: UserRole
  status: UserStatus
  cohort: string
  onRoleChange: (value: UserRole) => void
  onStatusChange: (value: UserStatus) => void
  onCohortChange: (value: string) => void
}) {
  return (
    <section data-slot="user-admin-account" className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Person>
          <PersonAvatar size="default">
            <AvatarFallback>{USER.name.slice(0, 1)}</AvatarFallback>
          </PersonAvatar>
          <PersonInfo>
            <PersonName className="text-base">{USER.name}</PersonName>
            <PersonDescription>{USER.email}</PersonDescription>
          </PersonInfo>
        </Person>
        <p className="text-xs tabular-nums text-muted-foreground sm:text-right">
          {USER.id}
          <span className="mx-1.5 text-border">·</span>
          최근 활동 {USER.lastActiveAt}
        </p>
      </header>

      <FieldGroup className="gap-5">
        <div className="@container grid gap-5 @[32rem]:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="user-role">역할</FieldLabel>
            <Select
              items={[...ROLE_ITEMS]}
              value={role}
              onValueChange={(value) => {
                const next = Array.isArray(value) ? value[0] : value
                if (next === "learner" || next === "instructor")
                  onRoleChange(next)
              }}
            >
              <SelectTrigger id="user-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {ROLE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="user-status">상태</FieldLabel>
            <Select
              items={[...STATUS_ITEMS]}
              value={status}
              onValueChange={(value) => {
                const next = Array.isArray(value) ? value[0] : value
                if (
                  next === "active" ||
                  next === "invited" ||
                  next === "suspended"
                ) {
                  onStatusChange(next)
                }
              }}
            >
              <SelectTrigger id="user-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {STATUS_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="user-cohort">코호트</FieldLabel>
          <Input
            id="user-cohort"
            value={cohort}
            onChange={(event) => onCohortChange(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="user-email">이메일</FieldLabel>
          <Input id="user-email" value={USER.email} readOnly />
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" className="w-full sm:w-auto">
          비밀번호 재설정 링크 보내기
        </Button>
        <Button type="button" className="w-full sm:w-auto">
          저장
        </Button>
      </div>
    </section>
  )
}

function RecordPanel() {
  return (
    <div
      data-slot="user-admin-record"
      className="grid gap-4 @[48rem]/admin-main:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
    >
      <LearnerRecord className="rounded-[1.25rem] border border-border/70 bg-card p-4 sm:p-5">
        <LearnerRecordHeader>
          <LearnerRecordTitle>{USER.name}</LearnerRecordTitle>
          <LearnerRecordMeta>
            {USER.cohort} · {USER.id}
          </LearnerRecordMeta>
        </LearnerRecordHeader>
        <LearnerRecordSection>
          <LearnerRecordSectionTitle>진행</LearnerRecordSectionTitle>
          <LearnerRecordPath>{USER.progressLabel}</LearnerRecordPath>
        </LearnerRecordSection>
        <LearnerRecordSection>
          <LearnerRecordSectionTitle>숙련</LearnerRecordSectionTitle>
          <LearnerRecordMastery>{USER.masteryLabel}</LearnerRecordMastery>
          <LearnerRecordAttempts>{USER.attemptsLabel}</LearnerRecordAttempts>
        </LearnerRecordSection>
        <LearnerRecordSection>
          <LearnerRecordSectionTitle>제출</LearnerRecordSectionTitle>
          <LearnerRecordSubmissions>
            {USER.submissionsLabel}
          </LearnerRecordSubmissions>
        </LearnerRecordSection>
        <LearnerRecordSection>
          <LearnerRecordSectionTitle>지원</LearnerRecordSectionTitle>
          <LearnerRecordSupport>{USER.supportLabel}</LearnerRecordSupport>
        </LearnerRecordSection>
      </LearnerRecord>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-[1.25rem] border border-border/70 bg-card p-4 sm:p-5">
          <Mastery level="fluent">
            <MasteryHeader>
              <MasteryLabel>주장-근거 연결</MasteryLabel>
              <MasteryBadge level="fluent" />
            </MasteryHeader>
            <MasteryStages level="fluent" />
            <MasteryDescription>
              근거를 스스로 고르고 문단에 붙이는 단계입니다.
            </MasteryDescription>
          </Mastery>
          <Mastery level="developing">
            <MasteryHeader>
              <MasteryLabel>존댓말 전환</MasteryLabel>
              <MasteryBadge level="developing" />
            </MasteryHeader>
            <MasteryStages level="developing" />
            <MasteryDescription>
              격식 전환 연습이 이어지고 있습니다.
            </MasteryDescription>
          </Mastery>
        </div>

        <Cadence className="rounded-[1.25rem] border border-border/70 bg-card p-4 sm:p-5">
          <CadenceHeader>
            <CadenceTitle>이번 주 리듬</CadenceTitle>
            <CadenceSummary>4일 학습</CadenceSummary>
          </CadenceHeader>
          <CadenceWeek>
            <CadenceDay state="practiced" label="월" />
            <CadenceDay state="practiced" label="화" />
            <CadenceDay state="rest" label="수" />
            <CadenceDay state="practiced" label="목" />
            <CadenceDay state="today" label="금" />
            <CadenceDay state="upcoming" label="토" />
            <CadenceDay state="upcoming" label="일" />
          </CadenceWeek>
          <CadenceHint>
            오늘은 짧게라도 한 레슨을 마치면 리듬이 이어집니다.
          </CadenceHint>
        </Cadence>
      </div>
    </div>
  )
}

function SupportPanel() {
  return (
    <div data-slot="user-admin-support" className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-4">
        <InterventionQueue className="rounded-[1.25rem] border border-border/70 bg-card p-4 sm:p-5">
          <InterventionQueueHeader>
            <InterventionQueueTitle>개입·지원</InterventionQueueTitle>
            <InterventionQueueMeta>1건</InterventionQueueMeta>
          </InterventionQueueHeader>
          <InterventionQueueList>
            <InterventionItem reason="repeated-errors">
              <InterventionItemName>{USER.name}</InterventionItemName>
              <InterventionItemReason reason="repeated-errors" />
              <InterventionItemEvidence>
                「주장-근거」 문항에서 같은 오답 패턴 2회
              </InterventionItemEvidence>
              <InterventionItemActions>
                <Button size="sm" variant="outline" type="button">
                  코칭 보내기
                </Button>
              </InterventionItemActions>
            </InterventionItem>
          </InterventionQueueList>
        </InterventionQueue>

        <CohortAssignment className="rounded-[1.25rem] border border-border/70 bg-card p-4 sm:p-5">
          <CohortAssignmentHeader>
            <CohortAssignmentTitle>{USER.cohort}</CohortAssignmentTitle>
            <CohortAssignmentMeta>28명</CohortAssignmentMeta>
          </CohortAssignmentHeader>
          <CohortAssignmentMembers>
            <CohortMember>{USER.name}</CohortMember>
            <CohortMember>박민준</CohortMember>
            <CohortMember>+26</CohortMember>
          </CohortAssignmentMembers>
          <CohortAssignmentTargets>
            <CohortTarget kind="lesson">
              <CohortTargetLabel kind="lesson" />
              <CohortTargetTitle>레슨 3 · 근거 붙이기</CohortTargetTitle>
            </CohortTarget>
            <CohortTarget kind="writing">
              <CohortTargetLabel kind="writing" />
              <CohortTargetTitle>설득문 초고</CohortTargetTitle>
            </CohortTarget>
          </CohortAssignmentTargets>
          <CohortAssignmentDeadline>마감 · 8월 12일</CohortAssignmentDeadline>
        </CohortAssignment>
      </div>

      <AuditLog className="rounded-[1.25rem] border border-border/70 bg-card p-4 sm:p-5">
        <AuditLogHeader>
          <AuditLogTitle>계정 변경 이력</AuditLogTitle>
          <AuditLogMeta>최근 3건</AuditLogMeta>
        </AuditLogHeader>
        <AuditLogList>
          <AuditLogEntry selected>
            <AuditLogActor>이운영</AuditLogActor>
            <AuditLogAction>중급 A반에 배정</AuditLogAction>
            <AuditLogTarget>{USER.name}</AuditLogTarget>
            <AuditLogKind kind="permission" />
            <AuditLogEnvironment env="live" />
            <AuditLogTime dateTime="2026-08-01T09:10:00">8월 1일</AuditLogTime>
          </AuditLogEntry>
          <AuditLogEntry>
            <AuditLogActor>시스템</AuditLogActor>
            <AuditLogAction>초대 수락 · 계정 활성화</AuditLogAction>
            <AuditLogTarget>{USER.email}</AuditLogTarget>
            <AuditLogKind kind="permission" />
            <AuditLogEnvironment env="live" />
            <AuditLogTime dateTime="2026-07-20T14:22:00">7월 20일</AuditLogTime>
          </AuditLogEntry>
          <AuditLogEntry>
            <AuditLogActor>김교사</AuditLogActor>
            <AuditLogAction>학습자 초대 발송</AuditLogAction>
            <AuditLogTarget>{USER.email}</AuditLogTarget>
            <AuditLogKind kind="content" />
            <AuditLogEnvironment env="live" />
            <AuditLogTime dateTime="2026-07-18T11:05:00">7월 18일</AuditLogTime>
          </AuditLogEntry>
        </AuditLogList>
      </AuditLog>
    </div>
  )
}

/**
 * Admin user detail: shared shell with account, learning record, and support tabs.
 */
export function UserAdmin({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [role, setRole] = React.useState<UserRole>(USER.role)
  const [status, setStatus] = React.useState<UserStatus>(USER.status)
  const [cohort, setCohort] = React.useState(USER.cohort)
  const [suspendOpen, setSuspendOpen] = React.useState(false)

  const handleSuspendConfirm = () => {
    setStatus("suspended")
    setSuspendOpen(false)
  }

  return (
    <AdminShell
      data-slot="user-admin"
      activeNav="users"
      title={USER.name}
      breadcrumb={[{ label: "사용자", href: "#users" }]}
      contentClassName="min-h-0 gap-3 overflow-hidden sm:gap-4"
      className={cn("h-full min-h-0!", className)}
      {...props}
    >
      <Tabs
        defaultValue="account"
        className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden"
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <TabsList className="w-fit">
              <TabsTrigger value="account">계정</TabsTrigger>
              <TabsTrigger value="record">학습 기록</TabsTrigger>
              <TabsTrigger value="support">지원·코호트</TabsTrigger>
            </TabsList>
            <Badge variant={STATUS_BADGE_VARIANT[status]}>
              {STATUS_LABELS[status]}
            </Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="rounded-xl" />
              }
              aria-label="사용자 작업 메뉴"
            >
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              작업
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem>초대 다시 보내기</DropdownMenuItem>
              <DropdownMenuItem>비밀번호 재설정 링크</DropdownMenuItem>
              <DropdownMenuSeparator />
              {status === "suspended" ? (
                <DropdownMenuItem onClick={() => setStatus("active")}>
                  접근 재활성화
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setSuspendOpen(true)}
                >
                  접근 일시정지
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent
          value="account"
          className="min-h-0 overflow-auto rounded-[1.25rem] border border-border/70 bg-card p-4 sm:p-5"
        >
          <AccountPanel
            role={role}
            status={status}
            cohort={cohort}
            onRoleChange={setRole}
            onStatusChange={setStatus}
            onCohortChange={setCohort}
          />
        </TabsContent>

        <TabsContent
          value="record"
          className="min-h-0 overflow-auto outline-none"
        >
          <RecordPanel />
        </TabsContent>

        <TabsContent
          value="support"
          className="min-h-0 overflow-auto outline-none"
        >
          <SupportPanel />
        </TabsContent>
      </Tabs>

      <AlertDialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>접근을 일시정지할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {USER.name}님의 학습 접근이 즉시 막힙니다. 진행 기록은 유지되며,
              나중에 재활성화할 수 있습니다. 이 변경은 감사 로그에 남습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleSuspendConfirm}
            >
              일시정지
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  )
}

export default UserAdmin
