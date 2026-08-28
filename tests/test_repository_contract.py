import shutil
import subprocess
import os
import sys
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


class RepositoryContractTests(unittest.TestCase):
    def test_root_contract_is_a_small_model_agnostic_router(self):
        agents = (REPO_ROOT / "AGENTS.md").read_text(encoding="utf-8")
        self.assertLessEqual(len(agents.splitlines()), 140)
        for forbidden in ("task-master", "Sequential Thinking", "Caveman", "45% capacity"):
            self.assertNotIn(forbidden, agents)

    def test_setup_installs_the_runtime_and_safety_hook(self):
        for name in ("setup-globalsetup.ps1", "setup-globalsetup.sh"):
            setup = (REPO_ROOT / "scripts" / name).read_text(encoding="utf-8")
            self.assertIn("build-runner.py", setup)
            self.assertIn("pre-tool-hook.ps1", setup)
            self.assertIn("repository-guard.py", setup)
            self.assertIn("core.hooksPath", setup)

    @unittest.skipUnless(shutil.which("pwsh"), "PowerShell is not installed")
    def test_safety_hook_canonicalizes_guarded_paths(self):
        targets = (
            ".github/workflows/build.yml",
            str(REPO_ROOT / ".github" / "workflows" / "build.yml"),
            "../outside.txt",
        )
        for target in targets:
            with self.subTest(target=target):
                result = subprocess.run(
                    [
                        "pwsh",
                        "-NoProfile",
                        "-File",
                        str(REPO_ROOT / "scripts" / "pre-tool-hook.ps1"),
                        "-ActionType",
                        "Write",
                        "-TargetFile",
                        target,
                        "-DryRun",
                    ],
                    text=True,
                    capture_output=True,
                )
                self.assertEqual(0, result.returncode, result.stderr)
                self.assertIn("DRY_RUN_RESULT=BLOCKED", result.stdout + result.stderr)

    def test_bootstrap_generates_machine_readable_execution_state(self):
        for name in ("generate-build-pack.ps1", "generate-build-pack.sh"):
            generator = (REPO_ROOT / "scripts" / name).read_text(encoding="utf-8")
            self.assertIn("execution-state.json", generator)
            self.assertIn("capabilities.json", generator)

    @unittest.skipUnless(shutil.which("pwsh") and shutil.which("node"), "bootstrap prerequisites missing")
    def test_powershell_bootstrap_installs_a_runnable_contract(self):
        with tempfile.TemporaryDirectory() as temp:
            temp_root = Path(temp)
            target = temp_root / "target"
            fake_bin = temp_root / "bin"
            target.mkdir()
            fake_bin.mkdir()
            (fake_bin / "gitnexus.cmd").write_text(
                '@echo off\r\nnode "%~dp0gitnexus-fake.cjs" %*\r\nexit /b %errorlevel%\r\n', encoding="utf-8"
            )
            (fake_bin / "gitnexus-fake.cjs").write_text(
                """const fs = require('fs');
const path = require('path');
const command = process.argv[2];
if (command === 'analyze') {
  fs.mkdirSync('.gitnexus', {recursive: true});
  fs.writeFileSync(path.join('.gitnexus', 'run.cjs'), `const command = process.argv[2];
if (command === 'status') { console.log('Status: up-to-date'); process.exit(0); }
if (command === 'analyze') { console.log('Indexed'); process.exit(0); }
process.exit(2);\n`);
}
console.log('fake gitnexus ' + process.argv.slice(2).join(' '));
process.exit(0);
""",
                encoding="utf-8",
            )
            env = os.environ.copy()
            env["PATH"] = f"{fake_bin}{os.pathsep}{env['PATH']}"
            result = subprocess.run(
                [
                    "pwsh",
                    "-NoProfile",
                    "-File",
                    str(REPO_ROOT / "scripts" / "setup-globalsetup.ps1"),
                    "-TargetDir",
                    str(target),
                ],
                text=True,
                capture_output=True,
                env=env,
            )
            self.assertEqual(0, result.returncode, result.stdout + result.stderr)
            for relative in (
                "AGENTS.md",
                ".gitnexusrc",
                "scripts/build-runner.py",
                "scripts/pre-tool-hook.ps1",
                "scripts/repository-guard.py",
                ".githooks/pre-commit",
                "build-pack/capabilities.json",
                "build-pack/execution-state.json",
            ):
                self.assertTrue((target / relative).exists(), relative)
            hooks_path = subprocess.run(
                ["git", "-C", str(target), "config", "--local", "--get", "core.hooksPath"],
                text=True,
                capture_output=True,
                check=True,
            ).stdout.strip()
            self.assertEqual(".githooks", hooks_path)

            workflow = target / ".github" / "workflows" / "build.yml"
            workflow.parent.mkdir(parents=True)
            workflow.write_text("name: prohibited\n", encoding="utf-8")
            subprocess.run(["git", "-C", str(target), "add", ".github/workflows/build.yml"], check=True)
            guard = subprocess.run(
                [sys.executable, str(target / "scripts" / "repository-guard.py"), "--root", str(target), "--staged"],
                text=True,
                capture_output=True,
            )
            self.assertEqual(1, guard.returncode, guard.stdout + guard.stderr)
            self.assertIn("GitHub Actions", guard.stderr)

    def test_example_execution_state_is_valid(self):
        with tempfile.TemporaryDirectory() as temp:
            project = Path(temp)
            shutil.copytree(
                REPO_ROOT / "examples" / "post-prd-build-pack",
                project / "build-pack",
            )
            result = subprocess.run(
                [
                    sys.executable,
                    str(REPO_ROOT / "scripts" / "build-runner.py"),
                    "--root",
                    str(project),
                    "validate",
                ],
                text=True,
                capture_output=True,
            )
            self.assertEqual(0, result.returncode, result.stdout + result.stderr)

    def test_obsolete_orchestrators_are_absent_from_installed_contract(self):
        roots = ("AGENTS.md", "docs", "rules", "skills", "templates", "reviewers", "safeguards")
        files = []
        for root in roots:
            path = REPO_ROOT / root
            files.extend([path] if path.is_file() else path.rglob("*.md"))
        combined = "\n".join(path.read_text(encoding="utf-8") for path in files)
        for forbidden in ("CodeGraph", "task-master", "Sequential Thinking", "Caveman", "45% capacity"):
            self.assertNotIn(forbidden, combined)

    def test_graph_intelligence_is_mandatory_and_gitnexus_only(self):
        capabilities = (
            REPO_ROOT / "templates" / "governance" / "capabilities-template.json"
        ).read_text(encoding="utf-8")
        self.assertIn('"required": true', capabilities)
        self.assertIn('"provider": "gitnexus"', capabilities)
        self.assertIn('"usage": "noncommercial"', capabilities)
        self.assertNotIn("codegraph", capabilities.lower())

    def test_no_default_github_actions_workflows_exist(self):
        workflow_dir = REPO_ROOT / ".github" / "workflows"
        workflows = [] if not workflow_dir.exists() else list(workflow_dir.glob("*.y*ml"))
        self.assertEqual([], workflows)

    def test_github_actions_are_prohibited_without_an_exception_path(self):
        roots = ("AGENTS.md", "README.md", "SECURITY.md", "docs", "rules", "skills", "templates", "safeguards")
        files = []
        for root in roots:
            path = REPO_ROOT / root
            files.extend([path] if path.is_file() else path.rglob("*.md"))
        combined = "\n".join(path.read_text(encoding="utf-8").lower() for path in files)
        for forbidden in (
            "github actions exception",
            "explicitly approves actions",
            "explicitly approves a workflow",
            "github actions need explicit",
        ):
            self.assertNotIn(forbidden, combined)

    def test_detailed_rules_are_loaded_on_demand(self):
        for rule in (REPO_ROOT / "rules").glob("*.md"):
            self.assertNotIn("alwaysApply: true", rule.read_text(encoding="utf-8"), rule.name)


if __name__ == "__main__":
    unittest.main()
