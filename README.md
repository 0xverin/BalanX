# BalanX — CEX/DEX Balance Monitor

**中文**：[README 中文版](README.zh.md)

---

View the real-time **USD value** of your assets across **9 exchanges** (OKX Dex, Hyperliquid, OKX CEX, Binance, Bybit, Gate, Bitget, KuCoin, Aster) in one page. Pure frontend — **no database, no login**; all data stays in your browser.

## Quick start

```bash
npm install
npm run dev     # → http://localhost:3000
```

## What to configure locally / where the key comes from

Only **OKX Dex** needs a configured key; every other exchange's key is entered in the "Add account" form.

```bash
cp .env.example .env.local
# fill OKX_DEX_API_KEY / OKX_DEX_SECRET / OKX_DEX_PASSPHRASE
```

Get the **three-part key** (API Key + Secret Key + Passphrase) from the **OKX OnchainOS dev portal** → **https://web3.okx.com/onchainos/dev-portal** and fill them in.

> ⚠️ Wrap the passphrase in double quotes if it contains `#` / `!`, otherwise it is truncated (OKX error 50105).

Other exchanges — no setup needed: just enter each exchange's API key in the "Add account" form (read-only permission recommended).

## Key security

- **All account keys live only in your browser's localStorage** — never uploaded to, or stored on, any server, database, or in the code repo.
- **Exception**: the OKX Dex OnchainOS key goes in **your own server env** (`OKX_DEX_*`) for server-side signing — the only server-side key; it's git-ignored and never committed.
- Requests to CORS-blocked exchanges go through a **stateless relay**: signing happens **in your browser**, so the **secret never leaves your client**; the relay stores nothing.
