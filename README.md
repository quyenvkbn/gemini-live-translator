# Gemini Live Translator

Ứng dụng web đa mục đích bằng Gemini Live API. Hiện tại tính năng phiên dịch song song dùng `gemini-3.5-live-translate-preview`; `gemini-3.8-live` và `gemini-3.8-live-extended-thinking` được dành cho các module phân tích đa phương thức về sau.

## Cấu trúc

- `src/gemini/`: kết nối và cấu hình Gemini Live dùng chung.
- `src/features/parallel-translation.js`: phiên dịch song song hiện tại.
- `public/js/media/`: thu audio PCM và frame video.
- `public/js/features/parallel-translation.js`: client-side translator.
- `public/js/features/visual-analysis.js`: extension point cho phân tích ảnh/video ở phase tiếp theo.

## Chạy

```powershell
Copy-Item .env.example .env
# mở .env và điền GEMINI_API_KEY
npm install
npm run dev
```

Mở http://localhost:3000. Cho phép microphone/camera khi trình duyệt hỏi.

## Deploy online

Project này có thể deploy nguyên app lên Render dưới dạng Web Service:

1. Đẩy repository lên GitHub.
2. Trong Render chọn `New > Web Service` và kết nối repository.
3. Build command: `npm ci`.
4. Start command: `npm start`.
5. Thêm biến môi trường `GEMINI_API_KEY` trong Render.
6. Mở URL HTTPS Render được cấp.

`render.yaml` đã có sẵn cấu hình cơ bản. App dùng WebSocket nên khi chạy online frontend tự chuyển sang `wss://`. Render hỗ trợ WebSocket cho Web Service; gói miễn phí có thể tự sleep sau thời gian không hoạt động nên lần mở đầu có thể chậm.

Để dịch YouTube, mở video ở một tab khác, bấm `Chia sẻ tab YouTube`, chọn đúng tab YouTube trong hộp thoại, rồi bật tùy chọn chia sẻ âm thanh của tab. Trình duyệt chỉ cho phép capture sau khi người dùng xác nhận quyền này.

## Chrome Extension

Thư mục `extension/` là bản Chrome Extension Manifest V3. Mở `chrome://extensions`, bật Developer mode, chọn `Load unpacked` và chọn thư mục `extension`. Mở video/audio trên tab bất kỳ (YouTube, Facebook…), bấm biểu tượng extension để mở Side Panel, nhập URL backend online dạng `wss://.../live` rồi bấm `Dịch tab hiện tại`. Extension không còn mặc định dùng localhost.

API key chỉ nằm ở backend trong `.env`, không được gửi vào mã JavaScript frontend.
# gemini-live-translator
