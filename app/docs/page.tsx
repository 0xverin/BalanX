"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Lang = "en" | "zh";

interface DocSection {
  title: string;
  blocks: Array<{ body?: string; code?: string }>;
}
interface Doc {
  brand: string;
  pageTitle: string;
  intro: string;
  sections: DocSection[];
  foot: string;
}
const DOCS: Record<Lang, Doc> = {
  en: {
    brand: "BalanX",
    pageTitle: "Documentation",
    intro:
      "View the real-time USD value of your assets across 9 exchanges (OKX Dex, Hyperliquid, OKX CEX, Binance, Bybit, Gate, Bitget, KuCoin, Aster) in one page. Pure frontend — no database, no login; all data stays in your browser.",
    sections: [
      {
        title: "Quick start",
        blocks: [
          { code: "npm install\nnpm run dev     # → http://localhost:3000" },
        ],
      },
      {
        title: "What to configure locally / where the key comes from",
        blocks: [
          {
            body:
              "Only OKX Dex needs a configured key; every other exchange's key is entered in the \"Add account\" form.",
          },
          { body: "Copy and fill `.env.local`:", code: "cp .env.example .env.local" },
          { code: "OKX_DEX_API_KEY=\nOKX_DEX_SECRET=\nOKX_DEX_PASSPHRASE=" },
          {
            body:
              "Get the three-part key (API Key + Secret Key + Passphrase) from the OKX OnchainOS dev portal → https://web3.okx.com/onchainos/dev-portal.",
          },
          {
            body:
              "Warning: wrap the passphrase in double quotes if it contains # / !, or it gets truncated (OKX error 50105).",
          },
          {
            body:
              "Other exchanges need no setup — just enter each exchange's API key in the \"Add account\" form (read-only permission recommended).",
          },
        ],
      },
      {
        title: "Key security",
        blocks: [
          {
            body:
              "All account keys live only in your browser's localStorage — never uploaded to, or stored on, any server, database, or in the code repo.",
          },
          {
            body:
              "Exception: the OKX Dex OnchainOS key goes in your own server env (OKX_DEX_*) for server-side signing — the only server-side key; it's git-ignored and never committed.",
          },
          {
            body:
              "CORS-blocked exchanges go through a stateless relay: signing happens in your browser, so the secret never leaves your client; the relay stores nothing.",
          },
        ],
      },
    ],
    foot: "All data stays in your browser — BalanX stores nothing.",
  },
  zh: {
    brand: "BalanX",
    pageTitle: "使用文档",
    intro:
      "在一个页面实时查看你 9 个平台（OKX Dex、Hyperliquid、OKX CEX、Binance、Bybit、Gate、Bitget、KuCoin、Aster）的 USD 资产总值。纯前端、无数据库、无登录，所有数据只存在你的浏览器。",
    sections: [
      {
        title: "快速开始",
        blocks: [
          { code: "npm install\nnpm run dev     # → http://localhost:3000" },
        ],
      },
      {
        title: "本地要配置什么 / key 从哪来",
        blocks: [
          {
            body: "只有 OKX Dex 需要配置 key，其他平台都在页面「添加账户」时输入。",
          },
          { body: "复制并填 `.env.local`：", code: "cp .env.example .env.local" },
          { code: "OKX_DEX_API_KEY=\nOKX_DEX_SECRET=\nOKX_DEX_PASSPHRASE=" },
          {
            body:
              "去 OKX OnchainOS 开发者门户 https://web3.okx.com/onchainos/dev-portal 创建 API key，得到三件套（API Key + Secret Key + Passphrase）后填入。",
          },
          {
            body: "注意：passphrase 若含 # !，必须用双引号包裹，否则会被截断（OKX 报 50105）。",
          },
          {
            body:
              "其他平台的 key 无需预配置：在「添加账户」表单里填对应平台的 API key 即可（建议只开只读权限）。",
          },
        ],
      },
      {
        title: "Key 安全",
        blocks: [
          {
            body:
              "所有账户 key 只存在你浏览器 localStorage —— 不上传、不存储到任何服务器/数据库，也不写进代码仓库。",
          },
          {
            body:
              "例外：OKX Dex 的 OnchainOS key 存于你自己配的服务端环境变量（OKX_DEX_*），由中继服务端签名——唯一放在服务端的 key，git 已忽略、绝不入库。",
          },
          {
            body:
              "被 CORS 拦截平台的请求经无状态中继转发：签名在你的浏览器完成，secret key 从不出客户端；中继不存储任何数据。",
          },
        ],
      },
    ],
    foot: "你的数据仅保存在浏览器中，BalanX 不存储任何数据。",
  },
};

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-line bg-inputbg px-4 py-3 font-mono text-xs leading-relaxed text-fg">
      {code}
    </pre>
  );
}

export default function DocsPage() {
  const [lang, setLang] = useState<Lang>("en");
  // restore saved language after first paint (microtask keeps it out of the
  // synchronous effect path — SSR always renders the default, no hydration gap)
  useEffect(() => {
    queueMicrotask(() => {
      if (typeof window === "undefined") return;
      const l = localStorage.getItem("balanx-docs-lang");
      if (l === "zh" || l === "en") setLang(l);
    });
  }, []);

  const d = DOCS[lang];
  const apply = (l: Lang) => {
    setLang(l);
    localStorage.setItem("balanx-docs-lang", l);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* header with the language switch */}
      <header className="sticky top-0 z-40 border-b border-line glass">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="font-display text-sm font-bold tracking-widest cursor-pointer">
            {d.brand} <span className="gold-text">Docs</span>
          </Link>
          <div className="flex items-center gap-1 rounded-xl border border-line bg-inputbg p-1">
            {(["zh", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => apply(l)}
                className={`rounded-lg px-3 py-1 text-sm font-semibold transition-colors cursor-pointer ${
                  lang === l ? "bg-cardbg-strong text-fg border border-line-strong" : "text-muted hover:text-fg"
                }`}
              >
                {l === "zh" ? "中文" : "English"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <h1 className="font-display text-2xl font-bold tracking-wide">{d.pageTitle}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{d.intro}</p>

        <div className="mt-10 space-y-8">
          {d.sections.map((s) => (
            <section key={s.title} className="glass rounded-2xl p-6">
              <h2 className="font-display text-base font-semibold">{s.title}</h2>
              <div className="mt-4 space-y-3">
                {s.blocks.map((b, i) => (
                  <div key={i} className="space-y-2">
                    {b.body && <p className="text-sm leading-relaxed text-foreground/90">{b.body}</p>}
                    {b.code && <CodeBlock code={b.code} />}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-line py-4 text-center text-[11px] text-soft">
        {d.foot}
      </footer>
    </div>
  );
}
