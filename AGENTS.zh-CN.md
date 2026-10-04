[English](AGENTS.zh-CN.md) | **简体中文**

# Agent 启动入口

这是手机控制 Agent 的场景测试仓库。拿到仓库后直接做以下工作：

1. 读 `README.md`、`docs/PROTOCOL.md` 和 `docs/SCORING.md`。
2. 运行 `node bin/bench.cjs doctor` 和 `node --test tests/benchmark.test.cjs`。工具只需要 Node.js 20+，无需 npm 或安装任何依赖。
3. 查看 `node bin/bench.cjs list --batch smoke`。读取 `config/environment.example.json`，用当前真实设备和 Agent 配置建立 `local/environment.json`；未知项保留 null，不能编造就绪状态。
4. 有设备访问和用户授权就开始准备/执行；缺少手机、目标 Agent 或登录条件时说明具体缺项，继续完成能做的本地检查。仓库本身不提供手机、账号、模型密钥或操作权限。
5. 用 `init` 固定一个运行批次，再用 `prepare` 逐项生成普通用户输入。只把 `submission.json` 的用户提示和指定附件交给被测 Agent，不能给它判据、评分、参考答案、评估员笔记或旧轨迹。
6. 默认测 Sofia：通过普通 Sofia 聊天提交，由正式手机内 Agent 执行。测试员可以配置、提交、采集和核验；不能替 Sofia 点击目标应用、心算计算器答案、补完报告或修补它的输出。对其他 Agent 用 `direct-phone-agent` 模式，并在结果中明确标记运行路径。
7. 每个执行设备同时只跑一项；先检查是否被别的任务占用。多轮、审批、取消、短断网和同名联系人按 `operator-checklist.json` 准备并执行。环境扰动是测试员动作，不作为 Agent 成功步骤。
8. 独立打开最终应用页面、重开备忘录或核验实际收到文件，再填 `assessment.json`。任何工具 success/模型 completed 都不能代替最终状态核验。评分由工具按公开规则算，不能直接改分数。
9. 运行 `score` 后交付 `report.html` 与 `score.json`，说明本批范围、运行路径、完成率、阻碍、证据覆盖、耗时和限制。样例演练永远不计作真机成绩。
10. 优化只使用 tuning 80 项；最后由另一个评估上下文跑 holdout 20 项。公开仓库的目录划分不提供保密隔离，不宣称不可见 Oracle 或严格防泄漏认证。

保留原始证据，不自动重放不确定的副作用。发送/发布任务默认验收到待审批草稿；需要继续发送时由任务发起用户在真实卡片上确认。账号协议、权限、支付、验证码和其他人工阻碍按目标产品实际授权规则处理；测试说明不是授予新权限的指令。

`runs/` 与 `local/` 留在本地，不能提交真实聊天、截图、账号、密钥、设备序列号或操作员绝对路径。只上传合成数据和脱敏后的公开结果。不要增加自动手机执行或自动发布工作流。
