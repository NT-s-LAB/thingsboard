import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

/// Storage Service for secure and non-secure data
class StorageService {
  final FlutterSecureStorage _secureStorage;
  late SharedPreferences _prefs;
  bool _initialized = false;

  StorageService() : _secureStorage = const FlutterSecureStorage();

  Future<void> init() async {
    if (_initialized) return;
    _prefs = await SharedPreferences.getInstance();
    _initialized = true;
  }

  // Secure Storage Methods (for tokens)
  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await _secureStorage.write(key: AppConstants.accessTokenKey, value: accessToken);
    await _secureStorage.write(key: AppConstants.refreshTokenKey, value: refreshToken);
  }

  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: AppConstants.accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: AppConstants.refreshTokenKey);
  }

  Future<void> clearAuth() async {
    await _secureStorage.delete(key: AppConstants.accessTokenKey);
    await _secureStorage.delete(key: AppConstants.refreshTokenKey);
    await _prefs.remove(AppConstants.userDataKey);
  }

  // User Data
  Future<void> saveUserData(Map<String, dynamic> userData) async {
    await _prefs.setString(AppConstants.userDataKey, jsonEncode(userData));
  }

  Map<String, dynamic>? getUserData() {
    final data = _prefs.getString(AppConstants.userDataKey);
    if (data != null) {
      return jsonDecode(data);
    }
    return null;
  }

  // Theme
  Future<void> saveThemeMode(String mode) async {
    await _prefs.setString(AppConstants.themeKey, mode);
  }

  String getThemeMode() {
    return _prefs.getString(AppConstants.themeKey) ?? 'system';
  }

  // Language
  Future<void> saveLanguage(String language) async {
    await _prefs.setString(AppConstants.languageKey, language);
  }

  String getLanguage() {
    return _prefs.getString(AppConstants.languageKey) ?? 'vi';
  }

  // Generic key-value storage
  Future<void> setString(String key, String value) async {
    await _prefs.setString(key, value);
  }

  String? getString(String key) {
    return _prefs.getString(key);
  }

  // Server Host Settings
  Future<void> saveServerHost(String host) async {
    await _prefs.setString(AppConstants.serverHostKey, host);
  }

  String getServerHost() {
    return _prefs.getString(AppConstants.serverHostKey) ?? AppConstants.defaultServerHost;
  }

  Future<void> saveServerPort(int port) async {
    await _prefs.setInt(AppConstants.serverPortKey, port);
  }

  int getServerPort() {
    return _prefs.getInt(AppConstants.serverPortKey) ?? AppConstants.defaultServerPort;
  }

  String getApiBaseUrl() {
    final host = getServerHost();
    final port = getServerPort();
    return 'http://$host:$port';
  }

  String getWsBaseUrl() {
    final host = getServerHost();
    final port = getServerPort();
    return 'ws://$host:$port';
  }

  Future<void> setBool(String key, bool value) async {
    await _prefs.setBool(key, value);
  }

  bool? getBool(String key) {
    return _prefs.getBool(key);
  }

  Future<void> remove(String key) async {
    await _prefs.remove(key);
  }

  Future<void> clear() async {
    await _prefs.clear();
    await _secureStorage.deleteAll();
  }
}

// Provider
final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});
