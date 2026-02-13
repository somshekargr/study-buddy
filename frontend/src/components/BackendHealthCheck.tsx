import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';

interface BackendHealthContextType {
    isBackendDown: boolean;
    checkHealth: () => Promise<void>;
}

const BackendHealthContext = createContext<BackendHealthContextType | undefined>(undefined);

const HEALTH_ENDPOINT = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') + '/health'
    : 'http://localhost:8000/health';

export const BackendHealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isBackendDown, setIsBackendDown] = useState(false);

    const checkHealth = useCallback(async () => {
        try {
            // Use a short timeout so the UI doesn't hang
            await axios.get(HEALTH_ENDPOINT, { timeout: 3000 });
            setIsBackendDown(false);
        } catch (error) {
            console.warn('Backend health check failed:', error);
            setIsBackendDown(true);
        }
    }, []);

    useEffect(() => {
        // Initial check
        checkHealth();

        // Periodic check every 30 seconds
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, [checkHealth]);

    return (
        <BackendHealthContext.Provider value={{ isBackendDown, checkHealth }}>
            {children}
        </BackendHealthContext.Provider>
    );
};

export const useBackendHealth = () => {
    const context = useContext(BackendHealthContext);
    if (context === undefined) {
        throw new Error('useBackendHealth must be used within a BackendHealthProvider');
    }
    return context;
};
