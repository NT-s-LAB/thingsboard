import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:developer' as developer;
import '../../../data/models/user.dart';
import '../../../data/repositories/auth_repository.dart';

/// Auth State
enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AuthState {
  final AuthStatus status;
  final User? user;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.errorMessage,
  });

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
}

/// Auth Notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(const AuthState()) {
    checkAuth();
  }

  Future<void> checkAuth() async {
    state = state.copyWith(status: AuthStatus.loading);
    
    try {
      final isAuthenticated = await _repository.checkAuthStatus();
      if (isAuthenticated) {
        final user = await _repository.getProfile();
        if (user != null) {
          state = AuthState(status: AuthStatus.authenticated, user: user);
        } else {
          state = const AuthState(status: AuthStatus.unauthenticated);
        }
      } else {
        state = const AuthState(status: AuthStatus.unauthenticated);
      }
    } catch (e) {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    developer.log('🔐 Login attempt: $email', name: 'AUTH');

    try {
      final response = await _repository.login(email, password);
      developer.log('✅ Login success: ${response.user.email}', name: 'AUTH');
      state = AuthState(status: AuthStatus.authenticated, user: response.user);
      return true;
    } catch (e, stackTrace) {
      developer.log('❌ Login error: $e', name: 'AUTH', error: e, stackTrace: stackTrace);
      String message = 'Đăng nhập thất bại: $e';
      if (e.toString().contains('401')) {
        message = 'Email hoặc mật khẩu không đúng';
      } else if (e.toString().contains('network') || e.toString().contains('SocketException')) {
        message = 'Lỗi kết nối mạng';
      } else if (e.toString().contains('Connection refused')) {
        message = 'Không thể kết nối đến server';
      }
      state = AuthState(status: AuthStatus.error, errorMessage: message);
      return false;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      await _repository.logout();
    } finally {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    try {
      final user = await _repository.updateProfile(data);
      state = state.copyWith(user: user);
    } catch (e) {
      // Handle error
    }
  }
}

/// Provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return AuthNotifier(repository);
});

/// Convenience providers
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isAuthenticated;
});

final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authProvider).user;
});
