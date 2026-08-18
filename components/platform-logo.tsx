"use client";

// Accurate brand marks (inline SVG paths):
// - Binance: official diamond mark (simple-icons, #F0B90B)
// - Bybit: official "B" letterform (Wikimedia official logo, #F7C600)
// - DEX: generic wallet icon (per product decision — an on-chain wallet address)
// - Gate.io / Bitget: brand-colored letter tiles (placeholder until official
//   brand assets are swapped in — registry makes that a one-line change)
import type { PlatformMeta } from "@/lib/platforms";
import { WalletIcon } from "./icons";

const BINANCE_PATH =
  "M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7154 2.7164L18.5682 12l2.6924-2.7164zm-9.272.001l2.7163 2.6914-2.7164 2.7174v-.001L9.2721 12l2.7164-2.7154zm-9.2722-.001L5.4088 12l-2.6914 2.6924L0 12l2.7164-2.7164zM11.9885.0115l7.353 7.329-2.7174 2.7154-4.6356-4.6356-4.6355 4.6595-2.7174-2.7154 7.353-7.353z";

const BYBIT_PATH =
  "M1500 4514l-1500 0 0 -3481 1440 0c700,0 1107,381 1107,978 0,386 -262,636 -443,719 216,98 493,318 493,782 0,650 -458,1002 -1097,1002zm-116 -2875l0 0 -685 0 0 802 685 0c297,0 463,-161 463,-401 0,-239 -166,-401 -463,-401zm45 1413l0 0 -730 0 0 856 730 0c317,0 468,-195 468,-430 0,-235 -151,-425 -468,-425z";

export function PlatformLogo({
  platform,
  size = 24,
  className = "",
  letter = true,
}: {
  platform: PlatformMeta;
  size?: number;
  className?: string;
  /** render letter tiles for placeholder logos (gate/bitget) */
  letter?: boolean;
}) {
  switch (platform.logoKey) {
    case "binance":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={platform.brandColor}
          className={className}
          role="img"
          aria-label="Binance"
        >
          <path d={BINANCE_PATH} />
        </svg>
      );
    case "bybit":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 1033 3000 3481"
          fill={platform.brandColor}
          className={className}
          role="img"
          aria-label="Bybit"
        >
          <path d={BYBIT_PATH} />
        </svg>
      );
    case "wallet":
      return <WalletIcon size={size} className={className} />;
    case "gate":
    case "bitget":
    default:
      return letter ? (
        <span
          className={`flex items-center justify-center rounded-full font-bold ${className}`}
          style={{
            width: size,
            height: size,
            fontSize: size * 0.55,
            color: platform.brandColor,
            background: `${platform.brandColor}1F`,
            border: `1px solid ${platform.brandColor}55`,
          }}
          aria-label={platform.id}
        >
          {platform.id === "gate" ? "G" : "B"}
        </span>
      ) : null;
  }
}
