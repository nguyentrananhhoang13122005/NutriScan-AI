import { NutritionResult, UserProfile } from '../types/nutrition';
import { MOCK_SCANS } from '../constants/mockData';
import { storageService } from './storageService';
import * as ImageManipulator from 'expo-image-manipulator';

export type AIProvider = 'MOCK' | 'GITHUB' | 'GROQ' | 'OPENAI' | 'GEMINI';

export interface AIServiceConfig {
  provider: AIProvider;
  proxyUrl?: string;
  githubToken?: string;
  groqKey?: string;
  openaiKey?: string;
  geminiKey?: string;
}

const DEFAULT_PROXY_URL = 'https://nutriscan-ai-nutriscan-proxy.vercel.app/api/analyze';

class AIService {
  private config: AIServiceConfig = {
    provider: ((process.env.EXPO_PUBLIC_AI_PROVIDER as string)?.trim() as AIProvider) || 'GROQ',
    proxyUrl: (process.env.EXPO_PUBLIC_API_PROXY_URL || DEFAULT_PROXY_URL).trim(),
    githubToken: (process.env.EXPO_PUBLIC_GITHUB_TOKEN || '').trim(),
    groqKey: (process.env.EXPO_PUBLIC_GROQ_API_KEY || '').trim(),
    openaiKey: (process.env.EXPO_PUBLIC_OPENAI_API_KEY || '').trim(),
    geminiKey: (process.env.EXPO_PUBLIC_GEMINI_API_KEY || '').trim(),
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
      const envProxyUrl = (process.env.EXPO_PUBLIC_API_PROXY_URL || DEFAULT_PROXY_URL).trim();
      const envGithub = (process.env.EXPO_PUBLIC_GITHUB_TOKEN || '').trim();
      const envGroq = (process.env.EXPO_PUBLIC_GROQ_API_KEY || '').trim();
      const envOpenAI = (process.env.EXPO_PUBLIC_OPENAI_API_KEY || '').trim();
      const envGemini = (process.env.EXPO_PUBLIC_GEMINI_API_KEY || '').trim();

      this.config = {
        provider: envProvider || (savedProvider as AIProvider) || 'GROQ',
        proxyUrl: envProxyUrl,
        githubToken: envGithub,
        groqKey: envGroq,
        openaiKey: envOpenAI || openaiKey || '',
        geminiKey: envGemini || geminiKey || '',
      };
    } catch (e) {
      console.warn('Lỗi tải cấu hình AI:', e);
    }
  }

  public getConfig(): AIServiceConfig {
    return this.config;
  }

  private getTargetDescription(profile: UserProfile): string {
    if (profile.target_group === 'CHILD') {
      return `Trẻ em (${profile.child_age_years || 2} tuổi)`;
    }
    if (profile.target_group === 'PREGNANT') {
      return 'Mẹ bầu & Cho con bú (Cần tránh phụ gia chống chỉ định thai kỳ, phẩm màu nhân tạo, chất kích thích/cafein)';
    }
    return 'Người lớn';
  }

  /**
   * 1. Gọi trực tiếp GitHub Models (OpenAI GPT-4o-mini MIỄN PHÍ qua GitHub Token)
   */
  private async callGitHubModelsDirect(promptText: string, base64Image?: string): Promise<any> {
    const userContent: any[] = [{ type: 'text', text: promptText }];
    if (base64Image) {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${base64Image}` },
      });
    }

    const res = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.githubToken}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: userContent }],
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GitHub Models (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('GitHub Models trả về rỗng');
    return JSON.parse(content);
  }

  /**
   * 2. Gọi trực tiếp Groq Cloud (Qwen 3.8 27B Vision MIỄN PHÍ - Siêu tốc 0.2s)
   */
  private async callGroqDirect(promptText: string, base64Image?: string): Promise<any> {
    const userContent: any[] = [{ type: 'text', text: promptText }];
    if (base64Image) {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${base64Image}` },
      });
    }

    const models = base64Image
      ? ['qwen/qwen3.8-27b']
      : ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b'];

    let lastErr = '';
    for (const model of models) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.groqKey}`,
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          messages: [{ role: 'user', content: userContent }],
          temperature: 0.1,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) return JSON.parse(content);
      } else {
        lastErr = await res.text();
      }
    }

    throw new Error(`Groq Error: ${lastErr}`);
  }

  /**
   * 3. Gọi trực tiếp OpenAI Platform
   */
  private async callOpenAIDirect(promptText: string, base64Image?: string): Promise<any> {
    const userContent: any[] = [{ type: 'text', text: promptText }];
    if (base64Image) {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${base64Image}` },
      });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: userContent }],
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI trả về rỗng');
    return JSON.parse(content);
  }

  /**
   * 4. Gọi trực tiếp Google Gemini
   */
  private async callGeminiDirect(promptText: string, base64Image?: string): Promise<any> {
    const parts: any[] = [{ text: promptText }];
    if (base64Image) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.config.geminiKey}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Gemini trả về rỗng');
    return JSON.parse(rawText);
  }

  /**
   * 5. Gọi qua Backend Proxy trên Vercel (Khi đóng gói APK không chứa key)
   */
  private async callSecureProxy(promptText: string, base64Image?: string): Promise<any> {
    if (!this.config.proxyUrl) {
      throw new Error('Chưa cấu hình EXPO_PUBLIC_API_PROXY_URL');
    }

    const response = await fetch(this.config.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-NutriScan-Client': 'nutriscan-mobile-v2',
      },
      body: JSON.stringify({
        promptText,
        base64Image,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Proxy (${response.status}): ${errText}`);
    }

    return response.json();
  }

  /**
   * Bộ điều phối thông minh:
   * - Nếu trong file .env có điền Key trực tiếp (GitHub / Groq / OpenAI / Gemini) -> Ưu tiên chạy Key trong .env để bạn test trên Expo ngay lập tức!
   * - Nếu .env để trống Key (như khi build APK) -> Tự động gọi qua Vercel Proxy!
   */
  private async executeAICall(promptText: string, base64Image?: string): Promise<any> {
    const errors: string[] = [];

    // 1. Ưu tiên số 1: GROQ_API_KEY trong .env (Qwen 3.8 27B Vision - Siêu tốc 0.2s & Miễn phí)
    if (this.config.groqKey) {
      try {
        return await this.callGroqDirect(promptText, base64Image);
      } catch (e: any) {
        console.warn('Lỗi Groq Direct:', e.message);
        errors.push(e.message);
      }
    }

    // 2. Nếu có OPENAI_API_KEY trong .env
    if (this.config.openaiKey) {
      try {
        return await this.callOpenAIDirect(promptText, base64Image);
      } catch (e: any) {
        console.warn('Lỗi OpenAI Direct:', e.message);
        errors.push(e.message);
      }
    }

    // 3. Nếu có GEMINI_API_KEY trong .env
    if (this.config.geminiKey) {
      try {
        return await this.callGeminiDirect(promptText, base64Image);
      } catch (e: any) {
        console.warn('Lỗi Gemini Direct:', e.message);
        errors.push(e.message);
      }
    }

    // 4. Gọi qua Vercel Proxy (Dành cho bản APK hoặc khi không điền key ở local .env)
    if (this.config.proxyUrl) {
      try {
        return await this.callSecureProxy(promptText, base64Image);
      } catch (e: any) {
        console.warn('Lỗi Vercel Proxy:', e.message);
        errors.push(e.message);
      }
    }

    throw new Error(errors.join(' | ') || 'Chưa cấu hình API Key trong .env hoặc trên Vercel Proxy');
  }

  /**
   * Tra cứu sản phẩm theo Mã vạch (Hybrid Barcode Scanner)
   */
  public async analyzeByBarcode(
    barcode: string,
    profile: UserProfile
  ): Promise<NutritionResult | null> {
    const cleanCode = barcode.trim();

    const cached = await storageService.findScanByBarcode(cleanCode);
    if (cached) {
      return {
        ...cached,
        timestamp: Date.now(),
      };
    }

    try {
      const offRes = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`
      );
      if (!offRes.ok) return null;

      const offData = await offRes.json();
      if (offData.status !== 1 || !offData.product) {
        return null;
      }

      const p = offData.product;
      const productName =
        p.product_name_vi || p.product_name || p.generic_name || `Sản phẩm (${cleanCode})`;
      const brandName = p.brands || '';
      const ingredientsText =
        p.ingredients_text_vi || p.ingredients_text || p.ingredients_text_en || '';
      const additivesTags: string[] = Array.isArray(p.additives_tags)
        ? p.additives_tags.map((t: string) => t.replace('en:', '').toUpperCase())
        : [];
      const allergensTags: string[] = Array.isArray(p.allergens_tags)
        ? p.allergens_tags.map((t: string) => t.replace('en:', ''))
        : [];
      const novaGroup = (p.nova_group >= 1 && p.nova_group <= 4 ? p.nova_group : 3) as 1 | 2 | 3 | 4;
      const imageUri = p.image_front_small_url || p.image_url || undefined;

      const promptText = `
Bạn là Hội đồng Chuyên gia An toàn Thực phẩm & Dinh dưỡng Nhi khoa (tiêu chuẩn FAO/WHO Codex và Bộ Y tế Việt Nam).
Người dùng vừa quét mã vạch: ${cleanCode}
Thông tin trích xuất từ cơ sở dữ liệu:
- Tên sản phẩm: ${productName}
- Thương hiệu: ${brandName}
- Bảng thành phần: ${ingredientsText || 'Chưa rõ chi tiết, hãy suy luận dựa trên tên sản phẩm và danh sách phụ gia'}
- Mã phụ gia phát hiện: ${additivesTags.join(', ') || 'Không có'}
- Chất dị ứng: ${allergensTags.join(', ') || 'Không có'}
- Phân nhóm NOVA: ${novaGroup}

HỒ SƠ NGƯỜI DÙNG:
- Đối tượng: ${this.getTargetDescription(profile)}
- Cảnh báo Dị ứng: ${profile.allergies.join(', ') || 'Không có'}
- Mối quan tâm đặc biệt: ${profile.special_concerns.join(', ') || 'Không có'}
- Chế độ bảo vệ nghiêm ngặt: ${profile.strict_child_mode ? 'BẬT' : 'TẮT'}

HÃY PHÂN TÍCH VÀ TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON VỚI CÁC TRƯỜNG:
{
  "is_valid_food_label": true,
  "product_name": "Tên sản phẩm bằng tiếng Việt rõ ràng",
  "brand_name": "Tên thương hiệu",
  "category": "Bánh kẹo | Đồ uống | Mì ăn liền | Sữa & Chế phẩm sữa | Đồ ăn dặm | Gia vị | Snack/Bim bim | Khác",
  "health_score": (số nguyên 0 đến 100),
  "traffic_light": "GREEN" hoặc "YELLOW" hoặc "RED",
  "nova_group": (1, 2, 3, hoặc 4),
  "summary": "Tóm tắt ngắn gọn 1-2 câu",
  "child_warning": {
    "is_safe_for_kids": (true/false),
    "min_recommended_age_years": (số tuổi),
    "danger_reason": "Đánh giá cụ thể đối với đối tượng đang quét"
  },
  "hidden_sugars_detected": [],
  "bad_fats_detected": [],
  "allergens_detected": [],
  "additives": [
    {
      "code": "Mã E/INS",
      "name": "Tên phụ gia tiếng Việt",
      "group": "Chất bảo quản | Phẩm màu | Chất điều vị | Chất tạo ngọt | Chất nhũ hóa | Khác",
      "risk_level": "NO_RISK" | "LOW_RISK" | "MODERATE_RISK" | "HAZARDOUS",
      "short_explanation": "Giải thích 1 câu ngắn dễ hiểu"
    }
  ],
  "healthy_alternatives": [
    {
      "suggestion_name": "Tên món thay thế sạch hơn",
      "why_better": "Lý do tốt hơn"
    }
  ],
  "actionable_advice": "Lời khuyên khẩu phần thiết thực"
}`;

      try {
        const parsed = await this.executeAICall(promptText);
        return this.mapParsedResult(parsed, {
          idPrefix: `barcode_${cleanCode}`,
          barcode: cleanCode,
          imageUri,
          fallbackName: productName,
          fallbackBrand: brandName,
          fallbackNova: novaGroup,
        });
      } catch (aiErr) {
        console.warn('Dùng dữ liệu OpenFoodFacts trực tiếp do AI lỗi:', aiErr);
      }

      const baseScore = novaGroup === 1 ? 88 : novaGroup === 2 ? 75 : novaGroup === 3 ? 62 : 38;
      const trafficLight = baseScore >= 75 ? 'GREEN' : baseScore >= 50 ? 'YELLOW' : 'RED';

      return {
        id: `barcode_${cleanCode}_${Date.now()}`,
        timestamp: Date.now(),
        barcode: cleanCode,
        image_uri: imageUri,
        is_valid_food_label: true,
        product_name: productName,
        brand_name: brandName,
        category: 'Thực phẩm đóng gói',
        health_score: baseScore,
        traffic_light: trafficLight,
        nova_group: novaGroup,
        summary: ingredientsText
          ? `Thành phần: ${ingredientsText.slice(0, 140)}...`
          : `Sản phẩm thuộc nhóm chế biến NOVA ${novaGroup}.`,
        child_warning: {
          is_safe_for_kids: novaGroup < 4 && additivesTags.length <= 2,
          min_recommended_age_years: novaGroup === 4 ? 3 : 1,
          danger_reason:
            novaGroup === 4
              ? 'Thực phẩm siêu chế biến (NOVA 4), cần hạn chế cho trẻ nhỏ.'
              : 'Có thể sử dụng với lượng hợp lý.',
        },
        hidden_sugars_detected: [],
        bad_fats_detected: [],
        allergens_detected: allergensTags,
        additives: additivesTags.map((code) => ({
          code,
          name: `Phụ gia ${code}`,
          group: 'Khác',
          risk_level: 'LOW_RISK',
          short_explanation: 'Được ghi nhận trên hệ thống mã vạch OpenFoodFacts.',
        })),
        healthy_alternatives: [],
        actionable_advice: 'Kết hợp chế độ ăn đa dạng thực phẩm tươi tự nhiên.',
      };
    } catch (e) {
      console.warn('Lỗi tra cứu mã vạch:', e);
      return null;
    }
  }

  private mapParsedResult(
    parsed: any,
    opts: {
      idPrefix: string;
      barcode?: string;
      imageUri?: string;
      fallbackName?: string;
      fallbackBrand?: string;
      fallbackNova?: 1 | 2 | 3 | 4;
    }
  ): NutritionResult {
    return {
      id: `${opts.idPrefix}_${Date.now()}`,
      timestamp: Date.now(),
      barcode: opts.barcode,
      image_uri: opts.imageUri,
      is_valid_food_label: parsed.is_valid_food_label !== false,
      product_name: parsed.product_name || opts.fallbackName || 'Sản phẩm',
      brand_name: parsed.brand_name || opts.fallbackBrand || '',
      category: parsed.category || 'Khác',
      health_score: typeof parsed.health_score === 'number' ? parsed.health_score : 50,
      traffic_light: parsed.traffic_light || 'YELLOW',
      nova_group: parsed.nova_group || opts.fallbackNova || 3,
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
  }

  private buildVisionPrompt(profile: UserProfile): string {
    const targetDesc = this.getTargetDescription(profile);
    return `
Bạn là Hội đồng Chuyên gia An toàn Thực phẩm & Dinh dưỡng Nhi khoa (tiêu chuẩn FAO/WHO Codex và Bộ Y tế Việt Nam).
Hãy phân tích hình ảnh bảng thành phần hoặc bao bì thực phẩm được cung cấp.

QUAN TRỌNG: Nếu bức ảnh hoàn toàn KHÔNG PHẢI là thực phẩm, đồ uống, bao bì sản phẩm hoặc quá mờ không thể nhận diện bất kỳ thông tin thực phẩm nào (ví dụ: chụp mặt bàn, sàn nhà, con người, màn hình trống...), hãy trả về "is_valid_food_label": false kèm lý do trong "summary". Ngược lại trả về "is_valid_food_label": true.

HỒ SƠ NGƯỜI DÙNG:
- Đối tượng: ${targetDesc}
- Cảnh báo Dị ứng: ${profile.allergies.join(', ') || 'Không có'}
- Mối quan tâm đặc biệt: ${profile.special_concerns.join(', ') || 'Không có'}
- Chế độ bảo vệ nghiêm ngặt: ${profile.strict_child_mode ? 'BẬT (Khắt khe với phẩm màu E102, E110, chất bảo quản)' : 'TẮT'}

HÃY PHÂN TÍCH VÀ TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON VỚI CÁC TRƯỜNG:
{
  "is_valid_food_label": (true hoặc false),
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
    "danger_reason": "Lý do cụ thể nếu nguy hại hoặc lời khuyên cho đối tượng đang quét"
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
  }

  private async extractBase64(imageUri: string): Promise<string> {
    if (imageUri.startsWith('data:image')) {
      return imageUri.split(',')[1];
    }
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 1024 } }],
      { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return manipulated.base64 || '';
  }

  /**
   * Phân tích hình ảnh bảng thành phần dựa trên cấu hình AI đã chọn
   */
  public async analyzeLabel(
    imageUri: string,
    profile: UserProfile
  ): Promise<NutritionResult> {
    try {
      const base64Data = await this.extractBase64(imageUri);
      const promptText = this.buildVisionPrompt(profile);
      const parsed = await this.executeAICall(promptText, base64Data);
      return this.mapParsedResult(parsed, {
        idPrefix: 'ai',
        imageUri,
      });
    } catch (err: any) {
      console.warn('Lỗi gọi AI, chuyển sang mock data dự phòng:', err.message);
      return {
        ...MOCK_SCANS[0],
        id: `scan_error_${Date.now()}`,
        timestamp: Date.now(),
        image_uri: imageUri,
        is_valid_food_label: true,
        summary: `[Chế độ dự phòng] Chưa kết nối được AI (${err.message}). Hãy kiểm tra khóa trong file .env hoặc trên Vercel.`,
      };
    }
  }
}

export const aiService = new AIService();
