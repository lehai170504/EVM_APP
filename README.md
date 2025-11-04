# Electric Vehicle Dealer Management - React Native App

Ứng dụng React Native cho nhân viên bán hàng (Dealer Staff) - Quản lý bán hàng xe điện.

## 🎨 Design System

- **Primary Color**: Electric Blue #0066FF
- **Accent Color**: Lime Green #4CAF50
- **Background**: #F5F7FA
- **Font**: System font (Inter/Roboto Medium style)
- **Icons**: Ionicons (Expo Vector Icons)

## 📱 Tính năng

### Đăng nhập & Xác thực
- Đăng nhập với email/password
- Lưu trữ token và user info
- Tự động đăng xuất khi token hết hạn

### Dashboard
- Tổng quan doanh số cá nhân
- Thống kê đơn hàng theo trạng thái
- Thao tác nhanh (Tạo báo giá, đơn hàng, khách hàng)

### Quản lý sản phẩm
- Xem danh sách xe điện
- Chi tiết từng mẫu xe
- So sánh 2-3 mẫu xe
- Tìm kiếm sản phẩm

### Quản lý báo giá (Quotes)
- Xem danh sách báo giá
- Tạo báo giá mới
- Chi tiết báo giá
- Chuyển báo giá đã chấp nhận thành đơn hàng

### Quản lý đơn hàng (Orders)
- Xem danh sách đơn hàng
- Tạo đơn hàng mới
- Chi tiết đơn hàng
- Cập nhật trạng thái đơn hàng
- Tạo phiếu giao hàng
- Tạo thanh toán

### Quản lý khách hàng (Customers)
- Xem danh sách khách hàng
- Tạo khách hàng mới
- Chi tiết khách hàng
- Tìm kiếm khách hàng

### Báo cáo
- Báo cáo cá nhân
- Thống kê doanh số
- Đơn hàng theo trạng thái

### Cài đặt
- Cập nhật thông tin cá nhân
- Đổi mật khẩu
- Đăng xuất

## 🚀 Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Cấu hình API URL trong `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://your-backend-url/api';
```

3. Chạy ứng dụng:
```bash
npm start
```

Hoặc cho Android/iOS:
```bash
npm run android
npm run ios
```

## 📁 Cấu trúc thư mục

```
MyApp/
├── src/
│   ├── components/       # Components tái sử dụng
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Input.js
│   │   ├── StatusBadge.js
│   │   └── Loading.js
│   ├── context/          # Context providers
│   │   └── AuthContext.js
│   ├── navigation/       # Navigation setup
│   │   └── AppNavigator.js
│   ├── screens/          # Tất cả các screens
│   │   ├── auth/
│   │   ├── vehicles/
│   │   ├── quotes/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── DashboardScreen.js
│   │   ├── ReportsScreen.js
│   │   └── SettingsScreen.js
│   ├── services/         # API services
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── vehicleService.js
│   │   ├── quoteService.js
│   │   ├── orderService.js
│   │   ├── customerService.js
│   │   ├── dashboardService.js
│   │   ├── deliveryService.js
│   │   └── paymentService.js
│   └── theme/            # Design system
│       ├── colors.js
│       ├── typography.js
│       ├── spacing.js
│       └── index.js
└── App.js                # Entry point
```

## 🔧 Cấu hình

### Backend URL

Cập nhật `API_BASE_URL` trong `src/services/api.js`:
- **Development**: `http://localhost:5000/api` (hoặc IP máy tính cho Android)
- **Production**: URL backend của bạn

### Android Network

Nếu test trên Android device/emulator, thay `localhost` bằng IP máy tính:
```javascript
const API_BASE_URL = 'http://192.168.1.100:5000/api';
```

## 📝 Ghi chú

- Ứng dụng được thiết kế cho role **DealerStaff** (Nhân viên bán hàng)
- Tất cả các API calls tự động thêm Authorization token
- Token được lưu trong AsyncStorage
- Navigation sử dụng React Navigation với Bottom Tabs và Stack Navigator

## 🎯 Lưu ý khi phát triển

1. **Picker Component**: Một số màn hình tạo (CreateQuote, CreateOrder) cần implement picker component thực tế thay cho alert
2. **Form Validation**: Có thể thêm validation chi tiết hơn cho các form
3. **Error Handling**: Có thể cải thiện error handling và user feedback
4. **Loading States**: Một số màn hình có thể cần loading states tốt hơn

## 📄 License

Private project

