# BalanX — CEX/DEX Balance Monitor

View the real-time **USD value** of your assets across **9 exchanges** (OKX Dex, Hyperliquid, OKX CEX, Binance, Bybit, Gate, Bitget, KuCoin, Aster) in one page. Pure frontend — **no database, no login**; all data stays in your browser.

> Full bilingual documentation (中文 / English, switchable in the page header) is available inside the app at **`/docs`** → run `npm run dev` and open `http://localhost:3000/docs`.

## Quick start

```bash
npm install
npm run dev     # → http://localhost:3000  (docs: /docs)
```

## Local setup

Only **OKX Dex** needs a configured key; every other exchange's key is entered in the "Add account" form.

```bash
cp .env.example .env.local
# fill OKX_DEX_API_KEY / OKX_DEX_SECRET / OKX_DEX_PASSPHRASE
```

The three-part key comes from the **OKX OnchainOS dev portal**: **https://web3.okx.com/onchainos/dev-portal**.

> ⚠️ In `.env.local`, wrap the passphrase in double quotes if it contains `#` / `!` (otherwise it's truncated → OKX error 50105).

## Key security

- **All account keys live only in your browser's localStorage** — never stored on any server, database, or in the code repo.
- **Exception**: the OKX Dex OnchainOS key goes in **your own server env** (`OKX_DEX_*`) for server-side signing — the only server-side key; git-ignored, never committed.
- Blocked-exchange requests go through a **stateless relay**: signing happens **in your browser**; the **secret never leaves your client**; the relay stores nothing.
