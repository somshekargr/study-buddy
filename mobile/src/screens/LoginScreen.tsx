import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../stores/useAuthStore';
import { LogIn } from 'lucide-react-native';

export default function LoginScreen() {
    const { setToken } = useAuthStore();

    const handleMockLogin = () => {
        // For now, we manually set a token to bypass login for development
        // Real implementation will use expo-auth-session
        setToken('mock_token', {
            email: 'dev@studybuddy.com',
            full_name: 'Dev User',
            theme_preference: 'dark'
        });
    };

    return (
        <View className="flex-1 items-center justify-center bg-slate-900 px-6">
            <View className="mb-8 items-center">
                <View className="w-16 h-16 bg-primary-500 rounded-2xl items-center justify-center mb-4">
                    <LogIn size={32} color="white" />
                </View>
                <Text className="text-white text-3xl font-bold">Study Buddy</Text>
                <Text className="text-slate-400 mt-2 text-center">
                    Your AI-powered personal learning assistant
                </Text>
            </View>

            <TouchableOpacity
                onPress={handleMockLogin}
                className="w-full bg-primary-500 py-4 rounded-xl items-center active:bg-primary-600"
            >
                <Text className="text-white font-semibold text-lg">Sign in with Google</Text>
            </TouchableOpacity>
        </View>
    );
}
