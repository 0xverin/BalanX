# BalanX — CEX/DEX Balance Monitor

Status: `ready-for-agent`
Feature: balanx-app
Source: design demo approved 2026-08-18 (mock data); this spec describes the real functionality to build on top of it.

---

## Problem Statement

用户同时在多个平台持有资产：链上钱包（OKX DEX / OnchainOS 查询）与中心化交易所（Binance）。目前要分别登录每个平台才能知道总共有多少钱，无法在一个地方看到全部资产的实时 USD 价值，也无法回顾余额的历史走势。

用户还要求：API 凭据不能上传任何服务器（第三方保管密钥有安全顾虑），所以方案必须是纯前端；未来要接入更多平台（Gate、Bybit、Bitget 等），布局必须为此预留扩展位。

## Solution

BalanX —— 一个纯前端（无后端、无数据库）的跨 CEX/DEX 余额统计看板：用户添加账户（输入各平台 API 凭据，仅存于浏览器 localStorage），系统实时汇总所有账户的 USD 总价值，展示 30 天快照折线图；支持每日自动 + 手动快照、中英双语、暗/亮主题、导出/导入 JSON 备份。凭据绝不上传任何服务器（ADR-0001）。

设计风格已定稿：Fintech/Crypto —— 玻璃拟态 + 暗色 OLED，蓝 `#3B82F6` 主色 / 青 `#06B6D4` 点缀 / 绿 `#22C55E` 增长，深海军蓝 `#0F172A` 底，Orbitron + Exo 2 + JetBrains Mono 字体（见 `design-system/balanx/MASTER.md`）。

## User Stories

### 总概览与刷新

1. As a 用户, I want 在一个页面看到所有平台所有账户余额的 USD 总和, so that 我一眼知道全部资产价值
2. As a 用户, I want 看到总资产较昨日（上次快照）的涨跌额与涨跌方向, so that 我快速感知资产变化
3. As a 用户, I want 点击「刷新」按钮重新拉取所有账户余额, so that 余额保持最新
4. As a 用户, I want 看到全局「上次刷新时间」, so that 我知道数据的新鲜度
5. As a 用户, I want 每日 UTC+8 24:00 自动刷新一次并记录快照, so that 我不手动操作也有每日余额记录（页面打开时生效，纯前端约束）
6. As a 用户, I want 看到 30 天总资产折线图, so that 我回顾资产走势
7. As a 用户, I want 刷新失败时账户保留上次成功值并显示错误状态, so that 部分平台故障不影响整体视图

### 账户管理

8. As a 用户, I want 点击「添加账户」弹出表单, so that 我录入新平台凭据
9. As a 用户, I want 用下拉框选择平台（而非铺开的网格）, so that 添加界面整洁且可容纳很多平台
10. As a 用户, I want 未接入的平台（Gate、Bybit、Bitget）在下拉中置灰并标注「即将支持」, so that 我知道它们的接入状态
11. As a 用户, I want DEX 账户表单包含：账户名称、apiKey、secretKey、passphrase、钱包地址列表（可加多行）、链选择（ETH/BSC）, so that 我一次录入完整的 OKX OnchainOS 凭据与查询范围
12. As a 用户, I want Binance 账户表单包含：账户名称、apiKey、secretKey, so that 我录入 Binance 读取凭据
13. As a 用户, I want 表单校验提示必填缺失项, so that 我不会保存残缺账户
14. As a 用户, I want 删除账户时二次确认, so that 我不会误删
15. As a 用户, I want 删除后该账户不再被统计、余额从后续快照中移除, so that 统计口径与实际持有一致
16. As a 用户, I want 每个账户卡片显示准确平台 logo 与平台名（Binance 用官方菱形标志，DEX 用钱包图标）, so that 我一眼识别平台
17. As a 用户, I want 账户卡片显示名称、总价、最后刷新时间, so that 概览信息完整
18. As a 用户, I want 在账户区用平台下拉筛选账户, so that 平台多了以后能聚焦查看
19. As a 用户, I want 首次使用（无账户）时看到引导页与 OKX/Binance key 申请说明, so that 我知道怎么开始

### 余额明细

20. As a 用户, I want DEX 账户展开显示逐 token 明细（代币、余额、价格、USD 价值，按价值排序）, so that 我知道链上资产构成
21. As a 用户, I want 风险代币（OKX 标记的 honeypot/空投钓鱼币）默认从统计与明细中过滤并可设置开关, so that 余额不被垃圾币虚增
22. As a 用户, I want Binance 账户展开按钱包类型显示小计（现货/资金/杠杆/理财/合约）, so that 我知道钱在 Binance 的分布
23. As a 用户, I want 合约小计包含未实现盈亏（真实权益）, so that 显示的是可交易的实时市值

### 设置与数据安全

24. As a 用户, I want 语言在 英文/中文 间切换并记住选择（默认英文）, so that 我用习惯的语言使用
25. As a 用户, I want 主题在 暗色/亮色 间手动切换并记住选择, so that 我按环境选择
26. As a 用户, I want 导出全部数据（账户配置 + 快照）为 JSON, so that 浏览器清空数据时我有备份
27. As a 用户, I want 导入 JSON 恢复账户与快照, so that 换设备/清缓存后能还原
28. As a 用户, I want 一键清空所有数据（二次确认）, so that 我能彻底重置
29. As a 用户, I want 凭据只存在我的浏览器里，绝不上传任何服务器, so that 我没有第三方保管密钥的安全顾虑

### 平台扩展

30. As a 用户, I want 接入新平台只需注册一行配置与一个 logo, so that 后续加 Gate/Bybit/Bitget 不需要改组件结构

## Implementation Decisions

### 架构

- **纯前端**（ADR-0001）：Next.js（App Router，SSG 静态部署于 Vercel），无后端、无数据库、无登录。全部状态（账户、快照、偏好、凭据）持久化于浏览器 localStorage。浏览器直连交易所 API —— 已实测 CORS 可行。
- **组合状态接缝**：把账户增删、刷新、快照、平台筛选、总资产/涨跌计算收口到单一纯模块（reducer 风格，e.g. `portfolio`），UI 组件是其薄壳。这是本 spec 的唯一测试接缝（见 Testing Decisions）。
- **平台注册表**：单一事实源 `lib/platforms` —— 每平台一条元数据（id、i18n 名称 key、品牌色、logo 类型、dex/cex、supported/coming-soon）。账户卡片、平台下拉、筛选下拉、添加账户表单全部由注册表驱动。新增平台 = 注册一行 + logo 一个 case。
- **领域类型**（对齐 `CONTEXT.md` 术语）：`Account`（账户 = 平台凭据；DEX 挂 `wallets`，CEX 挂 `typeSubtotals`）、`Wallet`（钱包，链上地址）、`TokenBalance`（逐 token USD 明细）、`Snapshot`（快照：日期 + 每账户余额 + 总资产）。
- **i18n**：语义 key 词典（en/zh），key 与术语表对齐以保证命名准确；品牌名中英文均为 BalanX。

### 交易所 API 契约（均已核实，纯浏览器可行）

**OKX DEX（OnchainOS Balance API）**，认证头 `OK-ACCESS-KEY / OK-ACCESS-SIGN / OK-ACCESS-PASSPHRASE / OK-ACCESS-TIMESTAMP`，签名 = `Base64(HMAC-SHA256(timestamp + method + requestPath + body, secretKey))`：
- 总价值：`GET https://web3.okx.com/api/v6/dex/balance/total-value-by-address?address=…&chains=…` → `data[0].totalValue`（USD 字符串）
- 逐 token：`GET https://web3.okx.com/api/v6/dex/balance/all-token-balances-by-address?address=…&chains=…` → `data[0].tokenAssets[{symbol, balance, tokenPrice, isRiskToken, chainIndex}]`，每 token USD = balance × tokenPrice
- 参数：`chains` 逗号分隔（ETH=`1`，BSC=`56`，最多 50 条）；`excludeRiskToken` 默认开启（过滤 honeypot/空投垃圾币）

**Binance（8 个签名端点，全部 `Access-Control-Allow-Origin: *`）**，HMAC-SHA256 + `X-MBX-APIKEY`：
- 现货 `GET /api/v3/account`（free + locked）
- 资金账户 `POST /sapi/v1/asset/get-funding-asset`（一次全返回，注意是 POST）
- 全仓杠杆 `GET /sapi/v1/margin/account`、逐仓杠杆 `GET /sapi/v1/margin/isolated/account` —— **净值口径**：free + locked − 借贷 − 利息，绝不用毛资产
- 理财 `GET /sapi/v1/simple-earn/flexible/position` + `locked/position`（无 USD 字段，需折算）
- 合约 `GET /fapi/v2/balance`（U 本位，加 `crossUnPnl` 才是真实权益）+ `GET /dapi/v1/balance`（币本位，需价格折算）
- 计价：收集全部币种后**一次批量** `GET /api/v3/ticker/price?symbols=[…]`（1–20 币权重仅 2）；无 USDT 对价币种经 BTC 折算
- 权限要求：key 需开启 `Enable Spot & Margin Trading`（含资金账户+理财）、`Enable Margin`、`Enable Futures`，缺失报 -2015
- 限流：spot 权重 6000/分/IP，全账户一次刷新约 150 权重；429 退避、注意 `X-MBX-USED-WEIGHT-1M`

### 刷新与快照

- 刷新：手动按钮 + 每日 UTC+8 24:00 自动一次（页面打开时，`setInterval` 对时）。刷新 = 顺序/受限并发调用各平台，聚合后更新账户余额与「上次刷新时间」；单账户失败不阻断整体，保留上次值并标记错误。
- 快照：每日自动 + 手动打点。每条快照记录**每账户余额 + 总资产**（未来导出「每日收益」需要账户粒度），折线图只画总资产。
- 显示：USD 两位小数 + 千分位，数字用等宽字体（tabular-nums）。

### 数据与安全

- localStorage key 约定：账户 + 快照 + 偏好（语言/主题/风险代币开关）分开存或单 JSON；导出文件 = `{version, exportedAt, accounts, snapshots}`。
- 凭据明文存 localStorage（纯前端约束，ADR-0001 已记录该权衡）；备份导出/导入是唯一数据保险。

## Testing Decisions

- **单一接缝**：组合状态纯模块（`portfolio`）。所有用户可见行为（添加/删除账户、刷新更新余额与时间戳、快照追加、平台筛选、总资产与涨跌计算、备份序列化/恢复）都收口在它上面 —— 一个接缝，UI 零测试。
- **好的测试标准**：只测外部行为与状态转换，不测实现细节。e.g. 给定账户列表 + `addAccount(draft)` → 列表包含新账户且 `total` 增加；`refresh` 后所有账户 `lastRefreshed` 更新；删除后 `total` 排除该账户；快照按序追加且折线图数据点按日期有序；筛选函数返回符合平台的子集。
- **运行器**：Vitest（新增 devDependency）。纯函数测试，无 DOM/jsdom 依赖。
- **先例**：仓库当前零测试，此为第一批；后续接真实 API 时，同一模块成为 mock-fetch 注入点（fetch 契约测试在同一接缝扩展）。

## Out of Scope

- 多用户、登录鉴权、任何服务端逻辑（ADR-0001 明确无后端）
- Gate / Bybit / Bitget 等新平台的实际 API 接入（注册表与 UI 就绪，接入本身待后续需求）
- 腾讯表格 / 谷歌表格自动导出（用户暂缓，快照数据已按可导出形态存储）
- Binance 逐币种明细（一期仅类型小计）
- 账户编辑（改名称/加钱包地址 —— 删除重加）
- 每钱包级链配置（一期链为账户级：ETH + BSC）
- 自动跟随系统主题（手动切换）
- OKX CEX 及其他账户类型
- 纯前端以外的部署形态（Vercel 静态托管）

## Further Notes

- 设计 demo 已验收：风格（玻璃拟态 + 蓝绿）、交互（下拉、卡片、弹窗）、i18n（默认英文）、平台注册表扩展位均已确认；本 spec 描述其上构建的真实功能。
- 每日自动快照依赖页面打开 —— 这是纯前端架构的已知代价（ADR-0001），用户已接受。
- 真机联调前需用户提供：OKX OnchainOS 三件套凭据、Binance key（已开对应权限）、测试钱包地址。
- 品牌名中英文均为 BalanX（i18n 不翻译品牌）。
