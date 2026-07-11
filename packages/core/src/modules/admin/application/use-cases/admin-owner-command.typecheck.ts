import type { AdminActor } from "@workspace/core/modules/admin/application/policies/admin-actor-policy"
import type { AdminContentResetUseCase } from "@workspace/core/modules/admin/application/use-cases/admin-content-reset.use-case"
import type { AdminCourseUseCase } from "@workspace/core/modules/admin/application/use-cases/admin-course.use-case"
import type { AdminSettingsUseCase } from "@workspace/core/modules/admin/application/use-cases/admin-settings.use-case"
import type { AdminUserUseCase } from "@workspace/core/modules/admin/application/use-cases/admin-user.use-case"

type Assert<TValue extends true> = TValue
type RequiresActor<TCommand> = TCommand extends { readonly actor: AdminActor }
  ? true
  : false

export type AdminOwnerCommandsRequireActor = [
  Assert<RequiresActor<Parameters<AdminCourseUseCase["createCourse"]>[0]>>,
  Assert<RequiresActor<Parameters<AdminCourseUseCase["archiveCourse"]>[0]>>,
  Assert<RequiresActor<Parameters<AdminUserUseCase["updateUserStatus"]>[0]>>,
  Assert<RequiresActor<Parameters<AdminUserUseCase["deleteUser"]>[0]>>,
  Assert<
    RequiresActor<Parameters<AdminSettingsUseCase["updateNoticeSettings"]>[0]>
  >,
  Assert<
    RequiresActor<Parameters<AdminSettingsUseCase["updateLegalSettings"]>[0]>
  >,
  Assert<
    RequiresActor<Parameters<AdminContentResetUseCase["resetContent"]>[0]>
  >,
]

// @ts-expect-error owner 변경 command에는 인증된 actor가 반드시 필요하다.
const commandWithoutActor: Parameters<AdminCourseUseCase["createCourse"]>[0] = {
  now: new Date("2026-06-14T03:00:00.000Z"),
}

void commandWithoutActor
