import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useStudyStore } from '../stores/useStudyStore';
import api from '../services/api';

interface PDFViewerProps {
    documentId: string;
}

export function PDFViewer({ documentId }: PDFViewerProps) {
    const currentPage = useStudyStore((state) => state.currentPage);
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchPdf = async () => {
            try {
                // Using axios instance instead of raw fetch to get ngrok-skip-browser-warning header
                const response = await api.get(`/documents/${documentId}/content`, {
                    responseType: 'blob'
                });

                const objectUrl = URL.createObjectURL(response.data);
                setUrl(objectUrl);
            } catch (error) {
                console.error('Error loading PDF:', error);
            }
        };

        if (documentId) {
            fetchPdf();
        }

        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [documentId]);

    if (!url) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-900 border-r border-slate-800">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    // Detect mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Append page number hash to URL to force jumps
    // Chrome's PDF viewer handles hash changes (#page=N).
    const displayUrl = currentPage ? `${url}#page=${currentPage}` : url;

    if (isMobile) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-slate-900 border-r border-slate-800 p-6 text-center space-y-6">
                <div className="w-20 h-20 bg-primary-500/10 rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-pulse" />
                </div>
                <div className="max-w-xs space-y-2">
                    <h3 className="text-lg font-semibold text-white">PDF Ready</h3>
                    <p className="text-sm text-slate-400">
                        Since you're on a mobile device, please open the PDF in a new tab to view it comfortably.
                    </p>
                </div>
                <button
                    onClick={() => window.open(url, '_blank')}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                >
                    Open PDF
                </button>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-900 border-r border-slate-800">
            <iframe
                src={displayUrl}
                className="w-full h-full border-none"
                title="PDF Viewer"
            />
        </div>
    );
}
