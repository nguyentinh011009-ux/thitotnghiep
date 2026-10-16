# Cổng Đăng Ký Nguyện Vọng Tuyển Sinh

Hệ thống đăng ký và quản lý nguyện vọng xét tuyển tốt nghiệp THPT và Đại học trực tuyến được viết lại hoàn toàn bằng **React (TypeScript, Vite, Tailwind CSS)**, kết nối cơ sở dữ liệu Firebase Firestore.

## 🚀 Tính Năng Chính

### 1. Phân Hệ Xác Thực & Phân Luồng (Authentication & Routing)
- **Đăng nhập học sinh**: Xác thực thông qua mã tài khoản (Username) và mật khẩu cá nhân.
- **Đăng ký tài khoản học sinh**:
  - Các trường bắt buộc: Họ tên, Số điện thoại (duy nhất), Lớp.
  - Các trường thông tin mở rộng: Email, CCCD, Sở GD&ĐT, Xã/Phường, Ngày sinh, Mã học sinh, Ảnh đại diện.
  - Tự động sinh mã học sinh `TS<Số điện thoại>` và mật khẩu ngẫu nhiên 6 chữ số.
  - Hộp thoại hiển thị thông tin tài khoản được cấp ngay sau khi đăng ký.
- **Đăng nhập Quản trị viên (Admin)**: Mật khẩu quản trị hệ thống (`thitotnghiep27`).
- **Phân luồng thiết bị tự động**: Nhận diện thiết bị di động hoặc máy tính để kích hoạt giao diện tối ưu tương ứng (kèm nút chuyển đổi linh hoạt).

### 2. Phân Hệ Thí Sinh (Student Portal - PC & Mobile)
- **Tab 1: Tổng quan (Overview)**: Xem chi tiết thông tin cá nhân và tóm tắt trạng thái hồ sơ tuyển sinh.
- **Tab 2: Đăng ký Tổ hợp (Combos)**:
  - *Cách 1*: Tự động ghép tổ hợp dựa trên 2 môn cố định (Toán, Ngữ văn) + 2 môn thi tự chọn.
  - *Cách 2*: Tìm kiếm và thêm thủ công theo mã tổ hợp hoặc tên môn học.
  - Lưu và quản lý danh sách tổ hợp xét tuyển cá nhân.
- **Tab 3: Gợi ý Nguyện vọng (Suggestions)**:
  - Lọc ngành tuyển sinh theo tổ hợp đã chọn.
  - Tìm kiếm từ khóa đa trường và đa ngành.
  - Theo dõi tiến trình phân tích thời gian thực 4 giai đoạn.
  - Thêm trực tiếp ngành gợi ý vào danh sách nguyện vọng.
- **Tab 4: Đăng ký Nguyện vọng (Wish Registration)**:
  - Chọn Trường, Ngành và Tổ hợp tương thích.
  - Kê khai nguyện vọng với kiểm tra ràng buộc số lượng tối đa (`maxWishes`), trạng thái khóa (`lockWishes`), và luật giới hạn thứ tự theo ngành (`wish_rules`).
  - Kéo thả sắp xếp thứ tự (Drag & Drop) hoặc dùng nút di chuyển Lên/Xuống.
  - Chỉnh sửa, xóa nguyện vọng trực tiếp.
  - Cảnh báo thay đổi chưa lưu.
  - Lưu nguyện vọng vào cơ sở dữ liệu hoặc lưu trữ thành Phiếu lưu (`saved_forms`).
  - In phiếu đăng ký xét tuyển chuẩn A4.
- **Tab 5: Quản lý Phiếu & Đổi Mật Khẩu (Forms & Security)**:
  - Lịch sử các phiếu đăng ký đã lưu.
  - Đổi mật khẩu tài khoản thí sinh.

### 3. Phân Hệ Quản Trị Viên (Admin Dashboard)
- **1. Dashboard**: Thống kê số lượng học sinh, số trường, số ngành, và số phiếu đã nộp.
- **2. Quản lý Tổ hợp**: Bảng danh sách tổ hợp, thêm thủ công, nhập dữ liệu hàng loạt từ tệp Excel (`.xlsx`).
- **3. Quản lý Trường**: Bảng danh sách trường, thêm thủ công, nhập Excel.
- **4. Quản lý Ngành**: Bảng danh sách ngành tuyển sinh kèm tổ hợp môn, thêm thủ công, nhập Excel.
- **5. Quản lý Học sinh**: Xem danh sách học sinh, trạng thái nộp phiếu, chỉnh sửa thông tin toàn diện (tự động đồng bộ và di chuyển dữ liệu liên kết nếu đổi username), xóa học sinh kèm xóa dây chuyền dữ liệu liên quan.
- **6. Quản lý Đăng ký NV**: Theo dõi chi tiết danh sách nguyện vọng của từng thí sinh trong hệ thống.
- **7. Quản lý Mật khẩu**: Cấp lại mật khẩu cho thí sinh theo tên tài khoản.
- **8. Cấu hình & Giới hạn**:
  - Thiết lập ngày bắt đầu kỳ thi (đồng hồ đếm ngược).
  - Cấu hình số nguyện vọng tối đa.
  - Khóa/Mở chức năng điều chỉnh nguyện vọng.
  - Cấu hình luật giới hạn thứ tự tối thiểu/tối đa cho từng ngành học.

### 4. Mẫu In Phiếu Đăng Ký Chuẩn A4
- Tiêu ngữ Quốc hiệu nước CHXHCN Việt Nam.
- Thông tin thí sinh và bảng kê khai nguyện vọng.
- Lời cam kết và khu vực ký tên của Phụ huynh học sinh và Thí sinh.
- Phông chữ Times New Roman, định dạng căn lề A4 chuẩn cho máy in và xuất PDF.

## 💻 Công Nghệ Sử Dụng
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Bundler**: Vite
- **Xử lý Excel**: SheetJS (`xlsx`)
- **Backend / Database**: Firebase Firestore
