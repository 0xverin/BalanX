# BalanX — CEX/DEX Balance Monitor

跨 CEX/DEX 的余额统计看板：实时查看你在 **9 个平台**（OKX Dex、Hyperliquid + OKX CEX、Binance、Bybit、Gate、Bitget、KuCoin、Aster）的 USD 资产总值。纯前端为主：**无数据库、无登录**，数据只存在你的浏览器；被 CORS 拦截的平台经一个无状态中继转发。

> 余额以 USD 计，全量口径统计各平台现货 / 资金 / 杠杆 / 理财 / 合约的对应物（含未实现盈亏）。

## 快速开始

```bash
npm install
# 先配置 DEX key（见下节），再：
npm run dev          # → http://localhost:3000
```

---

## DEX 查询：用哪个 API / 哪个 key / 去哪申请

- **查询方式**：链上（DEX）账户余额用 **OKX Dex（OnchainOS Balance API）** 按钱包地址查询（`total-value-by-address` / `all-token-balances-by-address`），无需在你的浏览器里输入 key。
- **需要的 key**：一个 **OKX OnchainOS API key**，三件套：**API Key + Secret Key + Passphrase**。
- **去哪申请**：**OKX OnchainOS 开发者门户**
  👉 **https://web3.okx.com/onchainos/dev-portal**
  （登录后创建 API key，拿到三件套。）
- **配置方式**：把三件套写进环境变量（本地 `.env.local` / Vercel Environment Variables），服务端中继读取并签名。**`.env.local` 已被 git 忽略，key 绝不进入代码仓库**（本项目开源，务必不要把真实 key 提交）。
- **Hyperliquid 不需要任何 key**：用公开 API 按地址查询。

### 本地配置

```bash
cp .env.example .env.local     # 然后填入你的 OnchainOS 三件套
```

```dotenv
OKX_DEX_API_KEY=your-onchainos-api-key
OKX_DEX_SECRET=your-onchainos-secret
OKX_DEX_PASSPHRASE="your-onchainos-passphrase"
```

> ⚠️ **特殊字符**：passphrase 若含 `#` `!` `@`，**必须用双引号包裹**——否则 dotenv 会把结尾的 `#` 当注释截断（实测 14 字符变 13，导致 OKX 报 `50105 OK-ACCESS-PASSPHRASE incorrect`）。Vercel 面板按原文存储、无此问题。

### Vercel 部署

1. Project → **Settings → Environment Variables**，添加三项（**Production** 作用域）：
   - `OKX_DEX_API_KEY` / `OKX_DEX_SECRET` / `OKX_DEX_PASSPHRASE`
2. 添加/更改环境变量后**必须重新部署**才生效。
3. 部署后打开页面 → 添加账户 → 选 **OKX Dex** → 输入名称 + 钱包地址 + 选链 → 保存，显示真实余额即成功。

---

## 平台连通性（实测 2026-08-19）

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

- **中继地址可用 `NEXT_PUBLIC_RELAY_URL` 覆盖**（默认同源 `/api/exchange-relay`），用于把中继迁到出站 IP 被交易所放行的自建实例。
- 排障：浏览器访问 `/api/diag` 可查看中继出站 IP 与 Binance 可达性（200 = 放行 / 451 = 被封）。

---

## Binance 地域限制（重要）

Binance 会封禁部分地区的 API 访问（"Service unavailable from a restricted location"）。浏览器直连的平台不受影响，但 **Binance / Gate / Bitget / KuCoin / OKX Dex 的中继请求由 Vercel 服务器发出**，默认函数区域（常为美国）会被 Binance 拒绝。

**正确设置函数区域**（`vercel.json` 的 `functions.region` 不被 schema 支持）：
1. Vercel → Project → **Settings → Functions → Region** → 选 **Tokyo（nrt1）**（或新加坡 `sin1` / 香港 `hkg1` / 法兰克福 `fra1`）
2. **重新部署**

若所有 Vercel 区域都不行（Binance 封云厂商 IP 段），用 `NEXT_PUBLIC_RELAY_URL` 把中继指到你自己的机器/境外 VPS（你本地网络已验证能通 Binance）。

---

## Design

- **风格**：Fintech/Crypto — 玻璃拟态 + 暗色 OLED（手动暗/亮切换），蓝 `#3B82F6` 主色 / 青 `#06B6D4` / 绿 `#22C55E`，深海军蓝 `#0F172A`
- **字体**：Orbitron（展示）/ Exo 2（正文）/ JetBrains Mono（数字）
- **设计系统**：`design-system/balanx/MASTER.md`
- **术语表**：`CONTEXT.md` · **架构决策**：`docs/adr/0001` 纯前端无库 / `0002` Binance 中继 / `0003` 共享环境凭据 + 多平台中继

## 功能

- 总资产总览 + 30 天快照折线图（UTC+8 日历日）
- 添加/删除账户：平台下拉按凭据字段规格渲染表单（地址型：名称+地址；凭据型：两/三件套）
- CEX 展开按钱包类型小计（含未实现盈亏）；DEX 展开逐 token 明细（< $1 与风险代币不展示）
- 手动刷新 + 每日 UTC+8 24:00 自动刷新/快照（页面打开时）
- EN / 中文 i18n（默认英文）、暗/亮主题、导出/导入 JSON 备份、风险代币开关
- 平台注册表驱动（`lib/platforms.ts`）：新平台 = 注册一行 + 适配器一个

## 测试与构建

```bash
npm test        # Vitest（portfolio 接缝 + 适配器纯函数 + 中继守卫）
npm run build
```
