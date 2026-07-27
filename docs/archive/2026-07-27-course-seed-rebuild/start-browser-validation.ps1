$ErrorActionPreference = "Stop"

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
$runRoot = Join-Path $repositoryRoot "output\playwright\course-catalog-20260728-4"
$bunExecutable = (Get-Command bun -ErrorAction Stop).Source

if (Test-Path -LiteralPath $runRoot) {
  throw "검증 디렉터리가 이미 존재합니다: $runRoot"
}

New-Item -ItemType Directory -Path $runRoot | Out-Null
$databasePath = Join-Path $runRoot "writing-app.sqlite"
$env:E2E_DATABASE_URL = $databasePath
$env:E2E_RUN_ROOT = $runRoot

$fixture = Start-Process `
  -FilePath $bunExecutable `
  -ArgumentList @("e2e/fixture-server.ts") `
  -WorkingDirectory $repositoryRoot `
  -RedirectStandardOutput (Join-Path $runRoot "fixture.out.log") `
  -RedirectStandardError (Join-Path $runRoot "fixture.err.log") `
  -WindowStyle Hidden `
  -PassThru

function Wait-ForHttp([string]$Url) {
  $deadline = (Get-Date).AddSeconds(120)
  do {
    Start-Sleep -Milliseconds 500
    try {
      if ((Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 2).StatusCode -eq 200) {
        return
      }
    } catch {
    }
  } until ((Get-Date) -gt $deadline)

  throw "서버 시작 제한 시간을 초과했습니다: $Url"
}

Wait-ForHttp "http://127.0.0.1:4199/"

$env:ADMIN_AUTH_SECRET = "e2e-admin-auth-secret-must-have-32-characters"
$env:ADMIN_ORIGIN = "http://127.0.0.1:3101"
$env:API_PORT = "4100"
$env:DATABASE_URL = $databasePath
$env:GOOGLE_CLIENT_ID = "e2e-google-client.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET = "e2e-google-client-secret"
$env:LEARNER_AUTH_SECRET = "e2e-auth-secret-must-have-32-characters"
$env:NODE_ENV = "test"
$env:WEB_ORIGIN = "http://localhost:3100"

$api = Start-Process `
  -FilePath $bunExecutable `
  -ArgumentList @("apps/api/src/scripts/start-e2e-api.ts") `
  -WorkingDirectory $repositoryRoot `
  -RedirectStandardOutput (Join-Path $runRoot "api.out.log") `
  -RedirectStandardError (Join-Path $runRoot "api.err.log") `
  -WindowStyle Hidden `
  -PassThru

Wait-ForHttp "http://127.0.0.1:4100/api/health"

$env:API_BASE_URL = "http://127.0.0.1:4100"
$env:CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS = "http://127.0.0.1:4199"
$env:CONTENT_ASSET_PUBLIC_BASE_URL = "http://127.0.0.1:4199/content-assets"
$env:HOSTNAME = "localhost"
$env:PORT = "3100"
Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue

$web = Start-Process `
  -FilePath $bunExecutable `
  -ArgumentList @(
    (Join-Path $repositoryRoot "apps\web\node_modules\next\dist\bin\next"),
    "dev",
    "--hostname",
    "localhost",
    "--port",
    "3100"
  ) `
  -WorkingDirectory (Join-Path $repositoryRoot "apps\web") `
  -RedirectStandardOutput (Join-Path $runRoot "web.out.log") `
  -RedirectStandardError (Join-Path $runRoot "web.err.log") `
  -WindowStyle Hidden `
  -PassThru

Wait-ForHttp "http://localhost:3100/login"

@{
  fixture = $fixture.Id
  api = $api.Id
  web = $web.Id
  runRoot = $runRoot
  database = $databasePath
} | ConvertTo-Json | Set-Content -Path (Join-Path $runRoot "processes.json")

Get-Content (Join-Path $runRoot "processes.json")
