import { NutritionResult, UserProfile } from '../types/nutrition';
import { MOCK_SCANS } from '../constants/mockData';
import { storageService } from './storageService';
import * as ImageManipulator from 'expo-image-manipulator';

export type AIProvider = 'MOCK' | 'GEMINI' | 'OPENAI';

export interface AIServiceConfig {
  provider: AIProvider;
  geminiKey?: string;
  openaiKey?: string;
}

class AIService {
  private config: AIServiceConfig = {
    provider: ((process.env.EXPO_PUBLIC_AI_PROVIDER as string)?.trim() as AIProvider) || 'OPENAI',
    geminiKey: (process.env.EXPO_PUBLIC_GEMINI_API_KEY || '').trim(),
    openaiKey: (process.env.EXPO_PUBLIC_OPENAI_API_KEY || '').trim(),
  };

  constructor() {
    this.init();
  }

  public async init() {
    try {
      const [savedProvider, geminiKey, openaiKey] = await Promise.all([
        storageService.getAIProvider(),
        storageService.getApiKey('GEMINI'),
        storageService.getApiKey('OPENAI'),
      ]);

      const envProvider = (process.env.EXPO_PUBLIC_AI_PROVIDER as string)?.trim() as AIProvider | undefined;
      const envOpenAI = (process.env.EXPO_PUBLIC_OPENAI_API_KEY || '').trim();
      const envGemini = (process.env.EXPO_PUBLIC_GEMINI_API_KEY || '').trim();

      const validSavedProvider =
        savedProvider === 'OPENAI' || savedProvider === 'GEMINI'
          ? (savedProvider as AIProvider)
          : undefined;

      this.config = {
        provider: envProvider || validSavedProvider || 'OPENAI',
        geminiKey: envGemini || geminiKey || '',
        openaiKey: envOpenAI || openaiKey || '',
      };
    } catch (e) {
      console.warn('Lỗi tải cấu hình AI:', e);
    }
  }

  public setConfig(newConfig: Partial<AIServiceConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.provider) {
      storageService.saveAIProvider(newConfig.provider);
    }
    if (newConfig.geminiKey !== undefined) {
      storageService.saveApiKey('GEMINI', newConfig.geminiKey);
    }
    if (newConfig.openaiKey !== undefined) {
      storageService.saveApiKey('OPENAI', newConfig.openaiKey);
    }
  }

  public getConfig(): AIServiceConfig {
    return this.config;
  }

  /**
   * Phân tích hình ảnh bảng thành phần dựa trên cấu hình AI đã chọn
   */
  public async analyzeLabel(
    imageUri: string,
    profile: UserProfile
  ): Promise<NutritionResult> {
    // 1. Nếu dùng MOCK hoặc chưa có API key tương ứng
    if (
      this.config.provider === 'MOCK' ||
      (this.config.provider === 'GEMINI' && !this.config.geminiKey) ||
      (this.config.provider === 'OPENAI' && !this.config.openaiKey)
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const randomIndex = Math.floor(Math.random() * MOCK_SCANS.length);
      const baseScan = MOCK_SCANS[randomIndex];

      const personalizedResult: NutritionResult = {
        ...baseScan,
        id: `scan_${Date.now()}`,
        timestamp: Date.now(),
        image_uri: imageUri,
      };

      const matchedAllergens = personalizedResult.allergens_detected.filter((a) =>
        profile.allergies.some((userAllergy) =>
          a.toLowerCase().includes(userAllergy.toLowerCase())
        )
      );

      if (matchedAllergens.length > 0) {
        personalizedResult.child_warning = {
          ...personalizedResult.child_warning,
          danger_reason: `⚠️ CẢNH BÁO DỊ ỨNG CHO ${profile.name.toUpperCase()}: Phát hiện có chứa ${matchedAllergens.join(', ')}!`,
        };
      }

      return personalizedResult;
    }

    // 2. Nếu dùng Google Gemini 2.0 Flash Vision
    if (this.config.provider === 'GEMINI' && this.config.geminiKey) {
      return this.callGeminiAPI(imageUri, profile);
    }

    // 3. Nếu dùng OpenAI GPT-4o Mini Vision
    if (this.config.provider === 'OPENAI' && this.config.openaiKey) {
      return this.callOpenAIAPI(imageUri, profile);
    }

    return MOCK_SCANS[0];
  }

  /**
   * GỌI GOOGLE GEMINI 2.0 FLASH VISION API THẬT
   */
  private async callGeminiAPI(imageUri: string, profile: UserProfile): Promise<NutritionResult> {
    try {
      // 1. Nén ảnh và chuyển thành Base64
      let base64Data = '';
      if (imageUri.startsWith('data:image')) {
        base64Data = imageUri.split(',')[1];
      } else {
        const manipulated = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1200 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        base64Data = manipulated.base64 || '';
      }

      // 2. Xây dựng prompt chuyên môn có hồ sơ người dùng
      const targetDesc =
        profile.target_group === 'CHILD'
          ? `Trẻ em (${profile.child_age_years || 2} tuổi)`
          : profile.target_group === 'PREGNANT'
          ? 'Mẹ bầu & Cho con bú (Cần tránh phụ gia chống chỉ định thai kỳ, phẩm màu nhân tạo, chất kích thích)'
          : 'Người lớn';

      const promptText = `
Bạn là Hội đồng Chuyên gia An toàn Thực phẩm & Dinh dưỡng Nhi khoa (tiêu chuẩn FAO/WHO Codex và Bộ Y tế Việt Nam).
Hãy phân tích hình ảnh bảng thành phần thực phẩm được cung cấp.

HỒ SƠ NGƯỜI DÙNG:
- Đối tượng: ${targetDesc}
- Cảnh báo Dị ứng: ${profile.allergies.join(', ') || 'Không có'}
- Mối quan tâm đặc biệt: ${profile.special_concerns.join(', ') || 'Không có'}
- Chế độ bảo vệ trẻ em nghiêm ngặt: ${profile.strict_child_mode ? 'BẬT (Khắt khe với phẩm màu E102, E110, chất bảo quản)' : 'TẮT'}

HÃY PHÂN TÍCH VÀ TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON VỚI CÁC TRƯỜNG:
{
  "product_name": "Tên sản phẩm",
  "brand_name": "Tên thương hiệu nếu có",
  "category": "Bánh kẹo | Đồ uống | Mì ăn liền | Sữa & Chế phẩm sữa | Đồ ăn dặm | Gia vị | Snack/Bim bim | Khác",
  "health_score": (số nguyên 0 đến 100),
  "traffic_light": "GREEN" hoặc "YELLOW" hoặc "RED",
  "nova_group": (1, 2, 3, hoặc 4 theo chuẩn NOVA),
  "summary": "Tóm tắt ngắn gọn 1-2 câu",
  "child_warning": {
    "is_safe_for_kids": (true/false),
    "min_recommended_age_years": (số tuổi),
    "danger_reason": "Lý do cụ thể nếu nguy hại cho bé"
  },
  "hidden_sugars_detected": ["Đường ẩn phát hiện được như Maltodextrin, Siro bắp HFCS..."],
  "bad_fats_detected": ["Dầu cọ, Trans-fat nếu có..."],
  "allergens_detected": ["Chất dị ứng phát hiện được..."],
  "additives": [
    {
      "code": "Mã E/INS ví dụ E102",
      "name": "Tên phụ gia",
      "group": "Chất bảo quản | Phẩm màu | Chất điều vị | Chất tạo ngọt | Chất nhũ hóa | Khác",
      "risk_level": "NO_RISK" | "LOW_RISK" | "MODERATE_RISK" | "HAZARDOUS",
      "short_explanation": "Giải thích 1 câu ngắn dễ hiểu"
    }
  ],
  "healthy_alternatives": [
    {
      "suggestion_name": "Tên món ăn/sản phẩm thay thế sạch hơn cùng loại",
      "why_better": "Lý do vì sao tốt hơn"
    }
  ],
  "actionable_advice": "Lời khuyên khẩu phần ăn uống thiết thực"
}
`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.config.geminiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error:', errorText);
        throw new Error(`Gemini trả về lỗi HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Gemini không trả về nội dung hợp lệ');
      }

      const parsed = JSON.parse(rawText);
      return {
        id: `gemini_${Date.now()}`,
        timestamp: Date.now(),
        image_uri: imageUri,
        product_name: parsed.product_name || 'Sản phẩm chưa rõ tên',
        brand_name: parsed.brand_name || '',
        category: parsed.category || 'Khác',
        health_score: typeof parsed.health_score === 'number' ? parsed.health_score : 50,
        traffic_light: parsed.traffic_light || 'YELLOW',
        nova_group: parsed.nova_group || 3,
        summary: parsed.summary || 'Đã phân tích thành phần sản phẩm.',
        child_warning: parsed.child_warning || {
          is_safe_for_kids: true,
          min_recommended_age_years: 1,
          danger_reason: 'Phù hợp với lứa tuổi.',
        },
        hidden_sugars_detected: parsed.hidden_sugars_detected || [],
        bad_fats_detected: parsed.bad_fats_detected || [],
        allergens_detected: parsed.allergens_detected || [],
        additives: parsed.additives || [],
        healthy_alternatives: parsed.healthy_alternatives || [],
        actionable_advice: parsed.actionable_advice || 'Sử dụng điều độ theo nhu cầu hằng ngày.',
      };
    } catch (err: any) {
      console.warn('Lỗi gọi Gemini Vision API, chuyển sang mock data dự phòng:', err.message);
      return {
        ...MOCK_SCANS[0],
        id: `scan_error_${Date.now()}`,
        timestamp: Date.now(),
        image_uri: imageUri,
        summary: `[Chế độ dự phòng] Không thể kết nối Gemini API (${err.message || 'Lỗi mạng/Key'}). Vui lòng kiểm tra lại API Key trong cài đặt.`,
      };
    }
  }

  /**
   * GỌI OPENAI GPT-4O-MINI VISION API
   */
  private async callOpenAIAPI(imageUri: string, profile: UserProfile): Promise<NutritionResult> {
    try {
      let base64Data = '';
      if (imageUri.startsWith('data:image')) {
        base64Data = imageUri.split(',')[1];
      } else {
        const manipulated = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1200 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        base64Data = manipulated.base64 || '';
      }

      const targetDesc =
        profile.target_group === 'CHILD'
          ? `Trẻ em (${profile.child_age_years || 2} tuổi)`
          : profile.target_group === 'PREGNANT'
          ? 'Mẹ bầu & Cho con bú (Cần tránh phụ gia chống chỉ định thai kỳ, phẩm màu nhân tạo, chất kích thích)'
          : 'Người lớn';

      const promptText = `
Bạn là Hội đồng Chuyên gia An toàn Thực phẩm & Dinh dưỡng Nhi khoa (tiêu chuẩn FAO/WHO Codex và Bộ Y tế Việt Nam).
Hãy phân tích hình ảnh bảng thành phần thực phẩm được cung cấp.

HỒ SƠ NGƯỜI DÙNG:
- Đối tượng: ${targetDesc}
- Cảnh báo Dị ứng: ${profile.allergies.join(', ') || 'Không có'}
- Mối quan tâm đặc biệt: ${profile.special_concerns.join(', ') || 'Không có'}
- Chế độ bảo vệ trẻ em nghiêm ngặt: ${profile.strict_child_mode ? 'BẬT (Khắt khe với phẩm màu E102, E110, chất bảo quản)' : 'TẮT'}

HÃY PHÂN TÍCH VÀ TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON VỚI CÁC TRƯỜNG:
{
  "product_name": "Tên sản phẩm",
  "brand_name": "Tên thương hiệu nếu có",
  "category": "Bánh kẹo | Đồ uống | Mì ăn liền | Sữa & Chế phẩm sữa | Đồ ăn dặm | Gia vị | Snack/Bim bim | Khác",
  "health_score": (số nguyên 0 đến 100 theo chuẩn Nutri-Score & NOVA),
  "traffic_light": "GREEN" hoặc "YELLOW" hoặc "RED",
  "nova_group": (1, 2, 3, hoặc 4 theo chuẩn NOVA),
  "summary": "Tóm tắt ngắn gọn 1-2 câu",
  "child_warning": {
    "is_safe_for_kids": (true/false),
    "min_recommended_age_years": (số tuổi),
    "danger_reason": "Lý do cụ thể nếu nguy hại cho bé"
  },
  "hidden_sugars_detected": ["Đường ẩn phát hiện được như Maltodextrin, Siro bắp HFCS..."],
  "bad_fats_detected": ["Dầu cọ, Trans-fat nếu có..."],
  "allergens_detected": ["Chất dị ứng phát hiện được..."],
  "additives": [
    {
      "code": "Mã E/INS ví dụ E102",
      "name": "Tên phụ gia",
      "group": "Chất bảo quản | Phẩm màu | Chất điều vị | Chất tạo ngọt | Chất nhũ hóa | Khác",
      "risk_level": "NO_RISK" | "LOW_RISK" | "MODERATE_RISK" | "HAZARDOUS",
      "short_explanation": "Giải thích 1 câu ngắn dễ hiểu"
    }
  ],
  "healthy_alternatives": [
    {
      "suggestion_name": "Tên món ăn/sản phẩm thay thế sạch hơn cùng loại",
      "why_better": "Lý do vì sao tốt hơn"
    }
  ],
  "actionable_advice": "Lời khuyên khẩu phần ăn uống thiết thực"
}
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: promptText },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${base64Data}` },
                },
              ],
            },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API Error:', errorText);
        throw new Error(`OpenAI trả về mã lỗi HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('OpenAI không trả về nội dung');

      const parsed = JSON.parse(content);
      return {
        id: `openai_${Date.now()}`,
        timestamp: Date.now(),
        image_uri: imageUri,
        product_name: parsed.product_name || 'Sản phẩm',
        brand_name: parsed.brand_name || '',
        category: parsed.category || 'Khác',
        health_score: typeof parsed.health_score === 'number' ? parsed.health_score : 50,
        traffic_light: parsed.traffic_light || 'YELLOW',
        nova_group: parsed.nova_group || 3,
        summary: parsed.summary || 'Đã phân tích thành phần sản phẩm qua OpenAI.',
        child_warning: parsed.child_warning || {
          is_safe_for_kids: true,
          min_recommended_age_years: 1,
          danger_reason: 'Phù hợp lứa tuổi.',
        },
        hidden_sugars_detected: parsed.hidden_sugars_detected || [],
        bad_fats_detected: parsed.bad_fats_detected || [],
        allergens_detected: parsed.allergens_detected || [],
        additives: parsed.additives || [],
        healthy_alternatives: parsed.healthy_alternatives || [],
        actionable_advice: parsed.actionable_advice || 'Sử dụng điều độ theo nhu cầu hằng ngày.',
      };
    } catch (err: any) {
      console.warn('Lỗi gọi OpenAI API, chuyển sang mock data dự phòng:', err.message);
      return {
        ...MOCK_SCANS[1],
        id: `scan_error_${Date.now()}`,
        timestamp: Date.now(),
        image_uri: imageUri,
        summary: `[Chế độ dự phòng] Không thể kết nối OpenAI API (${err.message || 'Lỗi mạng/Key'}). Vui lòng kiểm tra lại API Key OpenAI trong cài đặt.`,
      };
    }
  }
}

export const aiService = new AIService();
