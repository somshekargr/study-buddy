import { create } from 'zustand';

interface StudyState {
    currentPage: number;
    setCurrentPage: (page: number) => void;
}

export const useStudyStore = create<StudyState>((set) => ({
    currentPage: 1,
    setCurrentPage: (page) => set({ currentPage: page }),
}));
