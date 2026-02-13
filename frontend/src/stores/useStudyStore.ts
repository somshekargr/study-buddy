import { create } from 'zustand';

interface StudyState {
    currentPage: number | null;
    setPage: (page: number) => void;
}

export const useStudyStore = create<StudyState>((set) => ({
    currentPage: null,
    setPage: (page) => set({ currentPage: page }),
}));
