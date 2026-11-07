# NXTQR Production Brand Asset Manifest

All assets are deterministically compiled from the master vector SVG via `pnpm --filter @nxtqr/branding generate:all` and validated via `pnpm --filter @nxtqr/branding validate:assets`.

---

## 1. Icon & Favicon System

| File Path                                              | Format & Dimensions                 | Size     | Purpose                                          |
| :----------------------------------------------------- | :---------------------------------- | :------- | :----------------------------------------------- |
| `apps/web/public/branding/icons/favicon.ico`           | Multi-resolution ICO (16×16, 32×32) | 1,042 B  | Browser address bars & desktop bookmarks         |
| `apps/web/public/branding/icons/favicon.svg`           | SVG Vector (128×128)                | 1,196 B  | Scalable modern browser favicon                  |
| `apps/web/public/branding/icons/icon-16.png`           | PNG 16×16                           | 366 B    | Legacy desktop bookmarks                         |
| `apps/web/public/branding/icons/icon-32.png`           | PNG 32×32                           | 602 B    | Standard browser tabs                            |
| `apps/web/public/branding/icons/icon-48.png`           | PNG 48×48                           | 882 B    | Windows taskbar shortcut tiles                   |
| `apps/web/public/branding/icons/icon-192.png`          | PNG 192×192                         | 3,259 B  | Mobile home screen icon (PWA)                    |
| `apps/web/public/branding/icons/icon-512.png`          | PNG 512×512                         | 10,453 B | High-DPI PWA splash screen                       |
| `apps/web/public/branding/icons/apple-touch-icon.png`  | PNG 180×180                         | 3,249 B  | iOS Safari web clip & home screen                |
| `apps/web/public/branding/icons/maskable-icon-512.png` | PNG 512×512                         | 13,998 B | Android adaptive maskable icon with safe margins |

---

## 2. Next.js App Router Root Assets

| File Path                              | Format & Dimensions  | Size     | Next.js Metadata Hook                            |
| :------------------------------------- | :------------------- | :------- | :----------------------------------------------- |
| `apps/web/src/app/icon.svg`            | SVG Vector (128×128) | 1,196 B  | `app/icon.svg` automatically injected            |
| `apps/web/src/app/apple-icon.png`      | PNG 180×180          | 3,249 B  | `app/apple-icon.png` automatically injected      |
| `apps/web/src/app/opengraph-image.png` | PNG 1200×630         | 16,931 B | `app/opengraph-image.png` automatically injected |
| `apps/web/src/app/twitter-image.png`   | PNG 1200×600         | 17,750 B | `app/twitter-image.png` automatically injected   |

---

## 3. Social & Marketing Assets

| File Path                                             | Format & Dimensions | Size     | Usage                                       |
| :---------------------------------------------------- | :------------------ | :------- | :------------------------------------------ |
| `apps/web/public/branding/social/opengraph-image.png` | PNG 1200×630        | 16,931 B | Open Graph cards (Slack, LinkedIn, Discord) |
| `apps/web/public/branding/social/twitter-image.png`   | PNG 1200×600        | 17,750 B | X / Twitter `summary_large_image`           |
| `apps/web/public/branding/social/social-avatar.png`   | PNG 400×400         | 2,501 B  | Square avatar for GitHub / X profiles       |
| `apps/web/public/branding/banners/readme-banner.png`  | PNG 1200×380        | 13,033 B | GitHub repository README header             |

---

## 4. Master SVG Vector Library

| File Path                                            | Lockup Mode                                             | Dimensions |
| :--------------------------------------------------- | :------------------------------------------------------ | :--------- |
| `apps/web/public/branding/logos/logo-primary.svg`    | Full Horizontal Lockup (Monogram + Wordmark + Category) | 380 × 96   |
| `apps/web/public/branding/logos/logo-symbol.svg`     | Framed Geometric N Monogram                             | 128 × 128  |
| `apps/web/public/branding/logos/logo-minimal.svg`    | Unframed N Monogram                                     | 128 × 128  |
| `apps/web/public/branding/logos/logo-inverse.svg`    | Framed Monogram on White Surface                        | 128 × 128  |
| `apps/web/public/branding/logos/logo-monochrome.svg` | Single-Color Monogram (`currentColor`)                  | 128 × 128  |
