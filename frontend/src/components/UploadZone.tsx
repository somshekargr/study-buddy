import { useState, useCallback } from 'react';
import api from '../services/api';
import { UploadCloud, File, X, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useToast } from './ui/Toast';

export function UploadZone({ onUploadComplete }: { onUploadComplete: () => void }) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        if (file.type !== 'application/pdf') {
            setError('Only PDF files are supported.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB
            setError('File size must be less than 10MB.');
            return;
        }
        setError(null);
        setFile(file);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setProgress(0);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total || 100)
                    );
                    setProgress(percentCompleted);
                },
            });

            showToast('success', `"${file.name}" uploaded successfully!`);
            setFile(null);
            onUploadComplete();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Drop zone — hidden during upload */}
            {!uploading ? (
                <div
                    className={cn(
                        "relative flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 border-dashed transition-all",
                        dragActive ? "border-primary-500 bg-primary-500/10" : "border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800/50",
                        error ? "border-red-500/50 bg-red-500/5" : ""
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="text-center space-y-4">
                        <div className="p-4 rounded-full bg-gray-100 dark:bg-slate-800/50 inline-block">
                            <UploadCloud className="w-8 h-8 text-primary-500 dark:text-primary-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-slate-200">
                                <span className="text-primary-600 dark:text-primary-400 font-semibold cursor-pointer hover:underline" onClick={() => document.getElementById('file-upload')?.click()}>Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-600 dark:text-slate-500 mt-1">PDF up to 10MB</p>
                        </div>
                    </div>
                    <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept="application/pdf"
                        onChange={handleChange}
                    />

                    {dragActive && (
                        <div className="absolute inset-0 bg-primary-500/10 z-10 rounded-xl" />
                    )}
                </div>
            ) : (
                /* Upload progress UI */
                <div className="flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 border-primary-300 dark:border-primary-500/30 bg-primary-50 dark:bg-primary-500/5 transition-all">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-primary-200 dark:border-primary-500/20 border-t-primary-500 dark:border-t-primary-400 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{progress}%</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-gray-900 dark:text-slate-200">
                                Uploading {file?.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                {progress < 100 ? 'Please wait while your file is being uploaded...' : 'Processing...'}
                            </p>
                        </div>
                        {/* Progress bar */}
                        <div className="w-48 bg-gray-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-primary-500 to-violet-500 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-red-500/20">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {file && !uploading && (
                <div className="bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded text-red-600 dark:text-red-400">
                            <File className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-slate-200 truncate">{file.name}</p>
                            <p className="text-xs text-gray-600 dark:text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {file && !uploading && !error && (
                <Button onClick={handleUpload} className="w-full gap-2">
                    <UploadCloud className="w-4 h-4" />
                    Upload Document
                </Button>
            )}
        </div>
    );
}
