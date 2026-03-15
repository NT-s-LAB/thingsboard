import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/empty_widget.dart';
import '../providers/devices_provider.dart';

class DevicesScreen extends ConsumerWidget {
  const DevicesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(devicesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thiết bị'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              // TODO: Implement search
            },
          ),
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () => _showFilterSheet(context, ref),
          ),
        ],
      ),
      body: Column(
        children: [
          // Status Summary
          _StatusSummary(state: state),
          // Device List
          Expanded(
            child: _buildBody(context, ref, state),
          ),
        ],
      ),
    );
  }

  void _showFilterSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      builder: (context) => _FilterSheet(ref: ref),
    );
  }

  Widget _buildBody(BuildContext context, WidgetRef ref, DevicesState state) {
    if (state.isLoading && state.devices.isEmpty) {
      return const LoadingWidget();
    }

    if (state.errorMessage != null && state.devices.isEmpty) {
      return AppErrorWidget(
        message: state.errorMessage!,
        onRetry: () => ref.read(devicesProvider.notifier).refresh(),
      );
    }

    if (state.devices.isEmpty) {
      return EmptyWidget(
        icon: Icons.devices_other,
        title: 'Không có thiết bị',
        subtitle: 'Thêm thiết bị mới để bắt đầu giám sát',
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(devicesProvider.notifier).refresh(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: state.devices.length + (state.hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == state.devices.length) {
            ref.read(devicesProvider.notifier).loadMore();
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            );
          }

          final device = state.devices[index];
          return _DeviceCard(
            device: device,
            onTap: () => context.push('/devices/${device.id}'),
          );
        },
      ),
    );
  }
}

class _StatusSummary extends StatelessWidget {
  final DevicesState state;

  const _StatusSummary({required this.state});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _StatusChip(
              icon: Icons.check_circle,
              label: 'Online',
              count: state.onlineCount,
              color: AppColors.online,
            ),
          ),
          Expanded(
            child: _StatusChip(
              icon: Icons.cancel,
              label: 'Offline',
              count: state.offlineCount,
              color: AppColors.offline,
            ),
          ),
          Expanded(
            child: _StatusChip(
              icon: Icons.devices,
              label: 'Tổng',
              count: state.devices.length,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final int count;
  final Color color;

  const _StatusChip({
    required this.icon,
    required this.label,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 4),
        Text(
          count.toString(),
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}

class _DeviceCard extends StatelessWidget {
  final dynamic device;
  final VoidCallback onTap;

  const _DeviceCard({
    required this.device,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isOnline = device.status == 'ONLINE';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Device Icon with Status
              Stack(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: (isOnline ? AppColors.online : AppColors.offline)
                          .withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      _getDeviceIcon(device.type),
                      color: isOnline ? AppColors.online : AppColors.offline,
                      size: 28,
                    ),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: isOnline ? AppColors.online : AppColors.offline,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 12),
              // Device Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      device.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      device.type,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    if (device.latestTelemetry != null) ...[
                      const SizedBox(height: 8),
                      _TelemetryPreview(telemetry: device.latestTelemetry!),
                    ],
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: AppColors.textLight,
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getDeviceIcon(String type) {
    switch (type.toLowerCase()) {
      case 'sensor':
        return Icons.sensors;
      case 'controller':
        return Icons.memory;
      case 'gateway':
        return Icons.router;
      case 'camera':
        return Icons.videocam;
      default:
        return Icons.device_hub;
    }
  }
}

class _TelemetryPreview extends StatelessWidget {
  final Map<String, dynamic> telemetry;

  const _TelemetryPreview({required this.telemetry});

  @override
  Widget build(BuildContext context) {
    final entries = telemetry.entries.take(3).toList();
    return Wrap(
      spacing: 8,
      runSpacing: 4,
      children: entries.map((e) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            '${e.key}: ${e.value}',
            style: TextStyle(
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _FilterSheet extends StatelessWidget {
  final WidgetRef ref;

  const _FilterSheet({required this.ref});

  @override
  Widget build(BuildContext context) {
    final currentFilter = ref.watch(devicesProvider).statusFilter;

    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Lọc theo trạng thái',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          ListTile(
            leading: const Icon(Icons.all_inclusive),
            title: const Text('Tất cả'),
            trailing: currentFilter == null
                ? const Icon(Icons.check, color: AppColors.primary)
                : null,
            onTap: () {
              ref.read(devicesProvider.notifier).setStatusFilter(null);
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.check_circle, color: AppColors.online),
            title: const Text('Online'),
            trailing: currentFilter == 'ONLINE'
                ? const Icon(Icons.check, color: AppColors.primary)
                : null,
            onTap: () {
              ref.read(devicesProvider.notifier).setStatusFilter('ONLINE');
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.cancel, color: AppColors.offline),
            title: const Text('Offline'),
            trailing: currentFilter == 'OFFLINE'
                ? const Icon(Icons.check, color: AppColors.primary)
                : null,
            onTap: () {
              ref.read(devicesProvider.notifier).setStatusFilter('OFFLINE');
              Navigator.pop(context);
            },
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
