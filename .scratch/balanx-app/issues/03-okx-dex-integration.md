# 03 — OKX DEX 真接入

**What to build:** 浏览器内真实 OnchainOS 签名请求（Web Crypto HMAC-SHA256，apiKey/secretKey/passphrase 三件套），拉取总价值与逐 token 明细并落到账户上，刷新显示真实 USD 余额；风险代币过滤作用于真实返回数据；失败保留上次值并显示可读错误。

**Blocked by:** 01 — 组合状态纯模块化 + 测试基座；02 — 持久化：localStorage + 导出/导入

**Status:** resolved

- [ ] 用真实三件套凭据 + 钱包地址添加账户后显示真实 USD 总价值（total-value 端点）
- [ ] 展开明细显示真实逐 token 列表（代币/余额/价格/USD，按价值排序；all-token-balances 端点）
- [ ] 风险代币开关作用于真实返回的 isRiskToken 数据
- [ ] 刷新失败（无效凭据/限流/网络）保留上次余额并显示可读错误
- [ ] 凭据仅存于浏览器，请求从浏览器直接发出（无任何服务器中转）
