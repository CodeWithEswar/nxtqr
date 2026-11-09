/**
 * Synchronous theme initialization script executed before paint
 * Enforces pure black monochrome and cleans up any legacy theme keys.
 */
export function ThemeScript() {
  const scriptContent = `
    (function() {
      try {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        localStorage.removeItem('nxtqr_theme_mode');
        localStorage.removeItem('nxtqr_accent_config');
      } catch (e) {}
    })();
  `;

  return (
    <script
      id="nxtqr-theme-init"
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  );
}
