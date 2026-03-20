import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Pdf from 'react-native-pdf';
import api from '../services/api';
import { Loader2, AlertTriangle } from 'lucide-react-native';
import { Paths, File } from 'expo-file-system';

interface PDFViewerProps {
    documentId: string;
}

export default function PDFViewer({ documentId }: PDFViewerProps) {
    const [localUri, setLocalUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const downloadPdf = async () => {
            try {
                // We need to download the PDF to a local file because react-native-pdf
                // works best with local files or direct URLs that don't need complex headers
                // But since we need the ngrok bypass and auth headers, we'll fetch it manually.

                const pdfFile = new File(Paths.cache.uri, `${documentId}.pdf`);

                if (pdfFile.exists) {
                    setLocalUri(pdfFile.uri);
                    setLoading(false);
                    return;
                }

                // Fetching via our API utility which has the right headers
                const response = await api.get(`/documents/${documentId}/content`, {
                    responseType: 'arraybuffer'
                });

                // Manual base64 conversion for RN
                const bytes = new Uint8Array(response.data);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);

                pdfFile.write(base64, { encoding: 'base64' });
                setLocalUri(pdfFile.uri);
            } catch (err) {
                console.error('Error loading PDF:', err);
                setError('Failed to load document content.');
            } finally {
                setLoading(false);
            }
        };

        downloadPdf();
    }, [documentId]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-900">
                <Loader2 size={32} color="#3b82f6" />
                <Text className="text-slate-400 mt-4">Opening PDF...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-900 px-6">
                <AlertTriangle size={32} color="#f87171" />
                <Text className="text-white text-lg font-bold mt-4">Load Error</Text>
                <Text className="text-slate-400 text-center mt-2">{error}</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-900">
            {localUri && (
                <Pdf
                    source={{ uri: localUri }}
                    style={styles.pdf}
                    onError={(err) => {
                        console.error('Pdf error:', err);
                        setError('PDF display failed.');
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        backgroundColor: '#0f172a',
    }
});
