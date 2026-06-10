/**
 * Hidden SVG filters that power the Liquid Glass refraction. Rendered once at
 * the root so any glass surface can reference `url(#liquidGlass*)` in its
 * backdrop-filter. Three displacement scales so the lensing reads at any size:
 *   - liquidGlass-sm : pills, buttons, small chips (subtle)
 *   - liquidGlass    : the LiquidTabs thumb, mid surfaces (default)
 *   - liquidGlass-lg : sheets, sidebar, large panels (pronounced)
 */
function GlassFilter({ id, scale, freq }: { id: string; scale: number; freq: string }) {
  return (
    <filter id={id} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={7} result="n" />
      <feGaussianBlur in="n" stdDeviation={3} result="s" />
      <feDisplacementMap
        in="SourceGraphic"
        in2="s"
        scale={scale}
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  );
}

export function LiquidGlassFilter() {
  return (
    <svg aria-hidden width={0} height={0} style={{ position: "absolute", width: 0, height: 0 }}>
      <defs>
        <GlassFilter id="liquidGlass-sm" scale={18} freq="0.008 0.016" />
        <GlassFilter id="liquidGlass" scale={40} freq="0.006 0.013" />
        <GlassFilter id="liquidGlass-lg" scale={64} freq="0.004 0.009" />
      </defs>
    </svg>
  );
}
