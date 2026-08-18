# 01 — 组合状态纯模块化 + 测试基座

**What to build:** 把全部组合逻辑（添加/删除账户、刷新状态转换、平台筛选、总资产与涨跌计算、快照追加）从 Dashboard 组件抽成单一纯模块（reducer 风格，数据拉取作为可注入端口），并建立 Vitest 测试基座，为首批状态转换写测试。UI 组件退化为薄壳，用户可见行为保持不变。

**Blocked by:** None — can start immediately

**Status:** resolved

- [ ] 组合逻辑可从 UI 独立调用，同一输入产生同一输出（纯函数/纯 reducer），fetch 通过注入端口解耦
- [ ] 添加/删除账户、刷新时间戳更新、快照追加、平台筛选、总资产与涨跌计算均有测试覆盖
- [ ] `npm test` 全绿；测试只断言状态转换与外部行为，不触碰 DOM
- [ ] Dashboard 不再内联业务逻辑，重构后 UI 行为与现 demo 一致
