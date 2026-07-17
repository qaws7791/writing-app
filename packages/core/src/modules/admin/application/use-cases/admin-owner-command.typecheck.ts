import type { AdminSettingsUseCase } from "#core/modules/admin/application/use-cases/admin-settings.use-case"
import type { AdminActor } from "#core/shared/admin-owner-authorization"

type Assert<TValue extends true> = TValue
type RequiresActor<TCommand> = TCommand extends { readonly actor: AdminActor }
  ? true
  : false

export type AdminOwnerCommandsRequireActor = [
  Assert<
    RequiresActor<Parameters<AdminSettingsUseCase["updateNoticeSettings"]>[0]>
  >,
  Assert<
    RequiresActor<Parameters<AdminSettingsUseCase["updateLegalSettings"]>[0]>
  >,
]

// @ts-expect-error owner 변경 command에는 인증된 actor가 반드시 필요하다.
const commandWithoutActor: Parameters<
  AdminSettingsUseCase["updateNoticeSettings"]
>[0] = {
  announce: "공지",
  banner: "배너",
  now: new Date("2026-06-14T03:00:00.000Z"),
}

void commandWithoutActor
