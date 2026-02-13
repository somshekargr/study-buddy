import api from './api';

export interface DocumentResponse {
    id: string;
    filename: string;
    upload_status: 'pending' | 'processing' | 'ready' | 'failed' | 'needs_ocr';
    total_pages: number;
    total_chunks: number;
    created_at: string;
}

export const documentsService = {
    getDocuments: async (): Promise<DocumentResponse[]> => {
        const response = await api.get<DocumentResponse[]>('/documents');
        return response.data;
    },

    getDocumentStatus: async (id: string): Promise<DocumentResponse> => {
        const response = await api.get<DocumentResponse>(`/documents/${id}`);
        return response.data;
    },

    deleteDocument: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>(`/documents/${id}`);
        return response.data;
    },

    reprocessDocument: async (id: string): Promise<DocumentResponse> => {
        const response = await api.post<DocumentResponse>(`/documents/${id}/reprocess`);
        return response.data;
    }
};
