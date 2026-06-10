import Image from "next/image";
import aurionLogo from "@/public/aurion-logo.png";

/**
 * Brand compass mark (inline SVG) — theme-safe and crisp at any size.
 * Ported from the prototype's IC.compass. Uses the brand gold directly
 * so it reads on both light and dark backgrounds.
 */
function CompassMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden>
      <circle cx="50" cy="50" r="45" stroke="#C6A253" strokeWidth="1.6" />
      <g stroke="#A4924E" strokeWidth="5" strokeLinecap="round">
        <line x1="58" y1="42" x2="72" y2="28" />
        <line x1="58" y1="58" x2="72" y2="72" />
        <line x1="42" y1="58" x2="28" y2="72" />
        <line x1="42" y1="42" x2="28" y2="28" />
      </g>
      <polygon
        points="50,7 56.5,43.5 93,50 56.5,56.5 50,93 43.5,56.5 7,50 43.5,43.5"
        fill="#C6A253"
      />
      <circle cx="50" cy="50" r="8.5" fill="#A4924E" />
    </svg>
  );
}

/**
 * Single swap point for brand artwork.
 * - `variant="mark"` → the compass mark (header / sidebar).
 * - `variant="full"` → the full AURION logo PNG (login screen).
 *
 * When a transparent mark / transparent full logo become available, swap the
 * implementation here only — call sites don't change.
 */
export function Logo({
  variant = "mark",
  className,
  size = 60,
}: {
  variant?: "mark" | "full";
  className?: string;
  size?: number;
}) {
  if (variant === "full") {
    return (
      <Image
        src={aurionLogo}
        alt="Aurion"
        width={size}
        height={size}
        priority
        className={className}
      />
    );
  }
  return <CompassMark className={className} />;
}
