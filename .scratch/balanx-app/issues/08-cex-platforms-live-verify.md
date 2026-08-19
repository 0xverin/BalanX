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
