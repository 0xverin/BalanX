# BalanX — CEX/DEX Balance Monitor

在一个页面实时查看你 **9 个平台**（OKX Dex、Hyperliquid、OKX CEX、Binance、Bybit、Gate、Bitget、KuCoin、Aster）的 **USD 资产总值**。纯前端、**无数据库、无登录**，所有数据只存在你的浏览器。

View the real-time **USD value** of your assets across **9 exchanges** in one page. Pure frontend — **no database, no login**; all data stays in your browser.

---

## 🚀 快速开始 / Quick start

```bash
npm install
npm run dev     # → http://localhost:3000
```

---

## 🔑 本地运行要配置什么 / What to configure locally

只有一个 **OKX Dex** 需要配置 key，其他平台的 key 都在页面里「添加账户」时输入即可。

Only **OKX Dex** needs a configured key; every other exchange's key is entered in the "Add account" form.

**1. 复制并填 `.env.local` / copy and fill `.env.local`:**

```bash
cp .env.example .env.local
```

```
OKX_DEX_API_KEY=
OKX_DEX_SECRET=
OKX_DEX_PASSPHRASE=
```

**2. 这个 key 从哪来 / Where this key comes from:**

去 **OKX OnchainOS 开发者门户**申请 → **https://web3.okx.com/onchainos/dev-portal**，创建 API key 得到 **三件套：API Key + Secret Key + Passphrase**，填进上面三项。

Get the **three-part key** (API Key + Secret Key + Passphrase) from the **OKX OnchainOS dev portal** → **https://web3.okx.com/onchainos/dev-portal**.

> ⚠️ 本地 `.env.local` 里，passphrase 若含 `#` `!` 等特殊字符，**必须用双引号包裹**（例：`OKX_DEX_PASSPHRASE="xxx"`），否则会被截断导致 OKX 报 50105。
> In `.env.local`, if the passphrase contains `#` / `!`, **wrap it in double quotes**, otherwise it gets truncated (OKX error 50105).

**3. 其他平台的 key / Other exchanges' keys — 不用预配置：**

在你的"添加账户"表单里，选对应平台、填它家的 API key 即可（在各交易所官网创建，建议只开**只读**权限）。

No setup needed — just enter each exchange's API key in the "Add account" form (create them on each exchange's site, read-only permission recommended).

---

## 🛡️ Key 安全 / Key security

- **所有账户 key 只存在你的浏览器 localStorage** —— 不上传、不存储到任何服务器、数据库，也不写进代码仓库。
  **All account keys live only in your browser's localStorage** — never uploaded to, or stored on, any server, database, or in the code repo.
- **例外**：OKX Dex 的 OnchainOS key 存于**你自己配的服务端环境变量**（`OKX_DEX_*`），由你的中继在服务端签名。这是唯一一个需要放在服务端的 key，且**只在你自己的 Vercel/本地 env 里，git 已忽略，绝不入库**。
  **Exception**: the OKX Dex OnchainOS key goes in **your own server env** (`OKX_DEX_*`), used for server-side signing — the only server-side key, and it's git-ignored, never committed.
- 被 CORS 拦截平台的请求经**无状态中继**转发：签名在**你的浏览器**完成，**secret key 从不出客户端**；中继不存储任何数据。
  Blocked-exchange requests go through a **stateless relay**: signing happens **in your browser** — **the secret never leaves your client**; the relay stores nothing.

---

## ☁️ 部署到 Vercel / Deploy to Vercel

1. 把项目部署到 Vercel（GitHub 导入或 CLI：`npx vercel`）。
2. 在 Vercel → Settings → Environment Variables 添加三项（Production 作用域）：`OKX_DEX_API_KEY` / `OKX_DEX_SECRET` / `OKX_DEX_PASSPHRASE`。
3. **改完环境变量必须重新部署**才生效。

1. Deploy to Vercel. 2. Add the three `OKX_DEX_*` env vars (Production scope). 3. **Redeploy after changing env vars**.

---

## 📚 其他内部文档 / Other docs (for contributors)

- 术语表 Glossary: `CONTEXT.md`
- 架构决策 Architecture decisions: `docs/adr/`
- 规格/方案 Spec: `.scratch/balanx-app/spec.md`
- 测试 Test: `npm test`
