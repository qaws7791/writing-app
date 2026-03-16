"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Bookmark01Icon, BookmarkCheckIcon } from "@hugeicons/core-free-icons"
import { LevelDots } from "@/components/level-dots"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/tabs"

export default function Page() {
  const mockInspirations = [
    {
      id: 1,
      text: "비가 올 때 제일 먼저 생각\n나는 게 뭔가요?",
      category: "일상",
      level: 1,
    },
    {
      id: 2,
      text: "가장 최근에 누군가에게\n고마웠던 순간은 언제인가요?",
      category: "관계",
      level: 1,
    },
    {
      id: 3,
      text: "10년 후의 나에게 하고\n싶은 말 한마디는?",
      category: "자기이해",
      level: 2,
    },
    {
      id: 4,
      text: "어른이 된다는 건 무엇을\n포기하는 것일까요?",
      category: "사회",
      level: 3,
    },
  ]

  const mockDrafts: {
    id: number
    title: string
    description: string
    date: string
    length: string
  }[] = [
    {
      id: 1,
      title: "오늘 아침 창밖을 보며 든 생각",
      description:
        "아침 햇살이 비치는 창밖 풍경을 바라보며 느낀 감정들. 익숙한 풍경 속에서 발견하는 작은 변화와 소소한 행복에 대한 짧은 단상입니다.",
      date: "2026.03.16",
      length: "850자",
    },
    {
      id: 2,
      title: "관계에 대하여",
      description:
        "사람과 사람 사이의 거리는 어느 정도가 적당할까요? 너무 가깝지도 너무 멀지도 않은 안전한 거리에 대해 생각해보며 작성한 글.",
      date: "2026.03.15",
      length: "1,200자",
    },
    {
      id: 3,
      title: "시간이 참 빠르다고 느낄 때",
      description:
        "어느새 또 한 달이 지났다는 사실을 깨달았을 때의 막막함과 허무함. 시간의 흐름을 어떻게 받아들여야 할지에 대한 고민을 담았습니다.",
      date: "2026.03.14",
      length: "430자",
    },
    {
      id: 4,
      title: "나만의 스트레스 해소법",
      description:
        "머리가 복잡할 때는 무작정 걷는 것이 최고라는 걸 경험했습니다. 동네 한 바퀴를 돌며 리프레시하는 나만의 스트레스 해소루틴.",
      date: "2026.03.12",
      length: "1,500자",
    },
    {
      id: 5,
      title: "여행지에서 만난 낯선 사람",
      description:
        "혼자 떠난 여행길에서 우연히 만난 사람과의 짧지만 강렬했던 대화. 전혀 모르는 사람이라서 오히려 쉽게 털어놓을 수 있었던 속마음.",
      date: "2026.03.10",
      length: "920자",
    },
    {
      id: 6,
      title: "나를 가장 잘 표현하는 단어 한 가지",
      description:
        "수많은 단어 중에 나를 설명할 수 있는 유일한 단어가 있다면 무엇일까요? 한참을 고민한 끝에 마침내 찾아낸 나의 키워드.",
      date: "2026.03.08",
      length: "680자",
    },
    {
      id: 7,
      title: "가장 좋아하는 계절과 그 이유",
      description:
        "여름의 끝자락에서 가을을 맞이하는 그 찰나의 공기를 좋아합니다. 덥지도 춥지도 않은 적당한 온도가 주는 안정감을 생각하며.",
      date: "2026.03.05",
      length: "1,150자",
    },
    {
      id: 8,
      title: "어린 시절의 꿈을 다시 떠올려본다면",
      description:
        "초등학생 시절 장래희망 칸에 적었던 직업. 지금은 그때의 꿈과 얼마나 멀어졌는지 돌아보며, 잊고 있던 열정을 다시 꺼내봅니다.",
      date: "2026.03.01",
      length: "2,050자",
    },
    {
      id: 9,
      title: "불안을 다스리는 작은 습관",
      description:
        "알 수 없는 불안감이 밀려올 때면 종이 한 장을 꺼내 내 마음속 감정들을 쏟아냅니다. 활자로 적은 감정들이 주는 예상 밖의 위로감.",
      date: "2026.02.28",
      length: "890자",
    },
    {
      id: 10,
      title: "완벽하지 않아도 괜찮아",
      description:
        "매사에 완벽을 추구하다 보니 어느새 지쳐버린 나 자신에게 건네는 위로. 조급함을 내려놓고 서툰 모습 그대로를 받아들이기로 했습니다.",
      date: "2026.02.25",
      length: "1,340자",
    },
  ]

  const mockSavedPrompts: {
    id: number
    text: string
    category: string
    level: 1 | 2 | 3
    bookmarked?: boolean
  }[] = [
    {
      id: 1,
      text: "하루 중 가장 온전히 나일 수 있는 시간은 언제인가요?",
      category: "자기이해",
      level: 1,
      bookmarked: true,
    },
    {
      id: 2,
      text: "누군가에게 들었던 말 중 가장 오랫동안 기억에 남는 말은?",
      category: "관계",
      level: 1,
      bookmarked: true,
    },
    {
      id: 3,
      text: "스마트폰이 없다면 오늘 하루를 어떻게 보낼 계획인가요?",
      category: "일상",
      level: 2,
      bookmarked: true,
    },
    {
      id: 4,
      text: "실패를 두려워하지 않았다면 지금 가장 해보고 싶은 일은?",
      category: "성장",
      level: 3,
      bookmarked: true,
    },
    {
      id: 5,
      text: "살면서 가장 크게 가치관이 변했던 순간은 언제인가요?",
      category: "경험",
      level: 2,
      bookmarked: true,
    },
    {
      id: 6,
      text: "내가 생각하는 진정한 '어른'의 조건은 무엇일까요?",
      category: "자기이해",
      level: 3,
      bookmarked: true,
    },
    {
      id: 7,
      text: "지금 당장 떠날 수 있다면 어디로 가고 싶나요? 왜 그곳인가요?",
      category: "여행",
      level: 1,
      bookmarked: true,
    },
    {
      id: 8,
      text: "최근에 본 영화나 책 중에서 나를 가장 많이 생각하게 만든 것은?",
      category: "문화",
      level: 2,
      bookmarked: true,
    },
    {
      id: 9,
      text: "나에게 '행복'이란 단어를 정의한다면 어떻게 표현할 수 있을까요?",
      category: "감정",
      level: 2,
      bookmarked: true,
    },
    {
      id: 10,
      text: "미래의 나에게 편지를 쓴다면, 어떤 당부를 하고 싶나요?",
      category: "자기이해",
      level: 1,
      bookmarked: true,
    },
  ]

  return (
    <div className="min-h-svh flex-1 bg-background px-10 py-20 lg:px-24">
      <div className="mx-auto max-w-5xl">
        {/* 헤더 */}
        <section className="mb-20">
          <h1 className="text-3xl leading-snug font-medium tracking-tight text-foreground md:text-4xl">
            오늘도,
            <br />
            그냥 써봐요
          </h1>
        </section>

        {/* 오늘의 영감 */}
        <section className="mb-20">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">오늘의 영감</h2>
            <Link
              href="/prompts"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              더 보기
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {mockInspirations.map((item) => (
              <div
                key={item.id}
                className="flex h-full cursor-pointer flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-foreground/15"
              >
                <p className="text-sm leading-6 font-medium whitespace-pre-wrap text-foreground">
                  {item.text}
                </p>
                <div className="mt-auto flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {item.category}
                  </span>
                  <span className="text-xs text-border">·</span>
                  <LevelDots level={item.level as 1 | 2 | 3} showLabel />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 이어서 쓰기 - 탭 */}
        <section>
          <Tabs defaultValue="my-posts">
            <TabsList className="mb-6 gap-0">
              <TabsTrigger value="my-posts">내가 쓴 글</TabsTrigger>
              <TabsTrigger value="saved-prompts">저장한 글감</TabsTrigger>
            </TabsList>

            <TabsContent value="my-posts">
              {mockDrafts.length > 0 ? (
                <div className="flex flex-col">
                  {mockDrafts.map((item, index) => (
                    <Link
                      key={item.id}
                      href={`/write/${item.id}`}
                      className="group"
                    >
                      <article
                        className={`flex flex-col gap-1 py-6 transition-colors ${
                          index !== mockDrafts.length - 1
                            ? "border-b border-border/70"
                            : ""
                        }`}
                      >
                        {/* 글 제목 */}
                        <h3 className="text-base leading-normal font-semibold text-foreground underline-offset-4 group-hover:underline md:text-lg">
                          {item.title}
                        </h3>

                        {/* 글 설명 (최대 2줄 말줄임) */}
                        <p className="line-clamp-2 text-sm leading-7 font-normal text-muted-foreground md:text-base">
                          {item.description}
                        </p>

                        {/* 메타 정보 */}
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground md:text-sm">
                          <span>{item.date}</span>
                          <span className="text-border">·</span>
                          <span>{item.length}</span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
                  <p className="text-sm text-muted-foreground">
                    작성한 글이 아직 없습니다.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved-prompts">
              {mockSavedPrompts.length > 0 ? (
                <div className="flex flex-col">
                  {mockSavedPrompts.map((item) => (
                    <Link
                      key={item.id}
                      href={`/prompts/${item.id}`}
                      className="group flex items-center gap-4 rounded-xl py-3.5 transition-colors hover:bg-muted/60"
                    >
                      {/* 본문 */}
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="text-sm leading-snug font-medium text-foreground underline-offset-4 group-hover:underline md:text-base">
                          {item.text}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {item.category}
                          </span>
                          <span className="text-xs text-border">·</span>
                          <LevelDots level={item.level} showLabel />
                        </div>
                      </div>

                      {/* 북마크 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          // 북마크 토글 로직 추가 예정
                        }}
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-all ${
                          item.bookmarked
                            ? "text-foreground"
                            : "text-muted-foreground/60 hover:text-foreground"
                        }`}
                        aria-label="북마크"
                      >
                        <HugeiconsIcon
                          icon={
                            item.bookmarked ? BookmarkCheckIcon : Bookmark01Icon
                          }
                          size={16}
                          strokeWidth={1.5}
                        />
                      </button>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
                  <p className="text-sm text-muted-foreground">
                    저장한 글감이 아직 없습니다.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  )
}
