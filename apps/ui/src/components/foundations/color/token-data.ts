export type TokenGroup = "surface" | "content" | "action" | "status";

type SwatchKind = "fill" | "text";

export type SemanticToken = {
  cssVar: string;
  group: TokenGroup;
  kind: SwatchKind;
  label: string;
  token: string;
  usage: string;
};

export type ContrastPair = {
  backgroundCssVar: string;
  foregroundCssVar: string;
  label: string;
  role: string;
  usage: string;
};

export const tokenGroups: {
  description: string;
  id: TokenGroup;
  title: string;
}[] = [
  {
    id: "surface",
    title: "Surface",
    description: "Canvas, 콘텐츠 Surface와 floating layer",
  },
  {
    id: "content",
    title: "Content",
    description: "본문, metadata, 구조 경계와 focus",
  },
  {
    id: "action",
    title: "Action",
    description: "Primary, Secondary, selected와 hover 상태",
  },
  {
    id: "status",
    title: "Status",
    description: "오류, 성공, 주의, 정보와 provenance 상태",
  },
];

export const semanticTokens: SemanticToken[] = [
  {
    token: "background",
    cssVar: "--background",
    label: "Background",
    group: "surface",
    kind: "fill",
    usage: "앱 Canvas",
  },
  {
    token: "card",
    cssVar: "--card",
    label: "Card",
    group: "surface",
    kind: "fill",
    usage: "독립 콘텐츠 Surface",
  },
  {
    token: "popover",
    cssVar: "--popover",
    label: "Popover",
    group: "surface",
    kind: "fill",
    usage: "menu, popover와 dialog",
  },
  {
    token: "surface",
    cssVar: "--surface",
    label: "Surface",
    group: "surface",
    kind: "fill",
    usage: "낮은 강조의 구조 Surface",
  },
  {
    token: "foreground",
    cssVar: "--foreground",
    label: "Foreground",
    group: "content",
    kind: "text",
    usage: "기본 text",
  },
  {
    token: "muted-foreground",
    cssVar: "--muted-foreground",
    label: "Muted Foreground",
    group: "content",
    kind: "text",
    usage: "metadata와 보조 text",
  },
  {
    token: "border",
    cssVar: "--border",
    label: "Border",
    group: "content",
    kind: "fill",
    usage: "구조 경계",
  },
  {
    token: "input",
    cssVar: "--input",
    label: "Input",
    group: "content",
    kind: "fill",
    usage: "입력 경계와 낮은 입력 Surface",
  },
  {
    token: "ring",
    cssVar: "--ring",
    label: "Ring",
    group: "content",
    kind: "fill",
    usage: "focus indicator",
  },
  {
    token: "primary",
    cssVar: "--primary",
    label: "Primary",
    group: "action",
    kind: "fill",
    usage: "대표 행동",
  },
  {
    token: "primary-foreground",
    cssVar: "--primary-foreground",
    label: "Primary Foreground",
    group: "action",
    kind: "text",
    usage: "Primary 행동의 text",
  },
  {
    token: "secondary",
    cssVar: "--secondary",
    label: "Secondary",
    group: "action",
    kind: "fill",
    usage: "보조 행동과 Surface",
  },
  {
    token: "secondary-foreground",
    cssVar: "--secondary-foreground",
    label: "Secondary Foreground",
    group: "action",
    kind: "text",
    usage: "Secondary 행동의 text",
  },
  {
    token: "accent",
    cssVar: "--accent",
    label: "Accent",
    group: "action",
    kind: "fill",
    usage: "selected와 hover 상태",
  },
  {
    token: "accent-foreground",
    cssVar: "--accent-foreground",
    label: "Accent Foreground",
    group: "action",
    kind: "text",
    usage: "Accent 상태의 text",
  },
  {
    token: "selection",
    cssVar: "--selection",
    label: "Selection",
    group: "action",
    kind: "fill",
    usage: "text selection과 선택 상태",
  },
  {
    token: "destructive",
    cssVar: "--destructive",
    label: "Destructive",
    group: "status",
    kind: "text",
    usage: "실제 위험과 오류",
  },
  {
    token: "success",
    cssVar: "--success",
    label: "Success",
    group: "status",
    kind: "text",
    usage: "성공과 완료",
  },
  {
    token: "warning",
    cssVar: "--warning",
    label: "Warning",
    group: "status",
    kind: "text",
    usage: "주의와 확인 필요",
  },
  {
    token: "info",
    cssVar: "--info",
    label: "Info",
    group: "status",
    kind: "text",
    usage: "중립 정보",
  },
  {
    token: "purple",
    cssVar: "--purple",
    label: "Purple",
    group: "status",
    kind: "text",
    usage: "정의된 provenance 상태",
  },
];

export const contrastPairs: ContrastPair[] = [
  {
    role: "card",
    label: "Card",
    backgroundCssVar: "--card",
    foregroundCssVar: "--card-foreground",
    usage: "독립 콘텐츠 Surface",
  },
  {
    role: "popover",
    label: "Popover",
    backgroundCssVar: "--popover",
    foregroundCssVar: "--popover-foreground",
    usage: "floating layer",
  },
  {
    role: "primary",
    label: "Primary action",
    backgroundCssVar: "--primary",
    foregroundCssVar: "--primary-foreground",
    usage: "대표 행동",
  },
  {
    role: "secondary",
    label: "Secondary action",
    backgroundCssVar: "--secondary",
    foregroundCssVar: "--secondary-foreground",
    usage: "보조 행동",
  },
  {
    role: "accent",
    label: "Accent state",
    backgroundCssVar: "--accent",
    foregroundCssVar: "--accent-foreground",
    usage: "selected와 hover 상태",
  },
  {
    role: "selection",
    label: "Selection",
    backgroundCssVar: "--selection",
    foregroundCssVar: "--selection-foreground",
    usage: "text selection과 선택 상태",
  },
];

export const colorRules = [
  "따뜻한 paper와 ink 뉴트럴을 기본으로 사용한다.",
  "한 작업 영역은 Primary 행동 하나만 강하게 표시한다.",
  "상태는 색상 외에 text, icon, shape와 semantic 중 하나 이상을 함께 사용한다.",
  "Border는 관계를 설명할 때만 사용한다.",
  "Raw color는 reference token 밖에 추가하지 않는다.",
] as const;

export function tokensByGroup(group: TokenGroup): SemanticToken[] {
  return semanticTokens.filter((token) => token.group === group);
}
