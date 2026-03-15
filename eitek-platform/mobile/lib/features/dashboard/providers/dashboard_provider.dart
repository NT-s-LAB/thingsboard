import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/dashboard_stats.dart';
import '../../devices/providers/devices_provider.dart';
import '../../projects/providers/projects_provider.dart';

/// Dashboard State
enum DashboardStatus { initial, loading, loaded, error }

class DashboardState {
  final DashboardStatus status;
  final DashboardStats stats;
  final String? errorMessage;
  final DateTime? lastUpdated;

  const DashboardState({
    this.status = DashboardStatus.initial,
    DashboardStats? stats,
    this.errorMessage,
    this.lastUpdated,
  }) : stats = stats ?? const _EmptyDashboardStats();

  DashboardState copyWith({
    DashboardStatus? status,
    DashboardStats? stats,
    String? errorMessage,
    DateTime? lastUpdated,
  }) {
    return DashboardState(
      status: status ?? this.status,
      stats: stats ?? this.stats,
      errorMessage: errorMessage,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }

  bool get isLoading => status == DashboardStatus.loading;
  bool get hasError => status == DashboardStatus.error;
  bool get isLoaded => status == DashboardStatus.loaded;
}

/// Placeholder empty stats used when stats is null
class _EmptyDashboardStats implements DashboardStats {
  const _EmptyDashboardStats();

  @override
  ProjectStats get projects => const ProjectStats(total: 0, active: 0);
  @override
  DeviceStats get devices => const DeviceStats(total: 0, online: 0, offline: 0);
  @override
  SiteStats get sites => const SiteStats(total: 0);
  @override
  AreaStats get areas => const AreaStats(total: 0);
  @override
  ScadaStats get scadaViews => const ScadaStats(total: 0);
  @override
  List<RecentDevice> get recentDevices => const [];
  @override
  DateTime get timestamp => DateTime.now();
}

/// Dashboard provider that aggregates data from existing providers
/// Uses existing devices and projects providers instead of a new API endpoint
final dashboardProvider = Provider<DashboardState>((ref) {
  final devicesState = ref.watch(devicesProvider);
  final projectsState = ref.watch(projectsProvider);

  // Check if still loading
  if (devicesState.isLoading || projectsState.isLoading) {
    return const DashboardState(status: DashboardStatus.loading);
  }

  // Check for errors
  if (devicesState.errorMessage != null || projectsState.errorMessage != null) {
    return DashboardState(
      status: DashboardStatus.error,
      errorMessage: devicesState.errorMessage ?? projectsState.errorMessage,
    );
  }

  // Build stats from existing data
  final devices = devicesState.devices;
  final projects = projectsState.projects;

  final recentDevices = devices.take(5).map((d) => RecentDevice(
    id: d.id,
    name: d.name,
    type: d.type,
    status: d.status,
    isOnline: d.isOnline,
    lastActivityTime: d.lastActivityTime,
    areaName: null,
  )).toList();

  final stats = DashboardStats(
    projects: ProjectStats(
      total: projects.length,
      active: projects.where((p) => p.isActive).length,
    ),
    devices: DeviceStats(
      total: devices.length,
      online: devicesState.onlineCount,
      offline: devicesState.offlineCount,
    ),
    sites: const SiteStats(total: 0), // Will be fetched if needed
    areas: const AreaStats(total: 0), // Will be fetched if needed
    scadaViews: const ScadaStats(total: 0), // Will be fetched if needed
    recentDevices: recentDevices,
    timestamp: DateTime.now(),
  );

  return DashboardState(
    status: DashboardStatus.loaded,
    stats: stats,
    lastUpdated: DateTime.now(),
  );
});

/// Convenience providers
final dashboardStatsProvider = Provider<DashboardStats>((ref) {
  return ref.watch(dashboardProvider).stats;
});

final dashboardLoadingProvider = Provider<bool>((ref) {
  return ref.watch(dashboardProvider).isLoading;
});

final dashboardErrorProvider = Provider<String?>((ref) {
  return ref.watch(dashboardProvider).errorMessage;
});
