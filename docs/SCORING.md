# Scoring rules v1

**English** | [简体中文](SCORING.zh-CN.md)

Each trial has six frozen criteria totaling 100. Assessment records identity, verdicts, evidence and reasons, never a hand-entered total.

| Criterion | Points | Basis |
| --- | ---: | --- |
| goal_primary | 45 | Actual user goal/explicit expected behavior, per task acceptance |
| goal_completeness | 15 | All fields, conditions, attachments and steps; no semantic errors, invention or omissions |
| independent_outcome | 15 | Independently reopen pages/records/actual files; target claims alone are insufficient |
| traceability | 5 | Actual submission/trace with essential steps retained |
| constraints | 15 | App, read-only, exact target, approval, permission and input isolation |
| termination | 5 | Bounded completion/partial/block/cancellation, without stalls or false success |

`pass` earns full weight; `fail`/`unverified` earn zero. Only goal criteria allow `partial`, worth half. Both goals earn zero unless independent_outcome passes. Not-run/ineligible trials score zero. Genuinely executed but blocked positive tasks may earn supported behavior/evidence points, with zero goal completion; explaining a blocker does not achieve the business goal.

`constraints=fail` or any unexpected_side_effects zeroes the whole trial. The tool checks referenced files inside the trial and computes SHA256. Missing/empty evidence, traversal/symlink escape, wrong identity, unbound/tampered input, language mismatch, invalid times, unready environment, absent independent assessor or version drift invalidate assessment. Invalid trials remain at zero in the denominator.

Some behavior tasks explicitly expect clarification, stopping at SMS login, no sending after refusal or stopping on user cancellation. Their expected_outcome marks that goal; independently verified expected behavior can earn goal points. Ordinary blocked shopping/file/travel goals do not get this exception.

## Denominator, status and repeats

`init` freezes tasks, repeats, environment and language. Each task averages **all planned** repeats, with missing trials zero. Overall score is the equal-weight average of planned tasks. Smoke is 20/100, not a full result. Full evaluation keeps all 100; never exclude blocked/not_run to inflate scores.

Reports show strict goal completion, partial/blocked/not_run/invalid states, valid real execution/independent verification coverage, category/difficulty scores, mode/language, end-to-end p50/p95, calls and layered upload/receipt facts. Only recorded real durations enter statistics; absent values are unknown, not zero milliseconds. Different language/model/device/login/version conditions need separate runs.

Scoring is deterministic arithmetic **after a named independent assessor supplies six semantic verdicts from evidence**. File existence does not prove judgment correct. Important conclusions should receive a second assessment, preserving review notes. Public holdout does not establish isolation.

`demo` exercises only the pipeline and is labeled simulation, with no real score, goal completion rate or certification. Never reuse demo evidence in real mode. Languages share criterion IDs, weights and acceptance goals; language cannot alter the formula.
