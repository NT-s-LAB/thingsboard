/// Dashboard statistics model
/// Contains summary data for the dashboard view
class DashboardStats {
  final ProjectStats projects;
  final DeviceStats devices;
  final SiteStats sites;
  final AreaStats areas;
  final ScadaStats scadaViews;
  final List<RecentDevice> recentDevices;
  final DateTime timestamp;

  const DashboardStats({
    required this.projects,
    required this.devices,
    required this.sites,
    required this.areas,
    required this.scadaViews,
    required this.recentDevices,
    required this.timestamp,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      projects: ProjectStats.fromJson(json['projects'] ?? {}),
      devices: DeviceStats.fromJson(json['devices'] ?? {}),
      sites: SiteStats.fromJson(json['sites'] ?? {}),
      areas: AreaStats.fromJson(json['areas'] ?? {}),
      scadaViews: ScadaStats.fromJson(json['scadaViews'] ?? {}),
      recentDevices: (json['recentDevices'] as List<dynamic>?)
              ?.map((e) => RecentDevice.fromJson(e))
              .toList() ??
          [],
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
    );
  }

  /// Creates empty stats for initial/loading state
  factory DashboardStats.empty() {
    return DashboardStats(
      projects: const ProjectStats(total: 0, active: 0),
      devices: const DeviceStats(total: 0, online: 0, offline: 0),
      sites: const SiteStats(total: 0),
      areas: const AreaStats(total: 0),
      scadaViews: const ScadaStats(total: 0),
      recentDevices: const [],
      timestamp: DateTime.now(),
    );
  }
}

/// Project statistics
class ProjectStats {
  final int total;
  final int active;

  const ProjectStats({
    required this.total,
    required this.active,
  });

  int get inactive => total - active;

  factory ProjectStats.fromJson(Map<String, dynamic> json) {
    return ProjectStats(
      total: json['total'] ?? 0,
      active: json['active'] ?? 0,
    );
  }
}

/// Device statistics
class DeviceStats {
  final int total;
  final int online;
  final int offline;

  const DeviceStats({
    required this.total,
    required this.online,
    required this.offline,
  });

  double get onlinePercentage => total > 0 ? (online / total) * 100 : 0;

  factory DeviceStats.fromJson(Map<String, dynamic> json) {
    return DeviceStats(
      total: json['total'] ?? 0,
      online: json['online'] ?? 0,
      offline: json['offline'] ?? 0,
    );
  }
}

/// Site statistics
class SiteStats {
  final int total;

  const SiteStats({required this.total});

  factory SiteStats.fromJson(Map<String, dynamic> json) {
    return SiteStats(
      total: json['total'] ?? 0,
    );
  }
}

/// Area statistics
class AreaStats {
  final int total;

  const AreaStats({required this.total});

  factory AreaStats.fromJson(Map<String, dynamic> json) {
    return AreaStats(
      total: json['total'] ?? 0,
    );
  }
}

/// SCADA view statistics
class ScadaStats {
  final int total;

  const ScadaStats({required this.total});

  factory ScadaStats.fromJson(Map<String, dynamic> json) {
    return ScadaStats(
      total: json['total'] ?? 0,
    );
  }
}

/// Simplified device info for recent devices list
class RecentDevice {
  final String id;
  final String name;
  final String type;
  final String status;
  final bool isOnline;
  final DateTime? lastActivityTime;
  final String? areaName;

  const RecentDevice({
    required this.id,
    required this.name,
    required this.type,
    required this.status,
    required this.isOnline,
    this.lastActivityTime,
    this.areaName,
  });

  factory RecentDevice.fromJson(Map<String, dynamic> json) {
    return RecentDevice(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? 'default',
      status: json['status'] ?? 'OFFLINE',
      isOnline: json['isOnline'] ?? false,
      lastActivityTime: json['lastActivityTime'] != null
          ? DateTime.parse(json['lastActivityTime'])
          : null,
      areaName: json['areaName'],
    );
  }
}
