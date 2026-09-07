# 10 — 刷新/快照语义修正 + 刷新提速

**What to build:** 按用户 2026-08-19 的多轮确认修正「较上次快照」对比语义，并消除手动刷新 1-2 分钟的卡顿。

**已确认的语义（设计树已收敛）：**
- 快照序列：同一天（UTC+8 自然日）只留一个点；手动/自动快照都入序列，同日后者替换前者；自动整点快照保留（24:00 刷新 + 落点）；**手动 refresh 永不写快照**（现状已满足，保持）；缺拍不补。
- **「较上次」基准 = 序列中最近的一个可用快照点（手动或自动皆可）**：取「记录时刻晚于当前余额时刻」的点以外的最近一个（即排除本次刷新/落点自身的点）——典型情形 = 昨天 24:00 的点；序列无可用基线 → 显示 "—"。
- UI：标签改为「较上次快照」，并标注基线快照的时间（年月日分时，UTC+8）。
- 性能（刷新时刻数据，无任何跨刷新价格缓存）：每账户 10s 超时（超时保留旧值 + 错误标记）；计价逐币并发 + 同一刷新内按资产 in-flight 去重；OKX Dex 逐 token 明细改为**展开时惰性拉取**（刷新只取总值，变快）；手动刷新保持「一次拿全再刷」不逐账户上屏。
- 顺手修复：`app/api/exchange-relay/route.test.ts` 的 Bitget 路径单复数残留（测试断言 `ticker`，配置/适配器为 `tickers`）——当前 CI 红。

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [x] `Snapshot` 增加可选 `at`（记录时刻 ISO），旧数据缺省兼容
- [x] `deltaVsYesterday` → `deltaVsLastSnapshot`（返回 `number | null`）：基准 = 最近一个「记录时刻 < 当前 lastRefreshed」的快照；无 → null；`appendSnapshot` 写入 `at`；测试更新 + 新增（空序列、落点后基线、缺 at 兼容、还原态）
- [x] `refreshAll` 每账户 10s 超时（`FETCH_TIMEOUT_MS` 导出），超时 → 该账户保留旧值 + error 标记；测试（fake timers，永不 resolve 的 fetcher）
- [x] UI：Overview 显示 "—" 分支 + 「较上次快照 <年月日 分时>」标签（新 i18n key，删 `vsYesterday`）；page.tsx/overview.tsx 传 `delta: number|null` + 基线时间
- [x] 计价并发化（`pricing.ts`）：`publicPrice` 多源并行、`fillOwnPrices` 并发上限、Binance 批量被毒化时二分重试（不再整块逐币风暴）、in-flight 去重（非 TTL 缓存）
- [x] OKX Dex 惰性明细：`okxFetchBalance` 只取总值；新增展开时拉明细的取数路径；`account-card` 展开时 fetch + loading/error + 客户端风险代币过滤
- [x] 修复 `route.test.ts` Bitget 路径断言
- [x] 全量测试绿