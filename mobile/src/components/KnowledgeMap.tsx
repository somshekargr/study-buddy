import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Loader2, BrainCircuit, Network } from 'lucide-react-native';
import api from '../services/api';

interface KnowledgeMapProps {
    documentId: string;
}

export default function KnowledgeMap({ documentId }: KnowledgeMapProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGraph = async () => {
            try {
                const response = await api.get(`/graph/${documentId}`);
                setData(response.data);
            } catch (err) {
                console.error("Failed to fetch graph:", err);
                setError("No connections found. Try chatting more!");
            } finally {
                setLoading(false);
            }
        };

        fetchGraph();
    }, [documentId]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-900">
                <Loader2 size={32} color="#3b82f6" />
                <Text className="text-slate-400 mt-4">Building Knowledge Map...</Text>
            </View>
        );
    }

    if (error || !data || data.nodes.length === 0) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-900 px-6">
                <View className="w-16 h-16 bg-primary-500/10 rounded-full items-center justify-center mb-6">
                    <BrainCircuit size={32} color="#3b82f6" />
                </View>
                <Text className="text-white text-xl font-bold">Knowledge Foundation</Text>
                <Text className="text-slate-400 text-center mt-2 px-4">
                    Connections are discovered as you study. Ask questions to reveal the map!
                </Text>
            </View>
        );
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <script src="https://unpkg.com/force-graph"></script>
            <style>
                body { margin: 0; background-color: #0f172a; overflow: hidden; }
                #graph { width: 100vw; height: 100vh; }
            </style>
        </head>
        <body>
            <div id="graph"></div>
            <script>
                const data = ${JSON.stringify(data)};
                const Graph = ForceGraph()
                    (document.getElementById('graph'))
                    .graphData(data)
                    .nodeLabel('name')
                    .nodeColor(() => '#3b82f6')
                    .linkColor(() => '#334155')
                    .backgroundColor('#0f172a')
                    .linkDirectionalArrowLength(3.5)
                    .linkDirectionalArrowRelPos(1)
                    .linkCurvature(0.25)
                    .nodeCanvasObject((node, ctx, globalScale) => {
                        const label = node.name;
                        const fontSize = 14 / globalScale;
                        ctx.font = fontSize + 'px Sans-Serif';
                        const textWidth = ctx.measureText(label).width;
                        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
                        ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#f8fafc';
                        ctx.fillText(label, node.x, node.y);
                    });
            </script>
        </body>
        </html>
    `;

    return (
        <View className="flex-1 bg-slate-900">
            <WebView
                source={{ html: htmlContent }}
                style={{ backgroundColor: 'transparent' }}
                scrollEnabled={false}
            />
        </View>
    );
}
