"use client";

// All exchange marks sourced from web3icons.io (viewBox 0 0 24 24).
// Multi-color marks (Bybit yellow+white, Gate blue+green) render their true
// colors; single-color ones tint to brandColor. Aster isn't in web3icons
// (kept from its official asset); OKX Dex uses a generic wallet icon.
import type { PlatformMeta } from "@/lib/platforms";
import { WalletIcon } from "./icons";

const MARK = {
  okx: "M8.28 9.3H3.12a.12.12 0 0 0-.12.12v5.16a.12.12 0 0 0 .12.12h5.16a.12.12 0 0 0 .12-.12V9.42a.12.12 0 0 0-.12-.12M6.6 12.78a.12.12 0 0 1-.12.12H4.92a.12.12 0 0 1-.12-.12v-1.56a.12.12 0 0 1 .12-.12h1.56a.12.12 0 0 1 .12.12zm12.481-1.68h-1.56a.12.12 0 0 0-.12.12v1.56c0 .066.054.12.12.12h1.56a.12.12 0 0 0 .12-.12v-1.56a.12.12 0 0 0-.12-.12M17.28 9.3h-1.56a.12.12 0 0 0-.12.12v1.56c0 .066.054.12.12.12h1.56a.12.12 0 0 0 .12-.12V9.42a.12.12 0 0 0-.12-.12m3.6 0h-1.56a.12.12 0 0 0-.12.12v1.56c0 .066.054.12.12.12h1.56a.12.12 0 0 0 .12-.12V9.42a.12.12 0 0 0-.12-.12m-3.6 3.6h-1.56a.12.12 0 0 0-.12.12v1.56c0 .066.054.12.12.12h1.56a.12.12 0 0 0 .12-.12v-1.56a.12.12 0 0 0-.12-.12m3.6 0h-1.56a.12.12 0 0 0-.12.12v1.56c0 .066.054.12.12.12h1.56a.12.12 0 0 0 .12-.12v-1.56a.12.12 0 0 0-.12-.12m-6.301-3.6h-1.56a.12.12 0 0 0-.12.12v1.56c0 .066.054.12.12.12h1.56a.12.12 0 0 0 .12-.12V9.42a.12.12 0 0 0-.12-.12m0 3.6h-1.56a.12.12 0 0 0-.12.12v1.56c0 .066.054.12.12.12h1.56a.12.12 0 0 0 .12-.12v-1.56a.12.12 0 0 0-.12-.12m-1.68-1.681a.12.12 0 0 0-.12-.12h-1.68V9.42a.12.12 0 0 0-.12-.12h-1.56a.12.12 0 0 0-.12.12v5.157a.12.12 0 0 0 .12.12h1.56a.12.12 0 0 0 .12-.12v-1.678h1.68a.12.12 0 0 0 .12-.12z",
  binance: "m7.068 12-2.03 2.03L3.003 12l2.03-2.03zm4.935-4.935 3.482 3.483 2.03-2.03L12.003 3 6.485 8.518l2.03 2.03zm6.964 2.905L16.937 12l2.03 2.03 2.03-2.03zm-6.964 6.965L8.52 13.452l-2.03 2.03L12.003 21l5.512-5.518-2.03-2.03zm0-2.905 2.03-2.03-2.03-2.03L9.967 12z",
  kucoin:
    "m8.978 12.002 5.331 5.332 3.365-3.365a1.522 1.522 0 0 1 2.15 2.15l-4.44 4.441a1.533 1.533 0 0 1-2.15 0l-6.407-6.408v3.809a1.522 1.522 0 0 1-3.045 0V6.038a1.522 1.522 0 0 1 3.045 0v3.81l6.406-6.408a1.53 1.53 0 0 1 2.15 0l4.444 4.441a1.522 1.522 0 0 1-2.15 2.15l-3.365-3.365zm5.334-1.524a1.524 1.524 0 1 0-.002 3.05 1.524 1.524 0 0 0 .002-3.05",
  bybitMark: "M15.829 13.626V9h.93v4.626z",
  bybitText:
    "M4.993 15H3v-4.626h1.913c.93 0 1.471.507 1.471 1.3 0 .513-.348.845-.588.955.287.13.655.423.655 1.04 0 .863-.609 1.33-1.458 1.33m-.154-3.82h-.91v1.065h.91c.395 0 .615-.214.615-.533 0-.317-.22-.532-.615-.532m.06 1.877h-.97v1.137h.97c.42 0 .622-.259.622-.571s-.201-.565-.622-.565zm4.388.046V15h-.923v-1.898l-1.431-2.728h1.01l.889 1.864.877-1.864h1.01zM13.355 15h-1.993v-4.626h1.913c.93 0 1.47.507 1.47 1.3 0 .513-.347.845-.588.955.287.13.655.423.655 1.04 0 .863-.608 1.33-1.457 1.33m-.155-3.82h-.91v1.065h.91c.395 0 .616-.214.616-.533 0-.317-.22-.532-.616-.532m.06 1.877h-.97v1.137h.97c.422 0 .622-.259.622-.571s-.2-.565-.622-.565zm6.495-1.876V15h-.929v-3.82h-1.245v-.806H21v.806z",
  gateBlue:
    "M12 16.95a4.95 4.95 0 1 1 0-9.9V3a9 9 0 1 0 9 9h-4.05A4.95 4.95 0 0 1 12 16.95",
  gateGreen: "M16.95 7.05H12V12h4.95z",
  bitget1:
    "M11.121 9.46h4.283l4.381 4.555a.785.785 0 0 1 .003 1.076L14.17 21H9.757l1.334-1.357 4.898-5.092-4.836-5.092",
  bitget2:
    "M12.879 14.54H8.596L4.215 9.986a.785.785 0 0 1-.003-1.076L9.83 3h4.412l-1.334 1.357L8.01 9.449l4.836 5.092",
  hyperliquid:
    "M21 11.937a9.4 9.4 0 0 1-.901 4.112c-.867 1.863-2.947 3.387-4.846 1.765-1.55-1.322-1.837-4.005-4.157-4.398-3.07-.361-3.145 3.092-5.15 3.482-2.236.44-2.978-3.206-2.945-4.862s.487-3.984 2.43-3.984c2.236 0 2.386 3.283 5.224 3.105 2.81-.186 2.86-3.602 4.696-5.064 1.585-1.264 3.448-.337 4.381 1.184.865 1.406 1.245 3.057 1.265 4.66z",
  // Aster — not in web3icons; kept from official asset (viewBox 0 0 32 32)
  aster1:
    "M9.13309 30.4398L9.88315 26.9871C10.7197 23.1362 7.77521 19.4988 3.82118 19.4988H0.385363C1.4689 24.3374 4.75127 28.3496 9.13309 30.4398Z",
  aster2:
    "M10.64 31.0663C12.3326 31.6707 14.1567 32 16.0579 32C23.7199 32 30.1285 26.6527 31.7305 19.4988H21.249C16.5244 19.4988 12.4396 22.7824 11.44 27.3838L10.64 31.0663Z",
  aster3:
    "M32.0038 17.8987C32.0778 17.2756 32.1159 16.6415 32.1159 15.9985C32.1159 7.60402 25.629 0.719287 17.3779 0.0503251L15.1273 10.4105C14.2907 14.2614 17.2352 17.8987 21.1892 17.8987H32.0038Z",
  aster4:
    "M15.7459 0C7.02134 0.165717 0 7.26504 0 15.9985C0 16.6415 0.0380539 17.2756 0.112041 17.8987H3.76146C8.48603 17.8987 12.5709 14.6151 13.5705 10.0137L15.7459 0Z",
} as const;

const SVG = ({
  size,
  color,
  className,
  label,
  children,
  vb = "0 0 24 24",
}: {
  size: number;
  color?: string;
  className: string;
  label: string;
  children: React.ReactNode;
  vb?: string;
}) => (
  <svg width={size} height={size} viewBox={vb} fill={color} className={className} role="img" aria-label={label}>
    {children}
  </svg>
);

export function PlatformLogo({
  platform,
  size = 24,
  className = "",
}: {
  platform: PlatformMeta;
  size?: number;
  className?: string;
}) {
  const c = platform.brandColor;
  switch (platform.logoKey) {
    case "okx":
      return (
        <SVG size={size} color={c} className={className} label="OKX">
          <path d={MARK.okx} />
        </SVG>
      );
    case "binance":
      return (
        <SVG size={size} color="#F0B90B" className={className} label="Binance">
          <path d={MARK.binance} />
        </SVG>
      );
    case "kucoin":
      return (
        <SVG size={size} color="#23AF91" className={className} label="KuCoin">
          <path d={MARK.kucoin} />
        </SVG>
      );
    case "bybit":
      return (
        <SVG size={size} className={className} label="Bybit">
          <path d={MARK.bybitMark} fill="#F6A500" />
          <path d={MARK.bybitText} fill="#fff" />
        </SVG>
      );
    case "gate":
      return (
        <SVG size={size} className={className} label="Gate">
          <path d={MARK.gateBlue} fill="#2354E6" />
          <path d={MARK.gateGreen} fill="#17E6A1" />
        </SVG>
      );
    case "bitget":
      return (
        <SVG size={size} color="#00F0FF" className={className} label="Bitget">
          <path d={MARK.bitget1} />
          <path d={MARK.bitget2} />
        </SVG>
      );
    case "hyperliquid":
      return (
        <SVG size={size} color="#50D2C1" className={className} label="Hyperliquid">
          <path d={MARK.hyperliquid} />
        </SVG>
      );
    case "aster":
      return (
        <SVG size={size} color={c} className={className} label="Aster" vb="0 0 32 32">
          <path d={MARK.aster1} />
          <path d={MARK.aster2} />
          <path d={MARK.aster3} />
          <path d={MARK.aster4} />
        </SVG>
      );
    case "wallet":
      return <WalletIcon size={size} className={className} />;
    default:
      return (
        <span
          className={`flex items-center justify-center rounded-full font-bold ${className}`}
          style={{ width: size, height: size, fontSize: size * 0.55, color: c, background: `${c}1F`, border: `1px solid ${c}55` }}
          aria-label={platform.id}
        >
          {platform.id[0].toUpperCase()}
        </span>
      );
  }
}
