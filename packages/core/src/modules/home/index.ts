export { getHomeUseCase, makeGetHomeUseCase } from "./use-cases/index"
export type {
  GetHomeUseCaseDependencies,
  GetHomeUseCaseOutput,
} from "./use-cases/index"
export type { HomeSnapshot } from "./model/index"
// Compatibility adapter for migration
export { createHomeUseCasesAdapter } from "./adapters/application-compatibility"
