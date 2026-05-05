import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type { HomeSnapshot } from "../home-types"

export type GetHomeDeps = Record<never, never>

const emptyHomeSnapshot: HomeSnapshot = {
  startActions: [
    {
      id: "photo",
      title: "사진으로 시작",
      description: "한 장면에서 표현 재료를 찾습니다.",
      href: "/photo",
    },
    {
      id: "manual",
      title: "직접 재료 쓰기",
      description: "떠오른 감각과 단어로 시작합니다.",
      href: "/photo",
    },
    {
      id: "garden",
      title: "문체 정원 보기",
      description: "저장한 표현 카드를 다시 살펴봅니다.",
      href: "/garden",
    },
  ],
  recentWork: null,
  garden: {
    cardCount: 0,
    sentenceCount: 0,
  },
}

export function makeGetHomeUseCase(deps: GetHomeDeps) {
  void deps

  return (_userId: UserId): ResultAsync<HomeSnapshot, never> =>
    ResultAsync.fromSafePromise(Promise.resolve(emptyHomeSnapshot))
}
