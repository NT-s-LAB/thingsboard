# EITEK Mobile - Flutter Application

> Mobile application cho nền tảng EITEK IoT Platform

## 📱 Tính năng

- **Đăng nhập/Xác thực**: JWT Authentication với refresh token
- **Dashboard**: Tổng quan hệ thống, thống kê device online/offline
- **Quản lý Dự án**: Xem và quản lý các dự án IoT
- **Quản lý Thiết bị**: 
  - Danh sách thiết bị với filter theo trạng thái
  - Chi tiết thiết bị với telemetry realtime
  - Gửi RPC commands điều khiển thiết bị
- **SCADA View**: Xem các màn hình SCADA (coming soon)
- **Cài đặt**: Profile, ngôn ngữ, theme

## 🏗️ Cấu trúc dự án

```
lib/
├── core/                    # Core utilities
│   ├── constants/           # App constants, API endpoints
│   ├── router/              # GoRouter configuration
│   ├── services/            # API client, storage, websocket
│   └── theme/               # App theme, colors
├── data/                    # Data layer
│   ├── models/              # Data models (User, Device, Project, etc.)
│   └── repositories/        # Data repositories
├── features/                # Feature modules
│   ├── auth/                # Authentication feature
│   │   ├── providers/       # Auth state management
│   │   └── screens/         # Login screen
│   ├── dashboard/           # Dashboard feature
│   │   └── screens/         # Dashboard screen
│   ├── devices/             # Devices feature
│   │   ├── providers/       # Devices state management
│   │   └── screens/         # Devices list, detail screens
│   ├── projects/            # Projects feature
│   │   ├── providers/       # Projects state management
│   │   └── screens/         # Projects list screen
│   └── settings/            # Settings feature
│       └── screens/         # Settings screen
├── shared/                  # Shared components
│   └── widgets/             # Reusable widgets
└── main.dart                # App entry point
```

## 🛠️ Tech Stack

- **Flutter** 3.x
- **State Management**: Riverpod
- **Routing**: GoRouter
- **HTTP Client**: Dio
- **WebSocket**: Socket.IO Client
- **Storage**: Shared Preferences & Flutter Secure Storage
- **Charts**: FL Chart, Syncfusion Gauges

## 🚀 Cài đặt

### Yêu cầu

- Flutter SDK 3.x
- Dart SDK 3.x
- Android Studio / VS Code
- Android SDK / Xcode (for iOS)

### Cài đặt dependencies

```bash
cd mobile
flutter pub get
```

### Cấu hình môi trường

Sửa file `lib/core/constants/app_constants.dart`:

```dart
// API Configuration
static const String apiBaseUrl = 'http://YOUR_BACKEND_URL:3001';
static const String wsBaseUrl = 'ws://YOUR_BACKEND_URL:3001';
static const String thingsboardUrl = 'http://YOUR_TB_URL:8080';
```

### Chạy ứng dụng

```bash
# Chạy debug mode
flutter run

# Chạy release mode
flutter run --release

# Build APK
flutter build apk --release

# Build iOS
flutter build ios --release
```

## 📋 Build Commands

```bash
# Generate code (freezed, json_serializable)
flutter pub run build_runner build --delete-conflicting-outputs

# Watch mode for code generation
flutter pub run build_runner watch

# Format code
dart format .

# Analyze code
flutter analyze
```

## 🔗 API Integration

App kết nối với EITEK Backend API:

| Endpoint | Mô tả |
|----------|-------|
| `/auth/login` | Đăng nhập |
| `/auth/refresh` | Refresh token |
| `/projects` | Quản lý dự án |
| `/sites` | Quản lý sites |
| `/areas` | Quản lý areas |
| `/devices` | Quản lý thiết bị |
| `/devices/:id/telemetry` | Lấy telemetry |
| `/devices/:id/rpc` | Gửi RPC command |

## 🔒 Bảo mật

- Access token được lưu trữ trong Secure Storage
- Auto refresh token khi expired
- Logout sẽ clear tất cả credential

## 📝 License

EITEK © 2026
