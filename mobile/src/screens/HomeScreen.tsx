import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuthStore } from '../stores/useAuthStore';
import api from '../services/api';
import { LogOut, FileText, Plus, X } from 'lucide-react-native';
import UploadZone from '../components/UploadZone';

interface Document {
    id: string;
    filename: string;
    upload_status: string;
    created_at: string;
}

export default function HomeScreen({ navigation }: any) {
    const { logout, user } = useAuthStore();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showUpload, setShowUpload] = useState(false);

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/documents');
            setDocuments(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDocuments();
    };

    const renderItem = ({ item }: { item: Document }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('DocumentDetail', { documentId: item.id, filename: item.filename })}
            className="flex-row items-center p-4 mb-3 bg-slate-800 rounded-xl border border-slate-700"
        >
            <View className="w-10 h-10 bg-slate-700 rounded-lg items-center justify-center mr-4">
                <FileText size={20} color="#94a3b8" />
            </View>
            <View className="flex-1">
                <Text className="text-white font-medium" numberOfLines={1}>
                    {item.filename}
                </Text>
                <Text className="text-slate-500 text-xs mt-1 capitalize">
                    {item.upload_status} • {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-slate-900 pt-12 px-4">
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <Text className="text-slate-400 text-sm">Welcome back,</Text>
                    <Text className="text-white text-xl font-bold">{user?.full_name}</Text>
                </View>
                <TouchableOpacity onPress={logout} className="p-2 bg-slate-800 rounded-full">
                    <LogOut size={20} color="#f87171" />
                </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-semibold">Your Documents</Text>
                <TouchableOpacity
                    onPress={() => setShowUpload(!showUpload)}
                    className={`flex-row items-center px-3 py-1.5 rounded-lg ${showUpload ? 'bg-slate-700' : 'bg-primary-500'}`}
                >
                    {showUpload ? <X size={16} color="white" /> : <Plus size={16} color="white" />}
                    <Text className="text-white font-medium ml-1">{showUpload ? 'Close' : 'Upload'}</Text>
                </TouchableOpacity>
            </View>

            {showUpload && (
                <UploadZone onUploadSuccess={() => {
                    setShowUpload(false);
                    fetchDocuments();
                }} />
            )}

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#3b82f6" />
                </View>
            ) : (
                <FlatList
                    data={documents}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                    }
                    ListEmptyComponent={
                        <View className="mt-20 items-center justify-center">
                            <Text className="text-slate-400">No documents found</Text>
                        </View>
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
}
