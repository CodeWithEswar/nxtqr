import fs from "fs";
import path from "path";
import sharp from "sharp";
import { generateSvgMarkup, generateAppIconTileSvg } from "../src/utils/svg-paths";

// Output destinations
const rootDir = path.resolve(__dirname, "../../..");
const webPublicIconsDir = path.join(rootDir, "apps/web/public/branding/icons");
const webAppDir = path.join(rootDir, "apps/web/src/app");
const brandingDistIconsDir = path.join(__dirname, "../dist/icons");

// Ensure directories exist
[webPublicIconsDir, webAppDir, brandingDistIconsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper to write file to multiple locations
function writeToLocations(filename: string, buffer: Buffer | string) {
  const p1 = path.join(webPublicIconsDir, filename);
  const p2 = path.join(brandingDistIconsDir, filename);
  fs.writeFileSync(p1, buffer);
  fs.writeFileSync(p2, buffer);
}

// Convert PNG buffer to a valid ICO container
function createIcoBuffer(png32: Buffer, png16: Buffer): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(2, 4); // 2 images

  const dirEntry16 = Buffer.alloc(16);
  const dirEntry32 = Buffer.alloc(16);

  const offset16 = 6 + 16 * 2;
  const offset32 = offset16 + png16.length;

  // 16x16 entry
  dirEntry16.writeUInt8(16, 0); // Width
  dirEntry16.writeUInt8(16, 1); // Height
  dirEntry16.writeUInt8(0, 2); // Colors
  dirEntry16.writeUInt8(0, 3); // Reserved
  dirEntry16.writeUInt16LE(1, 4); // Planes
  dirEntry16.writeUInt16LE(32, 6); // BPP
  dirEntry16.writeUInt32LE(png16.length, 8); // Size
  dirEntry16.writeUInt32LE(offset16, 12); // Offset

  // 32x32 entry
  dirEntry32.writeUInt8(32, 0);
  dirEntry32.writeUInt8(32, 1);
  dirEntry32.writeUInt8(0, 2);
  dirEntry32.writeUInt8(0, 3);
  dirEntry32.writeUInt16LE(1, 4);
  dirEntry32.writeUInt16LE(32, 6);
  dirEntry32.writeUInt32LE(png32.length, 8);
  dirEntry32.writeUInt32LE(offset32, 12);

  return Buffer.concat([header, dirEntry16, dirEntry32, png16, png32]);
}

async function run() {
  console.log("Generating NXTQR SVG logos and app icons...");

  const masterSvgDark = generateAppIconTileSvg({ size: 512, opaque: true });
  const masterSvgLight = generateAppIconTileSvg({ size: 512, type: "white", opaque: true });
  const faviconSvg = generateAppIconTileSvg({ size: 128 });

  const logoAssets = {
    "logo-primary.svg": generateSvgMarkup({ includeWordmark: true }),
    "logo-symbol.svg": generateSvgMarkup(),
    "logo-minimal.svg": generateSvgMarkup({ showFraming: false }),
    "logo-inverse.svg": generateSvgMarkup({ colorMode: "inverse", background: "#FFFFFF" }),
    "logo-monochrome.svg": generateSvgMarkup({ colorMode: "current" }),
  };

  for (const [name, svg] of Object.entries(logoAssets)) {
    fs.writeFileSync(path.join(__dirname, "../src/svg", name), svg);
    fs.writeFileSync(path.join(rootDir, "apps/web/public/branding/logos", name), svg);
  }

  // 1. Write Favicon SVG
  writeToLocations("favicon.svg", faviconSvg);
  fs.writeFileSync(path.join(webAppDir, "icon.svg"), faviconSvg);

  // 2. Generate standard raster PNG icons
  const sizes = [16, 32, 48, 192, 512];
  for (const s of sizes) {
    const pngBuf = await sharp(Buffer.from(masterSvgDark))
      .resize(s, s)
      .png({ compressionLevel: 9 })
      .toBuffer();
    writeToLocations(`icon-${s}.png`, pngBuf);
  }

  // 3. Apple Touch Icon (180x180, opaque black tile)
  const appleSvg = generateAppIconTileSvg({ size: 180, opaque: true });
  const appleTouchBuf = await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeToLocations("apple-touch-icon.png", appleTouchBuf);
  fs.writeFileSync(path.join(webAppDir, "apple-icon.png"), appleTouchBuf);

  // 4. Maskable Icon (512x512 with safe area margin: 80% scale centered on #000000)
  const innerScaled = await sharp(Buffer.from(masterSvgDark)).resize(410, 410).toBuffer();
  const maskableBuf = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: "#000000",
    },
  })
    .composite([{ input: innerScaled, gravity: "center" }])
    .png()
    .toBuffer();
  writeToLocations("maskable-icon-512.png", maskableBuf);

  // 5. Generate Multi-Resolution favicon.ico
  const png16 = await sharp(Buffer.from(masterSvgDark)).resize(16, 16).png().toBuffer();
  const png32 = await sharp(Buffer.from(masterSvgDark)).resize(32, 32).png().toBuffer();
  const icoBuf = createIcoBuffer(png32, png16);
  writeToLocations("favicon.ico", icoBuf);
  fs.writeFileSync(path.join(rootDir, "apps/web/public/favicon.ico"), icoBuf);

  // 6. Inverse Icon (32x32 and 512x512)
  const inv32 = await sharp(Buffer.from(masterSvgLight)).resize(32, 32).png().toBuffer();
  writeToLocations("icon-inverse-32.png", inv32);
  const inv512 = await sharp(Buffer.from(masterSvgLight)).resize(512, 512).png().toBuffer();
  writeToLocations("icon-inverse-512.png", inv512);

  // 7. Signature App Icon Tiles (Hero, Black, White)
  const heroTileBuf = await sharp(Buffer.from(generateAppIconTileSvg({ size: 512, type: "hero" })))
    .png()
    .toBuffer();
  writeToLocations("app-icon-hero.png", heroTileBuf);

  const blackTileBuf = await sharp(
    Buffer.from(generateAppIconTileSvg({ size: 256, type: "black" })),
  )
    .png()
    .toBuffer();
  writeToLocations("app-icon-black.png", blackTileBuf);

  const whiteTileBuf = await sharp(
    Buffer.from(generateAppIconTileSvg({ size: 256, type: "white" })),
  )
    .png()
    .toBuffer();
  writeToLocations("app-icon-white.png", whiteTileBuf);

  console.log("Brand icon system generated successfully.");
}

run().catch((err) => {
  console.error("Icon generation failed:", err);
  process.exit(1);
});
