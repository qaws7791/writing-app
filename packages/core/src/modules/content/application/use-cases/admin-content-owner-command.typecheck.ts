import type { AdminContentResetUseCase } from "#core/modules/content/application/use-cases/admin-content-reset.use-case"
import type { AdminCourseUseCase } from "#core/modules/content/application/use-cases/admin-course.use-case"
import type { AdminActor } from "#core/shared/admin-owner-authorization"

type Assert<TValue extends true> = TValue
type RequiresActor<TCommand> = TCommand extends { readonly actor: AdminActor }
  ? true
  : false

export type AdminContentOwnerCommandsRequireActor = [
  Assert<RequiresActor<Parameters<AdminCourseUseCase["createCourse"]>[0]>>,
  Assert<RequiresActor<Parameters<AdminCourseUseCase["archiveCourse"]>[0]>>,
  Assert<
    RequiresActor<Parameters<AdminContentResetUseCase["resetContent"]>[0]>
  >,
]

// @ts-expect-error owner 변경 command에는 인증된 actor가 반드시 필요하다.
const commandWithoutActor: Parameters<AdminCourseUseCase["createCourse"]>[0] = {
  now: new Date("2026-06-14T03:00:00.000Z"),
}

void commandWithoutActor
