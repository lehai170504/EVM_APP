# Các lỗi đã sửa

## 1. Card Component - String cannot be cast to Boolean
**Vấn đề:** Card component đang spread `...props` vào View, gây lỗi khi có props không hợp lệ như `onPress`

**Đã sửa:**
- Loại bỏ `...props` trong Card component
- Card chỉ nhận `children` và `style` props

## 2. StatCard trong DashboardScreen
**Vấn đề:** StatCard đang truyền `onPress` vào Card component (View không nhận onPress)

**Đã sửa:**
- Wrap Card trong TouchableOpacity khi có onPress
- StatCard giờ xử lý onPress đúng cách

## 3. Button Component với prop không hợp lệ
**Vấn đề:** QuotesScreen đang truyền prop `icon` vào Button (không được hỗ trợ)

**Đã sửa:**
- Xóa prop `icon` không hợp lệ
- Thêm `...rest` props trong Button để xử lý các props khác an toàn hơn

## 4. Babel Config
**Đã thêm:** `babel.config.js` với react-native-reanimated plugin (cần thiết cho React Navigation)

## Các bước tiếp theo:

1. **Xóa cache và reinstall:**
```bash
cd MyApp
rm -rf node_modules
npm install
```

2. **Xóa cache Metro bundler:**
```bash
npx expo start --clear
```

3. **Nếu vẫn lỗi, rebuild app:**
```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

4. **Đảm bảo API URL đúng:**
- Kiểm tra `src/services/api.js`
- Với Android device/emulator: dùng IP máy tính thay vì localhost

## Lưu ý:

- Nếu dùng Android emulator, có thể cần thay `localhost` bằng `10.0.2.2`
- Nếu dùng Android device, dùng IP máy tính (VD: `http://192.168.1.100:5000/api`)

