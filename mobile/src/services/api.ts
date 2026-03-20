import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

// For mobile, we typically use an environment variable or a local IP for dev
// npx expo start will provide the IP of your machine.
const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token and ngrok bypass
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Always skip ngrok browser warning for all requests
        config.headers['ngrok-skip-browser-warning'] = 'true';
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle 401s
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default api;
