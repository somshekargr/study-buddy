import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import api from '../services/api';
import { Upload, FilePlus, X } from 'lucide-react-native';

interface UploadZoneProps {
    onUploadSuccess: () => void;
}

export default function UploadZone({ onUploadSuccess }: UploadZoneProps) {
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (!result.canceled) {
                setSelectedFile(result);
            }
        } catch (err) {
            console.error('Error picking document:', err);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || selectedFile.canceled) return;

        setUploading(true);
        const file = selectedFile?.assets?.[0];
        if (!file) return;

        const formData = new FormData();
        // @ts-ignore - FormData on React Native is a bit different
        formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/pdf',
        });

        try {
            await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            Alert.alert('Success', 'Document uploaded successfully!');
            setSelectedFile(null);
            onUploadSuccess();
        } catch (error) {
            console.error('Upload failed:', error);
            Alert.alert('Error', 'Failed to upload document.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <View className="mb-6">
            {!selectedFile ? (
                <TouchableOpacity
                    onPress={pickDocument}
                    className="border-2 border-dashed border-slate-700 rounded-2xl p-8 items-center bg-slate-800/50"
                >
                    <View className="w-12 h-12 bg-slate-700 rounded-full items-center justify-center mb-4">
                        <Upload size={24} color="#94a3b8" />
                    </View>
                    <Text className="text-white font-semibold text-lg">Upload PDF</Text>
                    <Text className="text-slate-500 text-sm mt-1 text-center">
                        Select a study material to get started
                    </Text>
                </TouchableOpacity>
            ) : (
                <View className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center flex-1">
                            <View className="w-10 h-10 bg-primary-500/10 rounded-lg items-center justify-center mr-3">
                                <FilePlus size={20} color="#3b82f6" />
                            </View>
                            <Text className="text-white font-medium flex-1" numberOfLines={1}>
                                {selectedFile?.assets?.[0]?.name}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedFile(null)}>
                            <X size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={handleUpload}
                        disabled={uploading}
                        className={`w-full py-3 rounded-xl items-center ${uploading ? 'bg-slate-700' : 'bg-primary-500'}`}
                    >
                        {uploading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-semibold">Confirm Upload</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
