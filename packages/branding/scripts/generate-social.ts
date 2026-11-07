import fs from "fs";
import path from "path";
import sharp from "sharp";
import { LOGO_GEOMETRY, BRAND_CONSTANTS } from "../src/tokens/branding-tokens";
import { WORDMARK_TYPOGRAPHY } from "../src/tokens/typography-fallback";

const rootDir = path.resolve(__dirname, "../../..");
const webSocialDir = path.join(rootDir, "apps/web/public/branding/social");
const webBannersDir = path.join(rootDir, "apps/web/public/branding/banners");
const webAppDir = path.join(rootDir, "apps/web/src/app");
const brandingDistSocialDir = path.join(__dirname, "../dist/social");

[webSocialDir, webBannersDir, webAppDir, brandingDistSocialDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper to construct background engineering graph grid
function createEngineeringGraphSvg(width: number, height: number): string {
  return `
    <!-- Engineering Precision Grid -->
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#161616" stroke-width="1" />
      </pattern>
      <radialGradient id="vignette" cx="50%" cy="50%" r="65%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="70%" stop-color="#000000" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.95" />
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="#000000" />
    <rect width="${width}" height="${height}" fill="url(#grid)" opacity="0.6" />
    
    <!-- Abstract Directed System Graph Nodes and Connections -->
    <g stroke="#262626" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.45">
      <line x1="120" y1="180" x2="340" y2="120" />
      <line x1="340" y1="120" x2="480" y2="240" />
      <line x1="480" y1="240" x2="260" y2="380" />
      <line x1="260" y1="380" x2="120" y2="180" />

      <line x1="720" y1="200" x2="920" y2="140" />
      <line x1="920" y1="140" x2="1080" y2="280" />
      <line x1="1080" y1="280" x2="880" y2="440" />
      <line x1="880" y1="440" x2="720" y2="200" />
    </g>
    <!-- System Graph Nodes -->
    <g fill="#0A0A0A" stroke="#262626" stroke-width="1.5">
      <circle cx="120" cy="180" r="5" />
      <circle cx="340" cy="120" r="5" />
      <circle cx="480" cy="240" r="5" />
      <circle cx="260" cy="380" r="5" />
      <circle cx="720" cy="200" r="5" />
      <circle cx="920" cy="140" r="5" />
      <circle cx="1080" cy="280" r="5" />
      <circle cx="880" cy="440" r="5" />
    </g>
    <!-- Vignette Overlay to maintain focal center -->
    <rect width="${width}" height="${height}" fill="url(#vignette)" />
  `;
}

// 1. Open Graph Image (1200 x 630)
function generateOgSvg(): string {
  const width = 1200;
  const height = 630;
  const graph = createEngineeringGraphSvg(width, height);

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${graph}

    <!-- Center Brand Lockup -->
    <g transform="translate(536, 130)">
      <!-- Master Monogram (128x128) -->
      <path d="${LOGO_GEOMETRY.cornerFraming.combinedPath}" stroke="#A3A3A3" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9"/>
      <path d="${LOGO_GEOMETRY.monogram.facetUnderPath}" fill="#FFFFFF" opacity="0.35"/>
      <path d="${LOGO_GEOMETRY.monogram.bodyPath}" fill="#FFFFFF"/>
      <line x1="${LOGO_GEOMETRY.monogram.executionLine.x1}" y1="${LOGO_GEOMETRY.monogram.executionLine.y1}" x2="${LOGO_GEOMETRY.monogram.executionLine.x2}" y2="${LOGO_GEOMETRY.monogram.executionLine.y2}" stroke="#FF0000" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="${LOGO_GEOMETRY.monogram.executionLine.node.cx}" cy="${LOGO_GEOMETRY.monogram.executionLine.node.cy}" r="${LOGO_GEOMETRY.monogram.executionLine.node.r}" fill="#FF0000"/>
    </g>

    <!-- Wordmark -->
    <text x="600" y="340" text-anchor="middle" font-family="${WORDMARK_TYPOGRAPHY.fallbackStack}" font-size="64" font-weight="700" letter-spacing="-0.04em" fill="#FFFFFF">
      ${BRAND_CONSTANTS.name}
    </text>

    <!-- Category -->
    <text x="600" y="380" text-anchor="middle" font-family="${WORDMARK_TYPOGRAPHY.subtitle.fontFamily}" font-size="13" font-weight="500" letter-spacing="0.22em" fill="#A3A3A3">
      ${BRAND_CONSTANTS.category.toUpperCase()}
    </text>

    <!-- Tagline (Design. Visualize. Simulate. Understand.) -->
    <g transform="translate(600, 440)">
      <rect x="-240" y="-18" width="480" height="36" rx="6" fill="#0A0A0A" stroke="#262626" stroke-width="1"/>
      <text x="0" y="6" text-anchor="middle" font-family="${WORDMARK_TYPOGRAPHY.fallbackStack}" font-size="14" font-weight="500" letter-spacing="0.04em" fill="#E5E5E5">
        ${BRAND_CONSTANTS.tagline}
      </text>
    </g>
  </svg>`;
}

// 2. Twitter Card Image (1200 x 600)
function generateTwitterSvg(): string {
  const width = 1200;
  const height = 600;
  const graph = createEngineeringGraphSvg(width, height);

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${graph}

    <!-- Center Brand Lockup -->
    <g transform="translate(536, 120)">
      <path d="${LOGO_GEOMETRY.cornerFraming.combinedPath}" stroke="#A3A3A3" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9"/>
      <path d="${LOGO_GEOMETRY.monogram.facetUnderPath}" fill="#FFFFFF" opacity="0.35"/>
      <path d="${LOGO_GEOMETRY.monogram.bodyPath}" fill="#FFFFFF"/>
      <line x1="${LOGO_GEOMETRY.monogram.executionLine.x1}" y1="${LOGO_GEOMETRY.monogram.executionLine.y1}" x2="${LOGO_GEOMETRY.monogram.executionLine.x2}" y2="${LOGO_GEOMETRY.monogram.executionLine.y2}" stroke="#FF0000" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="${LOGO_GEOMETRY.monogram.executionLine.node.cx}" cy="${LOGO_GEOMETRY.monogram.executionLine.node.cy}" r="${LOGO_GEOMETRY.monogram.executionLine.node.r}" fill="#FF0000"/>
    </g>

    <!-- Wordmark -->
    <text x="600" y="325" text-anchor="middle" font-family="${WORDMARK_TYPOGRAPHY.fallbackStack}" font-size="60" font-weight="700" letter-spacing="-0.04em" fill="#FFFFFF">
      ${BRAND_CONSTANTS.name}
    </text>

    <!-- Category -->
    <text x="600" y="365" text-anchor="middle" font-family="${WORDMARK_TYPOGRAPHY.subtitle.fontFamily}" font-size="13" font-weight="500" letter-spacing="0.22em" fill="#A3A3A3">
      ${BRAND_CONSTANTS.category.toUpperCase()}
    </text>

    <!-- Tagline -->
    <g transform="translate(600, 420)">
      <rect x="-230" y="-18" width="460" height="36" rx="6" fill="#0A0A0A" stroke="#262626" stroke-width="1"/>
      <text x="0" y="6" text-anchor="middle" font-family="${WORDMARK_TYPOGRAPHY.fallbackStack}" font-size="14" font-weight="500" letter-spacing="0.04em" fill="#E5E5E5">
        ${BRAND_CONSTANTS.tagline}
      </text>
    </g>
  </svg>`;
}

// 3. GitHub README Banner (1200 x 380)
function generateBannerSvg(): string {
  const width = 1200;
  const height = 380;
  const graph = createEngineeringGraphSvg(width, height);

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${graph}

    <g transform="translate(180, 126)">
      <!-- Monogram 128x128 -->
      <path d="${LOGO_GEOMETRY.cornerFraming.combinedPath}" stroke="#A3A3A3" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9"/>
      <path d="${LOGO_GEOMETRY.monogram.facetUnderPath}" fill="#FFFFFF" opacity="0.35"/>
      <path d="${LOGO_GEOMETRY.monogram.bodyPath}" fill="#FFFFFF"/>
      <line x1="${LOGO_GEOMETRY.monogram.executionLine.x1}" y1="${LOGO_GEOMETRY.monogram.executionLine.y1}" x2="${LOGO_GEOMETRY.monogram.executionLine.x2}" y2="${LOGO_GEOMETRY.monogram.executionLine.y2}" stroke="#FF0000" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="${LOGO_GEOMETRY.monogram.executionLine.node.cx}" cy="${LOGO_GEOMETRY.monogram.executionLine.node.cy}" r="${LOGO_GEOMETRY.monogram.executionLine.node.r}" fill="#FF0000"/>
    </g>

    <!-- Wordmark & Description (Horizontal lockup) -->
    <g transform="translate(340, 160)">
      <text x="0" y="44" font-family="${WORDMARK_TYPOGRAPHY.fallbackStack}" font-size="56" font-weight="700" letter-spacing="-0.04em" fill="#FFFFFF">
        ${BRAND_CONSTANTS.name}
      </text>
      <text x="4" y="74" font-family="${WORDMARK_TYPOGRAPHY.subtitle.fontFamily}" font-size="12" font-weight="500" letter-spacing="0.18em" fill="#A3A3A3">
        ${BRAND_CONSTANTS.category.toUpperCase()}
      </text>
      <text x="4" y="105" font-family="${WORDMARK_TYPOGRAPHY.fallbackStack}" font-size="14" font-weight="400" fill="#737373">
        ${BRAND_CONSTANTS.tagline}
      </text>
    </g>
  </svg>`;
}

// 4. Social Profile Avatar (400 x 400)
function generateAvatarSvg(): string {
  const width = 400;
  const height = 400;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#000000"/>
    
    <!-- Centered Monogram at scale 2x (viewBox: 0 0 128 128 placed in center 256x256) -->
    <g transform="translate(72, 72) scale(2)">
      <path d="${LOGO_GEOMETRY.cornerFraming.combinedPath}" stroke="#A3A3A3" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9"/>
      <path d="${LOGO_GEOMETRY.monogram.facetUnderPath}" fill="#FFFFFF" opacity="0.35"/>
      <path d="${LOGO_GEOMETRY.monogram.bodyPath}" fill="#FFFFFF"/>
      <line x1="${LOGO_GEOMETRY.monogram.executionLine.x1}" y1="${LOGO_GEOMETRY.monogram.executionLine.y1}" x2="${LOGO_GEOMETRY.monogram.executionLine.x2}" y2="${LOGO_GEOMETRY.monogram.executionLine.y2}" stroke="#FF0000" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="${LOGO_GEOMETRY.monogram.executionLine.node.cx}" cy="${LOGO_GEOMETRY.monogram.executionLine.node.cy}" r="${LOGO_GEOMETRY.monogram.executionLine.node.r}" fill="#FF0000"/>
    </g>
  </svg>`;
}

async function run() {
  console.log("Generating NXTQR Social Branding Assets...");

  // 1. Open Graph Image (1200x630)
  const ogSvg = generateOgSvg();
  const ogBuf = await sharp(Buffer.from(ogSvg)).png({ quality: 95 }).toBuffer();
  fs.writeFileSync(path.join(webSocialDir, "opengraph-image.png"), ogBuf);
  fs.writeFileSync(path.join(webAppDir, "opengraph-image.png"), ogBuf);
  fs.writeFileSync(path.join(brandingDistSocialDir, "opengraph-image.png"), ogBuf);

  // 2. Twitter Card Image (1200x600)
  const twSvg = generateTwitterSvg();
  const twBuf = await sharp(Buffer.from(twSvg)).png({ quality: 95 }).toBuffer();
  fs.writeFileSync(path.join(webSocialDir, "twitter-image.png"), twBuf);
  fs.writeFileSync(path.join(webAppDir, "twitter-image.png"), twBuf);
  fs.writeFileSync(path.join(brandingDistSocialDir, "twitter-image.png"), twBuf);

  // 3. GitHub README Banner (1200x380)
  const bannerSvg = generateBannerSvg();
  const bannerBuf = await sharp(Buffer.from(bannerSvg)).png({ quality: 95 }).toBuffer();
  fs.writeFileSync(path.join(webBannersDir, "readme-banner.png"), bannerBuf);
  fs.writeFileSync(path.join(brandingDistSocialDir, "readme-banner.png"), bannerBuf);

  // 4. Social Avatar (400x400)
  const avatarSvg = generateAvatarSvg();
  const avatarBuf = await sharp(Buffer.from(avatarSvg)).png({ quality: 95 }).toBuffer();
  fs.writeFileSync(path.join(webSocialDir, "social-avatar.png"), avatarBuf);
  fs.writeFileSync(path.join(brandingDistSocialDir, "social-avatar.png"), avatarBuf);

  console.log("Social branding assets generated successfully.");
}

run().catch((err) => {
  console.error("Social generation failed:", err);
  process.exit(1);
});

