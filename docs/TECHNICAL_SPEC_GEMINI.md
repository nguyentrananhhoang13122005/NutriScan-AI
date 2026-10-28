# ĐẶC TẢ KỸ THUẬT & TÍCH HỢP GEMINI AI (TECHNICAL SPEC) - V2.0
## DỰ ÁN: NUTRIGAN AI
* **Tech Stack:** Expo SDK 52+ (React Native) + TypeScript + Gemini 2.0 / 1.5 Flash Vision
* **Phiên bản:** v2.0.0 (Cập nhật Kiến trúc Quét Lai Hybrid Barcode + Chuẩn phân loại NOVA & Gợi ý Thay thế)

---

## 1. KIẾN TRÚC QUÉT LAI THÔNG MINH (HYBRID SCAN ARCHITECTURE)

Để vừa đạt tốc độ tức thì (0.1 giây), vừa tiết kiệm tối đa chi phí gọi API Gemini, ứng dụng sử dụng mô hình Quét Lai:

```
                  [Người dùng Quét Bao Bì]
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [Quét Mã Vạch Barcode]            [Chụp Ảnh Bảng Thành Phần]
            │                                 │
     (Tra cứu CSDL nội bộ)                    │
            │                                 │
    ┌───────┴───────┐                         │
 Có Barcode?    Không có                      ▼
    │               └─────────────► [Nén ảnh JPEG < 600KB]
    ▼                                         │
[Trả kết quả 0.1s]                            ▼
                             [Backend Proxy Node.js/TS]
                                      │
                                      ▼
                        [Google Gemini 2.0 Flash API]
                                      │
                                      ▼
                        [Trả về JSON Schema đầy đủ]
                                      │
                                      ▼
                    [Lưu Barcode + JSON vào DB để tái sử dụng]
                                      │
                                      ▼
                    [App hiển thị Giao diện Kết quả]
```

---

## 2. CHIẾN LƯỢC NHẬN DIỆN VĂN BẢN: MULTIMODAL VISION VS. DEDICATED OCR

Dự án đưa ra quyết định kiến trúc rõ ràng về việc **có sử dụng công cụ OCR rời (như Tesseract, Google ML Kit) hay không**:

### 2.1 Quyết định Kiến trúc: Sử dụng End-to-End Multimodal Vision (Không dùng OCR rời)
Trong giai đoạn hiện tại (MVP, V1 và V2), hệ thống **KHÔNG sử dụng bộ OCR trung gian**. Hình ảnh bảng thành phần được chuyển thẳng đến **Mô hình Đa phương thức (Gemini 2.0 Flash / GPT-4o Vision)** để thực hiện đồng thời 2 nhiệm vụ: **Đọc văn bản (Visual Recognition)** và **Suy luận Dinh dưỡng (Nutritional Reasoning)** trong 1 bước duy nhất.

### 2.2 Bảng Phân Tích Lý Do Kiến Trúc

| Tiêu chí | Dùng OCR rời (Tesseract / Google ML Kit) | Dùng Multimodal Vision (Gemini / GPT-4o) ⭐ *Lựa chọn* |
| :--- | :--- | :--- |
| **Đặc thù bao bì thực phẩm tại VN** | Bao bì nilon bóng lóa, túi snack phồng, chai tròn cong vòm... OCR truyền thống đọc sai ký tự rất nặng (ví dụ: số `0` nhầm thành chữ `O`, số `1` nhầm thành `l`, rách dòng bảng biểu). | **AI hiểu ngữ cảnh không gian (Spatial Context)**: Đọc tốt chữ uốn lượn, in nghiêng, in dọc thân chai và tự phân biệt được đâu là bảng thành phần thật, đâu là slogan tiếp thị. |
| **Tự động sửa lỗi chính tả hóa học** | Nếu OCR đọc ra `E1O2` hoặc `E62l`, mô hình ngôn ngữ sau đó rất dễ bị ảo giác (*Garbage In, Garbage Out*). | **Tự sửa lỗi (Contextual Self-Correction)**: Nhìn thấy từ *"phẩm màu"* kèm ký tự tương tự, AI tự động quy về đúng mã `E102` (Tartrazine). |
| **Dung lượng App Client (Bundle Size)** | Phải nhúng thư viện Native C++ / ONNX model / ML Kit nặng thêm **30MB – 50MB** vào app Expo. | **App siêu nhẹ**: Expo chỉ cần chụp và nén ảnh JPEG (< 600KB), không làm nặng máy người dùng. |
| **Độ trễ xử lý (Latency)** | Phải qua 2 bước nối tiếp: `Camera -> Run OCR (1s) -> Gửi text lên LLM (1.5s) -> Kết quả` = **2.5s - 3s**. | 1 bước duy nhất: `Camera -> Gửi ảnh lên Gemini Flash -> Kết quả JSON` = **1.5s - 2s**. |

### 2.3 Lộ trình Tích hợp On-Device OCR (Chỉ áp dụng ở Giai đoạn Scale Quy mô Lớn)
Khi ứng dụng đạt hàng trăm ngàn lượt quét mỗi ngày, hệ thống sẽ bổ sung một module **On-Device OCR siêu nhẹ** trên điện thoại với 2 mục đích kỹ thuật đặc thù:
1. **Lọc ảnh rác (Pre-validation Gateway):** Quét nhanh trong 50ms xem bức ảnh người dùng chụp có chứa từ khóa *"Thành phần"* hay không. Nếu chụp nhầm mặt bàn, sàn nhà hoặc ảnh mờ tịt không có chữ $\rightarrow$ Cảnh báo chụp lại ngay tại máy, **tiết kiệm 100% chi phí gọi API vô ích**.
2. **Tối ưu chi phí Token:** Với các loại bao bì hộp giấy phẳng hoàn hảo (như hộp sữa tươi), có thể bóc text cục bộ và chỉ gửi Text Token lên AI để giảm chi phí token hình ảnh.

---

## 3. NÂNG CẤP GEMINI SYSTEM PROMPT & JSON SCHEMA (V2.0)

### 2.1 System Instruction (Chỉ dẫn hệ thống tối ưu)
```text
Bạn là một Hội đồng Chuyên gia gồm: Bác sĩ Dinh dưỡng Nhi khoa, Chuyên gia Công nghệ Thực phẩm chuẩn Codex Quốc tế và Cán bộ Quản lý An toàn Thực phẩm theo quy định Bộ Y tế Việt Nam.

Nhiệm vụ của bạn:
1. Đọc hình ảnh bao bì, bóc tách toàn bộ thành phần (Ingredients).
2. Xếp loại độ siêu chế biến theo chuẩn quốc tế NOVA (Nhóm 1 đến Nhóm 4).
3. Bóc tách và phân loại chất phụ gia/bảo quản thành 4 cấp độ: NO_RISK (An toàn), LOW_RISK (Rủi ro thấp), MODERATE_RISK (Trung bình), HAZARDOUS (Nguy cơ cao/Cấm cho trẻ em).
4. ĐẶC BIỆT SOI KỸ CÁC LOẠI ĐƯỜNG ẨN: Siro bắp cao fructose (HFCS), Maltodextrin, Dextrose, Glucose syrup, Đường nghịch đảo.
5. ĐẶC BIỆT SOI DẦU MỠ XẤU: Dầu cọ tinh luyện, dầu thực vật hydro hóa một phần (chất béo chuyển hóa - Trans fat).
6. GỢI Ý 2 ĐẾN 3 LỰA CHỌN THAY THẾ LÀNH MẠNH HƠN: Cùng loại sản phẩm nhưng sạch hơn, ít chế biến hơn (Ví dụ: Bim bim khoai chiên dầu cọ -> Bánh gạo lứt nướng không dầu hoặc khoai lang sấy mộc).
7. TUÂN THỦ NGHIÊM NGẶT ĐỊNH DẠNG JSON SCHEMA.
```

### 2.2 JSON Schema v2.0 (Structured Outputs)

```json
{
  "type": "object",
  "properties": {
    "product_name": {
      "type": "string",
      "description": "Tên sản phẩm suy luận được từ bao bì hoặc bảng thành phần"
    },
    "brand_name": {
      "type": "string",
      "description": "Tên thương hiệu nếu có"
    },
    "category": {
      "type": "string",
      "enum": ["Bánh kẹo", "Đồ uống", "Mì ăn liền", "Sữa & Chế phẩm sữa", "Đồ ăn dặm", "Gia vị", "Đồ đóng hộp", "Snack/Bim bim", "Khác"]
    },
    "health_score": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100,
      "description": "Điểm sức khỏe tổng thể 0 - 100 theo công thức dinh dưỡng + phụ gia + NOVA"
    },
    "traffic_light": {
      "type": "string",
      "enum": ["GREEN", "YELLOW", "RED"]
    },
    "nova_group": {
      "type": "integer",
      "minimum": 1,
      "maximum": 4,
      "description": "Phân loại NOVA: 1 (Tự nhiên), 2 (Gia vị sơ chế), 3 (Chế biến thông thường), 4 (Siêu chế biến - Ultra-processed)"
    },
    "summary": {
      "type": "string",
      "description": "Tóm tắt súc tích 1-2 câu về mức độ an toàn và chất lượng dinh dưỡng"
    },
    "child_warning": {
      "type": "object",
      "properties": {
        "is_safe_for_kids": { "type": "boolean" },
        "min_recommended_age_years": { "type": "integer" },
        "danger_reason": { 
          "type": "string", 
          "description": "Lý do cụ thể nếu có hại cho trẻ (VD: Chứa màu Tartrazine E102 gây tăng động, hoặc chứa chất tạo ngọt Aspartame)" 
        }
      },
      "required": ["is_safe_for_kids", "danger_reason"]
    },
    "hidden_sugars_detected": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Danh sách các loại đường ẩn phát hiện được (VD: Maltodextrin, Siro bắp HFCS, Dextrose...)"
    },
    "bad_fats_detected": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Danh sách dầu mỡ xấu (VD: Dầu cọ, Dầu hydro hóa, Chất béo chuyển hóa)"
    },
    "allergens_detected": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Danh sách các chất gây dị ứng (Đậu phộng, Đậu nành, Sữa, Gluten...)"
    },
    "additives": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "code": { "type": "string", "description": "Mã quốc tế như E102, E211, E621" },
          "name": { "type": "string", "description": "Tên tiếng Việt thông dụng" },
          "group": { 
            "type": "string", 
            "enum": ["Chất bảo quản", "Phẩm màu", "Chất điều vị", "Chất tạo ngọt", "Chất nhũ hóa", "Chất chống oxy hóa", "Khác"] 
          },
          "risk_level": { 
            "type": "string", 
            "enum": ["NO_RISK", "LOW_RISK", "MODERATE_RISK", "HAZARDOUS"] 
          },
          "short_explanation": { 
            "type": "string", 
            "description": "Giải thích ngắn gọn 1 câu bằng ngôn ngữ bình dân" 
          }
        },
        "required": ["code", "name", "group", "risk_level", "short_explanation"]
      }
    },
    "healthy_alternatives": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "suggestion_name": { "type": "string", "description": "Tên sản phẩm/món ăn thay thế sạch hơn" },
          "why_better": { "type": "string", "description": "Lý do vì sao món này lành mạnh hơn" }
        },
        "required": ["suggestion_name", "why_better"]
      },
      "description": "2 đến 3 sản phẩm thay thế lành mạnh hơn cùng phân khúc"
    },
    "actionable_advice": {
      "type": "string",
      "description": "Khuyến nghị khẩu phần cụ thể (Ví dụ: Không dùng quá 1 gói/tuần, không dùng trước bữa chính)"
    }
  },
  "required": [
    "product_name",
    "health_score",
    "traffic_light",
    "nova_group",
    "summary",
    "child_warning",
    "hidden_sugars_detected",
    "bad_fats_detected",
    "allergens_detected",
    "additives",
    "healthy_alternatives",
    "actionable_advice"
  ]
}
```

---

## 4. CƠ CHẾ NÉN ẢNH & CACHING CƠ SỞ DỮ LIỆU

### 3.1 Nén ảnh trên thiết bị Client (Expo)
```typescript
import * as ImageManipulator from 'expo-image-manipulator';

export async function processCameraImage(uri: string) {
  // Resize chiều rộng về 1200px, chất lượng JPEG 0.7
  // Giúp dung lượng còn ~300KB - 500KB, truyền qua mạng chỉ mất 0.3s
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );
  return result;
}
```

### 3.2 Lập chỉ mục Barcode trên CSDL Backend
```sql
CREATE TABLE scanned_products (
    id SERIAL PRIMARY KEY,
    barcode VARCHAR(64) UNIQUE,
    product_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255),
    health_score INT NOT NULL,
    traffic_light VARCHAR(10) NOT NULL,
    nova_group INT NOT NULL,
    analysis_json JSONB NOT NULL,
    scanned_count INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_barcode ON scanned_products(barcode);
```

---

## 5. BẢO MẬT & TỐI ƯU CHI PHÍ TOKEN

1. **Bảo vệ API Key tuyệt đối:** Mobile App không gọi trực tiếp Google Cloud. Mọi request đi qua Backend Proxy xác thực chữ ký (HMAC SHA-256) của app.
2. **Tiết kiệm chi phí API:** Nhờ cơ chế quét mã vạch Barcode kết hợp lưu trữ kết quả phân tích:
   * Sản phẩm phổ biến (sữa chua Vinamilk, mì Hảo Hảo, bánh Chocopie...): Chỉ tốn tiền gọi Gemini **đúng 1 lần đầu tiên** cho cả cộng đồng hàng trăm ngàn người dùng!
   * Tiết kiệm tới **80% chi phí API** khi lượng người dùng tăng trưởng.
