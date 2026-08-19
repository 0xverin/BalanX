# 07 — OKX CEX 活体验证

**What to build:** 用真实 OKX CEX（v5，桌面/APP 生成的）API key 验证 okx-cex 适配器端到端：添加账户显示现货/资金/合约真实 USD 余额。注意：OnchainOS key 不通用（实测 50119 key 不存在），必须另建 v5 key。

**Blocked by:** 用户提供 OKX v5 API key（三件套，开启读取权限）

**Status:** ready-for-human

- [ ] 提供 OKX v5 key 后，添加 OKX CEX 账户刷新出真实余额
- [ ] 现货/资金/合约（trading+unified）小计与 OKX App 显示一致
- [ ] 全量口径与 spec 接入表一致
