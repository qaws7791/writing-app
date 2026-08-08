import { adminGuides } from "./admin";
import { displayFeedbackGuides } from "./display-feedback";
import { formGuides } from "./forms";
import { learningExtendedGuides } from "./learning-extended";
import { learningGuides } from "./learning";
import { overlayNavigationGuides } from "./overlay-navigation";
import type { ComponentGuide, ComponentGuideMap, GuideExample } from "./types";

export const componentGuides: ComponentGuideMap = {
  ...formGuides,
  ...overlayNavigationGuides,
  ...displayFeedbackGuides,
  ...learningGuides,
  ...learningExtendedGuides,
  ...adminGuides,
};

const fallbackExamples: GuideExample[] = [
  {
    id: "basic",
    title: "기본",
    description: "가장 작은 구성으로 컴포넌트의 기본 형태와 동작을 확인합니다.",
    preview: "default",
    code: "// 이 컴포넌트의 기본 구성은 위 사용법 예제를 참고하세요.",
  },
  {
    id: "states",
    title: "상태",
    description: "비활성화, 선택, 열림처럼 사용자에게 전달해야 하는 상태를 명시적으로 관리합니다.",
    code: "// 상태 prop은 현재 컴포넌트의 Props 표를 참고하세요.",
  },
  {
    id: "composition",
    title: "컴포넌트 조합",
    description: "레이블, 설명, 작업 버튼 등 인접한 Luma 컴포넌트와 함께 구성합니다.",
    code: "// 실제 제품 흐름에서는 문맥을 제공하는 컴포넌트와 함께 배치하세요.",
  },
  {
    id: "responsive",
    title: "반응형 배치",
    description: "좁은 화면에서도 콘텐츠 순서와 조작 영역이 유지되도록 배치합니다.",
    code: "// 고정 너비보다 컨테이너에 맞는 max-width와 gap을 사용하세요.",
  },
];

export function getComponentGuide(slug: string, title: string): ComponentGuide {
  return (
    componentGuides[slug] ?? {
      slug,
      summary: `${title}의 기본 구성, 상태, 조합 방법을 실제 제품 문맥에서 살펴봅니다.`,
      examples: fallbackExamples,
      usageNotes: [
        "컴포넌트가 해결하는 한 가지 작업에 집중하고 불필요한 장식을 추가하지 마세요.",
        "시각적 상태와 실제 React 상태가 서로 다르게 보이지 않도록 함께 관리하세요.",
      ],
      accessibility: [
        "상호작용 요소에는 문맥만으로 추측하지 않아도 되는 접근 가능한 이름을 제공하세요.",
        "키보드 포커스와 disabled 상태가 시각적으로도 분명하게 드러나는지 확인하세요.",
      ],
    }
  );
}

export type { ComponentGuide, GuideExample, GuideProp } from "./types";
