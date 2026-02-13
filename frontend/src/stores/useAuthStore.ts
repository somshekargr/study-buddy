import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    email: string;
    full_name: string;
    theme_preference: string;
}

interface AuthState {
    token: string | null;
    user: User | null;
    hasHydrated: boolean;
    setToken: (token: string | null, user?: User) => void;
    updateUser: (user: Partial<User>) => void;
    isAuthenticated: () => boolean;
    logout: () => void;
    setHasHydrated: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            hasHydrated: false,
            setToken: (token, user) => {
                if (token) {
                    set({ token, user: user || null });
                } else {
                    set({ token: null, user: null });
                }
            },
            updateUser: (userData) => {
                const currentUser = get().user;
                if (currentUser) {
                    set({ user: { ...currentUser, ...userData } });
                }
            },
            logout: () => {
                set({ user: null, token: null });
                localStorage.removeItem('auth-storage'); // Force clear
            },
            isAuthenticated: () => !!get().token,
            setHasHydrated: (state) => set({ hasHydrated: state }),
        }),
        {
            name: 'auth-storage', // key in localStorage
            partialize: (state) => ({
                token: state.token,
                user: state.user,
            }),
            onRehydrateStorage: () => {
                return (state, error) => {
                    if (!error) {
                        state?.setHasHydrated(true);
                        if (state && !state.token) {
                            state.user = null;
                        }
                    }
                };
            },
        }
    )
);
