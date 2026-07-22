# Storybook

`@workspace/ui` 디자인 시스템을 독립적으로 확인하는 작업 공간이다.

## 명령

```bash
bun storybook
bun build-storybook
```

## 범위

- 기반: 편집용 토큰과 타이포그래피
- 컴포넌트: 버튼, 폼, 카드, 대화상자
- Components/Lesson: 레슨 스텝 프레젠테이션 (`packages/shared/ui/src/components/lesson`) — READING, COMPARE, MULTIPLE_CHOICE, FILL_BLANK, SELECT, ORDER, MATCH, CATEGORIZE, WRITE, AI_FEEDBACK
- 패턴: 글쓰기 앱에서 사용하는 탐색과 피드백 흐름

## 참고

- 전역 스타일은 `@workspace/ui/styles`에서 가져온다.
- 테마 전환은 Storybook 도구 모음에서 제어한다.
- Lesson 스토리는 `src/stories/components/lesson/`에 있으며, Controls로 각 스텝 타입의 데이터와 `checked` 채점 상태를 조작할 수 있다. 앱 오케스트레이션(`LessonStepRenderer`)은 포함하지 않는다.
