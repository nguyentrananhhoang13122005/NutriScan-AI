import { create } from 'zustand';
import { NutritionResult, UserProfile } from '../types/nutrition';
import { DEFAULT_PROFILES } from '../constants/mockData';
import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';

interface AppState {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  history: NutritionResult[];
  currentScan: NutritionResult | null;
  isAnalyzing: boolean;
  analyzingImageUri: string | null;
  activeTab: 'scan' | 'history' | 'profile';
  shareModalVisible: boolean;

  // Actions
  loadInitialData: () => Promise<void>;
  setActiveProfile: (profileId: string) => Promise<void>;
  updateProfile: (updated: UserProfile) => Promise<void>;
  resetProfilesToDefault: () => Promise<void>;
  startAnalyze: (imageUri: string) => Promise<void>;
  viewScanDetail: (scan: NutritionResult) => void;
  clearCurrentScan: () => void;
  deleteHistoryItem: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  setActiveTab: (tab: 'scan' | 'history' | 'profile') => void;
  setShareModalVisible: (visible: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  profiles: [],
  activeProfile: null,
  history: [],
  currentScan: null,
  isAnalyzing: false,
  analyzingImageUri: null,
  activeTab: 'scan',
  shareModalVisible: false,

  loadInitialData: async () => {
    const [profiles, activeId, history] = await Promise.all([
      storageService.getProfiles(),
      storageService.getActiveProfileId(),
      storageService.getScanHistory(),
    ]);

    const activeProfile = profiles.find((p) => p.id === activeId) || profiles[0] || null;

    set({
      profiles,
      activeProfile,
      history,
    });
  },

  setActiveProfile: async (profileId: string) => {
    const { profiles } = get();
    const found = profiles.find((p) => p.id === profileId);
    if (found) {
      await storageService.setActiveProfileId(profileId);
      set({ activeProfile: found });
    }
  },

  updateProfile: async (updated: UserProfile) => {
    const { profiles } = get();
    const newProfiles = profiles.map((p) => (p.id === updated.id ? updated : p));
    await storageService.saveProfiles(newProfiles);
    set({
      profiles: newProfiles,
      activeProfile: updated,
    });
  },

  resetProfilesToDefault: async () => {
    await storageService.saveProfiles(DEFAULT_PROFILES);
    await storageService.setActiveProfileId(DEFAULT_PROFILES[0].id);
    set({
      profiles: DEFAULT_PROFILES,
      activeProfile: DEFAULT_PROFILES[0],
    });
  },

  startAnalyze: async (imageUri: string) => {
    const { activeProfile } = get();
    if (!activeProfile) return;

    set({
      isAnalyzing: true,
      analyzingImageUri: imageUri,
    });

    try {
      const result = await aiService.analyzeLabel(imageUri, activeProfile);
      await storageService.saveScanToHistory(result);
      
      const updatedHistory = await storageService.getScanHistory();
      set({
        isAnalyzing: false,
        analyzingImageUri: null,
        currentScan: result,
        history: updatedHistory,
      });
    } catch (error) {
      console.error('Phân tích thất bại:', error);
      set({
        isAnalyzing: false,
        analyzingImageUri: null,
      });
    }
  },

  viewScanDetail: (scan: NutritionResult) => {
    set({ currentScan: scan });
  },

  clearCurrentScan: () => {
    set({ currentScan: null });
  },

  deleteHistoryItem: async (id: string) => {
    await storageService.deleteScanFromHistory(id);
    const updated = await storageService.getScanHistory();
    set({ history: updated });
  },

  clearAllHistory: async () => {
    await storageService.clearAllHistory();
    set({ history: [] });
  },

  setActiveTab: (tab: 'scan' | 'history' | 'profile') => {
    set({ activeTab: tab });
  },

  setShareModalVisible: (visible: boolean) => {
    set({ shareModalVisible: visible });
  },
}));
