import os
import json
import shutil
import subprocess
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

    def test_setup_preflight_failure_preserves_the_target(self):
        with tempfile.TemporaryDirectory() as temp:
            temp_root = Path(temp)
            target = temp_root / "target"
            target.mkdir()
            existing_agents = target / "AGENTS.md"
            existing_agents.write_text("operator-owned\n", encoding="utf-8")

            env = os.environ.copy()
            env["PATH"] = str(temp_root / "missing-tools")
            result = subprocess.run(
                [
                    sys.executable,
                    str(REPO_ROOT / "scripts" / "setup-globalsetup.py"),
                    "--target",
                    str(target),
                    "--acknowledge-gitnexus-license",
                ],
                text=True,
                capture_output=True,
                env=env,
            )

            self.assertEqual(2, result.returncode, result.stdout + result.stderr)
            self.assertIn("preflight failed", result.stderr)
            self.assertEqual("operator-owned\n", existing_agents.read_text(encoding="utf-8"))
            self.assertEqual(["AGENTS.md"], sorted(path.name for path in target.iterdir()))

    @unittest.skipUnless(shutil.which("git") and shutil.which("node"), "setup prerequisites missing")
    def test_setup_failure_rolls_back_every_target_mutation(self):
        with tempfile.TemporaryDirectory() as temp:
            temp_root = Path(temp)
            target = temp_root / "target"
            fake_bin = temp_root / "bin"
            (target / ".agents").mkdir(parents=True)
            fake_bin.mkdir()
            (target / "AGENTS.md").write_text("operator-owned\n", encoding="utf-8")
            (target / ".agents" / "custom.md").write_text("keep\n", encoding="utf-8")
            (target / ".gitignore").write_text("operator-only/\n", encoding="utf-8")

            fake = fake_bin / ("gitnexus.cmd" if os.name == "nt" else "gitnexus")
            if os.name == "nt":
                fake.write_text("@echo off\r\necho forced analyze failure 1>&2\r\nexit /b 9\r\n", encoding="utf-8")
            else:
                fake.write_text("#!/bin/sh\necho forced analyze failure >&2\nexit 9\n", encoding="utf-8")
                fake.chmod(0o755)

            env = os.environ.copy()
            env["PATH"] = f"{fake_bin}{os.pathsep}{env['PATH']}"
            result = subprocess.run(
                [
                    sys.executable,
                    str(REPO_ROOT / "scripts" / "setup-globalsetup.py"),
                    "--target",
                    str(target),
                    "--acknowledge-gitnexus-license",
                ],
                text=True,
                capture_output=True,
                env=env,
            )

            self.assertEqual(2, result.returncode, result.stdout + result.stderr)
            self.assertIn("rolled back", result.stderr)
            files = sorted(path.relative_to(target).as_posix() for path in target.rglob("*") if path.is_file())
            directories = sorted(path.relative_to(target).as_posix() for path in target.rglob("*") if path.is_dir())
            self.assertEqual([".agents/custom.md", ".gitignore", "AGENTS.md"], files)
            self.assertEqual([".agents"], directories)
            self.assertFalse((target / ".git").exists())

    def test_repository_text_validator_rejects_corruption(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            mojibake = "".join(chr(codepoint) for codepoint in (0x00E2, 0x20AC, 0x201D))
            (root / "broken.md").write_text(
                f"bad {mojibake} text\ncontrol \x08 byte\n",
                encoding="utf-8",
            )
            result = subprocess.run(
                [sys.executable, str(REPO_ROOT / "scripts" / "repository-text.py"), "--root", str(root)],
                text=True,
                capture_output=True,
            )
            self.assertEqual(1, result.returncode, result.stdout + result.stderr)
            self.assertIn("mojibake", result.stderr)
            self.assertIn("control character", result.stderr)

    def test_repository_text_validator_rejects_broken_local_markdown_links(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "guide.md").write_text("Read [the contract](missing.md).\n", encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(REPO_ROOT / "scripts" / "repository-text.py"), "--root", str(root)],
                text=True,
                capture_output=True,
            )
            self.assertEqual(1, result.returncode, result.stdout + result.stderr)
            self.assertIn("missing local reference", result.stderr)

    def test_repository_text_is_utf8_and_reference_clean(self):
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "scripts" / "repository-text.py"), "--root", str(REPO_ROOT)],
            text=True,
            capture_output=True,
        )
        self.assertEqual(0, result.returncode, result.stdout + result.stderr)

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

    def test_machine_contracts_publish_json_schemas(self):
        for name in ("execution-state.schema.json", "capabilities.schema.json"):
            schema = json.loads((REPO_ROOT / "templates" / "governance" / name).read_text(encoding="utf-8"))
            self.assertEqual("https://json-schema.org/draft/2020-12/schema", schema["$schema"])
            self.assertEqual("object", schema["type"])

    @unittest.skipUnless(shutil.which("pwsh") and shutil.which("node"), "bootstrap prerequisites missing")
    def test_powershell_bootstrap_installs_a_runnable_contract(self):
        with tempfile.TemporaryDirectory() as temp:
            temp_root = Path(temp)
            target = temp_root / "target"
            fake_bin = temp_root / "bin"
            target.mkdir()
            fake_bin.mkdir()
            (target / ".gitnexusrc").write_text(
                json.dumps({"indexOnly": False, "customSetting": "preserve"}),
                encoding="utf-8",
            )
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
            dry_run = subprocess.run(
                [
                    "pwsh",
                    "-NoProfile",
                    "-File",
                    str(REPO_ROOT / "scripts" / "setup-globalsetup.ps1"),
                    "-TargetDir",
                    str(target),
                    "-DryRun",
                    "-AcknowledgeGitNexusLicense",
                ],
                text=True,
                capture_output=True,
                env=env,
            )
            self.assertEqual(0, dry_run.returncode, dry_run.stdout + dry_run.stderr)
            self.assertEqual([".gitnexusrc"], sorted(path.name for path in target.iterdir()))
            self.assertFalse(json.loads((target / ".gitnexusrc").read_text(encoding="utf-8"))["indexOnly"])

            result = subprocess.run(
                [
                    "pwsh",
                    "-NoProfile",
                    "-File",
                    str(REPO_ROOT / "scripts" / "setup-globalsetup.ps1"),
                    "-TargetDir",
                    str(target),
                    "-AcknowledgeGitNexusLicense",
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
            gitnexus_config = json.loads((target / ".gitnexusrc").read_text(encoding="utf-8"))
            self.assertTrue(gitnexus_config["indexOnly"])
            self.assertEqual("preserve", gitnexus_config["customSetting"])

            execution_state_path = target / "build-pack" / "execution-state.json"
            execution_state = json.loads(execution_state_path.read_text(encoding="utf-8"))
            execution_state["operator_marker"] = "preserve-on-rerun"
            execution_state_path.write_text(json.dumps(execution_state, indent=2), encoding="utf-8")
            rerun = subprocess.run(
                [
                    "pwsh",
                    "-NoProfile",
                    "-File",
                    str(REPO_ROOT / "scripts" / "setup-globalsetup.ps1"),
                    "-TargetDir",
                    str(target),
                    "-AcknowledgeGitNexusLicense",
                ],
                text=True,
                capture_output=True,
                env=env,
            )
            self.assertEqual(0, rerun.returncode, rerun.stdout + rerun.stderr)
            preserved_state = json.loads(execution_state_path.read_text(encoding="utf-8"))
            self.assertEqual("preserve-on-rerun", preserved_state["operator_marker"])
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
            shutil.copytree(REPO_ROOT / "skills", project / ".agents" / "skills")
            shutil.copytree(REPO_ROOT / "rules", project / ".agents" / "rules")
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

    @unittest.skipUnless(shutil.which("node"), "Node.js is required by the portability evaluation")
    def test_three_profile_portability_evaluation(self):
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "scripts" / "evaluate-portability.py")],
            text=True,
            capture_output=True,
        )
        self.assertEqual(0, result.returncode, result.stdout + result.stderr)
        payload = json.loads(result.stdout)
        self.assertTrue(payload["contract_portable"])
        self.assertEqual(["go", "python", "typescript"], sorted(item["profile"] for item in payload["profiles"]))

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

    def test_optional_ponytail_skills_do_not_claim_lifecycle_authority(self):
        paths = (
            REPO_ROOT / "rules" / "ponytail.md",
            REPO_ROOT / "skills" / "ponytail" / "SKILL.md",
            REPO_ROOT / "skills" / "ponytail-review" / "SKILL.md",
            REPO_ROOT / "skills" / "ponytail-audit" / "SKILL.md",
            REPO_ROOT / "skills" / "ponytail-debt" / "SKILL.md",
            REPO_ROOT / "skills" / "ponytail-done" / "SKILL.md",
        )
        combined = "\n".join(path.read_text(encoding="utf-8").lower() for path in paths)
        for forbidden in (
            "runs automatically",
            "mandatory completion gate",
            "before every task card",
            "at the start of every new context",
        ):
            self.assertNotIn(forbidden, combined)


if __name__ == "__main__":
    unittest.main()
