# BalanX — CEX/DEX Balance Monitor

Status: `ready-for-agent`
Feature: balanx-app
Source: design demo approved 2026-08-18; multi-platform expansion approved 2026-08-19

---

## Problem Statement

用户同时在多个平台持有资产：链上钱包（经 OKX OnchainOS 查询）、去中心化交易所（Hyperliquid）与多家中心化交易所（Binance、OKX、Bybit、Gate、Bitget、KuCoin、Aster）。目前要分别登录每个平台才能知道总共有多少钱，无法在一个地方看到全部资产的实时 USD 价值，也无法回顾余额历史。

核心约束：凭据安全（CEX 密钥仅存浏览器或服务端 env，绝不出现在代码仓库）、无数据库、部署于 Vercel、未来可持续接入更多平台。

## Solution

BalanX —— 纯前端为主的跨 CEX/DEX 余额统计看板：用户添加账户（凭据来源：CEX 表单输入存浏览器 / OKX Dex 服务端 env / Hyperliquid 无凭据），系统实时汇总全部账户的 USD 总价值，展示 30 天快照折线图；每日自动 + 手动快照、中英双语、暗/亮主题、导出/导入备份。被 CORS 拦截的平台经无状态中继转发（ADR-0002/0003）。

**支持平台（9）**：OKX Dex、Hyperliquid（地址型）；OKX CEX、Binance、Bybit、Gate、Bitget、KuCoin、Aster（凭据型，全量口径）。

## User Stories

### 总概览与刷新

1. As a 用户, I want 在一个页面看到所有平台所有账户余额的 USD 总和, so that 我一眼知道全部资产价值
2. As a 用户, I want 看到总资产较昨日（上次快照）的涨跌额与涨跌方向, so that 我快速感知资产变化
3. As a 用户, I want 点击「刷新」按钮重新拉取所有账户余额, so that 余额保持最新
4. As a 用户, I want 看到全局「上次刷新时间」, so that 我知道数据的新鲜度
5. As a 用户, I want 每日 UTC+8 24:00 自动刷新一次并记录快照, so that 我不手动操作也有每日余额记录（页面打开时生效）
6. As a 用户, I want 看到最近 30 天总资产折线图, so that 我回顾资产走势
7. As a 用户, I want 刷新失败时账户保留上次成功值并显示错误状态, so that 部分平台故障不影响整体视图

### 账户管理

8. As a 用户, I want 点击「添加账户」弹出表单, so that 我录入新平台账户
9. As a 用户, I want 用下拉框选择平台, so that 界面整洁且可容纳很多平台
10. As a 用户, I want 添加账户表单按平台渲染对应字段（凭据字段规格）, so that 每个平台只要求它需要的输入
11. As a 用户, I want DEX/Hyperliquid 账户只需输入名称 + 钱包地址（可多地址）, so that 添加地址型账户最省事（OKX Dex key 自动取自服务端环境变量）
12. As a 用户, I want OKX Dex 账户选择查询链（ETH/BSC）, so that 我控制链上查询范围
13. As a 用户, I want CEX 账户按平台输入对应凭据（两件套/三件套）, so that 凭据字段与平台一致
14. As a 用户, I want 表单校验提示必填缺失项, so that 我不会保存残缺账户
15. As a 用户, I want 删除账户时二次确认, so that 我不会误删
16. As a 用户, I want 删除后该账户不再被统计、余额从后续快照中移除, so that 统计口径与实际持有一致
17. As a 用户, I want 每个账户卡片显示准确平台 logo 与平台名, so that 我一眼识别平台
18. As a 用户, I want 在账户区用平台下拉筛选账户, so that 平台多了以后能聚焦查看
19. As a 用户, I want 首次使用（无账户）时看到引导页, so that 我知道怎么开始

### 余额明细

20. As a 用户, I want DEX 账户展开显示逐 token 明细（代币、数量、价格、USD 价值，按价值排序，< $1 与风险代币不展示）, so that 我知道链上资产构成
21. As a 用户, I want 风险代币默认过滤并可设置开关（影响统计口径与明细）, so that 余额不被垃圾币虚增
22. As a 用户, I want CEX 账户展开按钱包类型显示小计（现货/资金/杠杆/理财/合约的对应物）, so that 我知道钱在每个平台的分布
23. As a 用户, I want 合约小计包含未实现盈亏（真实权益）, so that 显示的是可交易的实时市值
24. As a 用户, I want Hyperliquid 账户展示现货 + 永续余额（无凭据）, so that 免 key 追踪链上 DEX 资产

### 设置与数据安全

25. As a 用户, I want 语言在 英文/中文 间切换并记住选择（默认英文）, so that 我用习惯的语言使用
26. As a 用户, I want 主题在 暗色/亮色 间手动切换并记住选择, so that 我按环境选择
27. As a 用户, I want 导出全部数据（账户配置 + 快照）为 JSON, so that 浏览器清空数据时我有备份
28. As a 用户, I want 导入 JSON 恢复账户与快照, so that 换设备/清缓存后能还原
29. As a 用户, I want 一键清空所有数据（二次确认）, so that 我能彻底重置
30. As a 用户, I want CEX 凭据只存在我的浏览器、OKX Dex key 只存在服务端环境变量，均不出现在代码仓库, so that 没有密钥泄露风险

### 平台扩展

31. As a 用户, I want 接入新平台只需注册一行配置（凭据字段规格 + 余额类型 + logo）, so that 后续加平台不需要改组件结构
32. As a 用户, I want 各平台全量口径：现货、资金、杠杆、理财、合约的对应物, so that 统计与平台实际持有一致

## Implementation Decisions

### 架构

- **纯前端为主**（ADR-0001）：Next.js App Router 静态部署于 Vercel；无数据库、无登录。账户、快照、偏好持久化于浏览器 localStorage。被 CORS 拦截的平台经无状态中继（ADR-0002/0003）。
- **组合状态接缝**：`portfolio` 纯模块（账户增删、刷新、快照、筛选、总资产/涨跌、序列化），UI 为薄壳。唯一测试接缝。
- **平台注册表** `lib/platforms`：每平台元数据 = id、i18n 名称 key、品牌色、logo key、dex/cex、状态、**凭据字段规格**（`[]` 地址型 / `[apiKey, secretKey]` / `[apiKey, secretKey, passphrase]`）、**余额类型列表**（现货/资金/杠杆/理财/合约的对应物）。账户卡片、平台下拉、添加表单、筛选全部由注册表驱动。
- **凭据来源**（ADR-0003）：CEX 账户 = 表单输入、存 localStorage；OKX Dex = 服务端环境变量（Vercel env / `.env.local`，git 忽略），中继服务端签名；Hyperliquid = 无凭据（公开 API 按地址查询）。
- **i18n**：语义 key 词典（en/zh），与术语表对齐；品牌名中英文均为 BalanX。

### 平台接入表（CORS 实测 + 认证）

| 平台 | 凭据 | 签名 | 中继 | 全量口径 |
|---|---|---|---|---|
| OKX Dex | 无（env key 服务端）| OKX 标准（HMAC-SHA256→Base64）| 服务端签名 | 逐 token 总价值（链上）|
| Hyperliquid | 无 | —（公开 API）| 直连 | 现货 + 永续 |
| OKX CEX | apiKey+secret+passphrase | OKX v5 标准 | 直连 | 现货 + 资金 + 交易(合约) + 统一账户 |
| Binance | apiKey+secret | HMAC-SHA256→hex | 直通 | 现货 + 资金 + 杠杆 + 理财 + 合约 |
| Bybit | apiKey+secret | v5（X-BAPI-*，HMAC→hex）| 直连 | 统一账户 + 资金 |
| Gate | apiKey+secret | v4（HMAC-SHA512）| 直通 | 现货 + 现货杠杆 + 永续 + 交割 |
| Bitget | apiKey+secret+passphrase | v2（HMAC-SHA256→Base64）| 直通 | 现货 + 合约(U/币本位) |
| KuCoin | apiKey+secret+passphrase | v2（HMAC-SHA256→Base64）| 直通 | 现货 + 杠杆 + 合约 + 理财 |
| Aster | apiKey+secret | Binance 系（fapi.asterdex.com）| 直连 | 合约（+ 现货尽力而为）|

- **中继** `/api/exchange-relay`：两种模式——`signed`（Binance/Gate/Bitget/KuCoin：浏览器签名，转发 `X-MBX-APIKEY`/`KEY`/`ACCESS-*`/`KC-API-*` 头与已签名查询串）与 `server-signed`（OKX Dex：服务端读 env key 签名）。白名单按平台收口、无存储、无数据库。
- **统一计价**：共享计价模块——Binance 批量 ticker（浏览器直连）+ OKX v5 行情兜底；DEX 账户用 OKX 返回的 tokenPrice。
- **环境变量**（Vercel env / `.env.local`，git 忽略）：`OKX_DEX_API_KEY` / `OKX_DEX_SECRET` / `OKX_DEX_PASSPHRASE`。

### 刷新与快照

- 刷新：手动 + 每日 UTC+8 24:00 自动（页面打开时）。顺序/受限并发调用各平台，单账户失败隔离（保留上次值 + 错误标记 + 可读错误映射：-2015 权限、429 限流）。
- 快照：每日自动 + 手动，日期按 UTC+8 日历日，同一天去重；每账户粒度存储，图表画总资产。
- 显示：USD 两位小数 + 千分位，等宽字体。

## Testing Decisions

- **单一接缝**：`portfolio` 纯模块（添加/删除、刷新带注入 fetcher、快照、筛选、总资产/涨跌、序列化/恢复）——全部外部行为收口于此，UI 零测试。
- **适配器纯函数**：各平台的签名构造（与 node:crypto 交叉验证）、响应映射、计价聚合（活体验证数据做 fixture）在适配器测试中覆盖；真实网络调用以真实凭据在验收阶段验证。
- **中继守卫**：`isAllowedRelay` 纯函数测试（平台/路径白名单、禁止穿越、畸形 body 不抛 500）。
- **运行器**：Vitest；先例：现有 52 个测试。

## Out of Scope

- 多用户、登录、任何数据库
- 交易/下单/划转等写操作（只读统计）
- 平台自带的杠杆/理财中无法通过公开 API 获取的部分（按接入表尽力而为）
- 腾讯/谷歌表格自动导出（暂缓）
- 账户编辑（删除重加）、每钱包级链配置、自动跟随系统主题
- 除 ETH/BSC 外的更多链（DEX）

## Further Notes

- 设计已验收（玻璃拟态 + 蓝绿、下拉、卡片、i18n、注册表扩展位）。
- 每日快照依赖页面打开（ADR-0001 代价）。
- 新平台适配器以现有 Binance 适配器为模板（签名 → 多端点 → 聚合 → 计价）；Aster 为 Binance 系 API，直接复用签名逻辑。
- 部署：Vercel env 需配置 `OKX_DEX_API_KEY/SECRET/PASSPHRASE`（README 有指引）。

## 运营与部署事实（2026-08-19 追加）

- **环境变量**：`OKX_DEX_API_KEY/SECRET/PASSPHRASE`（OnchainOS 三件套）存于 Vercel Env（Production 作用域）/ 本地 `.env.local`，git 忽略；申请地址 `https://web3.okx.com/onchainos/dev-portal`（README 已写明）。改 env 后必须重新部署。⚠️ `.env.local` 中 passphrase 含 `#` 必须加引号（否则被 dotenv 截断 → OKX 50105）。
- **中继区域（Binance 地域封锁）**：Binance 按出站 IP 封地区；Vercel 默认函数区域（美国）被拒。正确做法 = Vercel → Settings → Functions → Region 设为 Tokyo `nrt1`（`vercel.json` 的 `functions.region` 不被 schema 支持，勿用）。换区域后重新部署。若所有 Vercel 区域均被封，用 `NEXT_PUBLIC_RELAY_URL` 把中继迁到自建实例。
- **中继诊断**：`/api/diag` 返回中继出站 IP 与 Binance 可达性（200 放行 / 451 封）——排障地域问题用。
- **`error` 字段不持久化**：账户的刷新错误是瞬时状态，`serializeState` 会剥掉它（避免刷新页面后残留旧报错；测试覆盖）。
- **水合**：账户/主题从 localStorage 的恢复放在首帧后的微任务里，保证 SSR 基线一致（无 React #418）。
- **活体验证状态**：Binance（经中继，含净值/未实现盈亏）✅、OKX Dex（服务端签名）✅、Hyperliquid（公开 API，需有账户的地址）✅、OKX CEX ⚠️ 需用户单独的 v5 桌面/APP API key（OnchainOS key 不通用）、Bybit/Gate/Bitget/KuCoin/Aster ⚠️ 待用户提供各平台 key 在 UI 验证。
- **已知缺口**：KuCoin 合约需独立 futures key（现货 key 覆盖不到），当前 KuCoin 实现为现货+杠杆；Aster 现货为尽力而为；其余平台按接入表全量。
