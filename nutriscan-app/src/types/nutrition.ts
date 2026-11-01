export type TrafficLight = 'GREEN' | 'YELLOW' | 'RED';

export type NovaGroup = 1 | 2 | 3 | 4;

export type AdditiveRisk = 'NO_RISK' | 'LOW_RISK' | 'MODERATE_RISK' | 'HAZARDOUS';

export interface FoodAdditive {
  code: string; // e.g. E102, E211, E621
  name: string; // e.g. Tartrazine, Natri Benzoat
  group: 'Chất bảo quản' | 'Phẩm màu' | 'Chất điều vị' | 'Chất tạo ngọt' | 'Chất nhũ hóa' | 'Chất chống oxy hóa' | 'Khác';
  risk_level: AdditiveRisk;
  short_explanation: string;
}

export interface HealthyAlternative {
  suggestion_name: string;
  why_better: string;
}

export interface ChildWarning {
  is_safe_for_kids: boolean;
  min_recommended_age_years: number;
  danger_reason: string;
}

export interface NutritionResult {
  id: string;
  timestamp: number;
  image_uri?: string;
  barcode?: string;
  is_valid_food_label?: boolean;
  product_name: string;
  brand_name?: string;
  category: string;
  health_score: number; // 0 - 100
  traffic_light: TrafficLight;
  nova_group: NovaGroup;
  summary: string;
  child_warning: ChildWarning;
  hidden_sugars_detected: string[];
  bad_fats_detected: string[];
  allergens_detected: string[];
  additives: FoodAdditive[];
  healthy_alternatives: HealthyAlternative[];
  actionable_advice: string;
}

export interface UserProfile {
  id: string;
  name: string;
  target_group: 'CHILD' | 'PREGNANT' | 'ADULT';
  child_age_years?: number;
  allergies: string[]; // e.g. 'Đậu phộng', 'Sữa (Lactose)', 'Gluten', 'Đậu nành'
  special_concerns: string[]; // e.g. 'Tiểu đường (Hạn chế đường)', 'Cao huyết áp (Giảm muối)', 'Tránh dầu cọ'
  strict_child_mode: boolean;
}
