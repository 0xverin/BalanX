# BalanX

跨 CEX/DEX 的余额统计看板：用户输入各平台 API 凭据（仅存于浏览器），汇总所有账户的 USD 总价值，展示历史快照曲线。纯前端、无后端、无数据库。中英文界面均使用品牌名 BalanX。

## Language

**账户 (Account)**:
一个监控实体，绑定一个平台的 API 凭据。DEX 账户 = OKX OnchainOS 凭据组（apiKey + secretKey + passphrase）并挂载若干钱包；CEX 账户 = Binance 凭据（apiKey + secretKey）。
_Avoid_: 钱包、地址、平台（平台是平台，账户是账户）

**钱包 (Wallet)**:
DEX 账户下的一个链上地址（如 0x…），一个 DEX 账户可挂多个钱包。CEX 平台没有钱包概念，账户即凭据。
_Avoid_: 账户（CEX 语境下账户 ≠ 钱包）

**余额 (Balance)**:
以 USD 计价的资产价值。DEX 余额直接来自 OKX 的 `totalValue`；CEX 余额 = 各钱包类型余额 × 市价折算。
_Avoid_: 金额、资产（资产指币种本身，余额指价值）

**数量 (Amount)**:
逐 token 明细中币种的数量（如 32.4 ETH），与 USD 价值区分。
_Avoid_: 余额（余额指 USD 价值）

**总资产 (Total Value)**:
全部账户余额的 USD 总和，即页面顶部总概览的数字。

**快照 (Snapshot)**:
某一时刻全部账户 USD 余额的记录，构成折线图的数据点。手动触发或每日自动（UTC+8 24:00），持久化于用户浏览器。
_Avoid_: 记录、历史（历史是快照的集合）

**刷新 (Refresh)**:
向平台 API 重新拉取余额并更新「上次刷新时间」的动作。手动按钮，或每日 UTC+8 24:00 自动触发一次（仅当页面打开时生效）。

**风险代币 (Risk Token)**:
OKX 标记的 honeypot / 空投钓鱼代币，默认从统计中过滤（OKX API 默认即过滤，即 `excludeRiskToken` 默认开启）。

**链 (Chain)**:
DEX 账户级配置，指定该账户的钱包查询哪些链。当前仅支持 ETH（chainId `1`）与 BSC（chainId `56`），在添加账户时选择。

**备份 (Backup)**:
用户手动导出/导入的 JSON 文件，包含全部账户配置与快照，用于兜底浏览器数据被清空。

**平台 (Platform)**:
账户所属的交易所类别，当前支持 DEX（OKX OnchainOS）与 CEX（Binance）。
_Avoid_: 账户、交易所

**凭据 (Credential)**:
添加账户时用户输入的 API 密钥材料。仅存于浏览器本地存储，绝不上传任何服务器。
