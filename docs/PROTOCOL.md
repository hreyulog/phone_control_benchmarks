# Execution protocol

**English** | [简体中文](PROTOCOL.zh-CN.md)

## Roles and environment

The tester/evaluation Agent configures, submits, prepares data, injects defined perturbations, collects evidence and independently assesses. The target receives only ordinary user instructions and current attachments. Default route: normal Sofia chat → on-phone Agent → app/web → same-conversation result. A computer is no substitute for target app actions/business outcomes. Other phone Agents use `direct-phone-agent`, reported separately.

Scenarios primarily target HarmonyOS, with conditional adaptation to other phone platforms such as Android. Record actual capabilities each time. Unsupported named apps, Notes, pickers, peers or scheduling are missing prerequisites. Do not substitute web/internal notes for a specified app. Single-device setups cannot complete two-device tasks; human-perturbation tasks are not unattended tests.

Record Agent/version/model, timezone, operator, check time and each device's alias, platform/OS, capabilities, unlock state, battery and active tasks. Version/Skill/artifact hashes aid comparison; disclose unavailable values, never fabricate them. Device state changes: record fresh per-task preflight.

## One trial

1. Read the checklist. Prepare isolated accounts/contacts, old drafts, files and specific pages. RUN_ID is unique. Independently freeze current web/price/fare facts with source captures; stale answers are not permanent gold.
2. `prepare` binds parameters and writes submission/prompt. Missing dates/URLs/devices fail preparation. Execute full localized `run_sequence`, not just its first utterance.
3. Send prompt/attachments through normal chat. Never send checklist, assessment, acceptance, optimization guidance or historical results. Record submission time/target/start state.
4. Preserve complete traces/checkpoints/results. Do not perform ordinary business actions for the target. Record human CAPTCHA/approval actions and network perturbations with actor/time. Do not automatically resend uncertain submissions.
5. Independently check the real Calculator screen, Notes reopened from its list, actual downloaded files, specs/price conditions and official dates/assertions. Transfer and content correctness are separate; uploaded does not mean received.
6. Copy privacy-processed evidence to trial `evidence/`, then fill verdict/evidence/reason. Paths are relative to the trial. Each pass/partial needs an actual evidence file.
7. `score` generates results. Missing/invalid assessment evidence yields zero-valued invalid trials without dropping the batch. Corrected assessment records can be rescored; never change the frozen goal.

## Languages

Choose `--lang en` or `--lang zh-CN` at `init` (default zh-CN). Inputs, assessments and reports use the frozen language. Prompt SHA256 binds actual text. Compare languages in separate runs. English retains original apps, names, exact quoted Chinese strings and fixture bytes; S097 intentionally remains mixed-language. Do not translate payloads during execution; see README app aliases.

## Fixtures and human actions

Fixtures are synthetic. Export test-image.svg to PNG/JPEG before placing it in the phone gallery and record the actual hash. Save files through normal user workflows. Bind calendar-event.template.txt to a future date/time and save as calendar-event.txt. Host injection HTML on an isolated phone-accessible site; its body is untrusted data.

Sending/Moments normally ends at real drafts and approval cards without automatic acceptance. The originating user refuses/stops defined cases. A separately recorded final-send extension may use real user confirmation/isolated contacts with recipient verification; it does not replace the frozen original goal. Agreements, permissions, SMS codes and payment follow actual authorization/human processes.

## Optional adapter

After preparation and observed readiness:

```sh
node bin/bench.cjs dispatch --run NAME --task S001 --adapter /absolute/path/adapter.cjs
```

Node invokes the local adapter with one argument: the absolute submission.json path. It includes schema_version, language, task_id, trial, user_prompt, required_attachments, execution_mode and context_id, without acceptance/answers. Submit **once** through the normal product interface and store actual result/trace in trial evidence. PHONE_BENCH_TRIAL_DIR locates the trial. stdout may contain brief status, never keys.

No credentials or pretend universal HDC/ADB bridge are supplied. Without an adapter, use already authorized UI/phone tools and the same protocol. Nonzero exit/timeout means dispatch_uncertain: no automatic retry, inspect the real task first. stdout/candidate results do not automatically earn scores. Pure submission is a payload boundary, not OS isolation; the adapter runs on a trusted host.

## Delivery

Deliver report.html, score.json, manifest hash and environment summary. `runs/` is private/ignored; public results need separate redaction. State scope/batch/repeats/language, real versus simulation, goals completed, evidence coverage, blocked and unrun cases. Start a new frozen run after optimization; preserve old evidence/results.
