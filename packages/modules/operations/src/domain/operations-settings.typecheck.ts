import {
  validateLegalDocument,
  validateNoticeDocument,
} from "#operations/domain/operations-settings"

type Assert<TValue extends true> = TValue
type ExcludesNull<TValue> = null extends TValue ? false : true

type NoticeValidationExcludesNull = Assert<
  ExcludesNull<ReturnType<typeof validateNoticeDocument>>
>
type LegalValidationExcludesNull = Assert<
  ExcludesNull<ReturnType<typeof validateLegalDocument>>
>

const noticeValidationExcludesNull: NoticeValidationExcludesNull = true
const legalValidationExcludesNull: LegalValidationExcludesNull = true

void noticeValidationExcludesNull
void legalValidationExcludesNull
