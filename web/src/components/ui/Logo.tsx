export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
      <defs>
        <linearGradient id="lg-brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#12a2e0" />
          <stop offset="1" stopColor="#b78bff" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#0b0c16" />
      <rect width="32" height="32" rx="9" fill="url(#lg-brand)" opacity="0.12" />
      <path
        d="M9 6V11l7 6 7-6V6"
        stroke="url(#lg-brand)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
      <path
        d="M9 11h14M9 18l7 6 7-6"
        stroke="url(#lg-brand)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}