param (
    [string]$TargetDir = "."
)

# Setup script to copy GlobalSetup files to a target project directory (PowerShell).

$TargetDir = [System.IO.Path]::GetFullPath($TargetDir)

if (!(Test-Path $TargetDir)) {
    Write-Host "Target directory $TargetDir does not exist. Creating..."
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$GsDir = Split-Path -Parent $ScriptDir

Write-Host "Copying GlobalSetup configuration from $GsDir to $TargetDir..."

# Copy AGENTS.md to root
$targetAgents = Join-Path $TargetDir "AGENTS.md"
if (Test-Path $targetAgents) {
    Write-Host "AGENTS.md already exists. Backing up to AGENTS.md.bak..."
    Copy-Item $targetAgents (Join-Path $TargetDir "AGENTS.md.bak") -Force
}
Copy-Item (Join-Path $GsDir "AGENTS.md") $TargetDir -Force

# Copy folders to .agents/
$agentConfigDir = Join-Path $TargetDir ".agents"
if (!(Test-Path $agentConfigDir)) {
    New-Item -ItemType Directory -Path $agentConfigDir -Force | Out-Null
}

$folders = @("rules", "skills", "templates", "reviewers", "safeguards")
foreach ($folder in $folders) {
    $srcFolder = Join-Path $GsDir $folder
    $destFolder = Join-Path $agentConfigDir $folder
    if (Test-Path $destFolder) {
        Write-Host "Backing up existing $folder to $folder.bak..."
        if (Test-Path "$destFolder.bak") {
            Remove-Item "$destFolder.bak" -Recurse -Force | Out-Null
        }
        Rename-Item $destFolder "$folder.bak" -Force
    }
    Copy-Item $srcFolder $destFolder -Recurse -Force
}

# Copy scripts
$targetScripts = Join-Path $TargetDir "scripts"
if (!(Test-Path $targetScripts)) {
    New-Item -ItemType Directory -Path $targetScripts -Force | Out-Null
}
Copy-Item (Join-Path $GsDir "scripts\generate-build-pack.sh") $targetScripts -Force
Copy-Item (Join-Path $GsDir "scripts\generate-build-pack.ps1") $targetScripts -Force
Copy-Item (Join-Path $GsDir "scripts\validate-build-pack.sh") $targetScripts -Force
Copy-Item (Join-Path $GsDir "scripts\validate-build-pack.ps1") $targetScripts -Force
Copy-Item (Join-Path $GsDir "scripts\build-runner.py") $targetScripts -Force
Copy-Item (Join-Path $GsDir "scripts\build-runner.ps1") $targetScripts -Force
Copy-Item (Join-Path $GsDir "scripts\build-runner.sh") $targetScripts -Force
Copy-Item (Join-Path $GsDir "scripts\pre-tool-hook.ps1") $targetScripts -Force
Copy-Item (Join-Path $GsDir "scripts\repository-guard.py") $targetScripts -Force

# Keep GitNexus from rewriting GlobalSetup's model-agnostic instructions.
$targetGitNexusConfig = Join-Path $TargetDir ".gitnexusrc"
if (!(Test-Path $targetGitNexusConfig)) {
    Copy-Item (Join-Path $GsDir ".gitnexusrc") $targetGitNexusConfig
}

$targetGitIgnore = Join-Path $TargetDir ".gitignore"
if (!(Test-Path $targetGitIgnore)) {
    New-Item -ItemType File -Path $targetGitIgnore | Out-Null
}
if (!(Select-String -LiteralPath $targetGitIgnore -Pattern '^\.gitnexus/$' -Quiet)) {
    Add-Content -LiteralPath $targetGitIgnore -Value ".gitnexus/"
}

if (!(Test-Path (Join-Path $TargetDir ".git"))) {
    & git -C $TargetDir init --quiet
    if ($LASTEXITCODE -ne 0) { throw "Could not initialize the target Git repository." }
}

$hooksPath = (& git -C $TargetDir config --local --get core.hooksPath 2>$null)
if ($LASTEXITCODE -ne 0) { $hooksPath = $null }
if ($hooksPath -and $hooksPath -notin @(".githooks", "./.githooks")) {
    throw "Existing core.hooksPath '$hooksPath' must be integrated manually; setup will not overwrite it."
}
$targetHooks = Join-Path $TargetDir ".githooks"
New-Item -ItemType Directory -Path $targetHooks -Force | Out-Null
$sourcePreCommit = Join-Path $GsDir "scripts\pre-commit"
$targetPreCommit = Join-Path $targetHooks "pre-commit"
$userPreCommit = Join-Path $targetHooks "pre-commit.user"
if ((Test-Path $targetPreCommit) -and
    ((Get-FileHash $targetPreCommit).Hash -ne (Get-FileHash $sourcePreCommit).Hash)) {
    if (Test-Path $userPreCommit) {
        throw "Both .githooks/pre-commit and pre-commit.user exist; setup will not overwrite either hook."
    }
    Move-Item $targetPreCommit $userPreCommit
}
Copy-Item $sourcePreCommit $targetPreCommit -Force
& git -C $TargetDir config --local core.hooksPath .githooks
if ($LASTEXITCODE -ne 0) { throw "Could not install the repository pre-commit guard." }

$python = $null
foreach ($candidateName in @("python3", "python")) {
    $candidate = Get-Command $candidateName -ErrorAction SilentlyContinue
    if ($candidate) {
        & $candidate.Source -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)" *> $null
        if ($LASTEXITCODE -eq 0) { $python = $candidate; break }
    }
}
if (!$python) { throw "BuildRunner requires Python 3.10 or newer." }

$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue
if (!$node -or !$npm) {
    throw "GitNexus requires Node.js and npm. Install Node.js 22.18+ or 24.11+ and rerun setup."
}
& node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit((a===22&&b>=18)||(a===24&&b>=11)||a>24?0:1)"
if ($LASTEXITCODE -ne 0) {
    throw "GitNexus requires Node.js 22.18+ or 24.11+."
}

if (!(Get-Command gitnexus -ErrorAction SilentlyContinue)) {
    Write-Host "Installing GitNexus for declared noncommercial use..."
    & npm install --global gitnexus@latest
    if ($LASTEXITCODE -ne 0) { throw "GitNexus installation failed." }
}

Push-Location $TargetDir
try {
    & gitnexus analyze
    if ($LASTEXITCODE -ne 0) { throw "GitNexus could not index the target repository." }
    if (!(Test-Path ".gitnexus\run.cjs")) { throw "GitNexus did not create its repository-local runner." }
    $gitNexusStatus = (& node .gitnexus/run.cjs status | Out-String)
    if ($LASTEXITCODE -ne 0 -or $gitNexusStatus -notmatch '(?im)^\s*Status:\s*(?:✅\s*)?up[- ]to[- ]date\s*$') {
        throw "GitNexus did not report an up-to-date index."
    }
    & gitnexus setup
    if ($LASTEXITCODE -ne 0) { throw "GitNexus could not configure the detected agent harnesses." }

    if (!(Test-Path "build-pack\execution-state.json")) {
        & (Join-Path $targetScripts "generate-build-pack.ps1")
        if ($LASTEXITCODE -ne 0) { throw "Build-pack generation failed." }
    }
}
finally {
    Pop-Location
}

Write-Host "GlobalSetup installed: build pack, BuildRunner, safety hook, and GitNexus index are ready."
