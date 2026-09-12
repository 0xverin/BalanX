# 08 — Bybit / Gate / Bitget / KuCoin / Aster 活体验证

**What to build:** 用各平台真实 API key 在 UI 里验证适配器端到端（添加账户刷新出真实余额）。适配器已按各平台官方契约实现 + 单元测试覆盖，活体验证因缺少用户 key 尚未做。

**Blocked by:** 用户提供各平台 API key（只读/读取权限；Bybit/Gate 两件套，Bitget/KuCoin 三件套，Aster 两件套）

**Status:** ready-for-human

- [ ] Bybit：统一账户 + 资金小计真实
- [ ] Gate：现货 + 现货杠杆 + 永续 + 交割真实
- [ ] Bitget：现货 + 合约（U/币本位）真实
- [ ] KuCoin：现货 + 杠杆真实（合约需独立 futures key，见 09）
- [ ] Aster：合约真实（现货尽力而为）
- [ ] 任一刷新失败显示可读错误且不阻断其他账户

## Comments

**2026-09-12 — Gate 活体验证：适配器签名与端点都是错的，已修复**

用用户提供的 Gate 只读 key 直连 `api.gateio.ws` 复现：

1. **签名串错误（主因）**：Gate v4 要求
   `METHOD\nPATH\nQUERY\nSHA512hex(body)\nTIMESTAMP`（秒），旧实现写成
   `GET + path + Date.now()`（无换行、无 body hash、毫秒）→ 每个签名请求都 401
   `INVALID_SIGNATURE`。实测：补上换行 + 空 body 的 SHA512 + 秒级时间戳后
   `/api/v4/spot/accounts` 返回 200。
2. **两个端点是 404**：`/api/v4/spot/margin_accounts` 不存在（应为 `/api/v4/margin/accounts`，
   跨币种杠杆是 `/api/v4/margin/cross/accounts`）；`/api/v4/futures/delivery/accounts`
   不存在（交割是 `/api/v4/delivery/{settle}/accounts`）。
3. **错误被吞掉**：四个请求各自 `.catch(() => [] / null)`，401/404 全部变成默认值，
   于是 UI 显示 0 且不报错——用户看到的现象就是「获取不到余额」。

修复：改用 Gate 官方 `/api/v4/wallet/total_balance` 单次调用（返回每个钱包的 USDT 估值：
spot / margin / cross_margin / futures / delivery / finance / quant / options …），
不再需要客户端定价，覆盖口径更全；错误改为向上抛出，卡片显示 `Gate 401: INVALID_SIGNATURE`
这类可读信息。relay 白名单同步收紧为这一个路径。

验收证据（本机 relay 端到端，2026-09-12）：`status 200`，`total.amount = 14652.51563255`
（spot 14652.52 = USDT 7935.01 + BSC 长尾币 `龙虾` 55248.83 × Gate 自报价 ≈ $6700；该币
Binance/OKX 均不上线，因此官方估值端点比自建定价更可靠）。该账户杠杆/永续/交割钱包均为 0，
无法验证有仓位时的口径——`amount` 直接采用 Gate 自己的估值，未自行加减 `borrowed`/`unrealised_pnl`。

注意：`/wallet/total_balance` 官方说明为「估算值，汇率与余额可能缓存最多 1 分钟」，
用于看板统计口径足够；若日后要做实时盈亏需改用分账户端点。

单元测试：`lib/adapters/gate.test.ts`（签名串格式回归 + 钱包分类聚合）。
