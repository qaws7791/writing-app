# Storybook

Design system workbench for `@workspace/ui`.

## Commands

```bash
bun storybook
bun build-storybook
```

## Scope

- Foundations: editorial tokens and typography
- Components: buttons, forms, cards, dialogs
- Components/Lesson: 레슨 스텝 프레젠테이션 (`packages/ui/src/components/lesson`) — READING, COMPARE, MULTIPLE_CHOICE, FILL_BLANK, SELECT, ORDER, MATCH, CATEGORIZE, WRITE, AI_FEEDBACK
- Patterns: navigation and feedback flows used in the writing app

## Notes

- Global styles come from `@workspace/ui/globals.css`.
- Theme switching is controlled from the Storybook toolbar.
- Lesson 스토리는 `src/stories/components/lesson/`에 있으며, Controls로 각 스텝 타입의 데이터와 `checked` 채점 상태를 조작할 수 있다. 앱 오케스트레이션(`LessonStepRenderer`)은 포함하지 않는다.
