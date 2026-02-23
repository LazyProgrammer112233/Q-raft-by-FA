import { create } from 'zustand';

export interface SqlGeneration {
    task_name: string;
    description: string;
    clickhouse_sql: string;
    trino_sql: string;
    postgres_sql: string;
}

export interface UserSettings {
    designation: 'Product' | 'CST' | 'Tech' | 'Other';
    autoCopySql: boolean;
    reducedMotion: boolean;
}

interface AppState {
    isAnalyzing: boolean;
    uploadProgress: number;
    currentGenerations: SqlGeneration[];
    fileName: string | null;
    settings: UserSettings;
    setAnalyzing: (status: boolean) => void;
    setProgress: (progress: number) => void;
    setGenerations: (generations: SqlGeneration[], fileName: string) => void;
    updateSettings: (newSettings: Partial<UserSettings>) => void;
    reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    isAnalyzing: false,
    uploadProgress: 0,
    currentGenerations: [],
    fileName: null,
    settings: {
        designation: 'Tech',
        autoCopySql: false,
        reducedMotion: false,
    },
    setAnalyzing: (status) => set({ isAnalyzing: status }),
    setProgress: (progress) => set({ uploadProgress: progress }),
    setGenerations: (generations, fileName) => set({ currentGenerations: generations, fileName, isAnalyzing: false }),
    updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
    reset: () => set({ isAnalyzing: false, uploadProgress: 0, currentGenerations: [], fileName: null }),
}));
