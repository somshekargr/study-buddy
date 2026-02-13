import { useEffect, useState } from 'react';
import { FileText, MessageSquare, Loader2, CheckCircle, Clock, Trash2, RefreshCcw, Calendar } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { documentsService } from '../services/documentsService';
import { ConfirmModal } from './ui/ConfirmModal';
import { useToast } from './ui/Toast';

interface Document {
    id: string;
    filename: string;
    upload_status: 'pending' | 'processing' | 'ready' | 'failed' | 'needs_ocr';
    created_at: string;
}

export function DocumentList({ refreshTrigger }: { refreshTrigger: number }) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        fetchDocuments();
    }, [refreshTrigger]);

    // Poll for pending/processing documents
    useEffect(() => {
        const hasPending = documents.some(d => d.upload_status === 'pending' || d.upload_status === 'processing');
        if (!hasPending) return;

        const interval = setInterval(async () => {
            try {
                const data = await documentsService.getDocuments();
                const newDocs = data as Document[];

                // Check if any previously pending/processing docs are now ready
                for (const newDoc of newDocs) {
                    const oldDoc = documents.find(d => d.id === newDoc.id);
                    if (oldDoc && (oldDoc.upload_status === 'pending' || oldDoc.upload_status === 'processing') && newDoc.upload_status === 'ready') {
                        showToast('success', `"${newDoc.filename}" is ready to study!`);
                    }
                    if (oldDoc && (oldDoc.upload_status === 'pending' || oldDoc.upload_status === 'processing') && newDoc.upload_status === 'failed') {
                        showToast('error', `Processing failed for "${newDoc.filename}".`);
                    }
                }

                setDocuments(newDocs);
            } catch (error) {
                console.error('Polling failed', error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [documents, showToast]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const data = await documentsService.getDocuments();
            setDocuments(data as Document[]);
        } catch (error) {
            console.error('Failed to fetch documents', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, docId: string) => {
        e.stopPropagation();
        setDocToDelete(docId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!docToDelete) return;

        setIsDeleting(true);
        try {
            const doc = documents.find(d => d.id === docToDelete);
            await documentsService.deleteDocument(docToDelete);
            setDocuments(prev => prev.filter(d => d.id !== docToDelete));
            setIsDeleteModalOpen(false);
            setDocToDelete(null);
            showToast('success', `"${doc?.filename}" has been deleted.`);
        } catch (err) {
            console.error('Failed to delete document:', err);
            showToast('error', 'Failed to delete document. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleReprocess = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            const updated = await documentsService.reprocessDocument(id);
            setDocuments((prev: Document[]) => prev.map((d: Document) => d.id === id ? { ...d, upload_status: updated.upload_status } : d));
            showToast('info', 'Reprocessing started. You\'ll be notified when it\'s complete.');
        } catch (error) {
            showToast('error', 'Failed to start reprocessing. Please try again.');
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'ready': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/20';
            case 'processing': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-400/20';
            case 'failed': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20';
            default: return 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-400/10 border border-gray-200 dark:border-slate-400/20';
        }
    };

    const statusIcon = (status: string) => {
        switch (status) {
            case 'ready': return <CheckCircle className="w-4 h-4" />;
            case 'processing': return <Loader2 className="w-4 h-4 animate-spin" />;
            case 'failed': return <FileText className="w-4 h-4" />; // Error icon
            default: return <Clock className="w-4 h-4" />;
        }
    };

    if (loading && documents.length === 0) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="text-center p-8 border border-dashed border-gray-300 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-slate-900/30">
                <p className="text-gray-600 dark:text-slate-500">No documents found. Upload one to get started!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {documents.map((doc) => (
                <Card key={doc.id} className={cn(
                    "group transition-all duration-300 cursor-pointer",
                    (doc.upload_status === 'pending' || doc.upload_status === 'processing')
                        ? "border-blue-300 dark:border-blue-500/30"
                        : "hover:border-primary-500/40 hover:shadow-lg hover:shadow-primary-500/5"
                )}>
                    <CardContent className="p-5 space-y-4 relative">
                        {/* Processing overlay */}
                        {(doc.upload_status === 'pending' || doc.upload_status === 'processing') && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] rounded-xl z-10 flex flex-col items-center justify-center gap-3">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full border-3 border-blue-200 dark:border-blue-500/20 border-t-blue-500 dark:border-t-blue-400 animate-spin" />
                                </div>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    {doc.upload_status === 'pending' ? 'Queued...' : 'Processing...'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-500">This may take a moment</p>
                            </div>
                        )}

                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2.5 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl group-hover:from-primary-100 group-hover:to-primary-50 dark:group-hover:from-primary-500/15 dark:group-hover:to-primary-500/5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all duration-300 text-gray-600 dark:text-slate-400 shadow-sm">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-slate-200 truncate pr-2">{doc.filename}</h4>
                                    <span className={cn("text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1", statusColor(doc.upload_status))}>
                                        {statusIcon(doc.upload_status)}
                                        <span className="capitalize">{doc.upload_status}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(doc.created_at).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                            })}</span>
                        </div>

                        <div className="pt-2 flex flex-col gap-2">
                            <Button
                                className="w-full gap-2"
                                disabled={doc.upload_status !== 'ready' && doc.upload_status !== 'needs_ocr'}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/study/${doc.id}`);
                                }}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Study Now
                            </Button>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs gap-1 py-1 h-8 text-gray-600 dark:text-slate-400"
                                    onClick={(e) => handleReprocess(e, doc.id)}
                                    disabled={doc.upload_status === 'processing' || doc.upload_status === 'pending'}
                                >
                                    <RefreshCcw className="w-3 h-3" />
                                    Reprocess
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs gap-1 py-1 h-8 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={(e) => handleDelete(e, doc.id)}
                                    disabled={doc.upload_status === 'processing' || doc.upload_status === 'pending'}
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Document"
                message="Are you sure you want to delete this document? This will permanently remove all analytical data, citations, and the Knowledge Map associations. This action cannot be undone."
                confirmText="Delete permanently"
                loading={isDeleting}
            />
        </div>
    );
}
