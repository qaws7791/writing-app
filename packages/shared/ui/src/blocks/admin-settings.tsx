"use client"

import * as React from "react"

import { cn } from "#ui/lib/utils"
import { AdminShell } from "#ui/blocks/admin-shell"
import { Button } from "#ui/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "#ui/components/ui/field"
import { Input } from "#ui/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#ui/components/ui/select"
import { Switch } from "#ui/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#ui/components/ui/tabs"

const TIMEZONE_ITEMS = [
  { value: "asia-seoul", label: "Asia/Seoul (UTC+9)" },
  { value: "utc", label: "UTC" },
  { value: "america-la", label: "America/Los_Angeles" },
] as const

const ROLE_ITEMS = [
  { value: "admin", label: "운영자" },
  { value: "editor", label: "편집자" },
  { value: "viewer", label: "열람" },
] as const

const ENV_ITEMS = [
  { value: "sandbox", label: "Sandbox" },
  { value: "preview", label: "Preview" },
  { value: "live", label: "Live" },
] as const

const SECTIONS = [
  { value: "general", label: "일반" },
  { value: "members", label: "멤버·역할" },
  { value: "notifications", label: "알림" },
  { value: "security", label: "보안" },
  { value: "environment", label: "환경" },
] as const

function SettingsPanel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div
      data-slot="admin-settings-panel"
      className="min-h-0 min-w-0 rounded-[1.5rem] border border-border/70 bg-card p-4 sm:p-5"
    >
      <header className="mb-5 space-y-1">
        <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </div>
  )
}

function GeneralSection() {
  const [orgName, setOrgName] = React.useState("Luma 한국어")
  const [displayLocale, setDisplayLocale] = React.useState("ko-KR")
  const [timezone, setTimezone] = React.useState("asia-seoul")

  return (
    <SettingsPanel
      title="일반"
      description="조직 기본 정보와 표시 설정을 관리합니다."
    >
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="settings-org-name">조직명</FieldLabel>
          <Input
            id="settings-org-name"
            value={orgName}
            onChange={(event) => setOrgName(event.target.value)}
          />
          <FieldDescription>
            사이드바와 학습자 표면에 표시되는 이름입니다.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="settings-locale">표시 언어</FieldLabel>
          <Input
            id="settings-locale"
            value={displayLocale}
            onChange={(event) => setDisplayLocale(event.target.value)}
          />
          <FieldDescription>
            운영 UI 기본 로케일입니다. 예: ko-KR
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="settings-timezone">시간대</FieldLabel>
          <Select
            items={[...TIMEZONE_ITEMS]}
            value={timezone}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value
              if (typeof next === "string") setTimezone(next)
            }}
          >
            <SelectTrigger id="settings-timezone" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {TIMEZONE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="flex justify-end pt-1">
          <Button type="button" size="sm">
            변경 사항 저장
          </Button>
        </div>
      </FieldGroup>
    </SettingsPanel>
  )
}

function MembersSection() {
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState("editor")

  return (
    <SettingsPanel
      title="멤버·역할"
      description="운영 권한을 부여하고 초대를 보냅니다. 데모용 정적 UI입니다."
    >
      <FieldGroup className="gap-6">
        <FieldSet>
          <FieldLegend>현재 역할</FieldLegend>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-3.5 py-2.5">
              <span className="font-medium">수진</span>
              <span className="text-muted-foreground">운영자</span>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-3.5 py-2.5">
              <span className="font-medium">민호</span>
              <span className="text-muted-foreground">편집자</span>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-3.5 py-2.5">
              <span className="font-medium">예린</span>
              <span className="text-muted-foreground">열람</span>
            </li>
          </ul>
        </FieldSet>

        <FieldSet>
          <FieldLegend>멤버 초대</FieldLegend>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="settings-invite-email">이메일</FieldLabel>
              <Input
                id="settings-invite-email"
                type="email"
                autoComplete="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-invite-role">역할</FieldLabel>
              <Select
                items={[...ROLE_ITEMS]}
                value={inviteRole}
                onValueChange={(value) => {
                  const next = Array.isArray(value) ? value[0] : value
                  if (typeof next === "string") setInviteRole(next)
                }}
              >
                <SelectTrigger id="settings-invite-role" className="w-full">
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
            <div className="flex justify-end">
              <Button type="button" size="sm" variant="outline">
                초대 보내기
              </Button>
            </div>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </SettingsPanel>
  )
}

function NotificationsSection() {
  const [publishApproval, setPublishApproval] = React.useState(true)
  const [intervention, setIntervention] = React.useState(true)
  const [weeklySummary, setWeeklySummary] = React.useState(false)

  return (
    <SettingsPanel
      title="알림"
      description="운영 이벤트에 대한 알림 수신을 설정합니다."
    >
      <FieldGroup className="gap-4">
        <Field orientation="horizontal">
          <Switch
            id="settings-notify-publish"
            checked={publishApproval}
            onCheckedChange={setPublishApproval}
          />
          <FieldContent>
            <FieldLabel htmlFor="settings-notify-publish">
              게시 승인 대기
            </FieldLabel>
            <FieldDescription>
              코스가 검토·게시 대기열에 들어오면 알립니다.
            </FieldDescription>
          </FieldContent>
        </Field>
        <Field orientation="horizontal">
          <Switch
            id="settings-notify-intervention"
            checked={intervention}
            onCheckedChange={setIntervention}
          />
          <FieldContent>
            <FieldLabel htmlFor="settings-notify-intervention">
              개입 필요
            </FieldLabel>
            <FieldDescription>
              이탈·반복 오답 등 지원이 필요한 학습자를 알립니다.
            </FieldDescription>
          </FieldContent>
        </Field>
        <Field orientation="horizontal">
          <Switch
            id="settings-notify-weekly"
            checked={weeklySummary}
            onCheckedChange={setWeeklySummary}
          />
          <FieldContent>
            <FieldLabel htmlFor="settings-notify-weekly">주간 요약</FieldLabel>
            <FieldDescription>
              매주 월요일에 운영 지표 요약을 보냅니다.
            </FieldDescription>
          </FieldContent>
        </Field>
        <div className="flex justify-end pt-1">
          <Button type="button" size="sm">
            변경 사항 저장
          </Button>
        </div>
      </FieldGroup>
    </SettingsPanel>
  )
}

function SecuritySection() {
  const [require2fa, setRequire2fa] = React.useState(true)
  const [shortSession, setShortSession] = React.useState(false)

  return (
    <SettingsPanel
      title="보안"
      description="계정 보호와 세션 정책을 관리합니다."
    >
      <FieldGroup className="gap-4">
        <Field orientation="horizontal">
          <Switch
            id="settings-2fa"
            checked={require2fa}
            onCheckedChange={setRequire2fa}
          />
          <FieldContent>
            <FieldLabel htmlFor="settings-2fa">2단계 인증 필수</FieldLabel>
            <FieldDescription>
              운영자·편집자 계정에 2FA를 요구합니다.
            </FieldDescription>
          </FieldContent>
        </Field>
        <Field orientation="horizontal">
          <Switch
            id="settings-short-session"
            checked={shortSession}
            onCheckedChange={setShortSession}
          />
          <FieldContent>
            <FieldLabel htmlFor="settings-short-session">짧은 세션</FieldLabel>
            <FieldDescription>
              8시간 비활성 후 다시 로그인하도록 합니다.
            </FieldDescription>
          </FieldContent>
        </Field>
        <div className="flex justify-end pt-1">
          <Button type="button" size="sm">
            변경 사항 저장
          </Button>
        </div>
      </FieldGroup>
    </SettingsPanel>
  )
}

function EnvironmentSection() {
  const [defaultEnv, setDefaultEnv] = React.useState("preview")

  return (
    <SettingsPanel
      title="환경"
      description="게시와 미리보기에 쓰는 기본 환경을 고릅니다. Live 승격은 별도 확인이 필요합니다."
    >
      <FieldGroup className="gap-5">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2">
          {ENV_ITEMS.map((item) => (
            <div
              key={item.value}
              className={cn(
                "rounded-2xl border px-3.5 py-3 text-sm",
                item.value === "preview"
                  ? "border-foreground/20 bg-muted/60"
                  : "border-border/60 bg-background"
              )}
            >
              <p className="font-medium">{item.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.value === "sandbox"
                  ? "실험·초안"
                  : item.value === "preview"
                    ? "현재 활성"
                    : "프로덕션"}
              </p>
            </div>
          ))}
        </div>
        <Field>
          <FieldLabel htmlFor="settings-default-env">기본 게시 환경</FieldLabel>
          <Select
            items={[...ENV_ITEMS]}
            value={defaultEnv}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value
              if (typeof next === "string") setDefaultEnv(next)
            }}
          >
            <SelectTrigger id="settings-default-env" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {ENV_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>
            새 코스·레슨 게시 흐름의 기본 대상입니다. Live는 원클릭으로 올리지
            않습니다.
          </FieldDescription>
        </Field>
        <div className="flex justify-end pt-1">
          <Button type="button" size="sm">
            변경 사항 저장
          </Button>
        </div>
      </FieldGroup>
    </SettingsPanel>
  )
}

/**
 * Unified operator settings: vertical section tabs with organization, members, notifications, security, and environment panels.
 */
export function AdminSettings({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <AdminShell
      data-slot="admin-settings"
      activeNav="settings"
      title="설정"
      description="조직·알림·보안과 운영 환경을 관리합니다"
      className={cn(className)}
      {...props}
    >
      <Tabs
        defaultValue="general"
        orientation="vertical"
        className="grid min-h-[32rem] w-full gap-6 @[40rem]/admin-main:grid-cols-[11rem_minmax(0,1fr)]"
      >
        <TabsList
          variant="line"
          className="h-fit w-full overflow-x-auto pb-1 @[40rem]/admin-main:w-auto @[40rem]/admin-main:flex-col @[40rem]/admin-main:items-stretch @[40rem]/admin-main:overflow-visible @[40rem]/admin-main:pb-0"
        >
          {SECTIONS.map((section) => (
            <TabsTrigger
              key={section.value}
              value={section.value}
              className="justify-start"
            >
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent
          value="general"
          keepMounted
          className="min-w-0 outline-none"
        >
          <GeneralSection />
        </TabsContent>
        <TabsContent
          value="members"
          keepMounted
          className="min-w-0 outline-none"
        >
          <MembersSection />
        </TabsContent>
        <TabsContent
          value="notifications"
          keepMounted
          className="min-w-0 outline-none"
        >
          <NotificationsSection />
        </TabsContent>
        <TabsContent
          value="security"
          keepMounted
          className="min-w-0 outline-none"
        >
          <SecuritySection />
        </TabsContent>
        <TabsContent
          value="environment"
          keepMounted
          className="min-w-0 outline-none"
        >
          <EnvironmentSection />
        </TabsContent>
      </Tabs>
    </AdminShell>
  )
}

export default AdminSettings
