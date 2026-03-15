import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../providers/devices_provider.dart';
import '../../../data/repositories/device_repository.dart';

class DeviceDetailScreen extends ConsumerStatefulWidget {
  final String deviceId;

  const DeviceDetailScreen({super.key, required this.deviceId});

  @override
  ConsumerState<DeviceDetailScreen> createState() => _DeviceDetailScreenState();
}

class _DeviceDetailScreenState extends ConsumerState<DeviceDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final deviceAsync = ref.watch(deviceProvider(widget.deviceId));

    return deviceAsync.when(
      loading: () => const Scaffold(body: LoadingWidget()),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: Center(child: Text('Lỗi: $e')),
      ),
      data: (device) {
        if (device == null) {
          return Scaffold(
            appBar: AppBar(),
            body: const Center(child: Text('Không tìm thấy thiết bị')),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: Text(device.name),
            actions: [
              IconButton(
                icon: const Icon(Icons.edit),
                onPressed: () {
                  // TODO: Edit device
                },
              ),
              PopupMenuButton(
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'refresh',
                    child: Row(
                      children: [
                        Icon(Icons.refresh),
                        SizedBox(width: 8),
                        Text('Làm mới'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete, color: AppColors.error),
                        SizedBox(width: 8),
                        Text('Xóa', style: TextStyle(color: AppColors.error)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
            bottom: TabBar(
              controller: _tabController,
              tabs: const [
                Tab(text: 'Tổng quan'),
                Tab(text: 'Telemetry'),
                Tab(text: 'Điều khiển'),
              ],
            ),
          ),
          body: TabBarView(
            controller: _tabController,
            children: [
              _OverviewTab(device: device),
              _TelemetryTab(deviceId: widget.deviceId),
              _ControlTab(deviceId: widget.deviceId),
            ],
          ),
        );
      },
    );
  }
}

class _OverviewTab extends StatelessWidget {
  final dynamic device;

  const _OverviewTab({required this.device});

  @override
  Widget build(BuildContext context) {
    final isOnline = device.status == 'ONLINE';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: (isOnline ? AppColors.online : AppColors.offline)
                          .withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      isOnline ? Icons.check_circle : Icons.cancel,
                      color: isOnline ? AppColors.online : AppColors.offline,
                      size: 36,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isOnline ? 'Đang hoạt động' : 'Ngắt kết nối',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: isOnline ? AppColors.online : AppColors.offline,
                          ),
                        ),
                        if (device.lastActivityTime != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Hoạt động lần cuối: ${_formatTime(device.lastActivityTime!)}',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Device Info
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Thông tin thiết bị',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _InfoRow(label: 'Tên', value: device.name),
                  _InfoRow(label: 'Loại', value: device.type),
                  if (device.description != null)
                    _InfoRow(label: 'Mô tả', value: device.description!),
                  if (device.tbDeviceId != null)
                    _InfoRow(label: 'TB Device ID', value: device.tbDeviceId!),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Attributes
          if (device.attributes != null && device.attributes!.isNotEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Thuộc tính',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ...device.attributes!.entries.map((e) =>
                        _InfoRow(label: e.key, value: e.value.toString())),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 1) {
      return 'Vừa xong';
    } else if (diff.inHours < 1) {
      return '${diff.inMinutes} phút trước';
    } else if (diff.inDays < 1) {
      return '${diff.inHours} giờ trước';
    } else {
      return '${diff.inDays} ngày trước';
    }
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}

class _TelemetryTab extends ConsumerWidget {
  final String deviceId;

  const _TelemetryTab({required this.deviceId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final telemetryAsync = ref.watch(deviceTelemetryProvider(deviceId));

    return telemetryAsync.when(
      loading: () => const LoadingWidget(),
      error: (e, _) => Center(child: Text('Lỗi: $e')),
      data: (telemetry) {
        if (telemetry == null || telemetry.isEmpty) {
          return const Center(
            child: Text('Không có dữ liệu telemetry'),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: telemetry.length,
          itemBuilder: (context, index) {
            final key = telemetry.keys.elementAt(index);
            final value = telemetry[key];

            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  child: const Icon(
                    Icons.show_chart,
                    color: AppColors.primary,
                  ),
                ),
                title: Text(key),
                subtitle: Text(
                  value.toString(),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                trailing: IconButton(
                  icon: const Icon(Icons.timeline),
                  onPressed: () {
                    // TODO: Show history chart
                  },
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _ControlTab extends ConsumerWidget {
  final String deviceId;

  const _ControlTab({required this.deviceId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Điều khiển thiết bị',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        // Example control buttons
        _ControlButton(
          icon: Icons.power_settings_new,
          label: 'Bật/Tắt',
          onPressed: () => _sendRpc(ref, 'setPower', {'power': true}),
        ),
        _ControlButton(
          icon: Icons.refresh,
          label: 'Reset',
          onPressed: () => _sendRpc(ref, 'reset', {}),
        ),
        _ControlButton(
          icon: Icons.flash_on,
          label: 'Kiểm tra',
          onPressed: () => _sendRpc(ref, 'test', {}),
        ),
      ],
    );
  }

  void _sendRpc(WidgetRef ref, String method, Map<String, dynamic> params) {
    final repository = ref.read(deviceRepositoryProvider);
    repository.sendRpcCommand(deviceId, method, params);
    ScaffoldMessenger.of(ref.context).showSnackBar(
      SnackBar(content: Text('Đã gửi lệnh: $method')),
    );
  }
}

class _ControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  const _ControlButton({
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppColors.secondary.withValues(alpha: 0.1),
          child: Icon(icon, color: AppColors.secondary),
        ),
        title: Text(label),
        trailing: ElevatedButton(
          onPressed: onPressed,
          child: const Text('Thực hiện'),
        ),
      ),
    );
  }
}
