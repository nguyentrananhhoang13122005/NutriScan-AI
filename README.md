# 🥑 NutriScan AI - Ứng dụng Quét & Phân tích Thành phần Thực phẩm (v2.0)

> Ứng dụng di động thông minh hỗ trợ phụ huynh và người tiêu dùng chụp ảnh bảng thành phần bao bì thực phẩm, tự động phân tích các chất bảo quản, phụ gia hóa chất, đường ẩn, dầu mỡ xấu và đưa ra khuyến nghị an toàn sức khỏe (đặc biệt cho trẻ em) bằng **Google Gemini Multimodal Vision AI**.

---

## 🌟 Tính năng Đột phá (Dựa trên Nghiên cứu Đối thủ Quốc tế)

Sau khi nghiên cứu các ứng dụng hàng đầu thế giới (**Yuka** 40M+ users, **Trash Panda**, **Bobby Approved**), NutriScan AI đã tích hợp những "vũ khí bí mật":

1. **Gợi ý Sản phẩm Thay thế Lành mạnh hơn (Healthy Swaps):** Khi quét món bị điểm thấp hoặc chứa chất cấm cho trẻ em, AI tự động gợi ý 2-3 sản phẩm sạch hơn cùng loại để bố mẹ mua thay thế.
2. **Cơ chế Quét Lai Siêu Tốc (Hybrid Scanner):**
   * Quét **Mã vạch (Barcode)**: Nếu sản phẩm đã từng quét $\rightarrow$ trả kết quả ngay tức thì trong **0.1s** (tiết kiệm 80% chi phí API).
   * Chụp **Bảng thành phần (AI Vision)**: Nếu mã vạch chưa có trong CSDL $\rightarrow$ AI tự đọc bao bì và tự động lưu vào CSDL cho người dùng sau.
3. **Tiêu chuẩn Siêu chế biến Quốc tế NOVA (Group 1 - 4):** Phân loại mức độ can thiệp công nghiệp vào thực phẩm.
4. **Bộ Soi "Đường Ẩn" & "Dầu Chiên Xấu":** Tự động bóc tách các loại đường tinh vi (Siro bắp HFCS, Maltodextrin) và dầu cọ/chất béo chuyển hóa (Trans fat).
5. **Thẻ Chia sẻ Mạng Xã Hội (Viral Infographic Card):** Xuất ảnh tóm tắt cảnh báo đẹp mắt dạng Story 9:16 để mẹ bỉm sữa chia sẻ lên Facebook/Zalo.

---

## 📁 Cấu trúc Tài liệu Dự án

Tất cả tài liệu phân tích nghiệp vụ và đặc tả kỹ thuật phiên bản v2.0 nằm trong thư mục `docs/`:

| Tài liệu | Mô tả chi tiết |
| :--- | :--- |
| 📄 **[docs/PRD_BA_DOCUMENT.md](./docs/PRD_BA_DOCUMENT.md)** | **Tài liệu Nghiệp vụ BA v2.0:**<br>• Bảng so sánh đối thủ (Yuka, Trash Panda, Bobby Approved).<br>• Công thức tính điểm 100 khoa học (Nutri-Score 50% + Phụ gia 35% + NOVA 15%).<br>• Chi tiết 5 màn hình chính & Wireframe logic.<br>• Mô hình kinh doanh & doanh thu (Freemium + Affiliate sạch). |
| 📄 **[docs/TECHNICAL_SPEC_GEMINI.md](./docs/TECHNICAL_SPEC_GEMINI.md)** | **Đặc tả Kỹ thuật v2.0:**<br>• Sơ đồ kiến trúc Quét Lai (Barcode + Gemini Vision).<br>• Quy chuẩn nén ảnh Client-side (Expo Image Manipulator).<br>• System Prompt chuyên sâu (WHO/Codex + Bộ Y tế VN).<br>• **JSON Schema v2.0** với chuẩn NOVA, đường ẩn, dầu xấu & gợi ý thay thế.<br>• Thiết kế bảng CSDL PostgreSQL Caching giúp tiết kiệm 80% chi phí token. |

---

## 🛠 Công nghệ Cốt lõi (Tech Stack)

* **Mobile Framework:** [Expo (React Native)](https://expo.dev) + TypeScript
* **Định tuyến (Routing):** Expo Router (File-based routing)
* **Xử lý Camera & Mã vạch:** `expo-camera` + `expo-barcode-scanner` + `expo-image-manipulator`
* **Trí tuệ nhân tạo (AI Engine):** Google Gemini 2.0 / 1.5 Flash (Multimodal Structured Outputs)
* **Quản lý Trạng thái:** Zustand
* **Hiệu ứng & Giao diện:** React Native Reanimated + Lucide Icons

---

## 🚀 Hướng dẫn Chạy Thử Ứng Dụng (Quick Start)

Mã nguồn ứng dụng hoàn chỉnh nằm trong thư mục **`nutriscan-app/`**.

### Cách 1: Chạy trực tiếp trên Web Browser
```bash
cd nutriscan-app
npm run web
```

### Cách 2: Chạy trên Điện thoại thật (iOS / Android)
```bash
cd nutriscan-app
npx expo start
```
* Mở app **Expo Go** trên điện thoại và quét mã QR hiển thị trong terminal để trải nghiệm ngay lập tức.
