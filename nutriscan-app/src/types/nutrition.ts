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
  gender?: 'MALE' | 'FEMALE';
  height_cm?: number;
  weight_kg?: number;
  target_group: 'CHILD' | 'PREGNANT' | 'ADULT';
  child_age_years?: number;
  allergies: string[]; // e.g. 'Đậu phộng', 'Sữa (Lactose)', 'Gluten', 'Đậu nành'
  special_concerns: string[]; // e.g. 'Tiểu đường (Hạn chế đường)', 'Cao huyết áp (Giảm muối)', 'Tránh dầu cọ'
  strict_child_mode: boolean;
}

export interface BMIEvaluation {
  bmi: number;
  category: 'Thiếu cân' | 'Bình thường' | 'Thừa cân' | 'Béo phì độ I' | 'Béo phì độ II';
  color: string;
  idealMinKg: number;
  idealMaxKg: number;
  weightDiffKg: number; // >0 nghĩa là cần giảm, <0 nghĩa là cần tăng, 0 là chuẩn
  diagnosis: string;
  scanAdvice: string;
}

/**
 * Tính toán BMI hoàn toàn Offline trên thiết bị (0 token, 0 request API)
 * Áp dụng chuẩn BMI theo Thang đo Châu Á (IDI & WPRO):
 * - < 18.5: Thiếu cân
 * - 18.5 - 22.9: Bình thường
 * - 23.0 - 24.9: Thừa cân (Tiền béo phì)
 * - 25.0 - 29.9: Béo phì độ I
 * - >= 30.0: Béo phì độ II
 */
export function evaluateAsianBMI(
  heightCm?: number,
  weightKg?: number,
  gender: 'MALE' | 'FEMALE' = 'MALE'
): BMIEvaluation | null {
  if (!heightCm || !weightKg || heightCm < 40 || heightCm > 250 || weightKg < 3 || weightKg > 300) {
    return null;
  }

  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM);
  const bmi = Math.round(rawBmi * 10) / 10;

  const idealMinKg = Math.round(18.5 * heightM * heightM * 10) / 10;
  const idealMaxKg = Math.round(22.9 * heightM * heightM * 10) / 10;

  let weightDiffKg = 0;
  if (weightKg < idealMinKg) {
    weightDiffKg = Math.round((weightKg - idealMinKg) * 10) / 10; // âm: cần tăng
  } else if (weightKg > idealMaxKg) {
    weightDiffKg = Math.round((weightKg - idealMaxKg) * 10) / 10; // dương: cần giảm
  }

  const genderLabel = gender === 'FEMALE' ? 'Nữ' : 'Nam';

  if (bmi < 18.5) {
    return {
      bmi,
      category: 'Thiếu cân',
      color: '#38BDF8',
      idealMinKg,
      idealMaxKg,
      weightDiffKg,
      diagnosis: `Thể trạng ${genderLabel} đang thiếu cân (cần tăng thêm ít nhất ${Math.abs(weightDiffKg)}kg để đạt chuẩn Châu Á). Ưu tiên thực phẩm giàu đạm, sữa, ngũ cốc nguyên hạt; tránh đồ ăn vặt nhiều calo rỗng.`,
      scanAdvice: 'Ưu tiên sản phẩm NOVA 1-2 giàu dinh dưỡng thật, hạn chế phụ gia ức chế hấp thu.',
    };
  }

  if (bmi < 23.0) {
    return {
      bmi,
      category: 'Bình thường',
      color: '#10B981',
      idealMinKg,
      idealMaxKg,
      weightDiffKg: 0,
      diagnosis: `Thể trạng ${genderLabel} đạt mức Chuẩn khỏe mạnh theo thang đo Châu Á (${idealMinKg}kg – ${idealMaxKg}kg). Hãy duy trì chế độ ăn cân bằng và hạn chế thực phẩm siêu chế biến.`,
      scanAdvice: 'Duy trì lựa chọn các sản phẩm nhãn Xanh (Điểm ≥ 75) để giữ vóc dáng.',
    };
  }

  if (bmi < 25.0) {
    return {
      bmi,
      category: 'Thừa cân',
      color: '#F59E0B',
      idealMinKg,
      idealMaxKg,
      weightDiffKg,
      diagnosis: `Thể trạng ${genderLabel} đang ở ngưỡng Thừa cân theo thang đo Châu Á (dư khoảng ${weightDiffKg}kg). Cần kiểm soát đường ẩn (HFCS, Maltodextrin) và đồ chiên dầu cọ.`,
      scanAdvice: 'Cảnh giác cao với đồ uống có đường, bánh kẹo và thực phẩm nhóm NOVA 4.',
    };
  }

  if (bmi < 30.0) {
    return {
      bmi,
      category: 'Béo phì độ I',
      color: '#EF4444',
      idealMinKg,
      idealMaxKg,
      weightDiffKg,
      diagnosis: `Thể trạng ${genderLabel} thuộc nhóm Béo phì độ I theo thang đo Châu Á (vượt mức chuẩn ${weightDiffKg}kg). Cần cắt giảm nghiêm ngặt đường tinh luyện, chất béo bão hòa và muối natri cao.`,
      scanAdvice: 'Nghiêm khắc loại bỏ sản phẩm có Đường ẩn, Dầu cọ tinh luyện và Trans-fat.',
    };
  }

  return {
    bmi,
    category: 'Béo phì độ II',
    color: '#EF4444',
    idealMinKg,
    idealMaxKg,
    weightDiffKg,
    diagnosis: `Thể trạng ${genderLabel} thuộc nhóm Béo phì độ II theo thang đo Châu Á (vượt mức chuẩn ${weightDiffKg}kg). Khuyến nghị ưu tiên tuyệt đối thực phẩm tự nhiên nguyên bản (NOVA 1).`,
    scanAdvice: 'Chỉ nên sử dụng sản phẩm tự nhiên không đường bổ sung, không chất béo công nghiệp.',
  };
}
