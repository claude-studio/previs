import { IconMoon, IconSun } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

import { Button } from '../ui/button';

type Theme = 'light' | 'dark';

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initialTheme(): Theme {
  const stored = window.localStorage.getItem('previs-theme');
  return stored === 'dark' || stored === 'light' ? stored : systemTheme();
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => initialTheme());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('previs-theme', theme);
  }, [theme]);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <Button
      aria-label={`${nextTheme === 'dark' ? '다크' : '라이트'} 모드로 전환`}
      onClick={() => setTheme(nextTheme)}
      size="icon"
      variant="tertiary"
    >
      {theme === 'dark' ? (
        <IconSun aria-hidden="true" size={18} />
      ) : (
        <IconMoon aria-hidden="true" size={18} />
      )}
    </Button>
  );
}
