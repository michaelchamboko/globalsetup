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
        Write-Host "[missing] $path" -ForegroundColor Red
        $missing++
    } else {
        $content = Get-Content $path -Raw
        if ($content -match "<!-- TODO -->" -or $content -match "\[TODO\]") {
            Write-Host "[placeholder] $path contains placeholder markers" -ForegroundColor Yellow
        } else {
            Write-Host "[ok] $path is present" -ForegroundColor Green
        }
    }
}

if ($missing -eq 0) {
    $buildPlanFiles = @(
      "build-pack\build-plans\01-build-plan-index.md",
      "build-pack\build-plans\02-ui-ux-build-plan.md"
    )

    foreach ($buildPlan in $buildPlanFiles) {
        if (!(Test-Path $buildPlan)) {
            Write-Host "[missing] $buildPlan" -ForegroundColor Red
            exit 1
        }
    }

    $modulePlans = Get-ChildItem "build-pack\module-plans" -Filter "M-*.md" -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "M-000-*" }
    if ($modulePlans.Count -lt 1) {
        Write-Host "[missing] real build-pack\module-plans\M-*.md module plans beyond the M-000 template" -ForegroundColor Red
        exit 1
    }
    Write-Host "[ok] All 17 build pack files, build plans, and module plans are present" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[missing] $missing build pack file(s)" -ForegroundColor Red
    exit 1
}
