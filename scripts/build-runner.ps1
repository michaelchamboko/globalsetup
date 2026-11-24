param([Parameter(ValueFromRemainingArguments = $true)][string[]]$RunnerArgs)

$node = $null
foreach ($candidateName in @("node", "nodejs")) {
    $candidate = Get-Command $candidateName -ErrorAction SilentlyContinue
    if ($candidate) {
        & $candidate.Source -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit((a===22&&b>=20)||(a===24&&b>=11)||a>24?0:1)" *> $null
        if ($LASTEXITCODE -eq 0) { $node = $candidate; break }
    }
}
if (-not $node) {
    Write-Error "Node.js 22.20+ or 24.11+ is required for BuildRunner."
    exit 2
}

& $node.Source (Join-Path $PSScriptRoot "build-runner.ts") @RunnerArgs
exit $LASTEXITCODE
