"use client";

import { useId } from "react";

/** BalanX brand mark — blue-gradient tile, white wallet, gold coin
 * (matches the favicon, app/icon.svg). */
export function BalanxLogo({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const id = useId();
  const grad = `balanx-grad-${id.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="BalanX"
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill={`url(#${grad})`} />
      <g
        transform="translate(20 20) scale(1)"
        stroke="#ffffff"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4" />
      </g>
      <circle cx="32" cy="30" r="4.6" fill="#fbbf24" />
    </svg>
  );
}
