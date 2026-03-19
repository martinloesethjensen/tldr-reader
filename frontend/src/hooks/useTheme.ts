import { useState } from 'react';

export type Theme = 'dark' | 'light';

const THEME_KEY = 'tldr-theme';

function getStored(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {}
  return 'dark';
}

// Apply before first render to avoid flash of wrong theme
const initial = getStored();
document.documentElement.setAttribute('data-theme', initial);

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initial);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    setTheme(next);
  };

  return { theme, toggle };
}
