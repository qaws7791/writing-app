import { useQuery } from "@tanstack/react-query"
import type { HomeDataSource } from "@/features/home/repositories/home-data-source"
import { createHomeDataSource } from "@/features/home/repositories/home-data-source"

export const homeQueryKeys = {
  all: ["home"] as const,
  snapshot: () => [...homeQueryKeys.all, "snapshot"] as const,
}

/**
 * 홈 화면 데이터를 가져오는 유스케이스 훅.
 * TanStack Query로 캐싱·로딩·에러 상태를 자동 관리한다.
 *
 * @param dataSource - 의존성 주입용. 생략하면 기본 원격 데이터 소스를 사용한다.
 */
export function useHomeQuery(dataSource?: HomeDataSource) {
  const source = dataSource ?? createHomeDataSource()

  return useQuery({
    queryKey: homeQueryKeys.snapshot(),
    queryFn: () => source.getHome(),
  })
}
