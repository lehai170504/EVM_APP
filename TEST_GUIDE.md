# Hướng dẫn Test App

## Lỗi hiện tại:
`java.lang.String cannot be cast to java.lang.Boolean`

## Đã sửa:
1. ✅ Input component - đảm bảo tất cả boolean props là boolean thực sự
2. ✅ Button component - loại bỏ spread props
3. ✅ Card component - loại bỏ spread props
4. ✅ AuthContext - đảm bảo boolean
5. ✅ Navigation - đảm bảo boolean props

## Cách chạy app:

### 1. Đảm bảo bạn đang ở đúng thư mục:
```bash
cd C:\Users\Minh\Desktop\SDN302\Project\clone\MyApp
```

### 2. Cài đặt dependencies (nếu chưa):
```bash
npm install
```

### 3. Xóa cache và chạy:
```bash
npx expo start --clear
```

### 4. Nếu vẫn lỗi, rebuild hoàn toàn:
```bash
# Xóa node_modules
rm -rf node_modules
npm install

# Rebuild
npx expo run:android
```

## Debug:
Nếu vẫn lỗi, kiểm tra:
1. Console logs để xem component nào gây lỗi
2. Xem stack trace để biết prop nào bị cast sai
3. Có thể cần check từng screen một

