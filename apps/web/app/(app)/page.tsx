import Link from "next/link"
import { LevelDots } from "@/components/level-dots"

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

  const mockDrafts = [
    {
      id: 1,
      title: "혼자 여행하면 무엇이 달라질까",
      date: "2025년 6월 3일",
      length: "1,240자",
    },
  ]

  return (
    <div className="min-h-svh flex-1 bg-[#FAFAFA] px-10 py-20 lg:px-24">
      <div className="mx-auto max-w-[1000px]">
        {/* Header */}
        <section className="mb-20">
          <h1 className="text-[32px] leading-[1.4] font-medium tracking-tight text-[#111111] md:text-[36px]">
            오늘도,
            <br />
            그냥 써봐요
          </h1>
        </section>

        {/* Today's Inspiration */}
        <section className="mb-20">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-[17px] font-medium text-[#111111]">
              오늘의 영감
            </h2>
            <Link
              href="/prompts"
              className="text-[13px] font-medium text-[#888888] transition-colors hover:text-[#111111]"
            >
              더 보기
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {mockInspirations.map((item) => (
              <div
                key={item.id}
                className="flex h-full cursor-pointer flex-col justify-between gap-4 rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm transition-all hover:border-[#D0D0D0]"
              >
                <p className="text-[15px] leading-[1.6] font-medium whitespace-pre-wrap text-[#111111]">
                  {item.text}
                </p>
                <div className="mt-auto flex items-center gap-2">
                  <span className="text-[12px] font-medium text-[#888888]">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-[#D0D0D0]">·</span>
                  <LevelDots level={item.level as 1 | 2 | 3} showLabel />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Continue Writing */}
        <section>
          <div className="mb-8">
            <h2 className="text-[17px] font-medium text-[#111111]">
              이어서 쓰기
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            {mockDrafts.map((item) => (
              <div
                key={item.id}
                className="group flex cursor-pointer flex-col gap-2 py-2"
              >
                <h3 className="text-[16px] font-medium text-[#111111] underline-offset-4 group-hover:underline">
                  {item.title}
                </h3>
                <p className="text-[13px] font-medium text-[#888888]">
                  {item.date} · {item.length}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
