import Link from "next/link"
import { PencilEdit02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export default function WriteListPage() {
  const mockPosts = [
    {
      id: "1",
      title: "혼자 여행하면 무엇이 달라질까",
      description:
        "혼자 여행을 떠나본 적 있는가. 누군가와 함께하는 여행은 즐겁지만, 혼자만의 시간 속에서 발견하는 것들은 전혀 다른 종류의 감동을 준다.",
      updatedAt: "2025년 6월 3일",
      characterCount: 1240,
    },
    {
      id: "2",
      title: "비 오는 날의 기억",
      description:
        "비가 오면 언제나 그 골목이 떠오른다. 우산 없이 뛰어가던 여름날, 처마 밑에서 잠시 비를 피하며 올려다본 하늘은 의외로 아름다웠다.",
      updatedAt: "2025년 5월 28일",
      characterCount: 890,
    },
    {
      id: "3",
      title: "어른이 된다는 것",
      description:
        "어릴 때는 어른이 되면 모든 것을 알 수 있을 줄 알았다. 하지만 나이를 먹을수록 모르는 것이 더 많아지고, 그것이 당연하다는 걸 받아들이게 된다.",
      updatedAt: "2025년 5월 15일",
      characterCount: 2150,
    },
    {
      id: "4",
      title: "좋아하는 것을 좋아하는 용기",
      description:
        "남들이 좋아하는 것이 아니라, 내가 진짜 좋아하는 것을 좋아한다고 말할 수 있는 용기. 그것이 생각보다 어렵다는 걸 깨달은 건 꽤 오래된 일이다.",
      updatedAt: "2025년 5월 2일",
      characterCount: 1680,
    },
    {
      id: "5",
      title: "새벽 네 시의 고백",
      description:
        "잠이 오지 않는 밤, 핸드폰을 내려놓고 천장을 바라보며 스스로에게 물었다. 나는 지금 행복한가. 대답은 의외로 간단했다.",
      updatedAt: "2025년 4월 20일",
      characterCount: 560,
    },
  ]

  return (
    <div className="min-h-svh flex-1 bg-[#FAFAFA] px-6 py-16 md:px-10 md:py-20 lg:px-24">
      <div className="mx-auto max-w-[800px]">
        {/* 페이지 제목 */}
        <h1 className="mb-12 text-[28px] leading-[1.4] font-semibold tracking-tight text-[#111111] md:mb-16 md:text-[32px]">
          내 글
        </h1>

        {/* 히어로 CTA 섹션 */}
        <section className="mb-14 md:mb-16">
          <Link
            href="/write/new"
            className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-[#E0E0E0] bg-white px-7 py-8 shadow-sm transition-all hover:border-[#C8C8C8] hover:shadow-md md:px-10 md:py-10"
          >
            {/* 배경 장식 */}
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-[#F5F5F5] opacity-60 transition-transform group-hover:scale-110" />
            <div className="pointer-events-none absolute top-4 -right-2 h-16 w-16 rounded-full bg-[#FAFAFA] opacity-40" />

            <div className="relative z-10 flex flex-col gap-2">
              <span className="text-[20px] font-semibold tracking-tight text-[#111111] md:text-[22px]">
                글쓰기
              </span>
              <span className="text-[14px] font-medium text-[#888888]">
                새로운 이야기를 시작해보세요
              </span>
            </div>

            <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#111111] text-white transition-transform group-hover:scale-105">
              <HugeiconsIcon
                icon={PencilEdit02Icon}
                size={20}
                color="currentColor"
                strokeWidth={2}
              />
            </div>
          </Link>
        </section>

        {/* 글 목록 */}
        <section>
          <div className="flex flex-col">
            {mockPosts.map((post, index) => (
              <Link key={post.id} href={`/write/${post.id}`} className="group">
                <article
                  className={`flex flex-col gap-3 py-6 transition-colors ${
                    index !== mockPosts.length - 1
                      ? "border-b border-[#F0F0F0]"
                      : ""
                  }`}
                >
                  {/* 글 제목 */}
                  <h3 className="text-[16px] leading-[1.5] font-semibold text-[#111111] underline-offset-4 group-hover:underline md:text-[17px]">
                    {post.title}
                  </h3>

                  {/* 글 설명 (최대 2줄 말줄임) */}
                  <p className="line-clamp-2 text-[14px] leading-[1.7] font-normal text-[#666666] md:text-[15px]">
                    {post.description}
                  </p>

                  {/* 메타 정보 */}
                  <div className="flex items-center gap-2 text-[12px] font-medium text-[#999999] md:text-[13px]">
                    <span>{post.updatedAt}</span>
                    <span className="text-[#D6D6D6]">·</span>
                    <span>{post.characterCount.toLocaleString("ko-KR")}자</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
