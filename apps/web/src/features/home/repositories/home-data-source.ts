import type { HomeSnapshot } from "@/domain/draft"
import { createAppRepository } from "@/features/writing/repositories/app-repository"

/**
 * 홈 화면이 필요로 하는 데이터 소스 추상화 (Port).
 * 구현체를 교체하면 테스트·로컬 모드 전환이 가능하다.
 */
export type HomeDataSource = {
  getHome: () => Promise<HomeSnapshot>
}

export function createHomeDataSource(): HomeDataSource {
  const repository = createAppRepository()
  return {
    getHome: () => repository.getHome(),
  }
}
