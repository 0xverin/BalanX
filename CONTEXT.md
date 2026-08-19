# BalanX

跨 CEX/DEX 的余额统计看板：用户添加各平台账户（凭据按来源不同：CEX 输入于表单并仅存浏览器、OKX Dex 取自服务端环境变量、Hyperliquid 无需凭据），汇总所有账户的 USD 总价值，展示历史快照曲线。纯前端为主、无数据库；被 CORS 拦截的平台经无状态代理中继。中英文界面均使用品牌名 BalanX。

## Language

**账户 (Account)**:
一个监控实体，绑定一个平台。DEX/Hyperliquid 账户 = 名称 + 钱包地址（可多个）；CEX 账户 = 名称 + 平台凭据。
_Avoid_: 钱包、地址、平台

**钱包 (Wallet)**:
DEX 账户下的一个链上地址（如 0x…），一个 DEX 账户可挂多个钱包。CEX 平台没有钱包概念，账户即凭据。
_Avoid_: 账户（CEX 语境下账户 ≠ 钱包）

**余额 (Balance)**:
以 USD 计价的资产价值。DEX 余额来自 OKX OnchainOS 的 `totalValue`；CEX 余额 = 各钱包类型余额 × 市价折算。
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
OKX 标记的 honeypot / 空投钓鱼代币，默认从统计中过滤（`excludeRiskToken` 默认开启）。明细中 USD 价值 < $1 的代币同样不展示。

**链 (Chain)**:
DEX 账户级配置，指定该账户的钱包查询哪些链。当前支持 ETH（chainId `1`）与 BSC（chainId `56`），在添加账户时选择。

**平台 (Platform)**:
账户所属的交易所类别。当前支持：OKX Dex、Hyperliquid（地址型）；OKX CEX、Binance、Bybit、Gate、Bitget、KuCoin、Aster（凭据型，均按全量口径统计：现货/资金/杠杆/理财/合约的对应物）。
_Avoid_: 账户、交易所

**凭据 (Credential)**:
CEX 账户的 API 密钥材料（apiKey + secretKey [+ passphrase]），仅存于用户浏览器。OKX Dex 的 OnchainOS key 例外：存于服务端环境变量（Vercel env / `.env.local`，git 忽略），绝无可能进入仓库。

**凭据来源 (Credential Source)**:
账户凭据的三个来源：账户自带（CEX 表单输入，存浏览器）、共享环境变量（OKX Dex，服务端签名）、无凭据（Hyperliquid 公开 API）。

**备份 (Backup)**:
用户手动导出/导入的 JSON 文件，包含全部账户配置与快照，用于兜底浏览器数据被清空。

**中继 (Relay)**:
无状态服务器函数（`/api/exchange-relay`），两种模式：被 CORS 拦截的平台（Binance/Gate/Bitget/KuCoin）浏览器签名后经它直通；OKX Dex 由服务端读取环境变量 key 签名后转发。中继有白名单、无存储、无数据库；secret 要么在浏览器要么在服务端 env，从不在中继落盘。
