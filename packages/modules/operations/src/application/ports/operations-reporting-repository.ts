import type { CourseId, LessonId } from "@workspace/types/ids"

type OperationsMetricRate = Readonly<{
  denominator: number
  numerator: number
  percentage: number | null
}>

export type OperationsDashboard = Readonly<{
  activeWindow: Readonly<{
    from: string
    to: string
  }>
  asOfDate: string
  metrics: Readonly<{
    activeUsersLast7Days: number
    activationRate: OperationsMetricRate &
      Readonly<{ status: "available" | "empty" }>
    completedLessons: number
    d7ReturnRate: OperationsMetricRate &
      Readonly<{
        matureCohortThrough: string
        status: "available" | "empty" | "immature"
      }>
    writingRevisionAfterSelfCheckRate: OperationsMetricRate &
      Readonly<{ status: "available" | "empty" }>
    writingSelfCheckStartRate: OperationsMetricRate &
      Readonly<{ status: "available" | "empty" }>
  }>
}>

export type OperationsLessonAnalyticsItem = Readonly<{
  completed: number
  completionRate: number
  courseId: CourseId
  courseTitle: string
  dropOffRate: number
  lessonId: LessonId
  lessonTitle: string
  started: number
}>

export type OperationsAnalytics = Readonly<{
  dailySeries: readonly Readonly<{
    completions: number
    date: string
    returns: number | null
    returnStatus: "available" | "empty" | "immature"
    signups: number
    starts: number
  }>[]
  from: string
  matureCohortThrough: string
  to: string
  worstLessons: readonly OperationsLessonAnalyticsItem[]
}>

export type OperationsLessonAnalyticsPage = Readonly<{
  items: readonly OperationsLessonAnalyticsItem[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}>

export type OperationsLessonAnalyticsSort =
  | "completionRate"
  | "course"
  | "dropOff"
  | "lesson"

export type OperationsSortDirection = "asc" | "desc"

export type OperationsReportingRepository = Readonly<{
  readAnalytics: (input: {
    readonly from: string
    readonly matureCohortThrough: string
    readonly to: string
  }) => OperationsAnalytics
  readDashboard: (input: {
    readonly activeFrom: string
    readonly matureCohortThrough: string
    readonly reportDate: string
  }) => OperationsDashboard
  readLessonAnalytics: (input: {
    readonly direction: OperationsSortDirection
    readonly page: number
    readonly pageSize: number
    readonly query: string
    readonly sort: OperationsLessonAnalyticsSort
  }) => OperationsLessonAnalyticsPage
}>
