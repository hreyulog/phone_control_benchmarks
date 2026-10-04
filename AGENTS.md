# Evaluation Agent entry point

**English** | [简体中文](AGENTS.zh-CN.md)

When given this repository, begin the following work:

1. Read `README.md`, `docs/PROTOCOL.md` and `docs/SCORING.md`. Chinese counterparts end in `.zh-CN.md`.
2. Run `node bin/bench.cjs doctor` and `node --test tests/benchmark.test.cjs`. Node.js 20+ is sufficient, without npm/dependencies.
3. Inspect `node bin/bench.cjs list --batch smoke --lang en`. Create `local/environment.json` from the example using actual devices/Agent settings. Leave unknown fields null; invent no readiness.
4. With device access/user authorization, prepare and execute. If phone, Agent or login prerequisites are missing, describe the gap and complete available local checks. This repository supplies no device, account, model key or new permissions.
5. Freeze a run with `init --lang en` or `--lang zh-CN`, then `prepare` each ordinary user prompt. Only send submission prompt/named attachments to the target. Never send acceptance, scores, answers, evaluator notes or old traces. Language is frozen; start a new run to change it. Preserve exact Chinese test strings and mixed-language S097.
6. For Sofia, use normal chat and let the production on-phone Agent execute. Testers configure, submit, collect and verify, but must not click target apps, mentally solve Calculator tasks, finish reports or repair outputs for Sofia. Other Agents use `direct-phone-agent` with the route explicitly reported.
7. One active task per executor; check occupancy first. Follow localized checklists for multi-turn, approvals, cancellation, outages and duplicate contacts. Tester perturbations are setup actions, not successful Agent steps.
8. Independently open final pages, reopen Notes or verify actually received files before assessment. Tool success/model completed cannot replace final-state verification. Calculate scores using the public tool; never directly edit them.
9. Deliver report.html/score.json with scope, route, completion, blockers, evidence coverage, latency and limits. Simulations never count as real results.
10. Optimize with tuning 80, then run holdout 20 in another evaluation context. Public directories offer no confidentiality/strict leakage certification.

Preserve raw evidence and do not automatically replay uncertain side effects. Sending/publishing normally stops at actual drafts/approval cards. Continuing requires the originating user's real confirmation. Agreements, permissions, payment, SMS codes and other human blockers follow actual product authorization rules; this protocol grants no new authority.

Keep `runs/` and `local/` private. Do not commit real chats, screenshots, accounts, keys, device serials or operator absolute paths. Upload only synthetic data and separately redacted results. Do not add automated phone execution/publication workflows.
