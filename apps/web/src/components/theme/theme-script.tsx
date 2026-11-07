/**
 * Synchronous theme initialization script executed before paint
 * to completely eliminate hydration flash or theme flicker.
 */
export function ThemeScript() {
  const scriptContent = `
    (function() {
      try {
        var mode = localStorage.getItem('nxtqr_theme_mode') || 'dark';
        if (mode === 'system') {
          var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.classList.toggle('dark', isDark);
          document.documentElement.classList.toggle('light', !isDark);
        } else if (mode === 'light') {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        }

        var accentRaw = localStorage.getItem('nxtqr_accent_config');
        if (accentRaw) {
          var accentConfig = JSON.parse(accentRaw);
          var presets = {
            monochrome: '#FFFFFF',
            red: '#FF0000',
            orange: '#FF6600',
            yellow: '#FFD600',
            amber: '#FFD600',
            green: '#00CC66',
            blue: '#0066FF',
            violet: '#8000FF',
            pink: '#FF0099'
          };
          var hex = (accentConfig.customHex && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(accentConfig.customHex))
            ? accentConfig.customHex
            : (presets[accentConfig.preset] || '#FFFFFF');

          // Normalize 3-char hex to 6-char
          var cleanHex = hex.replace(/^#/, '');
          if (cleanHex.length === 3) {
            cleanHex = cleanHex[0] + cleanHex[0] + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2];
          }

          var r = parseInt(cleanHex.slice(0, 2), 16) || 0;
          var g = parseInt(cleanHex.slice(2, 4), 16) || 0;
          var b = parseInt(cleanHex.slice(4, 6), 16) || 0;
          var sR = r / 255, sG = g / 255, sB = b / 255;
          var lR = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
          var lG = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
          var lB = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);
          var lum = 0.2126 * lR + 0.7152 * lG + 0.0722 * lB;
          var fg = lum >= 0.30 ? '#000000' : '#FFFFFF';

          document.documentElement.style.setProperty('--accent', hex);
          document.documentElement.style.setProperty('--accent-foreground', fg);
          document.documentElement.style.setProperty('--accent-ring', hex);
          document.documentElement.style.setProperty('--ring', hex);
        }
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: scriptContent }} />;
}
