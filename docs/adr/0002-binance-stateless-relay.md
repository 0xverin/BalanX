# 0002 - Binance 无状态转发代理

Binance 的 CORS 拒绝浏览器携带 `X-MBX-APIKEY` 头的签名请求（预检 400/401、无 `Access-Control-Allow-Headers`，已实测），纯浏览器直连 Binance 不可行。用户选定方案（2026-08-18）：增加一个 **Vercel serverless 无状态转发函数**，仅放行本应用使用的 8 个签名端点（SSRF 白名单 + 禁止路径穿越）。

**关键安全属性**：HMAC 签名在浏览器完成，secret key 永不离开客户端；代理只转发已签名请求与 api key，不存储任何数据、无数据库、无状态。OKX Dex 仍浏览器直连。这构成 ADR-0001「纯前端、无服务器」的有意例外——核心诉求（凭据不上传服务器、无存储）保持不变。
