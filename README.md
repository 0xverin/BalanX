# BalanX — CEX/DEX Balance Monitor

Cross-exchange balance monitor: real-time USD value of your assets across **9 platforms** — OKX Dex, Hyperliquid (address-based) and OKX CEX, Binance, Bybit, Gate, Bitget, KuCoin, Aster (credential-based, full balance scope). Pure frontend-first: **no database, no login**. All data lives in your browser; a stateless relay bridges the platforms whose CORS blocks browser calls.

> 余额以 USD 计。全量口径统计各平台现货 / 资金 / 杠杆 / 理财 / 合约的对应物（含未实现盈亏）。

## Run locally

```bash
npm install
npm run dev          # → http://localhost:3000
```

## Environment variables (required for OKX Dex)

OKX Dex 的 OnchainOS key 存于服务端环境变量（**git 忽略**，绝不入库）。本地：

```bash
cp .env.example .env.local   # 然后填入你的三件套
```

```
OKX_DEX_API_KEY=your-okx-onchainos-api-key
OKX_DEX_SECRET=your-okx-onchainos-secret
OKX_DEX_PASSPHRASE="your-okx-onchainos-passphrase"
```

> ⚠️ **重要**：passphrase 若含 `#` `!` `@` 等特殊字符，**必须用双引号包裹**——否则 dotenv 会把结尾的 `#` 当注释截断（实测 14 字符变 13，导致 OKX 报 50105 passphrase incorrect）。Vercel 面板里的环境变量是按原文存储、无此问题，但仍建议直接粘贴。

Vercel 部署：Project → Settings → Environment Variables 添加同名三项（OKX Dex 查询会自动经服务端中继签名，key 不进浏览器、不进出代码仓库）。

## Platform connectivity (verified 2026-08-19)

| 平台 | 浏览器直连 | 经中继 | 签名 |
|---|---|---|---|
| OKX Dex | — | 服务端签名（env key）| OKX 标准（HMAC-SHA256 → Base64）|
| Hyperliquid | ✅ 直连 | — | 无需凭据（公开 API 按地址查）|
| OKX CEX | ✅ 直连 | — | OKX v5 标准 |
| Binance | — | 浏览器签名直通 | HMAC-SHA256 → hex |
| Bybit | ✅ 直连 | — | v5（X-BAPI-*）|
| Gate | — | 浏览器签名直通 | v4（HMAC-SHA512）|
| Bitget | — | 浏览器签名直通 | v2（Base64 HMAC-SHA256）|
| KuCoin | — | 浏览器签名直通 | v2（KC-API-*）|
| Aster | ✅ 直连 | — | Binance 系（fapi.asterdex.com）|

## Design

- **Style:** Fintech/Crypto — Glassmorphism + Dark OLED（手动暗/亮切换），蓝 `#3B82F6` 主色 / 青 `#06B6D4` / 绿 `#22C55E`，深海军蓝 `#0F172A`
- **Fonts:** Orbitron（展示）/ Exo 2（正文）/ JetBrains Mono（数字）
- **Design system:** `design-system/balanx/MASTER.md`
- **Domain glossary:** `CONTEXT.md` · **Architecture decisions:** `docs/adr/0001` 纯前端无库 / `0002` Binance 中继 / `0003` 共享环境凭据 + 多平台中继

## Features

- 总资产总览 + 30 天快照折线图（UTC+8 日历日）
- 添加/删除账户：平台下拉按凭据字段规格渲染表单（地址型：名称+地址；凭据型：两/三件套）
- CEX 展开按钱包类型小计（含未实现盈亏）；DEX 展开逐 token 明细（< $1 与风险代币不展示）
- 手动刷新 + 每日 UTC+8 24:00 自动刷新/快照（页面打开时）
- EN / 中文 i18n（默认英文）、暗/亮主题、导出/导入 JSON 备份、风险代币开关
- 平台注册表驱动（`lib/platforms.ts`）：新平台 = 注册一行 + 适配器一个

## Test & build

```bash
npm test        # Vitest（portfolio 接缝 + 适配器纯函数 + 中继守卫）
npm run build
```
