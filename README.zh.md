<p align="center">
  <h1 align="center">BalanX 💸</h1>
  <p align="center"><b>跨 CEX/DEX 余额监控</b> —— 一个页面查看你的 **USD 资产总值**。</p>
</p>

<p align="center">
  <a href="./README.md">English</a>
</p>

---

## ✨ 功能特性

支持查询以下交易所的**总资产（USD）**：

**DEX · Hyperliquid · OKX CEX · Binance · Bybit · Gate · Bitget · KuCoin · Aster**

## 🚀 快速开始

```bash
npm install
npm run dev     # → http://localhost:3000
```

如果本地运行并且需要查询 **DEX** 的资产，请从 OKX 申请 key → **https://web3.okx.com/onchainos/dev-portal**，然后配置到环境变量：

```bash
cp .env.example .env.local
# 填入 OKX_DEX_API_KEY / OKX_DEX_SECRET / OKX_DEX_PASSPHRASE
```

## 🔒 Key 安全

- **所有 key 都不会存储到服务器** —— 只存在你浏览器的 localStorage。
- 请确保你的 key 只有**只读**功能，没有交易/提现等权限。

> 说明：DEX 的 OnchainOS key 存于你自己配的服务端环境变量（唯一放在服务端的一个），git 已忽略、绝不入库。
