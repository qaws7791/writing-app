# Luma Quality Gates

새 컴포넌트와 큰 변경의 최종 검수 단계에서 `DESIGN.md` 및 해당 분야별 계약과 함께 사용한다. 모든 항목을 기계적으로 적용하지 말고 변경된 기능이 가진 상태와 위험 경계를 빠짐없이 선택한다.

## 1. Accessibility Baseline

최소 목표는 WCAG 2.2 AA다. 접근성은 별도 theme가 아니라 기본 디자인의 제약 조건이다.

- 일반 텍스트 대비 4.5:1 이상
- 큰 텍스트와 비텍스트 상태 표시 대비 3:1 이상
- pointer target 최소 24×24 CSS px 또는 동등한 간격 확보
- 일반 주요 control은 가능한 40×40px 이상의 편안한 target 제공
- 320px 너비와 200% 확대에서 정보와 기능 손실 없이 reflow
- 색만으로 의미 전달 금지
- 아이콘 전용 control에 접근 가능한 이름 제공
- label, description과 error를 프로그램적으로 연결
- 동적 상태 메시지를 live region 또는 적절한 기본 semantic으로 전달
- drag 동작에 동등한 click과 keyboard 대안 제공

사용자 preference도 검증한다.

- `prefers-color-scheme`: light와 dark 모두 완성된 theme 제공
- `prefers-reduced-motion`: 비필수 이동과 반복 animation 축소
- `prefers-contrast: more`: 경계, 텍스트와 focus 대비 강화
- `forced-colors: active`: 그림자와 배경 이미지 없이도 상태가 읽히게 조정
- `prefers-reduced-transparency`: 지원 환경에서 blur와 투명도 축소

`prefers-reduced-transparency`는 지원 범위가 제한되므로 불투명 fallback을 먼저 구현한다.

## 2. Test Matrices

### Visual

- Light / Dark
- Compact / Default / Comfortable
- Mobile / Tablet / Desktop
- Short / Long content
- Empty / Loading / Error / Populated
- Default / Hover / Active / Focus / Disabled / Invalid

### Accessibility

- Keyboard only
- Screen reader semantic inspection
- 200% zoom
- Reduced motion
- Increased contrast
- Forced colors
- Transparency unavailable or reduced

### Product state

기능이 가진 경우 다음 경계를 검증한다.

- Fresh session / Restored session / Shared URL
- Browser back / Forward / Refresh
- No access / Read only / Edit / Admin
- Draft / Review / Applied / Published / Rolled back
- Sandbox / Test / Preview / Live
- Human / AI / External source / Missing source
- Complete / Incomplete / Cancelled / Failed
- Empty / Pending / Partial / Stale / Offline
- Optimistic / Confirmed / Rolled back

## 3. Performance & Recovery

성능은 구현 세부사항이 아니라 interface 품질이다.

- Input, pointer와 scroll response를 비필수 animation이나 background work가 막지 않게 한다.
- 초기 구조를 가능한 한 즉시 보여주고 loading 전환으로 layout이 불필요하게 흔들리지 않게 한다.
- 장식 목적의 blur, shadow, observer와 animation이 rendering cost를 정당화하는지 확인한다.
- Skeleton과 spinner를 습관적으로 사용하지 않는다. 실제 구조, determinate progress 또는 기존 content 유지가 더 적절한지 검토한다.
- 긴 작업은 progress와 현재 phase를 제공하고 가능한 경우 cancel, retry, resume 또는 background completion을 지원한다.
- 저사양 device, 절전 환경과 느린 network에서도 핵심 정보와 행동을 유지한다.
- 변경 위험에 비례해 interaction latency, layout shift, bundle과 rendering cost를 측정하고 회귀를 기록한다.

실패와 복구도 전체 flow의 일부로 검증한다.

- Validation, network, permission과 server error 뒤에도 입력, selection과 작업 문맥을 가능한 한 보존한다.
- Offline, stale data, partial failure와 sync conflict를 일반 error와 구분한다.
- Optimistic update는 피해가 제한되고 실패 시 정확히 rollback할 수 있을 때만 사용한다.
- 취소 가능한 작업은 중단 뒤 일관된 state로 돌아가며 retry가 중복 side effect를 만들지 않게 한다.
- 되돌릴 수 있는 변경은 Undo, rollback 또는 history 중 위험도와 시간 범위에 맞는 recovery를 제공한다.

## 4. Stress Tests

1. **Environment** — browser, viewport, input mode와 OS에서 자연스럽게 작동하는가.
2. **Appearance** — light/dark, 실제 이미지, 긴 콘텐츠와 사용자 theme에서 계층이 유지되는가.
3. **Hierarchy** — 모든 상태와 option이 추가되어도 핵심 작업이 먼저 보이는가.
4. **Composition** — 다른 컴포넌트와 결합했을 때 간격, 반경, 표면과 motion이 충돌하지 않는가.
5. **Performance feel** — 초기 구조가 즉시 보이고 interaction이 지연, layout shift 또는 flicker를 만들지 않는가.
6. **Persistence** — 새로고침, history navigation과 링크 공유 후에도 작업 문맥을 복원하는가.
7. **Trust** — 생성 주체, source, 불확실성, 권한과 실행 환경을 구분할 수 있는가.
8. **Reversibility** — 적용 전 review와 적용 후 Undo, rollback 또는 history 중 적절한 경로가 있는가.
9. **Data realism** — 실제 길이, 관계, 누락, 권한과 locale을 가진 fixture에서도 API와 layout이 유지되는가.

## 5. Acceptance Questions

- 효과 하나를 제거해도 구조가 유지되는가.
- 색을 제거해도 상태와 위계가 읽히는가.
- 카드와 구분선을 줄여도 그룹이 이해되는가.
- 키보드만으로 같은 작업을 완료할 수 있는가.
- 실제 데이터가 sample보다 길고 복잡해도 견디는가.
- Offline, stale, partial, permission-denied와 optimistic failure에서 작업 문맥을 보존하고 복구할 수 있는가.
- 입력, scroll과 반복 interaction이 즉시 반응하고 effect가 이를 방해하지 않는가.
- 공유 URL과 새로고침이 같은 view를 복원하는가.
- AI 또는 외부 콘텐츠의 source와 확인 범위를 알아볼 수 있는가.
- 위험한 행동의 대상, 환경, 영향과 회복 방법을 실행 전에 이해할 수 있는가.
- preview가 실제 배포 API와 현실적인 fixture를 사용하는가.
- 이 컴포넌트가 기본 Shadcn과 구별되는 이유를 token 교체 외의 언어로 설명할 수 있는가.

## 6. Verification Handoff

검수 결과에는 수행한 matrix와 제외한 matrix를 구분한다. 테스트하지 않은 상태를 통과한 것으로 표현하지 않는다. 실패가 있다면 재현 조건, 영향받는 상태와 다음 수정 지점을 함께 기록한다.
