import { NutritionResult, UserProfile } from '../types/nutrition';

export const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'profile_child',
    name: 'Bé yêu (Trẻ nhỏ)',
    target_group: 'CHILD',
    child_age_years: 2,
    allergies: ['Sữa (Lactose)', 'Đậu phộng'],
    special_concerns: ['Tránh phẩm màu nhân tạo', 'Hạn chế đường tinh luyện', 'Tránh dầu cọ tinh luyện'],
    strict_child_mode: true,
  },
  {
    id: 'profile_adult',
    name: 'Bản thân (Người lớn)',
    target_group: 'ADULT',
    allergies: [],
    special_concerns: ['Tránh đường ẩn (HFCS, Maltodextrin)', 'Giảm muối & Bột ngọt (E621)'],
    strict_child_mode: false,
  },
  {
    id: 'profile_pregnant',
    name: 'Mẹ bầu & Cho con bú',
    target_group: 'PREGNANT',
    allergies: [],
    special_concerns: ['Tránh phẩm màu nhân tạo', 'Tránh dầu cọ tinh luyện'],
    strict_child_mode: true,
  },
];


export const MOCK_SCANS: NutritionResult[] = [
  {
    id: 'scan_snack_ostar',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 phút trước
    product_name: "Snack Khoai Tây Vị Tảo Biển",
    brand_name: "O'Star",
    category: "Snack/Bim bim",
    health_score: 36,
    traffic_light: 'RED',
    nova_group: 4,
    summary: 'Thuộc nhóm thực phẩm siêu chế biến (NOVA 4). Chiên qua dầu cọ nhiệt độ cao, chứa phẩm màu nhân tạo và hàm lượng muối vượt ngưỡng an toàn cho trẻ.',
    child_warning: {
      is_safe_for_kids: false,
      min_recommended_age_years: 6,
      danger_reason: 'Chứa phẩm màu Tartrazine (E102) liên quan đến chứng hiếu động thái quá và dị ứng hô hấp ở trẻ nhỏ dưới 6 tuổi.',
    },
    hidden_sugars_detected: ['Maltodextrin', 'Dextrose'],
    bad_fats_detected: ['Dầu cọ tinh luyện chiên nhiệt độ cao', 'Chất béo bão hòa (18g/100g)'],
    allergens_detected: ['Đậu nành', 'Lúa mì (Gluten)'],
    additives: [
      {
        code: 'E102',
        name: 'Tartrazine (Phẩm màu vàng chanh)',
        group: 'Phẩm màu',
        risk_level: 'HAZARDOUS',
        short_explanation: 'Phẩm màu tổng hợp có nguy cơ kích ứng da, hen suyễn và giảm chú ý ở trẻ nhỏ.',
      },
      {
        code: 'E621',
        name: 'Bột ngọt (Mì chính)',
        group: 'Chất điều vị',
        risk_level: 'MODERATE_RISK',
        short_explanation: 'Kích thích vị giác mạnh, không khuyến khích cho hệ thần kinh và thói quen ăn uống của trẻ dưới 3 tuổi.',
      },
      {
        code: 'E319',
        name: 'TBHQ (Chất chống oxy hóa dầu mỡ)',
        group: 'Chất bảo quản',
        risk_level: 'MODERATE_RISK',
        short_explanation: 'Giữ dầu mỡ không bị ôi thiu công nghiệp, cần giới hạn khẩu phần hằng ngày.',
      },
      {
        code: 'E330',
        name: 'Axit Citric (Chất điều chỉnh độ chua)',
        group: 'Khác',
        risk_level: 'NO_RISK',
        short_explanation: 'Chất tự nhiên có nguồn gốc từ chanh, an toàn tuyệt đối cho cơ thể.',
      },
    ],
    healthy_alternatives: [
      {
        suggestion_name: 'Bánh gạo lứt nướng mộc rong biển',
        why_better: 'Không chiên qua dầu mỡ, không dùng phẩm màu nhân tạo E102, giàu chất xơ tự nhiên.',
      },
      {
        suggestion_name: 'Khoai lang sấy mộc giòn không đường',
        why_better: 'Giữ nguyên vitamin A tự nhiên từ khoai lang, không chứa bột ngọt E621.',
      },
    ],
    actionable_advice: 'Tuyệt đối không cho bé dưới 3 tuổi dùng. Trẻ lớn hơn chỉ nên ăn tối đa 1/3 gói mỗi tuần và uống nhiều nước sau khi ăn.',
  },
  {
    id: 'scan_susu_yogurt',
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 giờ trước
    product_name: 'Sữa Chua Uống Men Sống Hương Dâu',
    brand_name: 'SuSu Vinamilk',
    category: 'Sữa & Chế phẩm sữa',
    health_score: 68,
    traffic_light: 'YELLOW',
    nova_group: 3,
    summary: 'Chứa lợi khuẩn tốt cho đường ruột nhưng lượng đường bổ sung (Added sugar) khá cao, cần lưu ý lượng dùng trong ngày.',
    child_warning: {
      is_safe_for_kids: true,
      min_recommended_age_years: 1,
      danger_reason: 'An toàn về phụ gia, nhưng chứa 16g đường/chai có thể gây nguy cơ sâu răng và thừa cân nếu uống quá nhiều.',
    },
    hidden_sugars_detected: ['Đường tinh luyện (Sucrose)', 'Siro Glucoza'],
    bad_fats_detected: [],
    allergens_detected: ['Sữa bò (Lactose)'],
    additives: [
      {
        code: 'E440',
        name: 'Pectin (Chất làm dày tự nhiên từ táo)',
        group: 'Chất nhũ hóa',
        risk_level: 'NO_RISK',
        short_explanation: 'Chất xơ hòa tan chiết xuất từ vỏ trái cây, an toàn cho hệ tiêu hóa.',
      },
      {
        code: 'E202',
        name: 'Kali Sorbat',
        group: 'Chất bảo quản',
        risk_level: 'LOW_RISK',
        short_explanation: 'Chất chống nấm mốc phổ biến, chuyển hóa tự nhiên trong cơ thể như axit béo.',
      },
      {
        code: 'E120',
        name: 'Carmines (Màu đỏ tự nhiên)',
        group: 'Phẩm màu',
        risk_level: 'LOW_RISK',
        short_explanation: 'Màu đỏ chiết xuất tự nhiên, an toàn hơn nhiều so với phẩm màu hóa học nhân tạo.',
      },
    ],
    healthy_alternatives: [
      {
        suggestion_name: 'Sữa chua men sống không đường trộn trái cây tươi',
        why_better: 'Kiểm soát 100% lượng đường nạp vào, giàu vitamin C tự nhiên từ quả tươi.',
      },
    ],
    actionable_advice: 'Có thể cho bé uống 1 chai/ngày sau bữa ăn chính 30 phút. Súc miệng với nước lọc sau khi uống để bảo vệ men răng.',
  },
  {
    id: 'scan_organic_rice_cake',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 ngày trước
    product_name: 'Bánh Gạo Lứt Nướng Mộc Hữu Cơ',
    brand_name: 'Vinaseed Bio',
    category: 'Đồ ăn dặm',
    health_score: 94,
    traffic_light: 'GREEN',
    nova_group: 1,
    summary: 'Sản phẩm tuyệt vời! 100% nguyên liệu tự nhiên hữu cơ, không chứa bất kỳ chất bảo quản hay phẩm màu công nghiệp nào.',
    child_warning: {
      is_safe_for_kids: true,
      min_recommended_age_years: 1,
      danger_reason: 'Rất an toàn và lành mạnh cho bé ăn dặm.',
    },
    hidden_sugars_detected: [],
    bad_fats_detected: [],
    allergens_detected: [],
    additives: [],
    healthy_alternatives: [],
    actionable_advice: 'Rất khuyến khích sử dụng làm bữa phụ lành mạnh cho bé và cả gia đình.',
  },
];
