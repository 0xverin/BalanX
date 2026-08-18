// Inline SVG icon set (Lucide-style strokes) — no emoji as icons (skill rule).

interface IconProps {
  className?: string;
  size?: number;
}

const S = ({ className, size = 18, children }: IconProps & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <S {...p}><path d="M12 5v14M5 12h14" /></S>
);
export const RefreshIcon = (p: IconProps) => (
  <S {...p}><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" /></S>
);
export const TrashIcon = (p: IconProps) => (
  <S {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></S>
);
export const ChevronDownIcon = (p: IconProps) => (
  <S {...p}><path d="m6 9 6 6 6-6" /></S>
);
export const SettingsIcon = (p: IconProps) => (
  <S {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></S>
);
export const GlobeIcon = (p: IconProps) => (
  <S {...p}><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" /></S>
);
export const SunIcon = (p: IconProps) => (
  <S {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></S>
);
export const MoonIcon = (p: IconProps) => (
  <S {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></S>
);
export const WalletIcon = (p: IconProps) => (
  <S {...p}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></S>
);
export const XIcon = (p: IconProps) => (
  <S {...p}><path d="M18 6 6 18M6 6l12 12" /></S>
);
export const DownloadIcon = (p: IconProps) => (
  <S {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></S>
);
export const UploadIcon = (p: IconProps) => (
  <S {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></S>
);
export const ShieldIcon = (p: IconProps) => (
  <S {...p}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></S>
);
export const CoinsIcon = (p: IconProps) => (
  <S {...p}><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82" /></S>
);
export const AlertIcon = (p: IconProps) => (
  <S {...p}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></S>
);
export const CheckIcon = (p: IconProps) => (
  <S {...p}><path d="M20 6 9 17l-5-5" /></S>
);
