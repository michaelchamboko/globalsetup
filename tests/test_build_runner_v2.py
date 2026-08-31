import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
RUNNER = REPO_ROOT / "scripts" / "build-runner.py"


class BuildRunnerV2Tests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        (self.root / ".gitnexus").mkdir()
        (self.root / ".gitnexus" / "run.cjs").write_text(
            "if (process.argv[2] === 'status') console.log('Status: up-to-date'); else console.log('Indexed');",
            encoding="utf-8",
        )
        (self.root / "docs").mkdir()
        (self.root / "docs" / "prd.md").write_text("# Approved\nBuild the tested thing.\n", encoding="utf-8")
        (self.root / "build-pack").mkdir()
        self.state_path = self.root / "build-pack" / "execution-state.json"
        self.state_path.write_text(
            json.dumps(
                {
                    "schema_version": 1,
                    "mode": "mvp",
                    "capabilities_file": "build-pack/capabilities.json",
                    "source_authority": {"build_intent_summary": "Build the tested thing.", "approved_sources": ["docs/prd.md"], "contradictions": [], "grommet_review": {"status": "approved", "summary": "mapped"}},
                    "automation_authority": {"publication": {"enabled": False, "destinations": []}},
                    "tasks": [{"id": "T-001", "title": "Test outcome", "status": "ready", "dependencies": [], "risk": "low", "source_changes": False, "requirement_sources": ["docs/prd.md"], "context_files": ["docs/prd.md"], "validation": [{"name": "test", "tier": "task", "kind": "command", "location": "local", "argv": [sys.executable, "-c", "print('ok')"]}], "evidence": []}],
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        (self.root / "build-pack" / "capabilities.json").write_text(
            json.dumps({"schema_version": 1, "python": {"required": True}, "graph": {"required": True, "provider": "gitnexus", "license": {"spdx": "PolyForm-Noncommercial-1.0.0", "usage": "noncommercial", "acknowledged": True}, "status_argv": ["node", ".gitnexus/run.cjs", "status"], "sync_argv": ["node", ".gitnexus/run.cjs", "analyze", "--skip-agents-md", "--skip-skills"]}}),
            encoding="utf-8",
        )
        subprocess.run(["git", "-C", str(self.root), "add", "."], check=True)
        subprocess.run(["git", "-C", str(self.root), "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "fixture"], check=True)

    def tearDown(self):
        managed = self.root.parent / ".globalsetup-worktrees" / self.root.name
        if managed.exists():
            for path in sorted(managed.iterdir(), reverse=True):
                subprocess.run(["git", "-C", str(self.root), "worktree", "remove", "--force", str(path)], capture_output=True)
            shutil.rmtree(managed.parent, ignore_errors=True)
        self.temp.cleanup()

    def run_runner(self, *args, expected=0):
        result = subprocess.run([sys.executable, str(RUNNER), "--root", str(self.root), *args], text=True, capture_output=True)
        self.assertEqual(expected, result.returncode, result.stdout + result.stderr)
        return result

    def approve_v2(self):
        self.run_runner("migrate", "--apply")
        sealed = json.loads(self.run_runner("seal-plan").stdout)["result"]
        path = self.root / "build-pack" / "grommet-approval.json"
        approval = json.loads(path.read_text(encoding="utf-8"))
        approval.update({"status": "approved", "operator": "test", "approved_at": "2026-08-31T00:00:00+00:00", "candidate_digest": sealed["candidate_digest"]})
        path.write_text(json.dumps(approval), encoding="utf-8")

    def test_migration_is_reversible_and_requires_grommet_approval(self):
        dry_run = json.loads(self.run_runner("migrate").stdout)["result"]
        self.assertEqual("dry_run", dry_run["status"])
        self.assertEqual(1, json.loads(self.state_path.read_text(encoding="utf-8"))["schema_version"])
        self.run_runner("migrate", "--apply")
        self.assertTrue((self.root / "build-pack" / "execution-state.json.v1.bak").exists())
        blocked = self.run_runner("validate", expected=2)
        self.assertIn("Grommet approval", blocked.stderr)
        self.approve_v2()
        self.run_runner("validate")

    def test_v2_rejects_context_over_40_percent(self):
        self.approve_v2()
        state = json.loads(self.state_path.read_text(encoding="utf-8"))
        state["tasks"][0]["context_packet"]["initial_tokens"] = 13000
        state["tasks"][0]["context_packet"]["window_tokens"] = 32000
        self.state_path.write_text(json.dumps(state), encoding="utf-8")
        result = self.run_runner("validate", expected=2)
        self.assertIn("40 percent", result.stderr)

    def test_duplicate_json_keys_are_rejected(self):
        self.state_path.write_text('{"schema_version": 1, "schema_version": 1}', encoding="utf-8")
        result = self.run_runner("validate", expected=2)
        self.assertIn("duplicate JSON key", result.stderr)

    def test_impact_invalidates_only_tasks_connected_to_changed_source_sections(self):
        self.approve_v2()
        (self.root / "docs" / "prd.md").write_text("# Approved\nChanged scope.\n", encoding="utf-8")
        impact = json.loads(self.run_runner("impact").stdout)["result"]
        self.assertEqual(["R-T-001"], impact["changed_requirements"])
        self.assertEqual(["T-001"], impact["changed_tasks"])
        state = json.loads(self.state_path.read_text(encoding="utf-8"))
        self.assertEqual("blocked", state["tasks"][0]["status"])

    def test_serial_worktree_lifecycle_keeps_operator_checkout_out_of_scope(self):
        self.approve_v2()
        capabilities_path = self.root / "build-pack" / "capabilities.json"
        capabilities = json.loads(capabilities_path.read_text(encoding="utf-8"))
        capabilities["graph"]["sync_argv"] = ["node", ".gitnexus/run.cjs", "analyze"]
        capabilities_path.write_text(json.dumps(capabilities), encoding="utf-8")
        started = json.loads(self.run_runner("start", "T-001").stdout)["result"]
        workspace = Path(started["workspace"]["path"])
        self.assertTrue(workspace.is_dir())
        self.assertNotEqual(self.root, workspace)
        self.run_runner("verify", "T-001")
        self.run_runner("integrate", "T-001")
        complete = json.loads(self.run_runner("complete", "T-001").stdout)["result"]
        self.assertEqual("done", complete["status"])


if __name__ == "__main__":
    unittest.main()
