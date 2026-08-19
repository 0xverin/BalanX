<p align="center">
  <h1 align="center">BalanX 💸</h1>
  <p align="center"><b>Cross-exchange balance monitor</b> — the real-time <b>USD value</b> of all your crypto, across 9 exchanges, in one page.</p>
</p>

<p align="center">
  <a href="./README.zh.md">中文</a>
</p>

<p align="center">
  [![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
  [![Platform](https://img.shields.io/badge/platform-Web-lightgrey.svg)](https://github.com/0xverin/BalanX)
  [![GitHub stars](https://img.shields.io/github/stars/0xverin/BalanX.svg?style=social)](https://github.com/0xverin/BalanX)
  [![License](https://img.shields.io/github/license/0xverin/BalanX)](https://github.com/0xverin/BalanX)
</p>

---

## ✨ Features <a id="features"></a>

- [x] 📊 Real-time **USD total** across **9 exchanges** — OKX Dex, Hyperliquid, OKX CEX, Binance, Bybit, Gate, Bitget, KuCoin, Aster
- [x] 🧮 Full balance scope per exchange — spot / funding / margin / earn / futures (incl. unrealized PnL), exchange-exclusive tokens priced via their own market
- [x] 📈 **30-day portfolio chart** with UTC+8 daily snapshots (manual + daily auto)
- [x] 🏷️ Accurate platform logos & per-platform balance breakouts
- [x] 🔄 One-click refresh with per-account error isolation
- [x] 🔒 **No database, no login** — all data stays in your browser's localStorage
- [x] 💾 Export / import JSON backup
- [x] 🌍 EN / 中文 bilingual UI
- [x] 🧩 Registry-driven — add a new exchange with one config entry

## 🚀 Quick start <a id="quick-start"></a>

```bash
npm install
npm run dev     # → http://localhost:3000
```

## 🔑 Configuration / where the key comes from

Only **OKX Dex** needs a configured key; every other exchange's key is entered in the **Add account** form.

```bash
cp .env.example .env.local
# fill OKX_DEX_API_KEY / OKX_DEX_SECRET / OKX_DEX_PASSPHRASE
```

Get the **three-part key** (API Key + Secret Key + Passphrase) from the **OKX OnchainOS dev portal** → **https://web3.okx.com/onchainos/dev-portal** and fill them in.

> ⚠️ Wrap the passphrase in double quotes if it contains `#` / `!`, otherwise it is truncated (OKX error 50105).

Other exchanges need no setup — just enter each exchange's API key in the **Add account** form (read-only permission recommended).

## 🛡️ Key security <a id="security"></a>

- **All account keys live only in your browser's localStorage** — never uploaded to, or stored on, any server, database, or in the code repo.
- **Exception**: the OKX Dex OnchainOS key goes in **your own server env** (`OKX_DEX_*`) for server-side signing — the only server-side key; it's git-ignored and never committed.
- Requests to CORS-blocked exchanges go through a **stateless relay**: signing happens **in your browser**, so the **secret never leaves your client**; the relay stores nothing.

## ⭐ Star History

<a href="https://github.com/0xverin/BalanX/stargazers">
  <img src="https://api.star-history.com/svg?repos=0xverin/BalanX&type=Date" width="600" alt="Star history chart">
</a>
