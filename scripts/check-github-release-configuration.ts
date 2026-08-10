import fs from "node:fs"
import path from "node:path"
import { z } from "zod"

const inputName = z.string().regex(/^[A-Z][A-Z0-9_]*$/u)
const sortedUniqueInputNames = z
  .array(inputName)
  .superRefine((value, context) => {
    const normalized = [...new Set(value)].sort()
    if (normalized.join("\n") !== value.join("\n")) {
      context.addIssue({
        code: "custom",
        message: "입력 이름은 중복 없이 오름차순으로 정렬해야 합니다.",
      })
    }
  })
const inputScope = z
  .object({
    secrets: sortedUniqueInputNames,
    variables: sortedUniqueInputNames,
  })
  .strict()
const environmentInputScope = inputScope
  .extend({ optionalSecrets: sortedUniqueInputNames })
  .superRefine((value, context) => {
    const requiredSecrets = new Set(value.secrets)
    for (const name of value.optionalSecrets) {
      if (!requiredSecrets.has(name)) continue
      context.addIssue({
        code: "custom",
        message: `${name}은 secrets와 optionalSecrets에 함께 넣을 수 없습니다.`,
        path: ["optionalSecrets"],
      })
    }
  })
const releaseInputContractSchema = z
  .object({
    automaticSecrets: sortedUniqueInputNames,
    environments: z.record(z.string().min(1), environmentInputScope),
    repository: inputScope,
    schemaVersion: z.literal(2),
    workflow: z
      .string()
      .regex(/^\.github\/workflows\/[A-Za-z0-9._-]+\.ya?ml$/u),
  })
  .strict()

export type ReleaseInputContract = z.infer<typeof releaseInputContractSchema>

interface AvailableReleaseInputs {
  readonly environments: Readonly<
    Record<
      string,
      {
        readonly secrets: ReadonlySet<string>
        readonly variables: ReadonlySet<string>
      }
    >
  >
  readonly repository: {
    readonly secrets: ReadonlySet<string>
    readonly variables: ReadonlySet<string>
  }
}

export interface MissingReleaseInputGroup {
  readonly label: string
  readonly names: readonly string[]
}

interface WorkflowInputReferences {
  readonly environments: ReadonlySet<string>
  readonly secrets: ReadonlySet<string>
  readonly variables: ReadonlySet<string>
}

const repositoryRoot = path.resolve(import.meta.dir, "..")
const contractPath = path.join(
  repositoryRoot,
  "deploy",
  "github-release-inputs.json"
)

export function readReleaseInputContract(
  file = contractPath
): ReleaseInputContract {
  const result = releaseInputContractSchema.safeParse(
    JSON.parse(fs.readFileSync(file, "utf8"))
  )
  if (!result.success) throw new Error(z.prettifyError(result.error))
  return result.data
}

export function collectWorkflowInputReferences(
  source: string
): WorkflowInputReferences {
  return {
    environments: new Set(
      source
        .split("\n")
        .flatMap(
          (line) =>
            /^\s{4}environment:\s*(?<name>[A-Za-z0-9._-]+)\s*$/u.exec(line)
              ?.groups?.name ?? []
        )
    ),
    secrets: collectExpressionNames(source, "secrets"),
    variables: collectExpressionNames(source, "vars"),
  }
}

export function assertWorkflowMatchesReleaseInputContract(
  contract: ReleaseInputContract,
  workflowSource: string
): void {
  const actual = collectWorkflowInputReferences(workflowSource)
  const expectedVariables = new Set([
    ...contract.repository.variables,
    ...Object.values(contract.environments).flatMap((scope) => scope.variables),
  ])
  const expectedSecrets = new Set([
    ...contract.automaticSecrets,
    ...contract.repository.secrets,
    ...Object.values(contract.environments).flatMap((scope) => scope.secrets),
    ...Object.values(contract.environments).flatMap(
      (scope) => scope.optionalSecrets
    ),
  ])
  const expectedEnvironments = new Set(Object.keys(contract.environments))

  const differences = [
    ...describeSetDifference("variable", expectedVariables, actual.variables),
    ...describeSetDifference("secret", expectedSecrets, actual.secrets),
    ...describeSetDifference(
      "environment",
      expectedEnvironments,
      actual.environments
    ),
  ]
  if (differences.length > 0) {
    throw new Error(
      `Release workflow와 입력 계약이 일치하지 않습니다.\n${differences
        .map((difference) => `- ${difference}`)
        .join("\n")}`
    )
  }
}

export function findMissingReleaseInputs(
  contract: ReleaseInputContract,
  available: AvailableReleaseInputs
): readonly MissingReleaseInputGroup[] {
  const groups: MissingReleaseInputGroup[] = []
  addMissingGroup(
    groups,
    "repository variables",
    contract.repository.variables,
    available.repository.variables
  )
  addMissingGroup(
    groups,
    "repository secrets",
    contract.repository.secrets,
    available.repository.secrets
  )
  for (const [environment, required] of Object.entries(contract.environments)) {
    const actual = available.environments[environment]
    addMissingGroup(
      groups,
      `${environment} environment variables`,
      required.variables,
      actual?.variables ?? new Set()
    )
    addMissingGroup(
      groups,
      `${environment} environment secrets`,
      required.secrets,
      actual?.secrets ?? new Set()
    )
  }
  return groups
}

function collectExpressionNames(
  source: string,
  context: "secrets" | "vars"
): ReadonlySet<string> {
  const pattern = new RegExp(
    `\\$\\{\\{\\s*${context}\\.(?<name>[A-Z][A-Z0-9_]*)`,
    "gu"
  )
  return new Set(
    [...source.matchAll(pattern)].flatMap((match) =>
      match.groups?.name === undefined ? [] : [match.groups.name]
    )
  )
}

function describeSetDifference(
  kind: string,
  expected: ReadonlySet<string>,
  actual: ReadonlySet<string>
): readonly string[] {
  const missing = [...expected].filter((name) => !actual.has(name)).sort()
  const undeclared = [...actual].filter((name) => !expected.has(name)).sort()
  return [
    ...(missing.length === 0
      ? []
      : [`workflow에 없는 계약 ${kind}: ${missing.join(", ")}`]),
    ...(undeclared.length === 0
      ? []
      : [`계약에 없는 workflow ${kind}: ${undeclared.join(", ")}`]),
  ]
}

function addMissingGroup(
  groups: MissingReleaseInputGroup[],
  label: string,
  required: readonly string[],
  actual: ReadonlySet<string>
): void {
  const names = required.filter((name) => !actual.has(name))
  if (names.length > 0) groups.push({ label, names })
}

function validateContract(
  contract: ReleaseInputContract
): ReleaseInputContract {
  const workflowPath = path.join(
    repositoryRoot,
    ...contract.workflow.split("/")
  )
  assertWorkflowMatchesReleaseInputContract(
    contract,
    fs.readFileSync(workflowPath, "utf8")
  )
  return contract
}

function readRepository(): string {
  const configured = readOptionalEnvironment("GITHUB_REPOSITORY")
  const repository =
    configured === undefined || configured.length === 0
      ? runGitHubCommand([
          "repo",
          "view",
          "--json",
          "nameWithOwner",
          "--jq",
          ".nameWithOwner",
        ])
      : configured
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repository)) {
    throw new Error("GitHub repository는 owner/repository 형식이어야 합니다.")
  }
  return repository
}

function readOptionalEnvironment(name: string): string | undefined {
  return process.env[name]
}

function runGitHubCommand(arguments_: readonly string[]): string {
  const result = Bun.spawnSync(["gh", ...arguments_], {
    cwd: repositoryRoot,
    env: { ...process.env, GH_PAGER: "cat" },
    stderr: "pipe",
    stdout: "pipe",
  })
  const stderr = result.stderr.toString().trim()
  if (result.exitCode !== 0) {
    throw new Error(
      `GitHub 읽기 전용 조회가 실패했습니다.${
        stderr.length === 0 ? "" : ` ${stderr}`
      }`
    )
  }
  return result.stdout.toString().trim()
}

function listGitHubNames(
  endpoint: string,
  property: string
): ReadonlySet<string> {
  const output = runGitHubCommand([
    "api",
    `--paginate`,
    endpoint,
    "--jq",
    `.${property}[].name`,
  ])
  return new Set(output.length === 0 ? [] : output.split(/\r?\n/u))
}

function readAvailableReleaseInputs(
  contract: ReleaseInputContract,
  repository: string
): AvailableReleaseInputs {
  const environments = Object.fromEntries(
    Object.keys(contract.environments).map((environment) => {
      const encodedEnvironment = encodeURIComponent(environment)
      const endpoint = `repos/${repository}/environments/${encodedEnvironment}`
      return [
        environment,
        {
          secrets: listGitHubNames(
            `${endpoint}/secrets?per_page=100`,
            "secrets"
          ),
          variables: listGitHubNames(
            `${endpoint}/variables?per_page=100`,
            "variables"
          ),
        },
      ]
    })
  )
  return {
    environments,
    repository: {
      secrets:
        contract.repository.secrets.length === 0
          ? new Set()
          : listGitHubNames(
              `repos/${repository}/actions/secrets?per_page=100`,
              "secrets"
            ),
      variables: listGitHubNames(
        `repos/${repository}/actions/variables?per_page=100`,
        "variables"
      ),
    },
  }
}

function run(): void {
  const command = process.argv[2] ?? "github"
  const contract = validateContract(readReleaseInputContract())
  if (command === "contract") {
    console.log("Release workflow와 GitHub 입력 계약이 일치합니다.")
    return
  }
  if (command !== "github") {
    throw new Error("contract 또는 github 명령을 사용해야 합니다.")
  }

  const repository = readRepository()
  const missing = findMissingReleaseInputs(
    contract,
    readAvailableReleaseInputs(contract, repository)
  )
  if (missing.length > 0) {
    console.error(`${repository}의 release 입력이 부족합니다.`)
    for (const group of missing) {
      console.error(`- ${group.label}: ${group.names.join(", ")}`)
    }
    console.error("GitHub secret과 variable의 값은 출력하지 않았습니다.")
    process.exitCode = 1
    return
  }
  console.log(
    `${repository}의 release 입력 이름이 계약과 일치합니다. 값은 출력하지 않았습니다.`
  )
}

if (import.meta.main) {
  try {
    run()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
