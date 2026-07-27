$ErrorActionPreference = "Stop"

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
$runRoot = Join-Path $repositoryRoot "output\playwright\course-catalog-20260728-4"
$processFile = Join-Path $runRoot "processes.json"

if (-not (Test-Path -LiteralPath $processFile)) {
  throw "브라우저 검증 프로세스 기록이 없습니다: $processFile"
}

$processIds = Get-Content -Raw $processFile | ConvertFrom-Json
foreach ($processId in @($processIds.fixture, $processIds.api, $processIds.web)) {
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if ($null -ne $process) {
    Stop-Process -Id $processId
    Wait-Process -Id $processId -ErrorAction SilentlyContinue
  }
}
