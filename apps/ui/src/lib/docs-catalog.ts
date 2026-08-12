import { blockSections } from "@/src/lib/block-docs";
import { componentDocs } from "@/src/lib/component-docs";
import { getComponentGuide } from "@/src/lib/component-guides";

export type DocSearchRecord = {
  title: string;
  href: string;
  description: string;
  category: string;
  searchText?: string;
};

export type DocNavSection = {
  title: string;
  items: DocSearchRecord[];
};

const staticSections: DocNavSection[] = [
  {
    title: "시작하기",
    items: [
      {
        title: "Luma UI 시작하기",
        href: "/docs/getting-started",
        description: "디자인 시스템의 범위, 문서 사용법, 기여 규칙을 설명합니다.",
        category: "시작하기",
        searchText: "welcome theme motion viewport contribution",
      },
    ],
  },
  {
    title: "파운데이션",
    items: [
      {
        title: "Color",
        href: "/docs/foundations/color",
        description: "semantic color token, 실제 색상값, 대비 조합을 확인합니다.",
        category: "파운데이션",
        searchText: "색상 token contrast WCAG light dark",
      },
      {
        title: "Typography",
        href: "/docs/foundations/typography",
        description: "한국어 본문과 제목의 type scale을 확인합니다.",
        category: "파운데이션",
        searchText: "글꼴 font Pretendard scale long content",
      },
      {
        title: "Spacing",
        href: "/docs/foundations/spacing",
        description: "레이아웃과 컴포넌트에 사용하는 spacing scale을 확인합니다.",
        category: "파운데이션",
        searchText: "간격 4 6 8 12 16 20 24 32 40 48 64",
      },
      {
        title: "Motion",
        href: "/docs/foundations/motion",
        description: "full motion과 reduced motion의 동작 계약을 비교합니다.",
        category: "파운데이션",
        searchText: "animation transition reduced motion 320ms",
      },
    ],
  },
];

const componentItems = componentDocs.map((component) => {
  const guide = getComponentGuide(component.slug, component.title);

  return {
    title: component.title,
    href: `/docs/components/${component.slug}`,
    description: component.description,
    category: component.category,
    searchText: [
      component.slug,
      guide.summary,
      ...guide.examples.flatMap((example) => [example.title, example.description]),
      ...guide.usageNotes,
      ...guide.accessibility,
    ].join(" "),
  };
});

const extensionItems: DocSearchRecord[] = [
  {
    title: "Theme Selector",
    href: "/docs/extensions/theme-selector",
    description: "제품 앱의 light, dark, system 테마 선택기를 설명합니다.",
    category: "프로젝트 확장",
    searchText: "activeTheme disabled onThemeChange",
  },
  ...[
    ["categorize-answer", "Categorize Answer", "항목을 카테고리로 분류하는 답안"],
    ["compare-step-view", "Compare Step View", "여러 글 버전을 비교하는 읽기 뷰"],
    ["fill-blank-answer", "Fill Blank Answer", "문장 빈칸에 단어를 배치하는 답안"],
    ["match-answer", "Match Answer", "두 선택지 집합을 연결하는 답안"],
    ["multiple-choice-answer", "Multiple Choice Answer", "하나의 정답을 고르는 답안"],
    ["order-answer", "Order Answer", "문장 조각의 순서를 정하는 답안"],
    ["reading-step-view", "Reading Step View", "마크다운 학습 본문과 출처"],
    ["select-answer", "Select Answer", "문장 안 텍스트 구간을 고르는 답안"],
  ].map(([slug, title, description]) => ({
    title,
    href: `/docs/extensions/lesson/${slug}`,
    description,
    category: "Lesson 확장",
    searchText: `${slug} checked playground`,
  })),
];

const compositionSections: DocNavSection[] = [
  {
    title: "패턴",
    items: [
      {
        title: "Admin",
        href: "/docs/patterns/admin",
        description: "운영 지표, 필터, 표와 빈 결과를 조합한 관리자 패턴입니다.",
        category: "패턴",
      },
    ],
  },
  {
    title: "레시피",
    items: [
      {
        title: "Course Management",
        href: "/docs/recipes/course-management",
        description: "코스 카드와 반응형 관리 폼 조합을 설명합니다.",
        category: "레시피",
      },
    ],
  },
  {
    title: "품질",
    items: [
      {
        title: "Content Contracts",
        href: "/docs/quality/content",
        description: "명확하고 관찰 가능한 UI 문구의 작성 기준입니다.",
        category: "품질",
      },
      {
        title: "Accessibility Checklist",
        href: "/docs/quality/accessibility",
        description: "자동 검사와 수동 키보드 검사의 완료 기준입니다.",
        category: "품질",
      },
      {
        title: "Migration Coverage",
        href: "/docs/quality/migration-coverage",
        description: "이전된 154개 실행 예제와 2개 문서의 목적지를 공개합니다.",
        category: "품질",
      },
    ],
  },
];

const blockItems = blockSections.flatMap((section) =>
  section.blocks.map((block) => ({
    title: block.title,
    href: `/docs/blocks#${block.slug}`,
    description: block.description,
    category: `블록 · ${section.title}`,
    searchText: block.slug,
  })),
);

export const docsNavigation: DocNavSection[] = [
  ...staticSections,
  { title: "컴포넌트", items: componentItems },
  { title: "프로젝트 확장", items: extensionItems },
  ...compositionSections,
];

export const docsSearchRecords = [
  ...docsNavigation.flatMap((section) => section.items),
  ...blockItems,
];

export function withBase(baseUrl: string, href: string) {
  return `${baseUrl}${href.replace(/^\//, "")}`;
}
