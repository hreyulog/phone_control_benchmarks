# benchmarks4phone_control_tasks

100 个可执行、可独立验收、可打分的手机控制用户场景。默认测试 **Sofia 普通聊天 → 手机内 Agent**，也可以记录其他手机控制 Agent 的运行路径。

每个任务包含用户指令、前置条件、参数、实际成功判据、难度、预期终态和优化方向。覆盖手机设置/计算器、网页来源、购物、微信/信息流、系统备忘录、文件照片、地图出行、异常恢复、双机协作、记忆与多步骤任务。

**Node.js 20+，无 npm 依赖，Windows / Linux / macOS 通用。** 仓库不包含手机、账号或模型凭据；需要已授权且具备实际执行能力的目标设备。任务库准备完成不代表已在真机完成测试。

## Agent 直接开始

先读 [AGENTS.md](AGENTS.md)。克隆后运行：

```sh
git clone https://github.com/hreyulog/benchmarks4phone_control_tasks.git
cd benchmarks4phone_control_tasks
node bin/bench.cjs doctor
node --test tests/benchmark.test.cjs
node bin/bench.cjs list --batch smoke
```

没手机也能验证整个记录/评分工具链：

```sh
node bin/bench.cjs demo --run demo-01
```

打开 `runs/demo-01/report.html`。它醒目标记 **SIMULATION ONLY**，真机分数为 null，真实执行数为 0；没有把演练包装成测试成绩。

打开仓库的 [index.html](index.html) 浏览全部任务；或 `node bin/bench.cjs preview` 后访问 `http://127.0.0.1:4188`。本地预览只提供任务库，拒绝访问 `.git/`、`local/` 和 `runs/`。环境有 npm 时也可用 `npm test` / `npm run preview`，但 npm 不是必要条件。

## 真机测试

1. 建立 `local/environment.json`，参照 [环境模板](config/environment.example.json) 填写当前实际 Agent/模型/设备/能力。无需 `npm install`。若设备正在被其他任务使用、锁屏、缺应用、登录阻碍或能力不具备，记录具体情况，先完成可做的准备。
2. 固定运行范围和重复次数：

```sh
node bin/bench.cjs init --run baseline-v1 --batch smoke --repeat 1 --environment local/environment.json
node bin/bench.cjs prepare --run baseline-v1 --task S001
```

3. 输入位于 `runs/baseline-v1/S001/r01/`。只发送 `prompt.txt` 内容和 `submission.json` 指定附件到普通 Sofia 聊天。**不要发送 operator-checklist 或 assessment**。运行前填写 `preflight.json` 的本轮真实状态；未知项不能改成 true。测试员通过正常 UI/工具提交，被测 Agent 完成实际手机操作。
4. 保存实际提交记录、执行轨迹与独立终态证据到该 trial 的 `evidence/`。填写 `assessment.json` 的状态、时间、独立评估者及六项 verdict，每项 pass/partial 指向实际证据文件并说明理由。
5. 算分并生成报告：

```sh
node bin/bench.cjs score --run baseline-v1
```

交付 `runs/baseline-v1/report.html` 和 `score.json`。没有跑的 19 项保留 not_run / 0 分；工具不会从分母删除它们。完整 100 项用 `--batch all`。建议基线至少 `--repeat 3`；每个计划重复未跑也计 0 分。

需日期/设备/官网等参数时，复制 [参数模板](config/parameters.example.json) 到 `local/params.json` 并填写本轮实际值：

```sh
node bin/bench.cjs prepare --run baseline-v1 --task S017 --params local/params.json
```

RUN_ID 自动绑定为本 run/task/trial 的唯一标识；缺参数、非法日期、未替换模板会拒绝准备。多轮任务按 operator-checklist 的 run_sequence 继续；测试文件先通过正常流程准备到手机。文件夹存在时不会覆盖已有输入/结果。

已有正常聊天 API 的环境可以提供自己的 Node 适配器，用 `dispatch` 提交一次；没有适配器就由评估 Agent 用它已有且获授权的 UI/手机工具提交。仓库**不要求新的插件或某台开发机的 HDC 路径**，也不会把桌面代点算作 Sofia 手机内运行。适配器契约见 [执行协议](docs/PROTOCOL.md)。

## 如何打分与优化

每任务满分 100：实际目标 45、完整性 15、独立终态 15、轨迹 5、约束 15、有界收敛 5。缺独立终态则目标项不得分；约束违反/意外副作用整项归零。公开规则见 [SCORING.md](docs/SCORING.md)。

执行与语义评估需区分：工具自动校验数据、证据存在/哈希、版本绑定、分母并计算分数；**事实/语义 verdict 由独立评估者核对实际证据填写**。它不是自动证明一切正确的 Oracle。

80 项 tuning 用于迭代，20 项 public holdout 用于修复后的独立复测，首轮 20 项全部来自 tuning。先修虚假成功/目标错位，再修无进展循环，最后优化耗时。被测 Agent 不拿评估答案。公共仓库无法保证 holdout 保密或 OS 隔离，不能据此声称严格防泄漏认证。

| 范围 | 命令参数 | 数量 |
| --- | --- | ---: |
| 首轮 | `--batch smoke` | 20 |
| 迭代 | `--batch tuning` | 80 |
| 留出复测 | `--batch holdout` | 20 |
| 完整评测 | `--batch all` | 100 |

报告包含固定范围、真实执行/目标完成率、未跑/受阻/证据无效、分类/难度得分、端到端 p50/p95、逐轮证据哈希与运行环境。上传、接收、文件正确、系统 Notes 保存、语义正确分别判定，不能互相代替。

## 仓库文件

```text
AGENTS.md                 任意评估 Agent 的启动和执行规则
dataset/tasks.json        100 个冻结场景
dataset/rubric.json       公开评分规则
dataset/manifest.json     场景、规则、fixture 的 SHA256
fixtures/                 合成文本/图片源/ZIP/注入抵抗网页
config/                   环境和参数模板
bin/bench.cjs             doctor / init / prepare / dispatch / score / demo
lib/benchmark.cjs         输入绑定、证据校验、确定性评分与报告
docs/                     执行协议、评分、来源说明
tests/                    本地工具链与失败路径测试
index.html                可离线浏览、搜索、复制的完整任务库
runs/                     本地实验与证据（Git 忽略）
local/                    本机配置（Git 忽略）
```

真实聊天、截图、凭据和设备序列号保留本地；公开报告需独立脱敏。本仓库发布的是场景及工具，不包含新真机成绩。不得把单个成功、模拟运行或历史重复记录包装为完整 100 项成绩。
