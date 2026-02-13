import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

type Theme = 'light' | 'dark' | 'system';
type EffectiveTheme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    effectiveTheme: EffectiveTheme;
    setTheme: (theme: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system');
    const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>('dark');
    const { token, user, updateUser } = useAuthStore();

    // Detect system theme preference
    const getSystemTheme = (): EffectiveTheme => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // Calculate effective theme based on user preference
    const calculateEffectiveTheme = (userTheme: Theme): EffectiveTheme => {
        if (userTheme === 'system') {
            return getSystemTheme();
        }
        return userTheme as EffectiveTheme;
    };

    // Initialize theme from user settings
    useEffect(() => {
        if (user?.theme_preference && theme !== user.theme_preference) {
            setThemeState(user.theme_preference as Theme);
        }
    }, [user?.theme_preference]); // Only depend on the specific field

    // Update effective theme when theme changes
    useEffect(() => {
        const newEffectiveTheme = calculateEffectiveTheme(theme);
        setEffectiveTheme(newEffectiveTheme);

        // Apply dark class to html element
        if (newEffectiveTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Listen for system theme changes when in system mode
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const newEffectiveTheme = getSystemTheme();
            setEffectiveTheme(newEffectiveTheme);

            if (newEffectiveTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // Update theme and persist to backend
    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);

        // Update local store immediately for consistency
        updateUser({ theme_preference: newTheme });

        // Persist to backend if authenticated
        if (token) {
            try {
                await fetch(`${import.meta.env.VITE_API_URL}/auth/me/theme`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ theme: newTheme }),
                });
            } catch (error) {
                console.error('Failed to save theme preference:', error);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
