import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'dark' | 'light';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('dbforge-theme') as Theme;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (t: Theme) => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(t);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('dbforge-theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-[var(--bg-secondary)]/50 transition-all group"
      title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-yellow-400 group-hover:rotate-45 transition-transform" strokeWidth={2} />
      ) : (
        <Moon className="w-4 h-4 text-[var(--text-muted)] group-hover:-rotate-12 transition-transform" strokeWidth={2} />
      )}
    </button>
  );
}
