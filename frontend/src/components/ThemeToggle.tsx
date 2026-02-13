import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useRef, useEffect } from 'react';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const themes = [
        { value: 'light' as const, label: 'Light', icon: Sun },
        { value: 'dark' as const, label: 'Dark', icon: Moon },
        { value: 'system' as const, label: 'System', icon: Monitor },
    ];

    const currentTheme = themes.find((t) => t.value === theme) || themes[2];
    const Icon = currentTheme.icon;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 transition-colors border border-white/10"
                title={`Theme: ${currentTheme.label}`}
            >
                <Icon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span className="text-sm text-slate-700 dark:text-slate-300 hidden sm:inline">
                    {currentTheme.label}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50">
                    {themes.map((t) => {
                        const ThemeIcon = t.icon;
                        return (
                            <button
                                key={t.value}
                                onClick={() => {
                                    setTheme(t.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${theme === t.value
                                        ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                                        : 'text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                <ThemeIcon className="w-4 h-4" />
                                <span className="text-sm">{t.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
