"use client"

import WritingDetailView from "@/views/writing-detail-view"

const MOCK_WRITING = {
  id: "1",
  title: "계절의 틈에서",
  date: "2024년 6월 12일 수요일",
  author: "김지원",
  prompt: {
    id: "1",
    title: "사유의 궤적: 여백의 미학",
  },
  paragraphs: [
    {
      type: "paragraph" as const,
      content:
        "창문을 열면 쏟아지는 공기 속에 계절이 바뀌는 냄새가 섞여 있다. 여름의 끝자락이 가을의 시작을 밀어내지 못하고 머뭇거리는 그 찰나의 순간, 나는 매번 설명할 수 없는 쓸쓸함과 안도감을 동시에 느낀다.",
    },
    {
      type: "paragraph" as const,
      content:
        "우리는 늘 무언가를 지나쳐 온다. 어제의 결심, 지난달의 약속, 그리고 지금 이 순간마저도 곧 과거라는 이름의 상자 속에 담길 것이다. 김훈 작가는 어떤 글에서 삶을 '바람 부는 날의 빨래'에 비유하기도 했지만, 내게 삶은 오히려 그 빨래가 마르는 동안 느껴지는 햇살의 온도에 더 가깝다.",
    },
    {
      type: "quote" as const,
      content:
        "가장 아름다운 것은 늘 틈 사이에 존재한다. 고요와 소음 사이, 머무름과 떠남 사이, 그리고 너와 나의 그리움 사이.",
    },
    {
      type: "paragraph" as const,
      content:
        "오후 네 시의 그림자가 길게 늘어질 때, 나는 차 한 잔을 마시며 문장을 고른다. 단어 하나를 고르는 일은 어쩌면 내 마음의 빈 공간을 채우는 일과도 같다. 완벽하지 않아도 좋다. 그저 이 계절의 틈에서 내가 느꼈던 작은 진동을 누군가에게 전할 수 있다면 그것으로 충분하다.",
    },
    {
      type: "paragraph" as const,
      content:
        "나무들이 잎을 떨굴 준비를 하듯, 우리도 가끔은 무거운 생각들을 내려놓아야 한다. 비워진 자리에는 새로운 계절의 공기가 차오를 것이다. 그것이 우리가 다음 계절을 맞이할 수 있는 유일한 방법이다.",
    },
    {
      type: "paragraph" as const,
      content:
        "오늘도 나는 기록한다. 사라지는 것들에 대한 예우이자, 다가올 것들에 대한 환대다. 계절의 틈은 좁지만, 그 안에 담긴 깊이는 결코 얕지 않다.",
    },
  ],
}

export default function WritingDetailClientPage({
  writingId,
}: {
  writingId: string
}) {
  return <WritingDetailView data={{ ...MOCK_WRITING, id: writingId }} />
}
