<p align="center">
  <h1 align="center">BalanX 💸</h1>
  <p align="center"><b>Cross-exchange balance monitor</b> — the real-time <b>USD value</b> of all your crypto, in one page.</p>
</p>

<p align="center">
  <a href="./README.zh.md">中文</a>
</p>

---

## ✨ Features

Queries the **total assets (USD)** of the following exchanges:

**DEX · Hyperliquid · OKX CEX · Binance · Bybit · Gate · Bitget · KuCoin · Aster**

## 🚀 Quick start

```bash
npm install
npm run dev     # → http://localhost:3000
```

To query **DEX** assets locally, apply for an **OKX OnchainOS API key** from OKX → **https://web3.okx.com/onchainos/dev-portal**, then configure it in the environment:

```bash
cp .env.example .env.local
# fill in OKX_DEX_API_KEY / OKX_DEX_SECRET / OKX_DEX_PASSPHRASE
```

## 🔒 Key security

- **All keys are never stored on the server** — they live only in your browser's localStorage.
- Make sure your exchange API keys have **read-only** permission only — no trading / withdrawal access.

> Note: the DEX OnchainOS key is kept in your own server environment (the one server-side case), git-ignored and never committed.
