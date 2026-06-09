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

Write-Host "GlobalSetup configuration copied successfully!"
