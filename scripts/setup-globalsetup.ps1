param (
    [string]$TargetDir = ".",
    [switch]$DryRun
)

$python = $null
foreach ($candidateName in @("python3", "python")) {
    $candidate = Get-Command $candidateName -ErrorAction SilentlyContinue
    if ($candidate) {
        & $candidate.Source -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)" *> $null
        if ($LASTEXITCODE -eq 0) { $python = $candidate.Source; break }
    }
}
if (!$python) {
    Write-Error "GlobalSetup requires Python 3.10 or newer."
    exit 2
}

$installer = Join-Path $PSScriptRoot "setup-globalsetup.py"
$arguments = @($installer, "--target", [System.IO.Path]::GetFullPath($TargetDir))
if ($DryRun) { $arguments += "--dry-run" }
& $python @arguments
exit $LASTEXITCODE
