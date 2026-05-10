// Square gradient block with first letter of pseudonym (or address).
// Used by the wallet detail page and the trade drawer (later tasks).
// Gradient ported from prototype/wallet-profile.jsx.
export function WalletAvatar({
  wallet,
  pseudonym,
  size = 36,
}: {
  wallet: string;
  pseudonym?: string | null;
  size?: number;
}) {
  const letter = (pseudonym?.[0] ?? wallet.slice(2, 3)).toUpperCase();
  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.4);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background:
          "linear-gradient(135deg, oklch(0.6 0.18 145), oklch(0.4 0.15 165))",
        color: "#0a1a0d",
        fontFamily: "var(--font-mono)",
        fontSize,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden="true"
    >
      {letter}
    </div>
  );
}
