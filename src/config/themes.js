// Fastudy clean themes: Dark and Light only

export const themes = {
  dark: {
    name: 'Dark',
  },
  light: {
    name: 'Light',
  },
};

export const applyTheme = (themeKey) => {
  const root = document.documentElement;
  const mode = themeKey === 'dark' ? 'dark' : 'light';
  root.setAttribute('data-theme', mode);
  root.style.colorScheme = mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'dark' ? '#191919' : '#ffffff');
  try { localStorage.setItem('fastudy_theme_mode', mode); } catch { /* storage unavailable */ }
};
