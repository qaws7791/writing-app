# Luma Reference Principles

이 문서는 외부 제품이나 패턴을 조사하고 Luma에 번역할 때만 읽는다. 특정 제품의 외형을 복제하지 않으며 서비스 이름의 평면 목록이 아니라 해결하려는 문제에 따라 레퍼런스를 선택한다.

| Design problem                  | Primary references       | Principle to adopt                                                                                 |
| ------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| Material과 layer                | Apple Liquid Glass       | 콘텐츠층과 기능층 분리, 문맥 적응, 절제된 투명도와 불투명 fallback                                 |
| 조합 가능한 콘텐츠              | Notion                   | block 조합, 인접 관계에 따른 spacing rhythm, 점진적으로 드러나는 구조                              |
| 정보 밀도와 전문 작업대         | Linear, Figma UI3, Attio | 보조 UI를 후퇴시키는 위계, dock·resize·collapse 가능한 패널, 같은 데이터의 관계형 view             |
| Keyboard와 직접 조작            | Raycast                  | 키보드 우선, 발견 가능한 shortcut, 즉각적이고 일관된 고수준 패턴                                   |
| 미디어 큐레이션과 관계          | Cosmos, Are.na           | 미디어 중심 탐색, 출처 보존, engagement보다 사람이 만든 연결을 우선하는 구조                       |
| 제품 flow 연구                  | Mobbin                   | 단일 화면의 외형보다 실제 flow, 상태 전이와 검증된 관습을 비교하는 방식                            |
| 점진적 복잡도와 AI trust        | Dia, Granola, Perplexity | 강한 기본값, 사람과 AI의 역할 구분, source·검색 범위·불확실성 노출                                 |
| 적응형 구성과 읽기 상태         | Threads, Readwise Reader | 단순한 단일 열 기본값, 선택 가능한 다중 열, query 기반 view와 읽기 lifecycle                       |
| 에디토리얼 공간과 적응형 복잡도 | Craft                    | 오래 머무는 문서 표면, platform별 입력 차이, 필요할 때 드러나는 complexity                         |
| 시스템 운영과 접근성            | Adobe Spectrum           | token source, component anatomy, input mode와 accessibility를 구현 계약으로 연결                   |
| Novelty counter-reference       | Arc                      | 학습 비용, cohesion 실패와 되돌린 결정을 함께 연구                                                 |
| Component contract와 preview    | Vercel Geist, Airbnb     | when-to-use·behavior·content·accessibility 계약, code를 source of truth로 한 실제 데이터 preview   |
| 안전한 변경과 실행 환경         | Framer, Stripe           | branch와 review를 거친 적용, preview·test·live 분리, permission과 audit trail                      |
| 학습 동기와 habit loop          | Duolingo, Brilliant      | 연속성·목표·숙련·이정표·상대 위치의 행동 원리만 번역. 불꽃 스트릭, XP·젬, hearts, 리그 연극은 제외 |

## Evidence Contract

위 표는 연구 포트폴리오이며 그 자체가 구현 근거는 아니다. 실제로 reference를 적용할 때는 다음을 함께 기록한다.

- Source title과 URL, 마지막 확인 날짜, 관찰한 platform과 version
- 공식 문서의 검증된 원칙인지, product screen 관찰인지, 우리 팀의 inference인지
- 가져올 behavior·state·content 원리와 가져오지 않을 고유 외형
- 같은 원리가 다른 domain에서도 유효한지 보여주는 비교 근거
- 실패, 철회된 redesign과 counter-example이 주는 제한 조건
- Trend를 채택하는 이유, 검증할 metric과 다시 검토하거나 폐기할 조건

Landing page와 정적 screenshot보다 실제 flow, keyboard, touch, loading, error, settings와 accessibility state를 우선한다. 관찰과 추론을 공식 제품 주장처럼 쓰지 않는다.

## Applied Evidence: Component Example Disclosure

- **확인일:** 2026-08-04
- **문제:** 실제 프리뷰와 긴 예제 코드가 분리되어 관계가 약하고, 여러 예제를 연속해서 읽을 때 코드가 콘텐츠 흐름을 과도하게 차지했다.
- **Source:** [shadcn/ui Carousel](https://ui.shadcn.com/docs/components/radix/carousel), [HeroUI Button](https://heroui.com/docs/react/components/button)의 웹 React 문서.
- **관찰:** 두 문서는 프리뷰와 대응 코드를 한 프레임 안에서 연속된 층으로 보여 주며, `View Code` 또는 `Expand code` 행동으로 긴 코드를 점진적으로 공개한다. 이는 2026-08-04 웹 문서와 사용자가 제공한 화면을 기준으로 한 product screen 관찰이다.
- **가져올 원리:** 프리뷰 우선 위계, 프리뷰와 source의 인접성, 전체 코드 복사를 유지한 접힘 상태, 명시적인 펼침·접힘 상태와 keyboard 접근.
- **가져오지 않을 표현:** 해당 제품의 radius, 색상, syntax theme, 버튼 문구와 고유 아이콘 배치를 복제하지 않는다. Luma의 paper-and-ink 표면, squircle control과 한국어 행동 문구로 번역한다.
- **검증:** 데스크톱과 320px에서 프리뷰·코드 경계, 전체 코드 노출, 복사, focus 유지와 가로 overflow를 확인한다. 코드 탐색 시간이 줄지 않거나 첫 상호작용이 느려지면 기본 노출 행 수와 전환 구조를 재검토한다.

## Applied Evidence: Sliding Tabs Indicator

- **확인일:** 2026-08-04
- **문제:** 탭마다 선택 배경을 따로 토글하면 상태 변화가 단절되어 보이고, 폭이 다른 탭 사이의 공간 관계가 드러나지 않았다.
- **Source:** [coss.com UI Tabs](https://coss.com/ui/docs/components/tabs)와 [cosscom/coss Tabs source](https://github.com/cosscom/coss/blob/main/apps/ui/registry/default/ui/tabs.tsx)의 웹 React 구현.
- **관찰:** Base UI `Tabs.Indicator`가 활성 탭의 위치·크기 CSS 변수를 제공하고, 하나의 indicator가 `width`와 `translate`를 전환하며 가로·세로 및 underline 표현을 공유한다. List는 `data-[orientation]`으로 배치하고, default 트랙은 muted 위에 background indicator, underline은 얇은 활성 선을 쓴다. 이는 2026-08-04 웹 문서와 공개 source를 기준으로 한 구현 관찰이다.
- **가져올 원리:** Coss Tabs의 anatomy와 indicator 동작 전체를 기반으로 하고, 활성 항목을 따라 이동하는 단일 상태 레이어, orientation-native selector, reduced motion fallback을 유지한다.
- **가져오지 않을 표현:** Coss의 `underline` API 이름과 `bg-primary` underline은 복제하지 않는다. Luma는 공개 API를 `line`으로 유지하고, squircle·`shadow-xs`·180ms cubic motion·disabled opacity 45·`bg-foreground` line indicator로 번역한다.
- **검증:** 폭이 다른 label, 가로·세로 방향, default·line variant, keyboard 전환, resize, light·dark와 reduced motion에서 indicator 위치와 선택 semantic을 확인한다.

## Translation Workflow

레퍼런스를 사용할 때는 다음 순서로 기록한다.

1. 해결할 사용자 문제와 작업 문맥
2. 실제 제품이 가진 데이터, 권한과 플랫폼 제약
3. 가져올 행동, 상태와 콘텐츠 원리
4. 가져오지 않을 고유한 외형과 브랜드 표현
5. Luma token과 component contract로 번역한 규칙
6. 실제 fixture와 flow에서 확인할 검증 근거

이미 같은 문제를 충분히 설명하는 레퍼런스가 있다면 비슷한 서비스를 목록에 더하지 않는다. screenshot 형태보다 현재 제품의 행동과 문서화된 제약을 우선한다. 결과가 특정 제품의 모사처럼 보이면 Luma의 콘텐츠, token, 상태와 조합 원칙으로 다시 해석한다.
