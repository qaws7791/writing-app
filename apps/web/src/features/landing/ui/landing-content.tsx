export const learningMethods = [
  {
    description:
      "핵심 개념을 짧은 레슨으로 익혀 무엇을 쓸지 먼저 선명하게 만듭니다.",
    title: "짧은 레슨",
  },
  {
    description:
      "읽고 넘기지 않고 문장과 문단을 직접 쓰며 표현을 내 것으로 만듭니다.",
    title: "직접 쓰기",
  },
  {
    description:
      "작성한 글에 대한 AI 코칭을 참고해 다음 문장을 더 분명하게 다듬습니다.",
    title: "AI 코칭",
  },
] as const

export const featuredCourse = {
  category: "입문자를 위한 코스",
  cover: null,
  description:
    "문장의 기본부터 한 문단을 완성하기까지, 매일 조금씩 쓰는 습관을 만듭니다.",
  title: "글쓰기 첫걸음 30일",
  visualKey: "basic-sentence-writing",
} as const

export const footerLinks = [
  { href: "/app/courses", label: "코스" },
  { href: "/app", label: "학습 시작" },
  { href: "/login", label: "로그인" },
] as const
