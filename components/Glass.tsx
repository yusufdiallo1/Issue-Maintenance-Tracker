import type { ElementType, ReactNode } from "react";

type GlassTier = "thin" | "regular" | "thick";
type GlassTint = "neutral" | "gold";

/**
 * Liquid Glass material primitive. Renders a translucent, refractive,
 * light-reactive surface via the `.glass-*` CSS classes (backdrop blur +
 * saturate + brightness, inset specular hairline, translucent edge, inner
 * bottom shadow, ambient+key drop shadow). Tier controls blur/displacement
 * strength; tint adds a gold wash for primary surfaces.
 *
 * Use ONLY on floating surfaces (nav, sheets, sidebar, pills, buttons). The
 * flat Resend canvas/cards stay matte. Legibility first — put a text scrim
 * behind low-contrast content.
 */
export function Glass({
  tier = "regular",
  tint = "neutral",
  as,
  className = "",
  children,
  ...rest
}: {
  tier?: GlassTier;
  tint?: GlassTint;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const Tag = as ?? "div";
  const tintClass = tint === "gold" ? " glass-gold" : "";
  return (
    <Tag className={`glass-surface glass-${tier}${tintClass} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
