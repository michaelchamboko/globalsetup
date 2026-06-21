<#
.SYNOPSIS
    Pre-Tool Execution Hook — Workspace Safety Guardrail

.DESCRIPTION
    Enforces tool-level access controls on guarded files before any write or destructive
    action proceeds. This hook is the runtime enforcement layer beneath the prompt-layer
    guidelines in AGENTS.md and rules/karpathy-workspace-norms.md.

    Cross-references safeguards/protected-files.md categories for protected path matching.

.PARAMETER ActionType
    The type of action being attempted. Supported values:
      Write     — Any file write or overwrite operation
      Delete    — File or directory deletion
      Execute   — Shell command execution on a guarded path
      Chmod     — Permission changes

.PARAMETER TargetFile
    The relative or absolute path to the file or directory being acted upon.

.PARAMETER DryRun
    If set, the hook runs validation logic but does NOT block the action.
    Outputs the result to stdout. Useful for pre-execution self-checks.

.EXAMPLE
    # Validate a write to AGENTS.md (will be blocked):
    .\pre-tool-hook.ps1 -ActionType Write -TargetFile "AGENTS.md"

    # Dry run (returns result without blocking):
    .\pre-tool-hook.ps1 -ActionType Write -TargetFile "AGENTS.md" -DryRun

    # Safe file (will pass):
    .\pre-tool-hook.ps1 -ActionType Write -TargetFile "build-pack/02-build-brief.md"

.NOTES
    Exit Codes:
      0 — Verification passed; action may proceed.
      1 — Access violation; action is blocked.
      2 — Invalid arguments.
#>

param (
    [Parameter(Mandatory = $true)]
    [ValidateSet("Write", "Delete", "Execute", "Chmod")]
    [string]$ActionType,

    [Parameter(Mandatory = $true)]
    [string]$TargetFile,

    [switch]$DryRun
)

# ─── Protected Path Registry ──────────────────────────────────────────────────
# Mirrors the categories defined in safeguards/protected-files.md.
# Supports both exact filenames and glob-style patterns (matched via -like).

$ProtectedExact = @(
    "AGENTS.md",
    ".gitignore",
    "LICENSE",
    "SECURITY.md"
)

$ProtectedPatterns = @(
    "rules\*.md",
    "safeguards\*.md",
    ".github\workflows\*",
    "*.env",
    "*.env.*",
    "*.pem",
    "*.key",
    "id_rsa",
    "credentials.json",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml"
)

$GuardedActions = @("Write", "Delete", "Chmod")

# ─── Normalise Target Path ────────────────────────────────────────────────────
$normTarget = $TargetFile.Replace("/", "\").TrimStart(".\").TrimStart("\")
$fileName   = Split-Path $normTarget -Leaf

# ─── Match Check ─────────────────────────────────────────────────────────────
function Test-IsProtected {
    param ([string]$Target, [string]$File)

    # Exact filename match
    foreach ($exact in $ProtectedExact) {
        if ($File -ieq $exact) { return $true }
    }

    # Pattern match against full relative path and filename
    foreach ($pattern in $ProtectedPatterns) {
        if ($Target -like $pattern -or $File -like $pattern) { return $true }
    }

    return $false
}

# ─── Core Guard Logic ─────────────────────────────────────────────────────────
$isProtected   = Test-IsProtected -Target $normTarget -File $fileName
$isGuardedAction = $GuardedActions -contains $ActionType

if ($isProtected -and $isGuardedAction) {
    $message = @"
+----------------------------------------------------------+
|       CRITICAL ACCESS VIOLATION -- ACTION BLOCKED        |
+----------------------------------------------------------+
|  File       : $normTarget
|  Action     : $ActionType
|  Status     : BLOCKED by pre-tool-hook.ps1
|  Reason     : File is in the protected paths registry.
|               See: safeguards/protected-files.md
|               See: rules/karpathy-workspace-norms.md
|
|  Resolution : Obtain explicit operator confirmation, then
|               re-run with operator-approved override flag.
+----------------------------------------------------------+
"@

    if ($DryRun) {
        Write-Warning "DRY-RUN: $message"
        Write-Output "DRY_RUN_RESULT=BLOCKED"
        exit 0
    } else {
        Write-Error $message
        exit 1
    }
}

# ─── Pass ─────────────────────────────────────────────────────────────────────
$passMessage = "Pre-tool verification PASSED - action '$ActionType' on '$normTarget' is permitted."

if ($DryRun) {
    Write-Output "DRY-RUN: $passMessage"
    Write-Output "DRY_RUN_RESULT=PASSED"
} else {
    Write-Output $passMessage
}

exit 0
