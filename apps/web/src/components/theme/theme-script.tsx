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
            monochrome: '#FAFAFA',
            red: '#E5484D',
            orange: '#F28C52',
            amber: '#E9AD46',
            green: '#48B98A',
            blue: '#579DFF',
            violet: '#A78BFA',
            pink: '#E879B9'
          };
          var hex = (accentConfig.customHex && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(accentConfig.customHex))
            ? accentConfig.customHex
            : (presets[accentConfig.preset] || '#FAFAFA');

          document.documentElement.style.setProperty('--accent', hex);
          document.documentElement.style.setProperty('--accent-ring', hex);
          document.documentElement.style.setProperty('--ring', hex);
        }
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: scriptContent }} />;
}
