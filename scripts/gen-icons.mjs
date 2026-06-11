/**
 * Generate PWA icons + iOS splash screens from the gold compass mark
 * (app/icon.svg). Run once: `node scripts/gen-icons.mjs`.
 *
 * Outputs:
 *   public/icons/icon-192.png        (any)
 *   public/icons/icon-512.png        (any)
 *   public/icons/icon-maskable-512.png (mark on dark, ~20% safe padding)
 *   public/apple-touch-icon.png      (180×180, mark on dark)
 *   public/splash/<W>x<H>.png        (iOS launch images, gold mark on #0a0a0a)
 */
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SVG = join(root, "app", "icon.svg");
const BG = "#0a0a0a"; // brand near-black

async function main() {
  await mkdir(join(root, "public", "icons"), { recursive: true });
  await mkdir(join(root, "public", "splash"), { recursive: true });
  const svg = await readFile(SVG);

  // Transparent "any" icons (the mark itself, padded a touch).
  for (const size of [192, 512]) {
    const inner = Math.round(size * 0.82);
    const markPng = await sharp(svg).resize(inner, inner).png().toBuffer();
    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: markPng, gravity: "centre" }])
      .png()
      .toFile(join(root, "public", "icons", `icon-${size}.png`));
  }

  // Maskable 512: mark on solid dark with generous safe padding (~64%).
  {
    const size = 512;
    const inner = Math.round(size * 0.64);
    const markPng = await sharp(svg).resize(inner, inner).png().toBuffer();
    await sharp({
      create: { width: size, height: size, channels: 4, background: BG },
    })
      .composite([{ input: markPng, gravity: "centre" }])
      .png()
      .toFile(join(root, "public", "icons", `icon-maskable-512.png`));
  }

  // apple-touch-icon: 180, mark on solid dark (no transparency for iOS).
  {
    const size = 180;
    const inner = Math.round(size * 0.62);
    const markPng = await sharp(svg).resize(inner, inner).png().toBuffer();
    await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
      .composite([{ input: markPng, gravity: "centre" }])
      .png()
      .toFile(join(root, "public", "apple-touch-icon.png"));
  }

  // iOS launch images for common iPhone sizes (portrait, @device px).
  const SPLASH = [
    [1290, 2796], // 15/16 Pro Max
    [1179, 2556], // 15/16 Pro
    [1170, 2532], // 13/14
    [1125, 2436], // X/11 Pro
    [1242, 2688], // 11 Pro Max / XS Max
    [828, 1792], // 11 / XR
    [750, 1334], // SE/8
    [640, 1136], // SE 1st gen
  ];
  for (const [w, h] of SPLASH) {
    const inner = Math.round(Math.min(w, h) * 0.34);
    const markPng = await sharp(svg).resize(inner, inner).png().toBuffer();
    await sharp({ create: { width: w, height: h, channels: 4, background: BG } })
      .composite([{ input: markPng, gravity: "centre" }])
      .png()
      .toFile(join(root, "public", "splash", `${w}x${h}.png`));
  }

  console.log("Icons + splash generated into public/icons, public/splash, public/apple-touch-icon.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
