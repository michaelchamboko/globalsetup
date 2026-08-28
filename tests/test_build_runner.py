import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
RUNNER = REPO_ROOT / "scripts" / "build-runner.py"


class BuildRunnerTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.project = Path(self.temp_dir.name)
        subprocess.run(["git", "init", "-q", str(self.project)], check=True)
        (self.project / ".gitignore").write_text(".gitnexus/\n", encoding="utf-8")
        (self.project / ".gitnexus").mkdir()
        (self.project / ".gitnexus" / "run.cjs").write_text(
            """const fs = require('fs');
const command = process.argv[2];
if (command === 'status') {
  if (fs.existsSync('.gitnexus/not-ready')) console.log('Repository not indexed.');
  else console.log('Status: ✅ up-to-date');
  process.exit(0);
}
if (command === 'analyze') {
  console.log('Indexed');
  process.exit(0);
}
process.exit(2);
""",
            encoding="utf-8",
        )
        (self.project / "build-pack").mkdir()
        capabilities = {
            "schema_version": 1,
            "python": {"required": True},
            "graph": {
                "required": True,
                "provider": "gitnexus",
                "license": {
                    "spdx": "PolyForm-Noncommercial-1.0.0",
                    "usage": "noncommercial",
                    "acknowledged": True,
                },
                "status_argv": ["node", ".gitnexus/run.cjs", "status"],
                "sync_argv": ["node", ".gitnexus/run.cjs", "analyze", "--skip-agents-md", "--skip-skills"],
            },
        }
        (self.project / "build-pack" / "capabilities.json").write_text(
            json.dumps(capabilities, indent=2), encoding="utf-8"
        )
        state = {
            "schema_version": 1,
            "mode": "mvp",
            "capabilities_file": "build-pack/capabilities.json",
            "tasks": [
                {
                    "id": "T-001",
                    "title": "Create the foundation",
                    "status": "ready",
                    "dependencies": [],
                    "risk": "low",
                    "source_changes": False,
                    "validation": [
                        {
                            "name": "focused check",
                            "tier": "task",
                            "argv": [sys.executable, "-c", "print('focused-pass')"],
                        }
                    ],
                    "evidence": [],
                },
                {
                    "id": "T-002",
                    "title": "Use the foundation",
                    "status": "blocked",
                    "dependencies": ["T-001"],
                    "risk": "medium",
                    "source_changes": True,
                    "validation": [
                        {
                            "name": "focused check",
                            "tier": "task",
                            "argv": [sys.executable, "-c", "print('focused-pass')"],
                        },
                        {
                            "name": "affected check",
                            "tier": "affected",
                            "argv": [sys.executable, "-c", "print('affected-pass')"],
                        },
                    ],
                    "evidence": [],
                },
            ],
        }
        self.state_path = self.project / "build-pack" / "execution-state.json"
        self.state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

    def tearDown(self):
        self.temp_dir.cleanup()

    def run_runner(self, *args, expected=0):
        completed = subprocess.run(
            [sys.executable, str(RUNNER), "--root", str(self.project), *args],
            text=True,
            capture_output=True,
        )
        self.assertEqual(
            expected,
            completed.returncode,
            msg=f"stdout:\n{completed.stdout}\nstderr:\n{completed.stderr}",
        )
        return completed

    def read_state(self):
        return json.loads(self.state_path.read_text(encoding="utf-8"))

    def test_validate_accepts_a_complete_execution_contract(self):
        result = self.run_runner("validate")
        self.assertIn("VALID", result.stdout)

    def test_next_start_verify_complete_unlocks_the_dependency(self):
        next_task = json.loads(self.run_runner("next").stdout)
        self.assertEqual("T-001", next_task["id"])

        self.run_runner("start", "T-001")
        self.run_runner("verify", "T-001")
        completion = self.run_runner("complete", "T-001")
        self.assertEqual("T-001", json.loads(completion.stdout)["id"])

        state = self.read_state()
        tasks = {task["id"]: task for task in state["tasks"]}
        self.assertEqual("done", tasks["T-001"]["status"])
        self.assertEqual("ready", tasks["T-002"]["status"])
        self.assertEqual(["task"], [receipt["tier"] for receipt in tasks["T-001"]["evidence"]])
        self.assertEqual("fresh", tasks["T-001"]["graph_evidence"]["status"])

    def test_only_one_task_can_be_in_progress(self):
        self.run_runner("start", "T-001")
        result = self.run_runner("start", "T-002", expected=2)
        self.assertIn("already active", result.stderr)

    def test_next_resumes_the_in_progress_task_before_selecting_new_work(self):
        self.run_runner("start", "T-001")
        task = json.loads(self.run_runner("next").stdout)
        self.assertEqual("T-001", task["id"])
        self.assertEqual("in_progress", task["status"])

    def test_next_resumes_a_verified_task_pending_completion(self):
        self.run_runner("start", "T-001")
        self.run_runner("verify", "T-001")
        task = json.loads(self.run_runner("next").stdout)
        self.assertEqual("T-001", task["id"])
        self.assertEqual("verified", task["status"])

        result = self.run_runner("start", "T-002", expected=2)
        self.assertIn("already active", result.stderr)

    def test_explicit_blocker_persists_until_resolved(self):
        self.run_runner("block", "T-001", "--reason", "missing fixture")
        result = self.run_runner("next", expected=2)
        self.assertIn("no ready task", result.stderr)

        self.run_runner("unblock", "T-001", "--resolution", "fixture supplied")
        next_task = json.loads(self.run_runner("next").stdout)
        self.assertEqual("T-001", next_task["id"])
        task = self.read_state()["tasks"][0]
        self.assertNotIn("blocker", task)
        self.assertEqual("fixture supplied", task["blocker_history"][0]["resolution"])

    def test_medium_risk_runs_focused_and_affected_checks(self):
        state = self.read_state()
        state["tasks"][0]["status"] = "done"
        state["tasks"][1]["status"] = "ready"
        self.state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

        self.run_runner("start", "T-002")
        self.run_runner("verify", "T-002")

        state = self.read_state()
        evidence = state["tasks"][1]["evidence"]
        self.assertEqual(["task", "affected"], [receipt["tier"] for receipt in evidence])

    def test_high_risk_requires_full_validation(self):
        state = self.read_state()
        state["tasks"][0]["risk"] = "high"
        self.state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

        result = self.run_runner("validate", expected=2)
        self.assertIn("full", result.stderr)

    def test_graph_sync_records_the_required_provider(self):
        state = self.read_state()
        state["tasks"][1]["status"] = "verified"
        self.state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")
        result = self.run_runner("graph-sync", "T-002")
        payload = json.loads(result.stdout)
        self.assertEqual("gitnexus", payload["provider"])
        self.assertEqual("fresh", payload["status"])

    def test_required_graph_provider_fails_closed_when_it_cannot_run(self):
        state = self.read_state()
        state["tasks"][1]["status"] = "verified"
        self.state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")
        capabilities_path = self.project / "build-pack" / "capabilities.json"
        capabilities = json.loads(capabilities_path.read_text(encoding="utf-8"))
        capabilities["graph"].pop("sync_argv")
        capabilities_path.write_text(json.dumps(capabilities, indent=2), encoding="utf-8")

        result = self.run_runner("graph-sync", "T-002", expected=2)
        self.assertIn("required graph provider", result.stderr)

    def test_graph_status_requires_an_explicit_up_to_date_result(self):
        (self.project / ".gitnexus" / "not-ready").touch()
        result = self.run_runner("start", "T-001", expected=2)
        self.assertIn("unavailable or stale", result.stderr)

    def test_completion_updates_gitnexus_even_without_source_changes(self):
        self.run_runner("start", "T-001")
        self.run_runner("verify", "T-001")
        self.run_runner("complete", "T-001")
        task = self.read_state()["tasks"][0]
        self.assertFalse(task["source_changes"])
        self.assertEqual("fresh", task["graph_evidence"]["status"])

    def test_failed_verification_records_a_durable_blocker(self):
        state = self.read_state()
        state["tasks"][0]["validation"][0]["argv"] = [sys.executable, "-c", "raise SystemExit(1)"]
        self.state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

        self.run_runner("start", "T-001")
        self.run_runner("verify", "T-001", expected=1)
        task = self.read_state()["tasks"][0]
        self.assertEqual("blocked", task["status"])
        self.assertIn("validation failed", task["blocker"]["reason"])

    def test_source_drift_invalidates_verification_before_completion(self):
        self.run_runner("start", "T-001")
        self.run_runner("verify", "T-001")
        (self.project / "changed-after-verification.txt").write_text("drift\n", encoding="utf-8")

        result = self.run_runner("complete", "T-001", expected=2)
        self.assertIn("source changed after verification", result.stderr)
        task = self.read_state()["tasks"][0]
        self.assertEqual("in_progress", task["status"])
        self.assertEqual("invalidated", task["verification_history"][0]["status"])

    def test_high_risk_completion_requires_recorded_review(self):
        state = self.read_state()
        task = state["tasks"][0]
        task["risk"] = "high"
        task["source_changes"] = True
        task["validation"].extend(
            [
                {
                    "name": "affected check",
                    "tier": "affected",
                    "argv": [sys.executable, "-c", "print('affected-pass')"],
                },
                {
                    "name": "full check",
                    "tier": "full",
                    "argv": [sys.executable, "-c", "print('full-pass')"],
                },
            ]
        )
        self.state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

        self.run_runner("start", "T-001")
        self.run_runner("verify", "T-001")
        result = self.run_runner("complete", "T-001", expected=2)
        self.assertIn("independent review", result.stderr)
        self.run_runner("review", "T-001", "--reviewer", "independent-reviewer", "--summary", "passed")
        self.run_runner("complete", "T-001")


if __name__ == "__main__":
    unittest.main()
