param (
    [string]$TargetDir = ".",
    [switch]$DryRun,
    [switch]$AcknowledgeGitNexusLicense
)

$node = $null
foreach ($candidateName in @("node", "nodejs")) {
    $candidate = Get-Command $candidateName -ErrorAction SilentlyContinue
    if ($candidate) {
        & $candidate.Source -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit((a===22&&b>=20)||(a===24&&b>=11)||a>24?0:1)" *> $null
        if ($LASTEXITCODE -eq 0) { $node = $candidate.Source; break }
    }
}
if (!$node) {
    Write-Error "GlobalSetup requires Node.js 22.20+ or 24.11+."
    exit 2
}

$installer = Join-Path $PSScriptRoot "setup-globalsetup.ts"
$arguments = @($installer, "--target", [System.IO.Path]::GetFullPath($TargetDir))
if ($DryRun) { $arguments += "--dry-run" }
if ($AcknowledgeGitNexusLicense) { $arguments += "--acknowledge-gitnexus-license" }
& $node @arguments
exit $LASTEXITCODE
