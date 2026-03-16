import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:developer' as developer;
import '../../core/services/api_client.dart';
import '../../core/services/storage_service.dart';
import '../../core/constants/api_endpoints.dart';
import '../../core/constants/app_constants.dart';
import '../models/user.dart';

/// Auth Repository
class AuthRepository {
  final ApiClient _apiClient;
  final StorageService _storage;

  AuthRepository(this._apiClient, this._storage);

  Future<AuthResponse> login(String email, String password) async {
    developer.log('📡 API Base URL: ${AppConstants.apiBaseUrl}', name: 'AUTH');
    developer.log('📡 Calling: ${ApiEndpoints.login}', name: 'AUTH');
    
    final response = await _apiClient.post(
      ApiEndpoints.login,
      data: {'email': email, 'password': password},
    );

    developer.log('📡 Response status: ${response.statusCode}', name: 'AUTH');
    developer.log('📡 Response data: ${response.data}', name: 'AUTH');

    // API returns wrapper: {success, statusCode, data: {...}}
    final responseData = response.data is Map && response.data['data'] != null
        ? response.data['data']
        : response.data;
    final authResponse = AuthResponse.fromJson(responseData);
    
    // Save tokens and user data
    await _storage.saveTokens(
      authResponse.accessToken,
      authResponse.refreshToken,
    );
    await _storage.saveUserData(authResponse.user.toJson());

    return authResponse;
  }

  Future<void> logout() async {
    try {
      await _apiClient.post(ApiEndpoints.logout);
    } finally {
      await _storage.clearAuth();
    }
  }

  Future<User?> getProfile() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.profile);
      return User.fromJson(response.data);
    } catch (e) {
      return null;
    }
  }

  Future<User> updateProfile(Map<String, dynamic> data) async {
    final response = await _apiClient.patch(ApiEndpoints.profile, data: data);
    final user = User.fromJson(response.data);
    await _storage.saveUserData(user.toJson());
    return user;
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    await _apiClient.post(ApiEndpoints.changePassword, data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  Future<bool> checkAuthStatus() async {
    final token = await _storage.getAccessToken();
    return token != null;
  }

  User? getCachedUser() {
    final userData = _storage.getUserData();
    if (userData != null) {
      return User.fromJson(userData);
    }
    return null;
  }
}

// Provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final storage = ref.watch(storageServiceProvider);
  return AuthRepository(apiClient, storage);
});
