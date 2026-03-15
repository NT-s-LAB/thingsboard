import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/projects/screens/projects_screen.dart';
import '../../features/devices/screens/devices_screen.dart';
import '../../features/devices/screens/device_detail_screen.dart';
import '../../features/settings/screens/settings_screen.dart';
import '../../shared/widgets/main_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/login',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isLoading = authState.status == AuthStatus.initial || 
                        authState.status == AuthStatus.loading;
      final isLoginRoute = state.uri.path == '/login';

      // Still checking auth status
      if (isLoading) {
        return null;
      }

      // Not authenticated and not on login page
      if (!isAuthenticated && !isLoginRoute) {
        return '/login';
      }

      // Authenticated and on login page
      if (isAuthenticated && isLoginRoute) {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      // Login Route
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),

      // Main Shell with Bottom Navigation
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          // Dashboard
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),

          // Projects
          GoRoute(
            path: '/projects',
            builder: (context, state) => const ProjectsScreen(),
            routes: [
              GoRoute(
                path: 'new',
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('Tạo dự án mới')),
                ),
              ),
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final id = state.pathParameters['id']!;
                  return Scaffold(
                    appBar: AppBar(title: const Text('Chi tiết dự án')),
                    body: Center(child: Text('Project: $id')),
                  );
                },
              ),
            ],
          ),

          // Devices
          GoRoute(
            path: '/devices',
            builder: (context, state) => const DevicesScreen(),
            routes: [
              GoRoute(
                path: 'new',
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('Thêm thiết bị mới')),
                ),
              ),
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final id = state.pathParameters['id']!;
                  return DeviceDetailScreen(deviceId: id);
                },
              ),
            ],
          ),

          // Settings
          GoRoute(
            path: '/settings',
            builder: (context, state) => const SettingsScreen(),
            routes: [
              GoRoute(
                path: 'profile',
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('Hồ sơ cá nhân')),
                ),
              ),
              GoRoute(
                path: 'change-password',
                builder: (context, state) => const Scaffold(
                  body: Center(child: Text('Đổi mật khẩu')),
                ),
              ),
            ],
          ),

          // SCADA
          GoRoute(
            path: '/scada',
            builder: (context, state) => Scaffold(
              appBar: AppBar(title: const Text('SCADA')),
              body: const Center(child: Text('SCADA Views')),
            ),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Không tìm thấy trang: ${state.uri.path}'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/dashboard'),
              child: const Text('Về trang chủ'),
            ),
          ],
        ),
      ),
    ),
  );
});
