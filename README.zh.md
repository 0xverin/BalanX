<p align="center">
  <h1 align="center">BalanX 💸</h1>
  <p align="center"><b>跨 CEX/DEX 余额监控</b> —— 一个页面实时查看你在 **9 个平台**的 **USD 资产总值**。</p>
</p>

<p align="center">
  <a href="./README.md">English</a>
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

## ✨ 功能特性 <a id="env"></a>

- [x] 📊 实时汇总 **9 个平台**的 **USD 总资产** —— OKX Dex、Hyperliquid、OKX CEX、Binance、Bybit、Gate、Bitget、KuCoin、Aster
- [x] 🧮 每平台全量口径：现货 / 资金 / 杠杆 / 理财 / 合约（含未实现盈亏），自家上架的长尾币按自家行情计价
- [x] 📈 **30 天资产走势图**，UTC+8 每日快照（手动 + 每日自动）
- [x] 🏷️ 真实平台 logo 与逐类型余额拆分
- [x] 🔄 一键刷新，单账户失败隔离
- [x] 🔒 **无数据库、无登录**，所有数据只存你的浏览器 localStorage
- [x] 💾 导出 / 导入 JSON 备份
- [x] 🌍 中英双语界面
- [x] 🧩 注册表驱动，新增平台只需一行配置

## 🚀 快速开始 <a id="quick-start"></a>

```bash
npm install
npm run dev     # → http://localhost:3000
```

## 🔑 配置 / key 从哪来

只有 **OKX Dex** 需要配置 key，其他平台都在页面「添加账户」时输入。

```bash
cp .env.example .env.local
# 填入 OKX_DEX_API_KEY / OKX_DEX_SECRET / OKX_DEX_PASSPHRASE
```

去 **OKX OnchainOS 开发者门户** → **https://web3.okx.com/onchainos/dev-portal** 创建 API key，得到**三件套（API Key + Secret Key + Passphrase）**后填入。

> ⚠️ passphrase 若含 `#` `!`，必须用双引号包裹，否则会被截断（OKX 报 50105）。

其他平台的 key 无需预配置：在「添加账户」表单里填对应平台的 API key 即可（建议只开**只读**权限）。

## 🛡️ Key 安全 <a id="security"></a>

- **所有账户 key 只存在你浏览器 localStorage** —— 不上传、不存储到任何服务器/数据库，也不写进代码仓库。
- **例外**：OKX Dex 的 OnchainOS key 存于**你自己配的服务端环境变量**（`OKX_DEX_*`），由中继服务端签名——唯一放在服务端的 key，git 已忽略、绝不入库。
- 被 CORS 拦截平台的请求经**无状态中继**转发：签名在**你的浏览器**完成，**secret key 从不出客户端**；中继不存储任何数据。

## ⭐ Star 增长

<a href="https://github.com/0xverin/BalanX/stargazers">
  <img src="https://api.star-history.com/svg?repos=0xverin/BalanX&type=Date" width="600" alt="Star 增长图">
</a>
