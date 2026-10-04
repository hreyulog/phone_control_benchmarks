[English](PROTOCOL.md) | **简体中文**

# 执行协议

## 角色与起始环境

测试员/评估 Agent 负责配置、任务提交、测试数据准备、扰动、证据采集与独立评估。被测 Agent 只拿普通用户指令和本轮附件。默认为 Sofia 普通聊天 → 手机内 Agent → 应用/网页 → 同会话结果；电脑不是目标应用动作或业务结果的替身。其他 Agent 可以用自己的手机控制插件，在 `direct-phone-agent` 模式报告，不能把其结果包装成 Sofia 手机内执行结果。

仓库支持 HarmonyOS 场景和 Android 等其他手机平台上的条件型适配。每次记录真实能力；应用名、系统 Notes、文件选择器、同账号协作、定时事务等无法适配时记前置条件缺失，不把网页或内部笔记替换成指定 App。单机不能完成双机用例，人工扰动用例不能冒充无人值守。

环境至少填写 Agent/版本/模型、时区、操作员、检查时间，以及每台设备别名、平台/系统版本、能力、解锁、电量、活动任务数。版本/Skill/artifact 哈希用于可比性，无法获取要明确说明；不能伪造。实际设备状态会变，task 的 preflight 要再次记录。

## 一个 trial

1. 阅读本任务的 operator-checklist，准备隔离测试账号/联系人、旧稿、文件和特定页面。RUN_ID 每轮唯一。实时网页、价格、票价由评估员按运行时间独立冻结答案与原始来源；不能把过期答案当永久 gold。
2. `prepare` 绑定参数，生成 submission.json / prompt.txt。尚未替换的日期、URL、设备参数会拒绝准备。多轮用例的 run_sequence 必须继续执行，不能只发送第一句话就认定完成。
3. 将 prompt 和 required_attachments 通过正常聊天交给目标 Agent。不要传 operator-checklist、assessment、acceptance、优化提示或历史结果。记录提交时间、实际派发目标和开始状态。
4. 保留完整实际执行轨迹/检查点与结果。目标正在执行时，测试员不能介入完成普通业务动作；验证码、审批和定义好的网络扰动需记录操作者与时刻。未知提交状态不自动重发。
5. 独立检查结果：真正的计算器屏幕；系统 Notes 退出到列表后重新找标题；实际下载到请求机的文件；购物规格价格条件；官方原文的日期与断言。传输成功与内容正确分开核验。文件上传成功不等于对端已接收。
6. 把经过隐私处理的证据复制到本轮 `evidence/`，填写 assessment 的 verdict/evidence/reason。所有 evidence 路径相对本 trial 目录。每个 pass/partial 判据至少有真实文件引用。
7. `score` 校验并生成结果。评估格式错误或缺证据不会导致整个批次消失；该 trial 计为无效且 0 分，继续列出其他任务。修复评估记录后可以重新算分，不能修改用户目标。

## 文件与人工条件

fixtures 是合成数据，不包含真实个人信息。`test-image.svg` 是图片源，进入手机照片库前导出为 PNG/JPEG 并记录实际哈希；测试目录和文件通过正常用户流程保存到设备。`calendar-event.template.txt` 必须绑定未来日期时间，另存 calendar-event.txt。用于注入抵抗的 HTML 要由测试员托管为手机可访问的隔离页面；它的正文不是可信指令。

发送/朋友圈类用例默认验收到真实草稿与审批卡，不自动点击同意。明确测试拒绝/停止的任务由发起用户拒绝或停止。要测最终发送，可在隔离测试联系人中由发起用户确认，再独立检查对端接收；此拓展记录不能替代原冻结目标。新协议、权限、短信验证码、付款按目标产品的合法授权和人工流程处理。

## 可选外部适配器

`node bin/bench.cjs dispatch --run NAME --task S001 --adapter /absolute/path/adapter.cjs` 只在 environment 明确就绪并准备完成后可用。

适配器由本机 Node 运行，接收一个参数：submission.json 的绝对路径。输入仅含 task_id、trial、user_prompt、required_attachments、execution_mode、context_id；不含验收或答案。适配器负责通过该产品正常接口提交**一次**并保存实际 result/trace 至本 trial evidence 中，stdout 可以返回简短状态，不能输出密钥。可通过环境变量 PHONE_BENCH_TRIAL_DIR 找到本 trial 目录。

仓库不内置凭据或假装通用的 HDC/ADB 注入桥。没有适配器时评估 Agent 用其已授权的 UI/手机工具正常提交，按相同协议记录。适配器非零退出/超时表示 dispatch_uncertain，禁止工具自动重试；先查真实任务再处理。stdout 或适配器候选结果不能自动获得评估分。纯 submission 是载荷边界，不是 OS 文件访问隔离；适配器进程仍由测试员在可信本机运行。

## 最终交付

交付 report.html、score.json、manifest 的 hash 与运行环境摘要。runs 为本地私有证据目录，默认忽略。公开成绩须另外脱敏。报告中必须说明 scope/batch/repeats、真机与模拟、正式用户目标完成数、证据覆盖、受阻项和未跑项。优化后用同一冻结协议开新 run 对比；不要修改旧证据和结果。

## 语言

在 `init` 时以 `--lang en` 或 `--lang zh-CN` 绑定语言；不传默认中文。输入、评估与报告携带同一语言，prompt SHA256 绑定实际发送文本。按当前语言执行 `run_sequence`。`submission.json` 另含 `schema_version` 与 `language`；纯载荷仍不含验收。跨语言分别报告，不改写精确中文 fixture。
