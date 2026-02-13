import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useStudyStore } from '../stores/useStudyStore';

interface PDFViewerProps {
    documentId: string;
}

export function PDFViewer({ documentId }: PDFViewerProps) {
    const token = useAuthStore((state) => state.token);
    const currentPage = useStudyStore((state) => state.currentPage);
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchPdf = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/documents/${documentId}/content`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to load PDF');

                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                setUrl(objectUrl);
            } catch (error) {
                console.error('Error loading PDF:', error);
            }
        };

        if (documentId && token) {
            fetchPdf();
        }

        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [documentId, token]);

    if (!url) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-900 border-r border-slate-800">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    // Append page number hash to URL to force jumps
    // Chrome's PDF viewer handles hash changes (#page=N).
    const displayUrl = currentPage ? `${url}#page=${currentPage}` : url;

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
