# ADR-0037: 작성 세션 본문에 Lexical 캔버스를 도입한다

## 상태

채택됨

## 날짜

2026-08-14

## 맥락

작성 세션 본문은 Luma `ComposeEditor`가 native `<textarea>`를 감싼 표면이다. 긴 글에 문단 간격과 이후 작문 보조를 붙이기 어렵다. 제품은 본문을 일반 텍스트로 저장하고 리치 텍스트와 마크다운을 비범위로 둔다. 받아쓰기 스텝은 같은 `ComposeEditor`로 원문과 문자 단위 일치를 맞춘다.

## 결정

- 작성 세션 본문만 `@workspace/ui`의 `ComposeCanvas`로 교체한다. 엔진은 Lexical이다.
- 공개 props는 일반 텍스트 `value`와 `onChange(string)`이다. API, schema, autosave, 글자 수, 점검은 평문 `body`를 유지한다.
- 등록 노드는 `ParagraphNode`, `TextNode`, `LineBreakNode`, `MarkNode`다. `MarkNode`는 점검 하이라이트 오버레이다. 툴바와 서식 단축키는 두지 않는다.
- 문단 간격은 theme로 둔다. 평문 붙여넣기, 실행 취소, 점검 마크는 플러그인으로 붙인다.
- `ComposeEditor`는 받아쓰기와 짧은 쓰기 입력에 남긴다.
- Lexical 패키지는 `@workspace/ui`만 직접 의존한다. 버전은 해당 manifest와 lockfile이 소유한다.

## 고려한 대안

### 대안 1. textarea에 문단 간격과 보조 표시를 직접 붙인다

- 장점: 의존성이 늘지 않는다.
- 단점: 이후 작문 보조 기능을 같은 표면에 붙이기 어렵다.

### 대안 2. `ComposeEditor`를 Lexical로 교체한다

- 장점: 쓰기 입력이 한 컴포넌트다.
- 단점: 받아쓰기의 문자 단위 일치와 짧은 입력이 무거운 엔진에 묶인다.

### 대안 3. 본문을 Lexical JSON이나 HTML로 저장한다

- 장점: 서식과 마크를 나중에 영속할 수 있다.
- 단점: 제품 비범위와 점검·글자 수·keepalive 계약을 바꾼다.

## 선택 근거

평문 계약을 지키면서 긴 글 가독성만 올린다. 플러그인 슬롯을 두면 이후 기능은 저장 형식을 바꾸지 않고 추가할 수 있다. 받아쓰기는 기존 textarea를 유지한다.

## 결과

- 작성 세션과 writing-studio block은 `ComposeCanvas`를 사용한다.
- 부모 `value`가 에디터 평문과 다를 때만 editor state를 다시 심는다. 저장 성공은 본문을 덮어쓰지 않는다.

## 검증

```bash
bun run ci:static
bun run ci:tests
bun run build
```

## 관련 문서

- `docs/product/requirements/platform/req-lrn-11-purpose-writing.md`
- `docs/design/screens/SCR-009-learner-writing-studio.md`
- `docs/engineering/frontend-development.md`
