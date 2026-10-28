# TÀI LIỆU ĐẶC TẢ YÊU CẦU NGHIỆP VỤ (PRD / BA DOCUMENT) - V2.0
## DỰ ÁN: NUTRIGAN AI - TRỢ LÝ PHÂN TÍCH THÀNH PHẦN THỰC PHẨM
* **Nền tảng:** Mobile App (iOS & Android) - Expo (React Native) + TypeScript
* **Công nghệ AI:** Google Gemini 2.0 / 1.5 Flash (Multimodal Vision API)
* **Phiên bản tài liệu:** v2.0.0 (Đã đối soát & nâng cấp theo tiêu chuẩn Yuka, Trash Panda, Bobby Approved)
* **Ngày cập nhật:** 2026-10-26

---

## 1. PHÂN TÍCH ĐỐI THỦ CẠNH TRANH & BÀI HỌC ÁP DỤNG (BENCHMARKING)

Để tạo ra sản phẩm vượt trội, dự án đã nghiên cứu 3 ứng dụng quét thực phẩm thành công nhất thế giới:

| Ứng dụng | Điểm mạnh cốt lõi | Hạn chế lớn | Bài học áp dụng cho NutriScan AI |
| :--- | :--- | :--- | :--- |
| **Yuka** *(Âu - Mỹ, 40M+ users)* | • Thang điểm 100 rất uy tín.<br>• **Gợi ý sản phẩm thay thế sạch hơn (Healthy Alternatives)** khi quét ra món điểm thấp.<br>• 100% độc lập, không nhận quảng cáo. | • **Phụ thuộc 100% vào Barcode** $\rightarrow$ Không quét được hàng ngàn sản phẩm nội địa Việt Nam.<br>• Chấm điểm khắt khe với thực phẩm tự nhiên nhiều béo (dầu oliu, phô mai). | 👉 **Giữ tính năng "Gợi ý món thay thế"**.<br>👉 Thay vì phụ thuộc Barcode, dùng **AI chụp thẳng bảng thành phần** để quét được 100% mọi sản phẩm ở VN. |
| **Trash Panda** *(Mỹ, App Store nổi bật)* | • Bóc tách rõ 4 nhóm: Độc hại, Đáng ngờ, Đường ẩn, Dị ứng.<br>• Có tính năng **fallback chụp ảnh nhãn thành phần** khi không có barcode. | • Phải trả phí mới mở hết bộ lọc cá nhân.<br>• Cơ sở dữ liệu phụ gia chỉ tập trung vào thị trường Bắc Mỹ (FDA). | 👉 Áp dụng phân loại 4 cấp độ phụ gia.<br>👉 Bản địa hóa dữ liệu theo **Quy chuẩn Bộ Y tế Việt Nam (Thông tư 24/2019/TT-BYT)**. |
| **Bobby Approved** *(Chuyên gia dinh dưỡng)* | • Phán quyết nhị phân rõ ràng: *"Đạt"* hoặc *"Không đạt"*.<br>• Cực kỳ nhạy cảm với **Dầu hạt tinh luyện (Seed oils), Dầu cọ, Đường ẩn & Bột ngọt**. | • Mang tính chủ quan của 1 cá nhân, không có thang điểm khoa học chi tiết. | 👉 Bổ sung mục cảnh báo chuyên biệt: **Soi Đường ẩn (Maltodextrin, HFCS) & Dầu chiên công nghiệp (Dầu cọ hydro hóa)** mà phụ huynh rất ghét. |

---

## 2. NHỮNG TÍNH NĂNG ĐỘT PHÁ BỔ SUNG (THE KILLER FEATURES)

Dựa trên nghiên cứu đối thủ, NutriScan AI bổ sung **5 tính năng "vũ khí bí mật"**:

1. **Gợi ý Thay thế Lành mạnh hơn (Healthy Swaps):** Khi quét sản phẩm bị Đèn Đỏ/Vàng, AI tự động gợi ý 2 - 3 sản phẩm sạch hơn cùng phân khúc (VD: Quét bim bim nhiều muối $\rightarrow$ gợi ý bánh gạo lứt rong biển ít gia vị).
2. **Cơ chế Quét Lai Siêu Tốc (Hybrid Scanner):** 
   * Ưu tiên quét Mã vạch (Barcode): Nếu sản phẩm đã từng được người khác quét, trả kết quả ngay trong **0.1 giây** (không tốn chi phí gọi AI).
   * Nếu Barcode mới chưa có trong hệ thống $\rightarrow$ Mở Camera AI chụp bảng thành phần, sau đó tự động lưu vào CSDL để người dùng sau hưởng lợi.
3. **Phân loại Siêu chế biến chuẩn Quốc tế (NOVA Group 1 - 4):** Đưa chuẩn khoa học của Liên Hợp Quốc vào app (Group 1: Tự nhiên $\rightarrow$ Group 4: Siêu chế biến công nghiệp).
4. **Bộ Soi "Đường Ẩn" & "Dầu Chiên Kém Chất Lượng":** Tự động gom các loại đường tinh vi (Siro bắp HFCS, Maltodextrin, Dextrose) và dầu cọ chiên đi chiên lại để cảnh báo bố mẹ.
5. **Thẻ Chia sẻ Mạng Xã Hội (Viral Infographic Card):** 1 nút bấm tạo ảnh tóm tắt đẹp mắt (như Story Instagram/Zalo/Facebook) để các mẹ bỉm sữa chia sẻ cảnh báo trong các hội nhóm.

---

## 3. CÔNG THỨC CHẤM ĐIỂM SỨC KHỎE (HEALTH SCORE 0 - 100)

Ứng dụng không chấm điểm bừa bãi mà áp dụng công thức phối hợp khoa học:

$$\text{Tổng điểm (100đ)} = \text{Chất lượng Dinh dưỡng (50\%)} + \text{Mức độ Phụ gia (35\%)} + \text{Mức độ Chế biến NOVA (15\%)}$$

* **Chất lượng dinh dưỡng (50 điểm):** Tính theo chuẩn Nutri-Score (Điểm trừ: Đường, Muối, Chất béo bão hòa, Calo rỗng; Điểm cộng: Chất xơ, Đạm tự nhiên).
* **Mức độ phụ gia (35 điểm):**
  * 🟢 **Không rủi ro (No Risk):** 0 điểm trừ (Axit Citric, Muối nở, Pectin...).
  * 🟡 **Rủi ro thấp (Low Risk):** Trừ 2 - 5 điểm/chất.
  * 🟠 **Rủi ro trung bình (Moderate Risk):** Trừ 8 - 12 điểm/chất.
  * 🔴 **Nguy cơ cao / Hại cho trẻ (Hazardous):** Trừ 20 - 30 điểm/chất (Ví dụ: E102 Tartrazine, E110 Hoàng hôn vàng, Aspartame, Natri Benzoat E211 kết hợp Vitamin C).
* **Độ tự nhiên NOVA (15 điểm):**
  * NOVA 1 (Nguyên bản/Tự nhiên): +15đ.
  * NOVA 2 (Nguyên liệu nấu ăn sơ chế): +10đ.
  * NOVA 3 (Thực phẩm chế biến thông thường): +5đ.
  * NOVA 4 (Thực phẩm siêu chế biến Ultra-Processed): 0đ.

---

## 4. ĐẶC TẢ CHI TIẾT CÁC MÀN HÌNH (CẬP NHẬT V2)

### Màn hình 1: Onboarding & Thiết lập Hồ sơ Cá nhân hóa
* **Đối tượng:** Trẻ nhỏ (0-1 tuổi, 1-3 tuổi, 3-6 tuổi, >6 tuổi), Mẹ bầu, Người lớn.
* **Bộ lọc Dị ứng & Bệnh lý:** 
  * Dị ứng: Đậu phộng, Đậu nành, Sữa (Lactose/Casein), Gluten, Hải sản, Trứng.
  * Sức khỏe: Bệnh tiểu đường (soi đường ẩn), Cao huyết áp (soi muối/E621), Tim mạch (chống Trans-fat), Ăn chay (Vegan).
* **Chế độ kiểm duyệt gắt gao cho bé (Strict Child Mode):** Bật công tắc này, bất kỳ món nào chứa màu nhân tạo hoặc chất bảo quản cấm cho trẻ sẽ bị đánh tụt điểm ngay lập tức.

### Màn hình 2: Màn hình Quét Camera Lai (Hybrid Scanner Screen)
* **Giao diện 2 trong 1:**
  * **Chế độ 1 - Quét Mã Vạch (Mặc định - Siêu nhanh):** Khung quét barcode nhỏ gọn.
  * **Chế độ 2 - Chụp Bảng Thành Phần (AI Camera):** Chuyển tab hoặc tự động kích hoạt nếu quét barcode không có dữ liệu.
* **Công cụ bổ trợ:**
  * Đèn Flash trợ sáng.
  * Nút tải ảnh từ Thư viện (hỗ trợ cả ảnh chụp màn hình shopee/tiki).
  * Khung hướng dẫn tự động canh viền chữ.
* **Cơ chế xử lý ảnh:** Sử dụng **End-to-End Multimodal Vision** (AI nhìn ảnh trực tiếp, không qua bộ OCR rời) để nhận diện chính xác 100% các ký tự mã E/INS dù bao bì bị uốn cong, nhăn nheo hoặc bóng lóa.

### Màn hình 3: Màn hình Chờ Phân tích (Radar State)
* Animation quét tia laser xanh chuyển động.
* 3 bước tiến trình: *"Bóc tách thành phần"* $\rightarrow$ *"Soi mã phụ gia INS"* $\rightarrow$ *"Tìm kiếm sản phẩm thay thế tốt hơn"*.
* Hiển thị câu đố vui / Kiến thức ngắn về dinh dưỡng trong lúc đợi 1.5s.

### Màn hình 4: Màn hình Kết quả Toàn diện (Result Screen)
1. **Header Điểm số & Đèn Giao Thông:**
   * Vòng tròn điểm số (0 - 100) + Badge NOVA (Group 1 - 4).
   * Tên thương hiệu & tên sản phẩm tự nhận diện.
2. **Khu vực Cảnh báo Đỏ (Critical Danger Banner):**
   * Hiển thị ngay đầu trang nếu phát hiện chất dị ứng với hồ sơ hoặc phụ gia độc hại cho bé.
3. **Mục Độc Quyền: Soi "Đường Ẩn" & "Chất Béo Xấu":**
   * Liệt kê tổng số thìa đường quy đổi (VD: *"Tương đương 4.5 thìa đường cát - Vượt 60% nhu cầu ngày của bé"*).
   * Cảnh báo dầu cọ / chất béo chuyển hóa (Trans fat).
4. **Phân rã Phụ gia & Hóa chất theo 4 cấp độ (Accordion):**
   * Màu xanh: An toàn.
   * Màu vàng: Cần thận trọng.
   * Màu cam: Có nghiên cứu nghi vấn.
   * Màu đỏ: Nguy cơ cao / Trẻ em không nên dùng.
   * Chạm vào để xem nguồn tài liệu khoa học (EFSA, WHO, Bộ Y tế).
5. **Khu vực Gợi ý Sản phẩm Thay thế Lành mạnh hơn (Healthy Alternatives):**
   * *"Món này điểm thấp (32/100)? Hãy thử các lựa chọn lành mạnh hơn này:"*
   * Danh sách 2 - 3 thẻ sản phẩm thay thế (ảnh + tên + điểm số cao hơn).
6. **Footer:**
   * Nút **"Tạo Thẻ Chia Sẻ" (Share Card)**: Xuất ảnh định dạng dọc 9:16 có sẵn điểm số, cảnh báo để mẹ up Facebook/Zalo Story.
   * Nút **"Lưu lại" (Bookmark)**.
   * Tuyên bố miễn trừ trách nhiệm y tế (Medical Disclaimer).

### Màn hình 5: Lịch sử & Thư viện Sức khỏe (History & Insights)
* Thống kê tuần: *"Tuần này bạn đã quét 12 sản phẩm (8 Tốt, 3 Trung bình, 1 Kém)"*.
* Phân loại theo nhãn: *Đồ ăn vặt của bé*, *Gia vị nhà bếp*, *Đồ uống*.
* Cho phép tìm kiếm và xem lại ngoại tuyến (Offline).

---

## 5. MÔ HÌNH THƯƠNG MẠI & KINH DOANH (MONETIZATION STRATEGY)

Học hỏi từ mô hình Freemium rất thành công của Yuka và Trash Panda:

1. **Gói Miễn phí (Free Tier):**
   * Quét không giới hạn bảng thành phần bằng AI.
   * Xem điểm số tổng quan và phân tích phụ gia cơ bản.
2. **Gói Thành viên Cao cấp (NutriScan Premium - 49.000đ/tháng hoặc 399.000đ/năm):**
   * **Không giới hạn hồ sơ gia đình:** Tạo riêng từng profile cho từng đứa con, bố mẹ, ông bà.
   * **Mở khóa Bộ lọc Chuyên sâu:** Tự chọn danh sách chất dị ứng riêng, lọc thực phẩm biến đổi gen (Non-GMO), lọc dầu hạt (Seed-oil free).
   * **Tính năng So sánh 2 sản phẩm:** Chụp cùng lúc 2 hộp sữa/bánh để AI chỉ ra hộp nào tốt hơn cho bé.
   * **Chế độ Quét Offline:** Tải trước cơ sở dữ liệu để quét mượt mà khi vào tầng hầm siêu thị mất sóng 4G.
3. **Tiếp thị Liên kết Sạch (Clean Affiliate - Giai đoạn 2):**
   * Ở mục *Gợi ý Sản phẩm Thay thế Lành mạnh*, gắn link mua hàng từ các thương hiệu thực phẩm hữu cơ (Bio/Organic) uy tín trên Shopee/Lazada/Tiki để nhận hoa hồng 5 - 10%.
   * **Cam kết đạo đức:** Không bao giờ nhận tiền của nhãn hàng để sửa đổi điểm số (giống triết lý 100% độc lập của Yuka).
