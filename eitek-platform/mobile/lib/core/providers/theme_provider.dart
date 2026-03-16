import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/storage_service.dart';

/// Theme mode state
enum AppThemeMode {
  light,
  dark,
  system,
}

/// Theme state class
class ThemeState {
  final AppThemeMode themeMode;
  final bool isDark;

  const ThemeState({
    required this.themeMode,
    required this.isDark,
  });

  ThemeMode get flutterThemeMode {
    switch (themeMode) {
      case AppThemeMode.light:
        return ThemeMode.light;
      case AppThemeMode.dark:
        return ThemeMode.dark;
      case AppThemeMode.system:
        return ThemeMode.system;
    }
  }

  ThemeState copyWith({
    AppThemeMode? themeMode,
    bool? isDark,
  }) {
    return ThemeState(
      themeMode: themeMode ?? this.themeMode,
      isDark: isDark ?? this.isDark,
    );
  }
}

/// Theme notifier for managing app theme
class ThemeNotifier extends StateNotifier<ThemeState> {
  final StorageService _storage;

  ThemeNotifier(this._storage)
      : super(const ThemeState(
          themeMode: AppThemeMode.system,
          isDark: false,
        )) {
    _loadTheme();
  }

  /// Load saved theme from storage
  Future<void> _loadTheme() async {
    final savedTheme = _storage.getThemeMode();
    final mode = _parseThemeMode(savedTheme);
    state = state.copyWith(themeMode: mode);
  }

  /// Parse string to AppThemeMode
  AppThemeMode _parseThemeMode(String value) {
    switch (value) {
      case 'light':
        return AppThemeMode.light;
      case 'dark':
        return AppThemeMode.dark;
      default:
        return AppThemeMode.system;
    }
  }

  /// Set theme mode
  Future<void> setThemeMode(AppThemeMode mode) async {
    await _storage.saveThemeMode(mode.name);
    state = state.copyWith(themeMode: mode);
  }

  /// Toggle between light and dark
  Future<void> toggleTheme() async {
    final newMode = state.themeMode == AppThemeMode.dark
        ? AppThemeMode.light
        : AppThemeMode.dark;
    await setThemeMode(newMode);
  }

  /// Set dark mode based on system brightness
  void updateSystemBrightness(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    state = state.copyWith(isDark: isDark);
  }

  /// Check if currently in dark mode
  bool get isDarkMode {
    if (state.themeMode == AppThemeMode.system) {
      return state.isDark;
    }
    return state.themeMode == AppThemeMode.dark;
  }
}

/// Theme provider
final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeState>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return ThemeNotifier(storage);
});

/// Convenience provider to check if dark mode is active
final isDarkModeProvider = Provider<bool>((ref) {
  // Watch the theme state to trigger rebuild on changes
  ref.watch(themeProvider);
  return ref.read(themeProvider.notifier).isDarkMode;
});
