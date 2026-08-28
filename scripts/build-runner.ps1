param([Parameter(ValueFromRemainingArguments = $true)][string[]]$RunnerArgs)

$python = $null
foreach ($candidateName in @("python3", "python")) {
    $candidate = Get-Command $candidateName -ErrorAction SilentlyContinue
    if ($candidate) {
        & $candidate.Source -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)" *> $null
        if ($LASTEXITCODE -eq 0) { $python = $candidate; break }
    }
}
if (-not $python) {
    Write-Error "Python 3.10 or newer is required for the model-agnostic BuildRunner."
    exit 2
}

& $python.Source (Join-Path $PSScriptRoot "build-runner.py") @RunnerArgs
exit $LASTEXITCODE
