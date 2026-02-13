import { useEffect, useState, useRef } from 'react';
// @ts-ignore
import ForceGraph2D from 'react-force-graph-2d';
import api from '../services/api';
import { Loader2, Network, BrainCircuit } from 'lucide-react';

interface Node {
    id: string;
    name: string;
    val?: number;
}

interface Link {
    source: string;
    target: string;
    label: string;
}

interface GraphData {
    nodes: Node[];
    links: Link[];
}

export function KnowledgeMap({ documentId }: { documentId: string }) {
    const [data, setData] = useState<GraphData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchGraph = async () => {
            try {
                const response = await api.get(`/graph/${documentId}`);
                setData(response.data);
            } catch (err) {
                console.error("Failed to fetch graph:", err);
                setError("No knowledge connections found yet. Try chatting more!");
            } finally {
                setLoading(false);
            }
        };

        fetchGraph();
    }, [documentId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                <p className="animate-pulse">Building Knowledge Map...</p>
            </div>
        );
    }

    if (error || !data || data.nodes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-6 animate-in fade-in duration-700">
                <div className="relative">
                    <div className="w-20 h-20 bg-primary-50 dark:bg-primary-500/10 rounded-3xl flex items-center justify-center rotate-3 group-hover:rotate-6 transition-transform">
                        <BrainCircuit className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700">
                        <Network className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
                <div className="max-w-[280px]">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Knowledge Foundation</h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                        Connections are discovered as you study and chat. Ask a question to start mapping concepts!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="h-full w-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
            <ForceGraph2D
                graphData={data}
                nodeAutoColorBy="id"
                nodeLabel="name"
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.25}
                linkLabel="label"
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                    const label = (node as Node).name;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2) as [number, number];

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.fillRect(node.x! - bckgDimensions[0] / 2, node.y! - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = (node as any).color || '#888';
                    ctx.fillText(label, node.x!, node.y!);

                    (node as any).__bckgDimensions = bckgDimensions;
                }}
                nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                    ctx.fillStyle = color;
                    const bckgDimensions = (node as any).__bckgDimensions;
                    bckgDimensions && ctx.fillRect(node.x! - bckgDimensions[0] / 2, node.y! - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
                }}
                width={containerRef.current?.clientWidth}
                height={containerRef.current?.clientHeight}
            />

            {/* Legend/Overlay */}
            <div className="absolute top-4 left-4 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm z-10 pointer-events-none">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Interactive Map</h4>
                <p className="text-xs text-gray-600 dark:text-slate-400">Explore concept connections</p>
            </div>
        </div>
    );
}
