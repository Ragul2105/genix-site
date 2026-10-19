export default function Logo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      <path d="M59.8 20.2 A28 28 0 1 0 68 40 H50" fill="none" stroke="#2563EB" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 39 L34 48 L50 27" fill="none" stroke="#FFC83D" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
