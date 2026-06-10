/**
 * Hidden SVG filter that powers the LiquidTabs glass refraction.
 * Rendered once at the root so any `.lg-thumb` can reference `url(#liquidGlass)`
 * in its backdrop-filter. Display contents so it occupies no layout space.
 */
export function LiquidGlassFilter() {
  return (
    <svg aria-hidden width={0} height={0} style={{ position: "absolute", width: 0, height: 0 }}>
      <filter
        id="liquidGlass"
        x="-35%"
        y="-35%"
        width="170%"
        height="170%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.006 0.013"
          numOctaves={2}
          seed={7}
          result="n"
        />
        <feGaussianBlur in="n" stdDeviation={3} result="s" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="s"
          scale={40}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
