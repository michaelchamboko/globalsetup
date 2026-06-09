# Checks build pack completeness (PowerShell).

Write-Host "Validating build-pack documents..."
$missing = 0

$files = @(
  "00-confirmed-prd-summary.md",
  "01-prd-review-checklist.md",
  "02-build-brief.md",
  "03-implementation-contract.md",
  "04-existing-codebase-discovery.md",
  "05-architecture-map.md",
  "06-database-contract.md",
  "07-api-contract.md",
  "08-ui-contract.md",
  "09-permissions-contract.md",
  "10-implementation-plan.md",
  "11-task-graph.md",
  "12-test-plan.md",
  "13-review-gate.md",
  "14-rollback-plan.md",
  "15-pre-ship-checklist.md",
  "16-definition-of-done.md"
)

foreach ($file in $files) {
    $path = "build-pack\$file"
    if (!(Test-Path $path)) {
        Write-Host "âŒ Missing $path" -ForegroundColor Red
        $missing++
    } else {
        $content = Get-Content $path -Raw
        if ($content -match "<!-- TODO -->" -or $content -match "\[TODO\]") {
            Write-Host "âš ï¸  $path contains placeholder markers" -ForegroundColor Yellow
        } else {
            Write-Host "âœ… $path is present" -ForegroundColor Green
        }
    }
}

if ($missing -eq 0) {
    Write-Host "ðŸŽ‰ All 17 build pack files are present!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "âŒ Missing $missing build pack file(s)!" -ForegroundColor Red
    exit 1
}
