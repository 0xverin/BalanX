# 0003 - 共享环境凭据 + 多平台中继

用户要求（2026-08-19）：OKX Dex 的 OnchainOS key 不再由账户表单输入，改为存于**服务端环境变量**（Vercel env / `.env.local`，git 忽略）；DEX / Hyperliquid 账户添加时仅输入「名称 + 钱包地址」。

**后果**：
1. OKX Dex 查询从「浏览器直连（账户内凭据）」改为**经中继、由服务端读取 env key 签名转发**——浏览器读不到服务器环境变量，这是 key 不进浏览器的唯一安全做法（`NEXT_PUBLIC_` 会把 key 打进前端包，等同公开）。
2. 中继从「Binance 专用」升级为**多平台**：Binance/Gate/Bitget/KuCoin 为「浏览器签名直通」模式；OKX Dex 为「服务端签名」模式。白名单按平台收口，仍无存储、无数据库。
3. Hyperliquid 用其公开 API（按地址查询，无需任何 key），不走中继。

**安全边界**：secret 要么在浏览器（CEX 账户、签名在本地）、要么在服务端 env（OKX Dex），中继只转发、从不落盘。apiKey 类标识可经中继传输（Binance/Gate/Bitget/KuCoin 由浏览器传入）。

**CORS 实测结论**（2026-08-19）：直连 = OKX CEX / Bybit / Hyperliquid / Aster；需中继 = Binance / Gate / Bitget / KuCoin（浏览器签名直通）+ OKX Dex（服务端签名）。
