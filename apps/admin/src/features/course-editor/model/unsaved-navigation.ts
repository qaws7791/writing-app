type NavigationModifiers = Readonly<{
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
}>

/**
 * 수정키 클릭은 새 탭·새 창을 여는 브라우저 기본 동작이므로 현재 편집 화면을
 * 떠나지 않는다. 따라서 저장하지 않은 변경이 있어도 확인을 묻지 않는다.
 */
export function shouldConfirmUnsavedNavigation(input: {
  readonly modifiers: NavigationModifiers
  readonly unsaved: boolean
}): boolean {
  return (
    input.unsaved &&
    !input.modifiers.altKey &&
    !input.modifiers.ctrlKey &&
    !input.modifiers.metaKey &&
    !input.modifiers.shiftKey
  )
}
