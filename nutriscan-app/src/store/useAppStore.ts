import { create } from 'zustand';
import { Alert } from 'react-native';
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
  compareItems: NutritionResult[];

  // Actions
  loadInitialData: () => Promise<void>;
  setActiveProfile: (profileId: string) => Promise<void>;
  updateProfile: (updated: UserProfile) => Promise<void>;
  resetProfilesToDefault: () => Promise<void>;
  startAnalyze: (imageUri: string) => Promise<void>;
  startBarcodeScan: (barcode: string) => Promise<'FOUND' | 'NOT_FOUND' | 'ERROR'>;
  viewScanDetail: (scan: NutritionResult) => void;
  clearCurrentScan: () => void;
  deleteHistoryItem: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  setActiveTab: (tab: 'scan' | 'history' | 'profile') => void;
  setShareModalVisible: (visible: boolean) => void;
  toggleCompareItem: (scan: NutritionResult) => void;
  clearCompareItems: () => void;
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
  compareItems: [],

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

      // Kiểm tra nếu ảnh không phải bao bì/nhãn thực phẩm hợp lệ
      if (result.is_valid_food_label === false) {
        set({
          isAnalyzing: false,
          analyzingImageUri: null,
        });
        Alert.alert(
          'Chưa nhận diện được Bảng Thành Phần',
          result.summary ||
            'Bức ảnh không rõ chữ hoặc không phải bao bì thực phẩm. Bạn hãy đưa camera lại gần bảng thành phần và chụp rõ nét hơn nhé!'
        );
        return;
      }

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

  startBarcodeScan: async (barcode: string) => {
    const { activeProfile } = get();
    if (!activeProfile) return 'ERROR';

    set({
      isAnalyzing: true,
      analyzingImageUri: null,
    });

    try {
      const result = await aiService.analyzeByBarcode(barcode, activeProfile);
      if (!result) {
        set({
          isAnalyzing: false,
          analyzingImageUri: null,
        });
        return 'NOT_FOUND';
      }

      await storageService.saveScanToHistory(result);
      const updatedHistory = await storageService.getScanHistory();

      set({
        isAnalyzing: false,
        analyzingImageUri: null,
        currentScan: result,
        history: updatedHistory,
      });
      return 'FOUND';
    } catch (error) {
      console.error('Lỗi quét mã vạch:', error);
      set({
        isAnalyzing: false,
        analyzingImageUri: null,
      });
      return 'ERROR';
    }
  },

  viewScanDetail: (scan: NutritionResult) => {
    set({ currentScan: scan });
  },

  clearCurrentScan: () => {
    set({ currentScan: null });
  },

  deleteHistoryItem: async (id: string) => {
    const { compareItems } = get();
    await storageService.deleteScanFromHistory(id);
    const updated = await storageService.getScanHistory();
    set({
      history: updated,
      compareItems: compareItems.filter((item) => item.id !== id),
    });
  },

  clearAllHistory: async () => {
    await storageService.clearAllHistory();
    set({ history: [], compareItems: [] });
  },

  setActiveTab: (tab: 'scan' | 'history' | 'profile') => {
    set({ activeTab: tab });
  },

  setShareModalVisible: (visible: boolean) => {
    set({ shareModalVisible: visible });
  },

  toggleCompareItem: (scan: NutritionResult) => {
    const { compareItems } = get();
    const exists = compareItems.some((item) => item.id === scan.id);
    if (exists) {
      set({ compareItems: compareItems.filter((item) => item.id !== scan.id) });
    } else {
      if (compareItems.length >= 2) {
        // Thay thế sản phẩm thứ 2 bằng sản phẩm mới chọn
        set({ compareItems: [compareItems[0], scan] });
      } else {
        set({ compareItems: [...compareItems, scan] });
      }
    }
  },

  clearCompareItems: () => {
    set({ compareItems: [] });
  },
}));
