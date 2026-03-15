import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// App Constants for EITEK Mobile
class AppConstants {
  AppConstants._();

  // App Info
  static const String appName = 'EITEK IoT';
  static const String appVersion = '1.0.0';

  // API Configuration
  // - Android Emulator: 10.0.2.2 (đặc biệt, trỏ về host machine)
  // - iOS Simulator: localhost (chia sẻ network với host)
  // - Web: localhost
  // - Real Device: Dùng IP thực của máy tính
  
  static String get _baseHost {
    if (kIsWeb) {
      return 'localhost';
    }
    if (Platform.isAndroid) {
      return '10.0.2.2'; // Android Emulator -> Host
    }
    return 'localhost'; // iOS Simulator, macOS, Windows, Linux
  }

  // Uncomment dòng dưới và thay IP thực khi test trên thiết bị thật
  // static const String _baseHost = '192.168.1.100';

  static String get apiBaseUrl => 'http://$_baseHost:3001';
  static String get wsBaseUrl => 'ws://$_baseHost:3001';
  static String get thingsboardUrl => 'http://$_baseHost:8080';

  // Timeout durations
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
  static const String themeKey = 'theme_mode';
  static const String languageKey = 'language';

  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;

  // Device Status
  static const String statusOnline = 'ONLINE';
  static const String statusOffline = 'OFFLINE';
  static const String statusUnknown = 'UNKNOWN';

  // Date Formats
  static const String dateFormat = 'dd/MM/yyyy';
  static const String timeFormat = 'HH:mm:ss';
  static const String dateTimeFormat = 'dd/MM/yyyy HH:mm:ss';
}
