import fs from "fs";
import path from "path";
import sharp from "sharp";

interface AssetSpec {
  filepath: string;
  expectedWidth?: number;
  expectedHeight?: number;
  expectedFormat?: string;
  minSize?: number;
}

const rootDir = path.resolve(__dirname, "../../..");
const webPublicDir = path.join(rootDir, "apps/web/public");
const webAppDir = path.join(rootDir, "apps/web/src/app");

const ASSETS_TO_VALIDATE: AssetSpec[] = [
  // App Icons
  {
    filepath: path.join(webPublicDir, "branding/icons/icon-16.png"),
    expectedWidth: 16,
    expectedHeight: 16,
    expectedFormat: "png",
    minSize: 100,
  },
  {
    filepath: path.join(webPublicDir, "branding/icons/icon-32.png"),
    expectedWidth: 32,
    expectedHeight: 32,
    expectedFormat: "png",
    minSize: 150,
  },
  {
    filepath: path.join(webPublicDir, "branding/icons/icon-48.png"),
    expectedWidth: 48,
    expectedHeight: 48,
    expectedFormat: "png",
    minSize: 200,
  },
  {
    filepath: path.join(webPublicDir, "branding/icons/icon-192.png"),
    expectedWidth: 192,
    expectedHeight: 192,
    expectedFormat: "png",
    minSize: 1000,
  },
  {
    filepath: path.join(webPublicDir, "branding/icons/icon-512.png"),
    expectedWidth: 512,
    expectedHeight: 512,
    expectedFormat: "png",
    minSize: 3000,
  },
  {
    filepath: path.join(webPublicDir, "branding/icons/apple-touch-icon.png"),
    expectedWidth: 180,
    expectedHeight: 180,
    expectedFormat: "png",
    minSize: 1000,
  },
  {
    filepath: path.join(webPublicDir, "branding/icons/maskable-icon-512.png"),
    expectedWidth: 512,
    expectedHeight: 512,
    expectedFormat: "png",
    minSize: 3000,
  },
  { filepath: path.join(webPublicDir, "branding/icons/favicon.svg"), minSize: 200 },
  { filepath: path.join(webPublicDir, "branding/icons/favicon.ico"), minSize: 500 },
  {
    filepath: path.join(webPublicDir, "branding/icons/app-icon-hero.png"),
    expectedWidth: 512,
    expectedHeight: 512,
    expectedFormat: "png",
    minSize: 10000,
  },
  {
    filepath: path.join(webPublicDir, "branding/icons/app-icon-black.png"),
    expectedWidth: 256,
    expectedHeight: 256,
    expectedFormat: "png",
    minSize: 5000,
  },
  {
    filepath: path.join(webPublicDir, "branding/icons/app-icon-white.png"),
    expectedWidth: 256,
    expectedHeight: 256,
    expectedFormat: "png",
    minSize: 5000,
  },
  {
    filepath: path.join(webPublicDir, "branding/icons/app-icon-red.png"),
    expectedWidth: 256,
    expectedHeight: 256,
    expectedFormat: "png",
    minSize: 5000,
  },
  { filepath: path.join(webPublicDir, "branding/icons/app-icon-hero.png"), expectedWidth: 512, expectedHeight: 512, expectedFormat: "png", minSize: 10000 },
  { filepath: path.join(webPublicDir, "branding/icons/app-icon-black.png"), expectedWidth: 256, expectedHeight: 256, expectedFormat: "png", minSize: 5000 },
  { filepath: path.join(webPublicDir, "branding/icons/app-icon-white.png"), expectedWidth: 256, expectedHeight: 256, expectedFormat: "png", minSize: 5000 },
  { filepath: path.join(webPublicDir, "branding/icons/app-icon-red.png"), expectedWidth: 256, expectedHeight: 256, expectedFormat: "png", minSize: 5000 },

  // Next.js App Router Root Assets
  { filepath: path.join(webAppDir, "icon.svg"), minSize: 200 },
  {
    filepath: path.join(webAppDir, "apple-icon.png"),
    expectedWidth: 180,
    expectedHeight: 180,
    expectedFormat: "png",
    minSize: 1000,
  },
  {
    filepath: path.join(webAppDir, "opengraph-image.png"),
    expectedWidth: 1200,
    expectedHeight: 630,
    expectedFormat: "png",
    minSize: 5000,
  },
  {
    filepath: path.join(webAppDir, "twitter-image.png"),
    expectedWidth: 1200,
    expectedHeight: 600,
    expectedFormat: "png",
    minSize: 5000,
  },

  // Social & Banners
  {
    filepath: path.join(webPublicDir, "branding/social/opengraph-image.png"),
    expectedWidth: 1200,
    expectedHeight: 630,
    expectedFormat: "png",
    minSize: 5000,
  },
  {
    filepath: path.join(webPublicDir, "branding/social/twitter-image.png"),
    expectedWidth: 1200,
    expectedHeight: 600,
    expectedFormat: "png",
    minSize: 5000,
  },
  {
    filepath: path.join(webPublicDir, "branding/social/social-avatar.png"),
    expectedWidth: 400,
    expectedHeight: 400,
    expectedFormat: "png",
    minSize: 2000,
  },
  {
    filepath: path.join(webPublicDir, "branding/banners/readme-banner.png"),
    expectedWidth: 1200,
    expectedHeight: 380,
    expectedFormat: "png",
    minSize: 5000,
  },
];

async function validate() {
  console.log("=== VALIDATING BRAND ASSETS INVENTORY ===");
  let passedCount = 0;
  let failedCount = 0;

  for (const asset of ASSETS_TO_VALIDATE) {
    const relPath = path.relative(rootDir, asset.filepath);
    if (!fs.existsSync(asset.filepath)) {
      console.error(`[FAIL] Missing file: ${relPath}`);
      failedCount++;
      continue;
    }

    const stats = fs.statSync(asset.filepath);
    if (asset.minSize && stats.size < asset.minSize) {
      console.error(
        `[FAIL] File size too small (${stats.size} bytes < ${asset.minSize}): ${relPath}`,
      );
      failedCount++;
      continue;
    }

    if (asset.expectedWidth || asset.expectedHeight || asset.expectedFormat) {
      try {
        const metadata = await sharp(asset.filepath).metadata();
        if (asset.expectedWidth && metadata.width !== asset.expectedWidth) {
          console.error(
            `[FAIL] Width mismatch (${metadata.width} !== ${asset.expectedWidth}): ${relPath}`,
          );
          failedCount++;
          continue;
        }
        if (asset.expectedHeight && metadata.height !== asset.expectedHeight) {
          console.error(
            `[FAIL] Height mismatch (${metadata.height} !== ${asset.expectedHeight}): ${relPath}`,
          );
          failedCount++;
          continue;
        }
        if (asset.expectedFormat && metadata.format !== asset.expectedFormat) {
          console.error(
            `[FAIL] Format mismatch (${metadata.format} !== ${asset.expectedFormat}): ${relPath}`,
          );
          failedCount++;
          continue;
        }
      } catch (err) {
        console.error(`[FAIL] Corrupted image read error: ${relPath}`, err);
        failedCount++;
        continue;
      }
    }

    console.log(`[PASS] ${relPath} (${stats.size} bytes)`);
    passedCount++;
  }

  console.log(`\nValidation complete: ${passedCount} passed, ${failedCount} failed.`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

validate().catch((err) => {
  console.error("Asset validation script error:", err);
  process.exit(1);
});
