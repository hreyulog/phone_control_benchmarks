# phone_control_benchmarks

**English** | [简体中文](README.zh-CN.md)

100 executable phone-control user scenarios with independent assessment and deterministic scoring. Default route: **normal Sofia chat → on-phone Agent**. Other phone-control Agents can use an explicitly recorded execution mode.

Each scenario has a user prompt, prerequisites, parameters, acceptance criteria, difficulty, expected outcome and optimization focus. Coverage includes Settings/Calculator, web sources, shopping, WeChat/feeds, system Notes, files/photos, travel, recovery, peer devices, memory and multi-step goals.

**Node.js 20+, no npm dependencies. Windows / Linux / macOS.** Bring an authorized device and working target Agent. This repository supplies no phones, accounts, credentials or new real-device results.

## Start as an evaluation Agent

Read [AGENTS.md](AGENTS.md), then:

```sh
git clone https://github.com/hreyulog/phone_control_benchmarks.git
cd phone_control_benchmarks
node bin/bench.cjs doctor
node --test tests/benchmark.test.cjs
node bin/bench.cjs list --batch smoke --lang en
```

Without a phone, rehearse the recording/scoring pipeline:

```sh
node bin/bench.cjs demo --run demo-en-01 --lang en
```

Open `runs/demo-en-01/report.html`. It is marked **SIMULATION ONLY**, with a null real score and zero real trials. One scenario has synthetic evidence; the other 19 remain unrun.

Browse [index.html](index.html) offline, or run `node bin/bench.cjs preview` and open `http://127.0.0.1:4188`. Use English / 中文 to switch the full catalog; search matches both languages. Preview denies `.git/`, `local/` and `runs/`. `npm test` / `npm run preview` are optional when npm is available.

## Actual device tests

1. Copy [the environment template](config/environment.example.json) to `local/environment.json`. Fill observed Agent/model/device/capability values. No `npm install` is needed. Record busy/locked devices, absent apps, login blockers and unsupported capabilities honestly.
2. Freeze scope, repeats and prompt language:

```sh
node bin/bench.cjs init --run baseline-en-v1 --batch smoke --repeat 1 --lang en --environment local/environment.json
node bin/bench.cjs prepare --run baseline-en-v1 --task S001
```

3. Inputs are in `runs/baseline-en-v1/S001/r01/`. Send only `prompt.txt` and the attachments named in `submission.json` through normal target chat. **Never send operator-checklist or assessment.** Fill `preflight.json` with current observed state; unknown is not true. The target performs the phone actions.
4. Save actual submission records, execution traces and independently checked final-state evidence in trial `evidence/`. Fill `assessment.json`: status, timestamps, independent assessor and six verdicts. Every pass/partial needs actual evidence references and a reason.
5. Generate final reports:

```sh
node bin/bench.cjs score --run baseline-en-v1
```

Deliver `report.html` and `score.json`. The other 19 planned tasks remain not_run / zero until executed. Full evaluation uses `--batch all`. A baseline with `--repeat 3` is recommended; unrun repeats also score zero.

Copy [the parameters template](config/parameters.example.json) to `local/params.json` and bind actual dates/devices/sites when required:

```sh
node bin/bench.cjs prepare --run baseline-en-v1 --task S017 --params local/params.json
```

RUN_ID is unique per run/task/trial. Missing parameters, invalid dates and unresolved placeholders fail preparation. Follow localized `run_sequence` for multi-turn tasks. Prepare fixtures on the phone through normal workflows. Existing prepared inputs/results are preserved.

With a normal-chat API, provide your own explicitly selected Node adapter for one-time `dispatch`; otherwise use authorized UI/phone tools. No new plugin or developer-specific HDC path is required. A tester operating target apps for Sofia is not a Sofia result. See [execution protocol](docs/PROTOCOL.md).

## Languages and apps

Use `--lang en` or `--lang zh-CN` at `init` (default zh-CN). `list`/`demo` also accept it. `prepare`, `dispatch` and `score` inherit the frozen session language. Start separate runs to compare languages. Reports/checklists use the selected language; evidence content is preserved.

All 100 IDs, splits, expected outcomes and score weights are shared. Original Chinese fields remain compatible; English fields are in `translations.en` in [tasks.json](dataset/tasks.json). v1.1.0 adds translations/language binding. Preserve old v1.0.0 runs locally and start new runs with the new dataset.

Original targets are retained: Taobao (淘宝), JD (京东), Pinduoduo (拼多多), WeChat (微信), Xiaohongshu (小红书), Amap (高德地图), Ctrip (携程), 12306, WPS and Palace Museum (故宫博物院). Keep Chinese contact names, quoted text, note titles and fixture bytes unchanged. S097 intentionally mixes Chinese and English. English instructions do not imply English app screens. HarmonyOS is the primary context; other platforms require supported equivalents recorded explicitly. Missing apps/capabilities remain missing prerequisites.

## Scoring and optimization

Each task is worth 100: primary goal 45, completeness 15, independent outcome 15, traceability 5, constraints 15, termination 5. Goal criteria earn zero without independent outcome verification. Constraint violations/unexpected side effects zero the whole trial. See [scoring rules](docs/SCORING.md).

The tool validates data, evidence files/hashes, version/language binding and denominator, then calculates scores. **Named independent assessors supply factual/semantic verdicts from actual evidence.** It is not an automatic semantic Oracle.

Use tuning for improvements, then a separate evaluation context for public holdout. Fix false success/wrong targets first, loops next, then latency. Never give evaluator answers to the target. Public holdout does not establish confidentiality or OS isolation.

| Scope | Option | Tasks |
| --- | --- | ---: |
| First-pass smoke | `--batch smoke` | 20 |
| Tuning | `--batch tuning` | 80 |
| Public holdout | `--batch holdout` | 20 |
| Full evaluation | `--batch all` | 100 |

Reports include scope, real execution/goal completion coverage, unrun/blocked/invalid records, category/difficulty scores, end-to-end p50/p95, trial evidence hashes and environment. Upload, receipt, file correctness, system Notes persistence and semantics are separate checks.

## Files

| Path | Purpose |
| --- | --- |
| `AGENTS.md` / `AGENTS.zh-CN.md` | Evaluation Agent instructions |
| `dataset/` | 100 bilingual tasks, rubric and frozen SHA256 manifest |
| `fixtures/` | Synthetic text, image source, ZIP and injection-resistance page |
| `config/` | Environment/parameter templates |
| `bin/bench.cjs`, `lib/` | CLI, binding, validation, scoring and reports |
| `docs/` | English/Chinese execution, scoring and origin documents |
| `tests/` | Pipeline/failure-path checks |
| `tools/` | Translation maintenance and catalog generation |
| `index.html` | Offline bilingual search/copy catalog |
| `runs/`, `local/` | Private evidence/config, Git-ignored |

Keep real chats, screenshots, credentials and device serials local; separately redact public reports. This release contains scenarios/tools, not new real-device scores. One success, simulation or historical repeats must not be presented as a complete 100-task result.
