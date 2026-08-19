# 접근성 기준

이 문서는 WCAG 2.2 AA 기준, 색 대비, 키보드 탐색, 상태 노출의 현재 기준이다.

## 목표 기준

- 신규 UI는 WCAG 2.2 AA를 목표로 한다.
- 일반 텍스트 대비는 최소 4.5:1을 목표로 한다.
- 18pt 이상 또는 14pt bold 이상의 큰 텍스트 대비는 최소 3:1을 목표로 한다.
- 아이콘, focus indicator, 입력 border처럼 의미 있는 비텍스트 UI 대비는 최소 3:1을 목표로 한다.
- Pointer target은 최소 24×24 CSS px 또는 동등한 간격을 제공한다.
- 일반 주요 control은 가능한 40×40 CSS px 이상의 target을 제공한다.

## 색상 주의점

- `primary` 위에는 `primary-foreground`를 사용한다.
- `secondary` 위에는 `secondary-foreground`를 사용한다.
- `accent` 위에는 `accent-foreground`를 사용한다.
- `muted-foreground`는 긴 본문보다 보조 정보에 사용한다.
- 성공, 경고, 오류와 정보는 색상만으로 구분하지 않는다.
- 병렬 항목 정체는 `series-*` 색과 점·라벨을 함께 사용한다.
- 위험 버튼은 `destructive` semantic token과 `Button variant="destructive"`를 사용한다.

색 조합을 새로 만들 때는 구현 전 대비를 확인한다.

## 키보드 탐색

- 모든 클릭 가능한 요소는 `button`, `a`, form control 같은 native interactive element로 구현한다.
- 탐색 목적 UI는 `Link`를 사용한다.
- 현재 페이지 링크는 `aria-current="page"`를 제공한다.
- toggle 성격 버튼은 `aria-pressed`를 제공한다.
- dialog는 닫기/취소/확인 동작을 키보드로 수행할 수 있어야 한다.
- focus indicator를 제거하지 않는다. 공통 UI는 `focus-visible:ring-3`을 사용한다.
- 가로 캐러셀은 이전·다음 버튼과 슬라이드 안 `Link`로 키보드 탐색을 제공한다. 포인터 드래그만으로 탐색이 끝나지 않게 한다. 캐러셀 영역 `aria-roledescription`은 `캐러셀`, 슬라이드는 `슬라이드`다.
- 화면 밖에 있는 캐러셀 슬라이드는 Tab 순서에 넣지 않는다.
- 캐러셀 위치는 현재/전체 개수 텍스트로 전달하고 `progressbar`를 쓰지 않는다.

## 레슨 접근성

- 레슨 진행 헤더의 진행률은 `role="progressbar"`와 `aria-valuemin`, `aria-valuemax`, `aria-valuenow`를 제공한다.
- 레슨 진행 화면의 현재 스텝 제목은 `h1`이다.
- 레슨 행동 영역은 `aria-label="레슨 행동"`을 사용한다.
- 레슨 하단 CTA는 모바일 safe area inset을 반영한다.
- `READING`·`COMPARE`에서 본문이 넘치면 끝까지 내리기 전에는 `이해했어요`를 비활성으로 두고, 이유는 숨긴 텍스트로 전달한다.
- 나가기 버튼은 `aria-label="나가기"`를 제공한다.
- 순서 스텝의 항목 재정렬은 포인터 드래그에만 의존하지 않는다.
- 키보드 사용자는 드래그 핸들에서 Space 또는 Enter로 항목을 들고 방향키로 이동한 뒤 Space 또는 Enter로 놓을 수 있어야 한다.
- 순서 변경 안내는 한국어 `status` 메시지로 현재 항목과 위치를 전달한다.
- 분류 스텝의 바구니 배치는 포인터 드래그에만 의존하지 않는다.
- 키보드 사용자는 항목을 선택한 뒤 바구니 이름을 활성화해 담을 수 있어야 한다.
- 분류 배치 안내는 한국어 `status` 메시지로 항목과 바구니를 전달한다.
- 답안 확인 실패와 완료 실패는 화면에 보이는 한국어 오류로 제공한다.

## 쓰기 접근성

- 본문에는 보이는 한국어 label을 제공한다.
- 작성 세션 본문 캔버스는 `role="textbox"`와 `aria-multiline="true"`를 제공한다. 접근 이름은 `sr-only` 「본문」이다. Tab은 본문에서 열린 패널이 있으면 패널로, 없으면 다음 chrome으로 나간다.
- 고칠 일 형광펜은 `highlight-*` 배경만 쓴다. 밑줄·점선·테두리는 붙이지 않는다. 열린 팝오버의 문장은 같은 색의 더 진한 배경으로 표시한다. 포인터는 마크를 눌러 비모달 팝오버를 연다. 팝오버는 열릴 때 본문 포커스를 빼지 않는다. 키보드 사용자는 개요 패널의 고칠 일 항목으로 같은 팝오버에 도달한다. Escape는 열린 팝오버를 먼저 닫는다.
- 점검 성공으로 본문에 고칠 일을 표시한 사실은 `role="status"`로 전달한다.
- 작성 세션의 본문 캔버스는 입력 중에도 control용 `ring-3`을 쓰지 않는다. 포커스는 캐럿으로 전달한다. 플로팅 chrome control은 공통 `focus-visible:ring-3`을 유지한다.
- 레슨은 저장과 동기화 상태를 live region으로 전달하지 않는다.
- 학습자가 실행한 행동이 실패하면 작성한 내용과 다음 행동을 `role="alert"`로 전달한다.
- 모바일 소프트 키보드는 본문과 주요 행동을 가리지 않아야 한다. 열린 참조 패널은 키보드가 열리면 한 줄로 접힌다.
- 모바일 Drawer가 열려 있으면 방향키와 Home·End로 `간단히`·`나누기`·`읽기` 스냅을 고른다. `간단히`에서 아래 방향키는 패널을 닫는다. 포인터 스와이프만으로 높이·닫기를 바꾸게 두지 않는다.
- 320px 화면과 텍스트 200% 확대에서 작성과 점검을 완료할 수 있어야 한다.

## 어드민 접근성

- 사이드바 nav는 `aria-label="어드민 주요 메뉴"`를 사용한다.
- 테이블은 `th scope="col"`을 사용한다.
- 오류는 `role="alert"`를 사용한다.
- 처리 완료, 저장 완료 같은 상태는 `role="status"`를 사용한다.
- 확인 dialog는 `AlertDialog`를 사용하고 `role="alertdialog"` 의미와 제목/설명 관계를 제공한다.
- 위험 작업 버튼은 색상만으로 의미를 전달하지 않고 `보관하기`, `삭제 처리`, `초기화 실행`처럼 명확한 텍스트를 사용한다.

## Form 접근성

- 입력에는 보이는 label 또는 `aria-label`이 필요하다.
- placeholder는 label을 대체하지 않는다.
- invalid 상태는 `aria-invalid="true"`로 표시한다.
- 오류 메시지는 해당 control 가까이에 둔다.
- 비활성 버튼은 실제 `disabled` 속성을 사용한다.

## Motion 접근성

- Button press와 짧은 상태 전환만 기본 motion으로 사용한다.
- 학습 흐름과 공개 랜딩의 핵심 정보는 motion에만 의존하지 않는다.
- 캐러셀 스크롤은 `prefers-reduced-motion`에서 즉시 이동한다.
- 새 장시간 반복 애니메이션을 추가할 때는 `prefers-reduced-motion` 대응을 함께 추가한다.

## 사용자 설정 접근성

- `prefers-contrast: more`에서 border, text와 focus indicator 대비를 강화한다.
- `forced-colors: active`에서 shadow와 배경 이미지 없이 상태를 읽을 수 있어야 한다.
- `prefers-reduced-transparency`에서 blur와 반투명 Surface를 제거한다.
- 투명 Surface는 지원 여부와 관계없이 불투명 fallback을 제공한다.

## 언어와 문구

- 사용자 노출 문구, 접근성 텍스트, 오류 메시지는 한국어로 작성한다.
- 외부 계약의 enum, status, code는 영어 식별자를 유지할 수 있지만, 화면 설명은 한국어로 보완한다.
