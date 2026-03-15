import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/device.dart';
import '../../../data/repositories/device_repository.dart';

/// Devices State
class DevicesState {
  final List<Device> devices;
  final bool isLoading;
  final bool hasMore;
  final int currentPage;
  final String? errorMessage;
  final String? statusFilter;

  const DevicesState({
    this.devices = const [],
    this.isLoading = false,
    this.hasMore = true,
    this.currentPage = 1,
    this.errorMessage,
    this.statusFilter,
  });

  DevicesState copyWith({
    List<Device>? devices,
    bool? isLoading,
    bool? hasMore,
    int? currentPage,
    String? errorMessage,
    String? statusFilter,
  }) {
    return DevicesState(
      devices: devices ?? this.devices,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      errorMessage: errorMessage,
      statusFilter: statusFilter ?? this.statusFilter,
    );
  }

  int get onlineCount => devices.where((d) => d.isOnline).length;
  int get offlineCount => devices.where((d) => d.isOffline).length;
}

/// Devices Notifier
class DevicesNotifier extends StateNotifier<DevicesState> {
  final DeviceRepository _repository;

  DevicesNotifier(this._repository) : super(const DevicesState()) {
    loadDevices();
  }

  Future<void> loadDevices({bool refresh = false}) async {
    if (state.isLoading) return;
    
    final page = refresh ? 1 : state.currentPage;
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final devices = await _repository.getDevices(
        page: page,
        status: state.statusFilter,
      );
      
      state = state.copyWith(
        devices: refresh ? devices : [...state.devices, ...devices],
        isLoading: false,
        hasMore: devices.length >= 20,
        currentPage: page + 1,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Không thể tải danh sách thiết bị',
      );
    }
  }

  Future<void> refresh() async {
    await loadDevices(refresh: true);
  }

  Future<void> loadMore() async {
    if (!state.hasMore || state.isLoading) return;
    await loadDevices();
  }

  void setStatusFilter(String? status) {
    state = state.copyWith(statusFilter: status, devices: [], currentPage: 1);
    loadDevices();
  }

  void updateDeviceStatus(String deviceId, String status) {
    state = state.copyWith(
      devices: state.devices.map((d) {
        if (d.id == deviceId) {
          return d.copyWith(status: status);
        }
        return d;
      }).toList(),
    );
  }

  void updateDeviceTelemetry(String deviceId, Map<String, dynamic> telemetry) {
    state = state.copyWith(
      devices: state.devices.map((d) {
        if (d.id == deviceId) {
          return d.copyWith(latestTelemetry: telemetry);
        }
        return d;
      }).toList(),
    );
  }
}

/// Provider
final devicesProvider = StateNotifierProvider<DevicesNotifier, DevicesState>((ref) {
  final repository = ref.watch(deviceRepositoryProvider);
  return DevicesNotifier(repository);
});

/// Single device provider
final deviceProvider = FutureProvider.family<Device?, String>((ref, id) async {
  final repository = ref.watch(deviceRepositoryProvider);
  try {
    return await repository.getDevice(id);
  } catch (e) {
    return null;
  }
});

/// Device telemetry provider
final deviceTelemetryProvider = FutureProvider.family<Map<String, dynamic>?, String>((ref, id) async {
  final repository = ref.watch(deviceRepositoryProvider);
  try {
    return await repository.getDeviceTelemetry(id);
  } catch (e) {
    return null;
  }
});
