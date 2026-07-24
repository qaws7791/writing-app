type FetchImplementation = typeof fetch

export interface ReleaseHeadCheckInput {
  readonly apiUrl: string
  readonly releaseRevision: string
  readonly repository: string
  readonly token: string
}

export async function assertReleaseIsCurrentMain(
  input: ReleaseHeadCheckInput,
  fetchImplementation: FetchImplementation = fetch
): Promise<void> {
  const releaseRevision = readRevision(input.releaseRevision)
  const endpoint = createMainReferenceUrl(input.apiUrl, input.repository)
  const token = readToken(input.token)

  const response = await fetchImplementation(endpoint, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })
  if (!response.ok) {
    throw new Error(
      `GitHub main reference 조회가 HTTP ${response.status}로 실패했습니다.`
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error("GitHub main reference 응답이 JSON이 아닙니다.")
  }
  const currentMainRevision = readMainRevision(payload)
  if (currentMainRevision !== releaseRevision) {
    throw new Error(
      `release revision ${releaseRevision}은 현재 main ${currentMainRevision}이 아니므로 production 배포를 중단합니다.`
    )
  }
}

function createMainReferenceUrl(apiUrl: string, repository: string): URL {
  let base: URL
  try {
    base = new URL(apiUrl)
  } catch {
    throw new Error("GITHUB_API_URL은 유효한 HTTPS URL이어야 합니다.")
  }
  if (
    base.protocol !== "https:" ||
    base.username !== "" ||
    base.password !== "" ||
    base.search !== "" ||
    base.hash !== ""
  ) {
    throw new Error("GITHUB_API_URL은 credential 없는 HTTPS URL이어야 합니다.")
  }

  const repositoryMatch =
    /^(?<owner>[A-Za-z0-9][A-Za-z0-9_.-]{0,99})\/(?<name>[A-Za-z0-9_.-]{1,100})$/u.exec(
      repository
    )
  if (repositoryMatch?.groups === undefined) {
    throw new Error("GITHUB_REPOSITORY는 owner/repository 형식이어야 합니다.")
  }

  const basePath = base.pathname.replace(/\/+$/u, "")
  base.pathname = `${basePath}/repos/${encodeURIComponent(
    repositoryMatch.groups.owner
  )}/${encodeURIComponent(repositoryMatch.groups.name)}/git/ref/heads/main`
  return base
}

function readMainRevision(payload: unknown): string {
  if (!isObject(payload) || payload.ref !== "refs/heads/main") {
    throw new Error("GitHub main reference 응답의 ref가 올바르지 않습니다.")
  }
  const object = payload.object
  if (
    !isObject(object) ||
    object.type !== "commit" ||
    typeof object.sha !== "string"
  ) {
    throw new Error("GitHub main reference 응답의 commit SHA가 없습니다.")
  }
  return readRevision(object.sha)
}

function readRevision(value: string): string {
  if (!/^[0-9a-f]{40}$/u.test(value)) {
    throw new Error("RELEASE_REVISION은 40자리 lowercase Git SHA여야 합니다.")
  }
  return value
}

function readToken(value: string): string {
  if (value.length === 0 || /\s/u.test(value)) {
    throw new Error("GITHUB_TOKEN이 필요합니다.")
  }
  return value
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function runReleaseHeadCheck(): Promise<void> {
  await assertReleaseIsCurrentMain({
    apiUrl: readEnvironment("GITHUB_API_URL"),
    releaseRevision: readEnvironment("RELEASE_REVISION"),
    repository: readEnvironment("GITHUB_REPOSITORY"),
    token: readEnvironment("GITHUB_TOKEN"),
  })
  console.log("Production release revision이 현재 main과 일치합니다.")
}

function readEnvironment(name: string): string {
  const value = process.env[name]
  if (value === undefined || value.length === 0) {
    throw new Error(`${name} 환경 변수가 필요합니다.`)
  }
  return value
}

if (import.meta.main) {
  try {
    await runReleaseHeadCheck()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
