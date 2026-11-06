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
  age_years?: number;
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
  minNormalBmi: number;
  maxNormalBmi: number;
  overweightBmi: number;
  idealMinKg: number;
  idealMaxKg: number;
  dailyKcal?: number;
  weightDiffKg: number; // >0 nghĩa là cần giảm, <0 nghĩa là cần tăng, 0 là chuẩn
  scaleLabel: string;
  diagnosis: string;
  scanAdvice: string;
}

/**
 * Tính toán BMI hoàn toàn Offline trên thiết bị (0 token, 0 request API)
 * - Người lớn (>= 18 tuổi): Áp dụng Thang đo Châu Á (Chuẩn: 18.5 - 22.9, Thừa cân: 23.0 - 24.9, Béo phì: >= 25.0)
 * - Trẻ em (< 18 tuổi): Tự động điều chỉnh ngưỡng BMI chuẩn theo độ tuổi đang phát triển của trẻ
 */
export function evaluateAsianBMI(
  heightCm?: number,
  weightKg?: number,
  gender: 'MALE' | 'FEMALE' = 'MALE',
  ageYears?: number
): BMIEvaluation | null {
  if (!heightCm || !weightKg || heightCm < 40 || heightCm > 250 || weightKg < 3 || weightKg > 300) {
    return null;
  }

  const age = ageYears && ageYears > 0 ? ageYears : 25;
  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM);
  const bmi = Math.round(rawBmi * 10) / 10;

  // Ngưỡng BMI tự động điều chỉnh theo độ tuổi (Trẻ em vs Người lớn Châu Á)
  let minNormalBmi = 18.5;
  let maxNormalBmi = 22.9;
  let overweightBmi = 25.0;
  let scaleLabel = 'Thang đo Châu Á (Người lớn)';

  if (age < 6) {
    minNormalBmi = 14.0;
    maxNormalBmi = 17.2;
    overweightBmi = 18.5;
    scaleLabel = `Thang đo Châu Á (Trẻ nhỏ ${age} tuổi)`;
  } else if (age < 12) {
    minNormalBmi = 14.5;
    maxNormalBmi = 18.8;
    overweightBmi = 20.5;
    scaleLabel = `Thang đo Châu Á (Trẻ em ${age} tuổi)`;
  } else if (age < 18) {
    minNormalBmi = 16.5;
    maxNormalBmi = 21.5;
    overweightBmi = 23.5;
    scaleLabel = `Thang đo Châu Á (Thiếu niên ${age} tuổi)`;
  }

  const idealMinKg = Math.round(minNormalBmi * heightM * heightM * 10) / 10;
  const idealMaxKg = Math.round(maxNormalBmi * heightM * heightM * 10) / 10;

  // Ước tính năng lượng khuyến nghị mỗi ngày (Mifflin-St Jeor + hệ số vận động nhẹ 1.35)
  const bmr =
    gender === 'FEMALE'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const dailyKcal = Math.max(800, Math.round(bmr * 1.35));

  let weightDiffKg = 0;
  if (weightKg < idealMinKg) {
    weightDiffKg = Math.round((weightKg - idealMinKg) * 10) / 10;
  } else if (weightKg > idealMaxKg) {
    weightDiffKg = Math.round((weightKg - idealMaxKg) * 10) / 10;
  }

  const genderLabel = gender === 'FEMALE' ? 'Nữ' : 'Nam';

  if (bmi < minNormalBmi) {
    return {
      bmi,
      category: 'Thiếu cân',
      color: '#38BDF8',
      minNormalBmi,
      maxNormalBmi,
      overweightBmi,
      idealMinKg,
      idealMaxKg,
      dailyKcal,
      weightDiffKg,
      scaleLabel,
      diagnosis: `Thể trạng ${genderLabel} (${age} tuổi) đang thiếu cân (cần tăng thêm khoảng ${Math.abs(weightDiffKg)}kg để đạt ngưỡng chuẩn ${idealMinKg}–${idealMaxKg}kg). Nhu cầu năng lượng ước tính ~${dailyKcal} kcal/ngày.`,
      scanAdvice: 'Ưu tiên sản phẩm NOVA 1-2 giàu đạm và dưỡng chất thật, tránh calo rỗng.',
    };
  }

  if (bmi <= maxNormalBmi) {
    return {
      bmi,
      category: 'Bình thường',
      color: '#10B981',
      minNormalBmi,
      maxNormalBmi,
      overweightBmi,
      idealMinKg,
      idealMaxKg,
      dailyKcal,
      weightDiffKg: 0,
      scaleLabel,
      diagnosis: `Thể trạng ${genderLabel} (${age} tuổi) đạt mức Chuẩn khỏe mạnh (${idealMinKg}kg – ${idealMaxKg}kg). Nhu cầu duy trì ước tính ~${dailyKcal} kcal/ngày.`,
      scanAdvice: 'Duy trì lựa chọn các sản phẩm nhãn Xanh (Điểm ≥ 75) để giữ thể trạng.',
    };
  }

  if (bmi < overweightBmi) {
    return {
      bmi,
      category: 'Thừa cân',
      color: '#F59E0B',
      minNormalBmi,
      maxNormalBmi,
      overweightBmi,
      idealMinKg,
      idealMaxKg,
      dailyKcal,
      weightDiffKg,
      scaleLabel,
      diagnosis: `Thể trạng ${genderLabel} (${age} tuổi) đang ở ngưỡng Thừa cân (dư khoảng ${weightDiffKg}kg so với mức chuẩn ${idealMinKg}–${idealMaxKg}kg). Cần kiểm soát đường ẩn và dầu chiên công nghiệp.`,
      scanAdvice: 'Cảnh giác cao với đồ uống có đường, bánh kẹo và thực phẩm nhóm NOVA 4.',
    };
  }

  if (bmi < overweightBmi + 5) {
    return {
      bmi,
      category: 'Béo phì độ I',
      color: '#EF4444',
      minNormalBmi,
      maxNormalBmi,
      overweightBmi,
      idealMinKg,
      idealMaxKg,
      dailyKcal,
      weightDiffKg,
      scaleLabel,
      diagnosis: `Thể trạng ${genderLabel} (${age} tuổi) thuộc nhóm Béo phì độ I (vượt mức chuẩn ${weightDiffKg}kg). Cần cắt giảm nghiêm ngặt đường tinh luyện, chất béo bão hòa và muối natri cao.`,
      scanAdvice: 'Nghiêm khắc loại bỏ sản phẩm có Đường ẩn, Dầu cọ tinh luyện và Trans-fat.',
    };
  }

  return {
    bmi,
    category: 'Béo phì độ II',
    color: '#EF4444',
    minNormalBmi,
    maxNormalBmi,
    overweightBmi,
    idealMinKg,
    idealMaxKg,
    dailyKcal,
    weightDiffKg,
    scaleLabel,
    diagnosis: `Thể trạng ${genderLabel} (${age} tuổi) thuộc nhóm Béo phì độ II (vượt mức chuẩn ${weightDiffKg}kg). Khuyến nghị ưu tiên tuyệt đối thực phẩm tự nhiên nguyên bản (NOVA 1).`,
    scanAdvice: 'Chỉ nên sử dụng sản phẩm tự nhiên không đường bổ sung, không chất béo công nghiệp.',
  };
}
