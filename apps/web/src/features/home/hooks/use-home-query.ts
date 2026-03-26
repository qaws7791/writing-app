import { useQuery } from "@tanstack/react-query"
import type { HomeRepository } from "@/features/home/repositories/home-repository"
import { createHomeRepository } from "@/features/home/repositories/home-repository"

export const homeQueryKeys = {
  all: ["home"] as const,
  snapshot: () => [...homeQueryKeys.all, "snapshot"] as const,
}

/**
 * 홈 화면 데이터를 가져오는 유스케이스 훅.
 * TanStack Query로 캐싱·로딩·에러 상태를 자동 관리한다.
 *
 * @param repository - 의존성 주입용. 생략하면 기본 원격 리포지토리를 사용한다.
 */
export function useHomeQuery(repository?: HomeRepository) {
  const repo = repository ?? createHomeRepository()

  return useQuery({
    queryKey: homeQueryKeys.snapshot(),
    queryFn: () => repo.getHome(),
  })
}
