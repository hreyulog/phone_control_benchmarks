# Origin and scope

**English** | [简体中文](ORIGIN.zh-CN.md)

100 scenarios designed for Sofia on 2026-10-04: ten categories of ten, 30 easy/40 medium/30 hard, 80 tuning/20 public holdout and 20 smoke entirely from tuning.

The standalone version stratifies two holdout items per category: 6 easy/8 medium/6 hard, without smoke overlap. Retests cover simple/medium tasks as well as the difficult tail.

Design references Sofia's app-first routing, on-phone Agent, system Notes, built-in browser, files, approvals, peers and scheduled transactions, plus known long-text, login-loop, source-coverage and semantic-inference problems. Observed design-source commit: 7eec3bd; Skill catalog: 2026-10-04.10. These are background, not version proof for any new run. The release excludes the original workspace, real device records, diagnostics, signed packages and accounts.

Not every phone has every app or Sofia collaboration capability. Preserve explicit prerequisites/conditional cases and report missing capabilities. Other Agents must record actual routes; different modes are not automatically comparable.

v1.1.0 adds complete English translations beside original Chinese fields. IDs, split/difficulty and grading goals remain unchanged; exact payloads/fixtures are retained and S097 intentionally tests mixed-language routing. Language is frozen per run.

Public holdout supports engineering retests with controlled context access. The repository claims no strict isolation/security certification or new real-device scores.
