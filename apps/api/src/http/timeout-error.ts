export class TimeoutError extends Error {
  constructor(message = "요청 시간이 초과되었습니다.") {
    super(message)
    this.name = "TimeoutError"
  }
}
