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
        (self.project / "build-pack" / "tasks").mkdir()
        (self.project / "build-pack" / "tasks" / "T-001.md").write_text("# T-001\n", encoding="utf-8")
        (self.project / "build-pack" / "tasks" / "T-002.md").write_text("# T-002\n", encoding="utf-8")
        (self.project / "docs").mkdir()
        (self.project / "docs" / "approved-prd.md").write_text("# Approved PRD\n", encoding="utf-8")
        (self.project / ".agents" / "skills" / "fresh-context-execution").mkdir(parents=True)
        (self.project / ".agents" / "skills" / "fresh-context-execution" / "SKILL.md").write_text(
            "---\nname: fresh-context-execution\ndescription: Use when executing one task.\n---\n",
            encoding="utf-8",
        )
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
            "source_authority": {
                "build_intent_summary": "Build the approved foundation and use it.",
                "approved_sources": ["docs/approved-prd.md"],
                "contradictions": [],
                "grommet_review": {"status": "approved", "summary": "Tasks match the approved PRD."},
            },
            "automation_authority": {
                "publication": {"enabled": True, "destinations": ["production-site"]}
            },
            "tasks": [
                {
                    "id": "T-001",
                    "title": "Create the foundation",
                    "status": "ready",
                    "dependencies": [],
                    "risk": "low",
                    "source_changes": False,
                    "requirement_sources": ["docs/approved-prd.md"],
                    "context_files": [
                        "docs/approved-prd.md",
                        "build-pack/tasks/T-001.md",
                        ".agents/skills/fresh-context-execution/SKILL.md",
                    ],
                    "validation": [
                        {
                            "name": "focused check",
                            "tier": "task",
                            "kind": "command",
                            "location": "local",
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
                    "requirement_sources": ["docs/approved-prd.md"],
                    "context_files": [
                        "docs/approved-prd.md",
                        "build-pack/tasks/T-002.md",
                        ".agents/skills/fresh-context-execution/SKILL.md",
                    ],
                    "validation": [
                        {
                            "name": "focused check",
                            "tier": "task",
                            "kind": "command",
                            "location": "local",
                            "argv": [sys.executable, "-c", "print('focused-pass')"],
                        },
                        {
                            "name": "affected check",
                            "tier": "affected",
                            "kind": "command",
                            "location": "local",
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

    def write_state(self, state):
        self.state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

    def result_payload(self, completed):
        payload = json.loads(completed.stdout)
        self.assertTrue(payload["ok"])
        return payload["result"]

    def test_validate_accepts_a_complete_execution_contract(self):
        result = self.run_runner("validate")
        payload = json.loads(result.stdout)
        self.assertEqual({"ok": True, "command": "validate", "result": {"status": "valid"}}, payload)

    def test_next_start_verify_complete_unlocks_the_dependency(self):
        next_task = self.result_payload(self.run_runner("next"))
        self.assertEqual("T-001", next_task["id"])

        self.run_runner("start", "T-001")
        self.run_runner("verify", "T-001")
        completion = self.run_runner("complete", "T-001")
        self.assertEqual("T-001", self.result_payload(completion)["id"])

        state = self.read_state()
        tasks = {task["id"]: task for task in state["tasks"]}
        self.assertEqual("done", tasks["T-001"]["status"])
        self.assertEqual("ready", tasks["T-002"]["status"])
        self.assertEqual(["task"], [receipt["tier"] for receipt in tasks["T-001"]["evidence"]])
        self.assertEqual("fresh", tasks["T-001"]["graph_evidence"]["status"])
        self.assertEqual(
            tasks["T-001"]["verified_source_fingerprint"],
            tasks["T-001"]["graph_evidence"]["source_fingerprint"],
        )

    def test_only_one_task_can_be_in_progress(self):
        self.run_runner("start", "T-001")
        result = self.run_runner("start", "T-002", expected=2)
        self.assertIn("already active", result.stderr)

    def test_next_resumes_the_in_progress_task_before_selecting_new_work(self):
        self.run_runner("start", "T-001")
        task = self.result_payload(self.run_runner("next"))
        self.assertEqual("T-001", task["id"])
        self.assertEqual("in_progress", task["status"])

    def test_next_resumes_a_verified_task_pending_completion(self):
        self.run_runner("start", "T-001")
        self.run_runner("verify", "T-001")
        task = self.result_payload(self.run_runner("next"))
        self.assertEqual("T-001", task["id"])
        self.assertEqual("verified", task["status"])

        result = self.run_runner("start", "T-002", expected=2)
        self.assertIn("already active", result.stderr)

    def test_explicit_blocker_persists_until_resolved(self):
        self.run_runner("block", "T-001", "--reason", "missing fixture")
        result = self.run_runner("next", expected=2)
        self.assertIn("no ready task", result.stderr)

        self.run_runner("unblock", "T-001", "--resolution", "fixture supplied")
        next_task = self.result_payload(self.run_runner("next"))
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
        state["tasks"][0]["status"] = "done"
        state["tasks"][1]["status"] = "ready"
        self.state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")
        self.run_runner("start", "T-002")
        self.run_runner("verify", "T-002")
        result = self.run_runner("graph-sync", "T-002")
        payload = self.result_payload(result)
        self.assertEqual("gitnexus", payload["provider"])
        self.assertEqual("fresh", payload["status"])
        self.assertEqual(self.read_state()["tasks"][1]["verified_source_fingerprint"], payload["source_fingerprint"])

    def test_required_graph_provider_fails_closed_when_it_cannot_run(self):
        state = self.read_state()
        state["tasks"][0]["status"] = "done"
        state["tasks"][1]["status"] = "ready"
        self.state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")
        self.run_runner("start", "T-002")
        self.run_runner("verify", "T-002")
        capabilities_path = self.project / "build-pack" / "capabilities.json"
        capabilities = json.loads(capabilities_path.read_text(encoding="utf-8"))
        capabilities["graph"].pop("sync_argv")
        capabilities_path.write_text(json.dumps(capabilities, indent=2), encoding="utf-8")

        result = self.run_runner("graph-sync", "T-002", expected=2)
        self.assertIn("graph.sync_argv", result.stderr)

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

    def test_verification_rejects_commands_that_change_source_state(self):
        state = self.read_state()
        state["tasks"][0]["validation"][0]["argv"] = [
            sys.executable,
            "-c",
            "from pathlib import Path; Path('generated.txt').write_text('changed', encoding='utf-8')",
        ]
        self.state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

        self.run_runner("start", "T-001")
        result = self.run_runner("verify", "T-001", expected=2)
        self.assertIn("changed source", result.stderr)
        task = self.read_state()["tasks"][0]
        self.assertEqual("in_progress", task["status"])
        self.assertNotIn("verified_source_fingerprint", task)

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
                    "kind": "command",
                    "location": "local",
                    "argv": [sys.executable, "-c", "print('affected-pass')"],
                },
                {
                    "name": "full check",
                    "tier": "full",
                    "kind": "command",
                    "location": "local",
                    "argv": [sys.executable, "-c", "print('full-pass')"],
                },
            ]
        )
        self.state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

        self.run_runner("start", "T-001")
        self.run_runner("verify", "T-001")
        result = self.run_runner("complete", "T-001", expected=2)
        self.assertIn("independent review", result.stderr)
        review = self.result_payload(
            self.run_runner(
                "review",
                "T-001",
                "--reviewer",
                "independent-reviewer",
                "--status",
                "passed",
                "--summary",
                "No blocking findings",
                "--receipt",
                "task://independent-review/123",
            )
        )
        self.assertEqual("task://independent-review/123", review["receipt"])
        self.assertEqual(self.read_state()["tasks"][0]["verified_source_fingerprint"], review["source_fingerprint"])
        self.run_runner("complete", "T-001")

    def test_context_files_must_be_repo_relative_and_exist(self):
        state = self.read_state()
        state["tasks"][0]["context_files"] = ["../outside.md"]
        self.state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

        result = self.run_runner("validate", expected=2)
        self.assertIn("context_files", result.stderr)
        self.assertIn("inside the repository", result.stderr)
        result = self.run_runner("start", "T-001", expected=2)
        self.assertIn("context_files", result.stderr)

    def test_unresolved_source_contradiction_blocks_execution(self):
        state = self.read_state()
        state["source_authority"]["contradictions"] = [
            {
                "id": "C-001",
                "summary": "Conflicting publication rules",
                "sources": ["docs/approved-prd.md", "docs/approved-prd.md"],
                "status": "unresolved",
            }
        ]
        self.write_state(state)

        result = self.run_runner("validate", expected=2)

        self.assertIn("source contradiction C-001 must be resolved", result.stderr)

    def test_gitnexus_output_cannot_be_product_authority(self):
        graph_source = self.project / ".gitnexus" / "derived.md"
        graph_source.write_text("# Derived graph\n", encoding="utf-8")
        state = self.read_state()
        state["source_authority"]["approved_sources"] = [".gitnexus/derived.md"]
        state["tasks"][0]["requirement_sources"] = [".gitnexus/derived.md"]
        state["tasks"][0]["context_files"].append(".gitnexus/derived.md")
        self.write_state(state)

        result = self.run_runner("validate", expected=2)

        self.assertIn("cannot use derived GitNexus data as product authority", result.stderr)

    def test_authorized_publication_does_not_require_another_confirmation(self):
        state = self.read_state()
        state["tasks"][0]["publication"] = {"destination": "production-site"}
        self.write_state(state)

        result = self.run_runner("validate")

        self.assertTrue(result.stdout)

    def test_undeclared_publication_destination_is_rejected(self):
        state = self.read_state()
        state["tasks"][0]["publication"] = {"destination": "package-registry"}
        self.write_state(state)

        result = self.run_runner("validate", expected=2)

        self.assertIn("publication destination is not authorized", result.stderr)

    def test_hosted_receipt_is_required_and_bound_to_source(self):
        state = self.read_state()
        state["tasks"][0]["validation"] = [
            {
                "name": "production smoke",
                "tier": "task",
                "kind": "receipt",
                "location": "production",
            }
        ]
        self.state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

        self.run_runner("start", "T-001")
        missing = self.run_runner("verify", "T-001", expected=2)
        self.assertIn("record-evidence", missing.stderr)
        receipt = self.result_payload(
            self.run_runner(
                "record-evidence",
                "T-001",
                "--check",
                "production smoke",
                "--location",
                "production",
                "--source",
                "https://example.test/deployments/123",
                "--summary",
                "HTTP 200 and expected release marker",
            )
        )
        self.assertEqual("receipt", receipt["kind"])
        evidence = self.result_payload(self.run_runner("verify", "T-001"))
        self.assertEqual("https://example.test/deployments/123", evidence[0]["source"])
        self.assertEqual(receipt["source_fingerprint"], evidence[0]["source_fingerprint"])

    def test_subcommands_publish_actionable_help(self):
        result = subprocess.run(
            [sys.executable, str(RUNNER), "record-evidence", "--help"],
            text=True,
            capture_output=True,
        )
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn("hosted or external verification receipt", result.stdout)
        self.assertIn("--source", result.stdout)


if __name__ == "__main__":
    unittest.main()
