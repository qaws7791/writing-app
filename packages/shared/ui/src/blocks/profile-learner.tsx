"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BookOpen01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "#ui/lib/utils"
import {
  LearnerShell,
  type LearnerProfileAction,
} from "#ui/blocks/learner-shell"
import { AvatarFallback } from "#ui/components/ui/avatar"
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
import { Field, FieldGroup, FieldLabel } from "#ui/components/ui/field"
import { Goal } from "#ui/components/ui/goal"
import { Input } from "#ui/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "#ui/components/ui/item"
import {
  LearningProfile,
  LearningProfileFooter,
  LearningProfileHeader,
  LearningProfileOption,
  LearningProfileOptions,
  LearningProfileSection,
  LearningProfileSectionHint,
  LearningProfileSectionLabel,
  LearningProfileSummary,
  LearningProfileSummaryRow,
  LearningProfileSummaryTerm,
  LearningProfileSummaryValue,
  LearningProfileTitle,
} from "#ui/components/ui/learning-profile"
import {
  Mastery,
  MasteryBadge,
  MasteryDescription,
  MasteryHeader,
  MasteryLabel,
  MasteryStages,
} from "#ui/components/ui/mastery"
import {
  Milestone,
  MilestoneBody,
  MilestoneList,
  MilestoneMark,
  MilestoneMeta,
  MilestoneTitle,
} from "#ui/components/ui/milestone"
import {
  MistakeJournal,
  MistakeJournalHeader,
  MistakeJournalList,
  MistakeJournalMeta,
  MistakeJournalTitle,
  MistakePattern,
  MistakePatternCount,
  MistakePatternDescription,
  MistakePatternLabel,
} from "#ui/components/ui/mistake-journal"
import {
  NextAction,
  NextActionActions,
  NextActionBody,
  NextActionEyebrow,
  NextActionMeta,
  NextActionReason,
  NextActionTitle,
} from "#ui/components/ui/next-action"
import {
  Person,
  PersonAvatar,
  PersonDescription,
  PersonInfo,
  PersonName,
} from "#ui/components/ui/person"
import {
  Portfolio,
  PortfolioHeader,
  PortfolioList,
  PortfolioMeta,
  PortfolioPiece,
  PortfolioPieceExcerpt,
  PortfolioPieceMeta,
  PortfolioPieceTitle,
  PortfolioTitle,
} from "#ui/components/ui/portfolio"
import {
  PracticeQueue,
  PracticeQueueHeader,
  PracticeQueueItem,
  PracticeQueueItemMeta,
  PracticeQueueItemReason,
  PracticeQueueItemTitle,
  PracticeQueueList,
  PracticeQueueMeta,
  PracticeQueueTitle,
} from "#ui/components/ui/practice-queue"
import {
  SkillMap,
  SkillMapHeader,
  SkillMapList,
  SkillMapMeta,
  SkillMapTitle,
  SkillNode,
  SkillNodeFocus,
  SkillNodeLabel,
  SkillNodeLevel,
  SkillNodePrereq,
} from "#ui/components/ui/skill-map"

type ProfileView = "profile" | "history" | "settings"

const VIEW_TITLES: Record<ProfileView, string> = {
  profile: "프로필",
  history: "학습 기록",
  settings: "설정",
}

const COMPLETED_ACTIVITY = [
  {
    id: "a1",
    date: "3월 18일",
    title: "문맥 단서의 종류 찾기",
    course: "어휘와 문장의 의미 정확히 읽기",
    kind: "레슨 완료",
  },
  {
    id: "a2",
    date: "3월 12일",
    title: "인사와 자기소개",
    course: "회화",
    kind: "코스 완료",
  },
  {
    id: "a3",
    date: "3월 7일",
    title: "숙제 폐지 찬반",
    course: "짧은 의견 쓰기",
    kind: "글 제출",
  },
] as const

function parseViewHash(): ProfileView {
  if (typeof window === "undefined") return "profile"
  const hash = window.location.hash.replace(/^#/, "")
  if (hash === "history" || hash === "settings" || hash === "profile")
    return hash
  return "profile"
}

function SubpageHeader({
  title,
  onBack,
  titleRef,
}: {
  title: string
  onBack: () => void
  titleRef?: React.RefObject<HTMLHeadingElement | null>
}) {
  return (
    <header
      data-slot="profile-learner-subpage-header"
      className="flex items-center gap-2"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        onClick={onBack}
        aria-label="프로필로 돌아가기"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
      </Button>
      <h1
        ref={titleRef}
        tabIndex={-1}
        className="font-heading text-lg font-semibold tracking-[-0.03em] outline-none sm:text-xl"
      >
        {title}
      </h1>
    </header>
  )
}

function ProfileRoot({
  onNavigate,
}: {
  onNavigate: (view: Exclude<ProfileView, "profile">) => void
}) {
  return (
    <div
      data-slot="profile-learner-root"
      className="@container flex flex-col gap-12 sm:gap-14"
    >
      <Person orientation="vertical" aria-labelledby="profile-learner-name">
        <PersonAvatar size="xl">
          <AvatarFallback>민</AvatarFallback>
        </PersonAvatar>
        <PersonInfo>
          <PersonName id="profile-learner-name">민지</PersonName>
          <PersonDescription>
            논증 글쓰기를 또렷하게 쓰는 것이 목표예요
          </PersonDescription>
        </PersonInfo>
      </Person>

      <NextAction className="rounded-[1.75rem] bg-muted/55 px-5 py-5 sm:px-6 sm:py-6">
        <NextActionEyebrow>이어서 학습</NextActionEyebrow>
        <NextActionBody>
          <NextActionTitle>근거 연결 연습 이어하기</NextActionTitle>
          <NextActionReason>
            주장 세우기는 안정 단계입니다. 근거를 스스로 고르는 연습을 이어 가면
            흐름이 유지됩니다.
          </NextActionReason>
          <NextActionMeta>약 12분</NextActionMeta>
        </NextActionBody>
        <NextActionActions>
          <Button type="button">이어하기</Button>
        </NextActionActions>
      </NextAction>

      <div className="grid grid-cols-1 gap-8 @[48rem]:grid-cols-2 @[48rem]:gap-10">
        <Cadence>
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

        <Goal value={1} target={2} unit="레슨" />
      </div>

      <div className="grid grid-cols-1 gap-10 @[48rem]:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] @[48rem]:items-start @[48rem]:gap-12">
        <SkillMap>
          <SkillMapHeader>
            <SkillMapTitle>논증 기술</SkillMapTitle>
            <SkillMapMeta>4개 개념</SkillMapMeta>
          </SkillMapHeader>
          <SkillMapList>
            <SkillNode level="secure">
              <SkillNodeLabel>주장 세우기</SkillNodeLabel>
              <SkillNodeLevel />
            </SkillNode>
            <SkillNode level="developing" focus>
              <div className="flex flex-wrap items-center gap-2">
                <SkillNodeLabel>근거 연결</SkillNodeLabel>
                <SkillNodeFocus>집중 연습</SkillNodeFocus>
              </div>
              <SkillNodeLevel />
              <SkillNodePrereq>선행: 주장 세우기</SkillNodePrereq>
            </SkillNode>
            <SkillNode level="emerging">
              <SkillNodeLabel>반박 구성</SkillNodeLabel>
              <SkillNodeLevel />
              <SkillNodePrereq>선행: 근거 연결</SkillNodePrereq>
            </SkillNode>
            <SkillNode level="emerging">
              <SkillNodeLabel>결론 정리</SkillNodeLabel>
              <SkillNodeLevel />
              <SkillNodePrereq>선행: 반박 구성</SkillNodePrereq>
            </SkillNode>
          </SkillMapList>
        </SkillMap>

        <div className="flex flex-col gap-8">
          <Mastery level="developing">
            <MasteryHeader>
              <MasteryLabel>근거 연결</MasteryLabel>
              <MasteryBadge level="developing" />
            </MasteryHeader>
            <MasteryStages level="developing" />
            <MasteryDescription>
              근거를 스스로 고르는 연습을 이어 가세요.
            </MasteryDescription>
          </Mastery>

          <MilestoneList>
            <Milestone state="reached">
              <MilestoneMark state="reached">1</MilestoneMark>
              <MilestoneBody>
                <MilestoneTitle>첫 레슨 완료</MilestoneTitle>
                <MilestoneMeta>3월 2일 · 주장 고르기</MilestoneMeta>
              </MilestoneBody>
            </Milestone>
            <Milestone state="reached">
              <MilestoneMark state="reached">2</MilestoneMark>
              <MilestoneBody>
                <MilestoneTitle>첫 코스 완료</MilestoneTitle>
                <MilestoneMeta>3월 12일 · 인사와 자기소개</MilestoneMeta>
              </MilestoneBody>
            </Milestone>
            <Milestone state="upcoming">
              <MilestoneMark state="upcoming">3</MilestoneMark>
              <MilestoneBody>
                <MilestoneTitle>첫 쓰기 제출</MilestoneTitle>
                <MilestoneMeta>다가오는 이정표</MilestoneMeta>
              </MilestoneBody>
            </Milestone>
          </MilestoneList>
        </div>
      </div>

      <Portfolio>
        <PortfolioHeader>
          <PortfolioTitle>나의 글 모음</PortfolioTitle>
          <PortfolioMeta>2편</PortfolioMeta>
        </PortfolioHeader>
        <PortfolioList>
          <PortfolioPiece visibility="cohort">
            <PortfolioPieceTitle>숙제 폐지 찬반</PortfolioPieceTitle>
            <PortfolioPieceMeta visibility="cohort">
              3월 7일 · 268자
            </PortfolioPieceMeta>
            <PortfolioPieceExcerpt>
              숙제를 줄여야 한다. 주 5일 반복 과제가 학습 부담을 키우기
              때문이다…
            </PortfolioPieceExcerpt>
          </PortfolioPiece>
          <PortfolioPiece visibility="private">
            <PortfolioPieceTitle>자기반박 연습</PortfolioPieceTitle>
            <PortfolioPieceMeta visibility="private">
              2월 28일 · 초안
            </PortfolioPieceMeta>
            <PortfolioPieceExcerpt>
              모든 숙제를 없애면 복습 리듬이 사라질 수 있다…
            </PortfolioPieceExcerpt>
          </PortfolioPiece>
        </PortfolioList>
      </Portfolio>

      <nav aria-label="프로필 하위 메뉴">
        <ItemGroup className="gap-2">
          <Item
            variant="muted"
            size="default"
            render={
              <button
                type="button"
                aria-label="학습 기록 열기"
                onClick={() => onNavigate("history")}
                className="cursor-pointer text-left"
              />
            }
          >
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={2} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>학습 기록</ItemTitle>
              <ItemDescription>
                완료한 활동, 연습 추천, 반복 오류를 봅니다.
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="size-4 text-muted-foreground"
              />
            </ItemActions>
          </Item>
          <Item
            variant="muted"
            size="default"
            render={
              <button
                type="button"
                aria-label="설정 열기"
                onClick={() => onNavigate("settings")}
                className="cursor-pointer text-left"
              />
            }
          >
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>설정</ItemTitle>
              <ItemDescription>
                표시 이름과 학습 선호를 조정합니다.
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="size-4 text-muted-foreground"
              />
            </ItemActions>
          </Item>
        </ItemGroup>
      </nav>
    </div>
  )
}

function HistoryView({
  onBack,
  titleRef,
}: {
  onBack: () => void
  titleRef: React.RefObject<HTMLHeadingElement | null>
}) {
  return (
    <div data-slot="profile-learner-history" className="flex flex-col gap-10">
      <SubpageHeader title="학습 기록" onBack={onBack} titleRef={titleRef} />

      <section
        className="flex flex-col gap-4"
        aria-labelledby="profile-history-activity"
      >
        <header className="flex items-baseline justify-between gap-3">
          <h2
            id="profile-history-activity"
            className="text-sm font-medium tracking-[-0.01em]"
          >
            최근 활동
          </h2>
          <p className="text-xs tabular-nums text-muted-foreground">3건</p>
        </header>
        <ol className="flex flex-col gap-2">
          {COMPLETED_ACTIVITY.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-1 rounded-2xl border border-border/70 bg-card px-3.5 py-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm font-medium tracking-[-0.01em]">
                  {item.title}
                </p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {item.date}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {item.kind}
                <span className="mx-1.5 text-border" aria-hidden="true">
                  ·
                </span>
                {item.course}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <PracticeQueue>
        <PracticeQueueHeader>
          <PracticeQueueTitle>연습 추천</PracticeQueueTitle>
          <PracticeQueueMeta>2개 · 약 18분</PracticeQueueMeta>
        </PracticeQueueHeader>
        <PracticeQueueList>
          <PracticeQueueItem priority="high">
            <PracticeQueueItemTitle>근거 연결 다시 쓰기</PracticeQueueItemTitle>
            <PracticeQueueItemReason>
              최근 제출에서 근거와 주장의 거리가 멀었습니다.
            </PracticeQueueItemReason>
            <PracticeQueueItemMeta priority="high" />
          </PracticeQueueItem>
          <PracticeQueueItem>
            <PracticeQueueItemTitle>반박 문장 고르기</PracticeQueueItemTitle>
            <PracticeQueueItemReason>유닛 1 복습 권장</PracticeQueueItemReason>
            <PracticeQueueItemMeta />
          </PracticeQueueItem>
        </PracticeQueueList>
      </PracticeQueue>

      <MistakeJournal>
        <MistakeJournalHeader>
          <MistakeJournalTitle>반복 오류</MistakeJournalTitle>
          <MistakeJournalMeta>최근 4주</MistakeJournalMeta>
        </MistakeJournalHeader>
        <MistakeJournalList>
          <MistakePattern state="recurring" count={3}>
            <div className="flex items-center justify-between gap-2">
              <MistakePatternLabel>근거가 주장과 무관함</MistakePatternLabel>
              <MistakePatternCount count={3} />
            </div>
            <MistakePatternDescription>
              통계나 사례를 넣었지만 주장과 직접 연결되지 않았습니다.
            </MistakePatternDescription>
          </MistakePattern>
          <MistakePattern state="emerging" count={1}>
            <div className="flex items-center justify-between gap-2">
              <MistakePatternLabel>문단 전환 없음</MistakePatternLabel>
              <MistakePatternCount count={1} />
            </div>
            <MistakePatternDescription>
              본론 문단 사이에 연결어가 빠졌습니다.
            </MistakePatternDescription>
          </MistakePattern>
        </MistakeJournalList>
      </MistakeJournal>
    </div>
  )
}

function SettingsView({
  onBack,
  titleRef,
}: {
  onBack: () => void
  titleRef: React.RefObject<HTMLHeadingElement | null>
}) {
  const [displayName, setDisplayName] = React.useState("민지")
  const [prefs, setPrefs] = React.useState({
    purpose: "논증 글쓰기",
    level: "중급",
    genres: ["논증", "의견"] as string[],
    weeklyHours: "주 2–3시간",
    feedback: "힌트 후 코칭",
  })
  const [draft, setDraft] = React.useState<typeof prefs | null>(null)

  const editingPrefs = draft !== null
  const { purpose, level, genres, weeklyHours, feedback } = draft ?? prefs

  function startEditingPrefs() {
    setDraft({
      ...prefs,
      genres: [...prefs.genres],
    })
  }

  function cancelEditingPrefs() {
    setDraft(null)
  }

  function saveEditingPrefs() {
    if (!draft) return
    setPrefs({
      ...draft,
      genres: [...draft.genres],
    })
    setDraft(null)
  }

  function toggleGenre(genre: string) {
    setDraft((current) => {
      if (!current) return current
      return {
        ...current,
        genres: current.genres.includes(genre)
          ? current.genres.filter((item) => item !== genre)
          : [...current.genres, genre],
      }
    })
  }

  return (
    <div data-slot="profile-learner-settings" className="flex flex-col gap-10">
      <SubpageHeader title="설정" onBack={onBack} titleRef={titleRef} />

      <section
        className="flex flex-col gap-4"
        aria-labelledby="profile-settings-account"
      >
        <h2
          id="profile-settings-account"
          className="text-sm font-medium tracking-[-0.01em]"
        >
          계정
        </h2>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="profile-display-name">표시 이름</FieldLabel>
            <Input
              id="profile-display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="nickname"
            />
          </Field>
        </FieldGroup>
      </section>

      <LearningProfile>
        <LearningProfileHeader>
          <LearningProfileTitle>학습 선호</LearningProfileTitle>
        </LearningProfileHeader>

        {editingPrefs ? (
          <>
            <LearningProfileSection>
              <LearningProfileSectionLabel>
                학습 목적
              </LearningProfileSectionLabel>
              <LearningProfileOptions mode="single">
                {["논증 글쓰기", "학술 에세이", "설득 카피"].map((option) => (
                  <LearningProfileOption
                    key={option}
                    mode="single"
                    selected={purpose === option}
                    onClick={() =>
                      setDraft((current) =>
                        current ? { ...current, purpose: option } : current
                      )
                    }
                  >
                    {option}
                  </LearningProfileOption>
                ))}
              </LearningProfileOptions>
            </LearningProfileSection>
            <LearningProfileSection>
              <LearningProfileSectionLabel>
                현재 수준
              </LearningProfileSectionLabel>
              <LearningProfileSectionHint>
                자가 진단입니다. 언제든 바꿀 수 있습니다.
              </LearningProfileSectionHint>
              <LearningProfileOptions mode="single">
                {["입문", "중급", "숙련"].map((option) => (
                  <LearningProfileOption
                    key={option}
                    mode="single"
                    selected={level === option}
                    onClick={() =>
                      setDraft((current) =>
                        current ? { ...current, level: option } : current
                      )
                    }
                  >
                    {option}
                  </LearningProfileOption>
                ))}
              </LearningProfileOptions>
            </LearningProfileSection>
            <LearningProfileSection>
              <LearningProfileSectionLabel>
                관심 장르
              </LearningProfileSectionLabel>
              <LearningProfileOptions mode="multiple">
                {["논증", "의견", "요약", "서사"].map((option) => (
                  <LearningProfileOption
                    key={option}
                    mode="multiple"
                    selected={genres.includes(option)}
                    onClick={() => toggleGenre(option)}
                  >
                    {option}
                  </LearningProfileOption>
                ))}
              </LearningProfileOptions>
            </LearningProfileSection>
            <LearningProfileSection>
              <LearningProfileSectionLabel>
                주당 학습 시간
              </LearningProfileSectionLabel>
              <LearningProfileOptions mode="single">
                {["주 1시간 이하", "주 2–3시간", "주 4시간 이상"].map(
                  (option) => (
                    <LearningProfileOption
                      key={option}
                      mode="single"
                      selected={weeklyHours === option}
                      onClick={() =>
                        setDraft((current) =>
                          current
                            ? { ...current, weeklyHours: option }
                            : current
                        )
                      }
                    >
                      {option}
                    </LearningProfileOption>
                  )
                )}
              </LearningProfileOptions>
            </LearningProfileSection>
            <LearningProfileSection>
              <LearningProfileSectionLabel>
                피드백 선호
              </LearningProfileSectionLabel>
              <LearningProfileOptions mode="single">
                {["힌트만", "힌트 후 코칭", "바로 코칭"].map((option) => (
                  <LearningProfileOption
                    key={option}
                    mode="single"
                    selected={feedback === option}
                    onClick={() =>
                      setDraft((current) =>
                        current ? { ...current, feedback: option } : current
                      )
                    }
                  >
                    {option}
                  </LearningProfileOption>
                ))}
              </LearningProfileOptions>
            </LearningProfileSection>
            <LearningProfileFooter>
              <Button
                type="button"
                variant="outline"
                onClick={cancelEditingPrefs}
              >
                취소
              </Button>
              <Button type="button" onClick={saveEditingPrefs}>
                저장
              </Button>
            </LearningProfileFooter>
          </>
        ) : (
          <>
            <LearningProfileSummary>
              <LearningProfileSummaryRow>
                <LearningProfileSummaryTerm>목적</LearningProfileSummaryTerm>
                <LearningProfileSummaryValue>
                  {purpose}
                </LearningProfileSummaryValue>
              </LearningProfileSummaryRow>
              <LearningProfileSummaryRow>
                <LearningProfileSummaryTerm>수준</LearningProfileSummaryTerm>
                <LearningProfileSummaryValue>
                  {level}
                </LearningProfileSummaryValue>
              </LearningProfileSummaryRow>
              <LearningProfileSummaryRow>
                <LearningProfileSummaryTerm>장르</LearningProfileSummaryTerm>
                <LearningProfileSummaryValue>
                  {genres.length > 0 ? genres.join(" · ") : "아직 고르지 않음"}
                </LearningProfileSummaryValue>
              </LearningProfileSummaryRow>
              <LearningProfileSummaryRow>
                <LearningProfileSummaryTerm>
                  주당 시간
                </LearningProfileSummaryTerm>
                <LearningProfileSummaryValue>
                  {weeklyHours}
                </LearningProfileSummaryValue>
              </LearningProfileSummaryRow>
              <LearningProfileSummaryRow>
                <LearningProfileSummaryTerm>피드백</LearningProfileSummaryTerm>
                <LearningProfileSummaryValue>
                  {feedback}
                </LearningProfileSummaryValue>
              </LearningProfileSummaryRow>
            </LearningProfileSummary>
            <LearningProfileFooter>
              <Button
                type="button"
                variant="outline"
                onClick={startEditingPrefs}
              >
                선호 수정
              </Button>
            </LearningProfileFooter>
          </>
        )}
      </LearningProfile>
    </div>
  )
}

/**
 * Learner profile hub: identity, rhythm, mastery, and portfolio on the root,
 * with learning history and preferences as hierarchical subpages.
 */
export function ProfileLearner({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [view, setView] = React.useState<ProfileView>("profile")
  const titleRef = React.useRef<HTMLHeadingElement>(null)
  const mainRef = React.useRef<HTMLElement>(null)
  const didMount = React.useRef(false)

  React.useEffect(() => {
    setView(parseViewHash())
  }, [])

  function goTo(next: ProfileView) {
    setView(next)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.hash = next === "profile" ? "profile" : next
      window.history.replaceState(null, "", url)
    }
  }

  React.useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }
    if (view === "profile") {
      mainRef.current?.focus({ preventScroll: true })
      return
    }
    titleRef.current?.focus({ preventScroll: true })
  }, [view])

  function handleProfileAction(action: LearnerProfileAction) {
    if (action === "profile") goTo("profile")
    if (action === "history") goTo("history")
    if (action === "settings") goTo("settings")
  }

  return (
    <LearnerShell
      data-slot="profile-learner"
      className={className}
      currentNav={null}
      onProfileAction={handleProfileAction}
      {...props}
    >
      <main
        ref={mainRef}
        tabIndex={-1}
        aria-label={VIEW_TITLES[view]}
        className={cn(
          "mx-auto w-full max-w-5xl flex-1 px-5 py-10 outline-none sm:px-8 sm:py-12",
          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
        )}
        key={view}
      >
        {view === "profile" ? <ProfileRoot onNavigate={goTo} /> : null}
        {view === "history" ? (
          <HistoryView onBack={() => goTo("profile")} titleRef={titleRef} />
        ) : null}
        {view === "settings" ? (
          <SettingsView onBack={() => goTo("profile")} titleRef={titleRef} />
        ) : null}
      </main>
    </LearnerShell>
  )
}

export default ProfileLearner
