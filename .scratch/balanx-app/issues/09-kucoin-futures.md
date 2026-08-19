# 09 — KuCoin 合约（独立 futures key）

**What to build:** KuCoin 的合约（futures）需要**独立的 futures API key**（现货 key 覆盖不到，用 `X-FUTURES-APIKEY` 头）。当前 KuCoin 适配器实现为现货 + 杠杆（`/api/v2/accounts` + `/api/v1/margin/account`）；如需纳入合约账户，需要：注册表支持「第二个 futures 凭据字段」+ 适配器增加 `/api/v1/account-overview`（futures）+ 中继白名单。

**Blocked by:** 用户确认是否要 KuCoin 合约（并决定是否接受额外输入一个 futures key）

**Status:** needs-info

- [ ] （若采纳）注册表 `credentialFields` 支持可选 futures key
- [ ] KuCoin 合约小计并入总资产
- [ ] 活体验证
