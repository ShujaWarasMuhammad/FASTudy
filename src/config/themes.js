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
  root.setAttribute('data-theme', themeKey === 'dark' ? 'dark' : 'light');
  localStorage.setItem('fastudy_theme_mode', themeKey);
};
