import AsyncStorage from '@react-native-async-storage/async-storage';
import { NutritionResult, UserProfile } from '../types/nutrition';
import { DEFAULT_PROFILES, MOCK_SCANS } from '../constants/mockData';

const KEYS = {
  PROFILES: '@nutriscan_profiles',
  ACTIVE_PROFILE_ID: '@nutriscan_active_profile_id',
  SCAN_HISTORY: '@nutriscan_scan_history',
  API_KEY_GEMINI: '@nutriscan_api_key_gemini',
  API_KEY_OPENAI: '@nutriscan_api_key_openai',
  AI_PROVIDER: '@nutriscan_ai_provider',
};

export const storageService = {
  async getProfiles(): Promise<UserProfile[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PROFILES);
      if (data) {
        const parsed = JSON.parse(data);
        const hasLegacy = parsed.some(
          (p: any) =>
            p.id === 'profile_ken' ||
            p.name?.includes('Bé Ken') ||
            p.name?.includes('Mẹ Lan')
        );
        if (hasLegacy) {
          await AsyncStorage.setItem(KEYS.PROFILES, JSON.stringify(DEFAULT_PROFILES));
          await AsyncStorage.setItem(KEYS.ACTIVE_PROFILE_ID, DEFAULT_PROFILES[0].id);
          return DEFAULT_PROFILES;
        }
        return parsed;
      }
      // Lưu mặc định lần đầu
      await AsyncStorage.setItem(KEYS.PROFILES, JSON.stringify(DEFAULT_PROFILES));
      return DEFAULT_PROFILES;
    } catch {
      return DEFAULT_PROFILES;
    }
  },

  async saveProfiles(profiles: UserProfile[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
    } catch (e) {
      console.error('Error saving profiles:', e);
    }
  },

  async getActiveProfileId(): Promise<string> {
    try {
      const id = await AsyncStorage.getItem(KEYS.ACTIVE_PROFILE_ID);
      if (id === 'profile_ken' || id === 'profile_mom') {
        return DEFAULT_PROFILES[0].id;
      }
      return id || DEFAULT_PROFILES[0].id;
    } catch {
      return DEFAULT_PROFILES[0].id;
    }
  },

  async setActiveProfileId(id: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.ACTIVE_PROFILE_ID, id);
    } catch (e) {
      console.error('Error setting active profile id:', e);
    }
  },

  async getScanHistory(): Promise<NutritionResult[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SCAN_HISTORY);
      if (data) {
        const parsed: NutritionResult[] = JSON.parse(data);
        // Tự động lọc bỏ các mẫu mock scan ban đầu nếu còn lưu trong máy
        const realScans = parsed.filter(
          (item) =>
            item.id !== 'scan_snack_ostar' &&
            item.id !== 'scan_susu_yogurt' &&
            item.id !== 'scan_organic_rice_cake'
        );
        if (realScans.length !== parsed.length) {
          await AsyncStorage.setItem(KEYS.SCAN_HISTORY, JSON.stringify(realScans));
        }
        return realScans;
      }
      return [];
    } catch {
      return [];
    }
  },

  async clearAllHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.SCAN_HISTORY);
    } catch (e) {
      console.error('Error clearing history:', e);
    }
  },

  async saveScanToHistory(scan: NutritionResult): Promise<void> {
    try {
      const current = await this.getScanHistory();
      const updated = [scan, ...current.filter((item) => item.id !== scan.id)];
      await AsyncStorage.setItem(KEYS.SCAN_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving scan to history:', e);
    }
  },

  async deleteScanFromHistory(id: string): Promise<void> {
    try {
      const current = await this.getScanHistory();
      const updated = current.filter((item) => item.id !== id);
      await AsyncStorage.setItem(KEYS.SCAN_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error deleting scan from history:', e);
    }
  },

  async getApiKey(provider: 'GEMINI' | 'OPENAI'): Promise<string> {
    try {
      const key = provider === 'GEMINI' ? KEYS.API_KEY_GEMINI : KEYS.API_KEY_OPENAI;
      return (await AsyncStorage.getItem(key)) || '';
    } catch {
      return '';
    }
  },

  async saveApiKey(provider: 'GEMINI' | 'OPENAI', apiKey: string): Promise<void> {
    try {
      const key = provider === 'GEMINI' ? KEYS.API_KEY_GEMINI : KEYS.API_KEY_OPENAI;
      await AsyncStorage.setItem(key, apiKey.trim());
    } catch (e) {
      console.error('Error saving API key:', e);
    }
  },

  async getAIProvider(): Promise<string> {
    try {
      return (await AsyncStorage.getItem(KEYS.AI_PROVIDER)) || '';
    } catch {
      return '';
    }
  },

  async saveAIProvider(provider: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.AI_PROVIDER, provider);
    } catch (e) {
      console.error('Error saving AI provider:', e);
    }
  },
};
