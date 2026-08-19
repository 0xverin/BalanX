# BalanX — CEX/DEX 余额监控

[English](README.md)

在一个页面实时查看你 **9 个平台**（OKX Dex、Hyperliquid、OKX CEX、Binance、Bybit、Gate、Bitget、KuCoin、Aster）的 **USD 资产总值**。纯前端、**无数据库、无登录**，所有数据只存在你的浏览器。

## 快速开始

```bash
npm install
npm run dev     # → http://localhost:3000
```

## 本地要配置什么 / key 从哪来

只有 **OKX Dex** 需要配置 key，其他平台都在页面「添加账户」时输入。

复制并填 `.env.local`：

```bash
cp .env.example .env.local
```

```dotenv
OKX_DEX_API_KEY=
OKX_DEX_SECRET=
OKX_DEX_PASSPHRASE=
```

去 **OKX OnchainOS 开发者门户** → **https://web3.okx.com/onchainos/dev-portal** 创建 API key，得到**三件套（API Key + Secret Key + Passphrase）**后填入。

> ⚠️ passphrase 若含 `#` `!`，必须用双引号包裹，否则会被截断（OKX 报 50105）。

其他平台的 key 无需预配置：在「添加账户」表单里填对应平台的 API key 即可（在各交易所官网创建，建议只开**只读**权限）。

## Key 安全

- **所有账户 key 只存在你浏览器 localStorage** —— 不上传、不存储到任何服务器/数据库，也不写进代码仓库。
- **例外**：OKX Dex 的 OnchainOS key 存于**你自己配的服务端环境变量**（`OKX_DEX_*`），由中继服务端签名——唯一放在服务端的 key，git 已忽略、绝不入库。
- 被 CORS 拦截平台的请求经**无状态中继**转发：签名在**你的浏览器**完成，**secret key 从不出客户端**；中继不存储任何数据。
