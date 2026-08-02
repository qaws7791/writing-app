export type TokenGroup = "background" | "foreground" | "action" | "status"

export type SwatchKind = "fill" | "text"

export type SemanticToken = {
  cssVar: string
  group: TokenGroup
  kind: SwatchKind
  label: string
  token: string
  usage: string
}

export type ContrastPair = {
  backgroundCssVar: string
  foregroundCssVar: string
  label: string
  role: string
  usage: string
}

export const tokenGroups: {
  description: string
  id: TokenGroup
  title: string
}[] = [
  {
    id: "background",
    title: "Background",
    description: "앱 배경, 카드, 패널, 입력 표면",
  },
  {
    id: "foreground",
    title: "Foreground",
    description: "본문, 보조, placeholder 텍스트",
  },
  {
    id: "action",
    title: "Action",
    description: "주요 행동과 선택 상태",
  },
  {
    id: "status",
    title: "Status",
    description: "성공, 위험, 정보 상태",
  },
]

export const semanticTokens: SemanticToken[] = [
  {
    token: "bg-canvas",
    cssVar: "--bg-canvas",
    label: "Canvas",
    group: "background",
    kind: "fill",
    usage: "공통 앱 배경",
  },
  {
    token: "bg-surface",
    cssVar: "--bg-surface",
    label: "Surface",
    group: "background",
    kind: "fill",
    usage: "카드, 패널, 칩",
  },
  {
    token: "bg-surface-hover",
    cssVar: "--surface-hover",
    label: "Surface Hover",
    group: "background",
    kind: "fill",
    usage: "hover, 낮은 selected",
  },
  {
    token: "bg-elevated",
    cssVar: "--bg-elevated",
    label: "Elevated",
    group: "background",
    kind: "fill",
    usage: "input, popover 같은 높은 표면",
  },
  {
    token: "fg-default",
    cssVar: "--fg-default",
    label: "Default",
    group: "foreground",
    kind: "text",
    usage: "기본 텍스트",
  },
  {
    token: "fg-muted",
    cssVar: "--fg-muted",
    label: "Muted",
    group: "foreground",
    kind: "text",
    usage: "보조 텍스트",
  },
  {
    token: "fg-subtle",
    cssVar: "--fg-subtle",
    label: "Subtle",
    group: "foreground",
    kind: "text",
    usage: "placeholder, 낮은 metadata",
  },
  {
    token: "action-primary-bg",
    cssVar: "--action-primary-bg",
    label: "Primary BG",
    group: "action",
    kind: "fill",
    usage: "주요 행동 배경",
  },
  {
    token: "action-primary-fg",
    cssVar: "--action-primary-fg",
    label: "Primary FG",
    group: "action",
    kind: "text",
    usage: "주요 행동 텍스트",
  },
  {
    token: "action-selected-bg",
    cssVar: "--action-selected-bg",
    label: "Selected BG",
    group: "action",
    kind: "fill",
    usage: "선택, 강조 fill",
  },
  {
    token: "action-selected-fg",
    cssVar: "--action-selected-fg",
    label: "Selected FG",
    group: "action",
    kind: "text",
    usage: "선택, 강조 위 텍스트",
  },
  {
    token: "success-bg",
    cssVar: "--success-bg",
    label: "Success BG",
    group: "status",
    kind: "fill",
    usage: "성공 fill",
  },
  {
    token: "success-fg",
    cssVar: "--success-fg",
    label: "Success FG",
    group: "status",
    kind: "text",
    usage: "성공 텍스트",
  },
  {
    token: "danger-bg",
    cssVar: "--danger-bg",
    label: "Danger BG",
    group: "status",
    kind: "fill",
    usage: "위험 fill",
  },
  {
    token: "danger-fg",
    cssVar: "--danger-fg",
    label: "Danger FG",
    group: "status",
    kind: "text",
    usage: "위험 텍스트",
  },
  {
    token: "info-bg",
    cssVar: "--info-bg",
    label: "Info BG",
    group: "status",
    kind: "fill",
    usage: "정보 fill",
  },
  {
    token: "info-fg",
    cssVar: "--info-fg",
    label: "Info FG",
    group: "status",
    kind: "text",
    usage: "정보 텍스트",
  },
]

export const contrastPairs: ContrastPair[] = [
  {
    role: "action-primary",
    label: "Primary action",
    backgroundCssVar: "--action-primary-bg",
    foregroundCssVar: "--action-primary-fg",
    usage: "주요 CTA 버튼",
  },
  {
    role: "action-selected",
    label: "Selected",
    backgroundCssVar: "--action-selected-bg",
    foregroundCssVar: "--action-selected-fg",
    usage: "선택된 옵션, 강조 상태",
  },
  {
    role: "success",
    label: "Success",
    backgroundCssVar: "--success-bg",
    foregroundCssVar: "--success-fg",
    usage: "정답, 완료 피드백",
  },
  {
    role: "danger",
    label: "Danger",
    backgroundCssVar: "--danger-bg",
    foregroundCssVar: "--danger-fg",
    usage: "오답, 위험 행동",
  },
  {
    role: "info",
    label: "Info",
    backgroundCssVar: "--info-bg",
    foregroundCssVar: "--info-fg",
    usage: "안내, 정보 메시지",
  },
]

export const colorRules = [
  "밝은 노랑, 민트, 코랄은 fill로 쓰고 텍스트는 대응 fg 토큰을 사용한다.",
  "선택 상태는 action-selected-*, 주요 행동은 action-primary-*로 분리한다.",
  "신규 색상은 임의 hex보다 semantic token 조합으로 해결한다.",
  "UI source의 raw hex는 reference 또는 semantic token 정의에만 둔다.",
  "legacy fill 색상을 텍스트로 쓰는 패턴은 새 코드에 추가하지 않는다.",
] as const

export function tokensByGroup(group: TokenGroup): SemanticToken[] {
  return semanticTokens.filter((token) => token.group === group)
}
