import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../models/dashboard_stats.dart';
import 'stats_card.dart';

/// Statistics overview grid widget
/// Shows all main statistics in a 2x2 grid
class StatsOverview extends StatelessWidget {
  final DashboardStats stats;
  final bool isLoading;

  const StatsOverview({
    super.key,
    required this.stats,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.3,
        children: const [
          StatsCardSkeleton(),
          StatsCardSkeleton(),
          StatsCardSkeleton(),
          StatsCardSkeleton(),
        ],
      );
    }

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.3,
      children: [
        StatsCard(
          icon: Icons.folder_outlined,
          label: 'Dự án',
          value: stats.projects.total.toString(),
          subtitle: '${stats.projects.active} đang hoạt động',
          color: AppColors.primary,
          onTap: () => context.push('/projects'),
        ),
        StatsCard(
          icon: Icons.devices,
          label: 'Thiết bị',
          value: stats.devices.total.toString(),
          subtitle: '${stats.devices.online} online',
          color: AppColors.secondary,
          onTap: () => context.push('/devices'),
        ),
        StatsCard(
          icon: Icons.check_circle_outline,
          label: 'Online',
          value: stats.devices.online.toString(),
          subtitle: _getOnlinePercentage(),
          color: AppColors.online,
          onTap: () => context.push('/devices?status=ONLINE'),
        ),
        StatsCard(
          icon: Icons.cancel_outlined,
          label: 'Offline',
          value: stats.devices.offline.toString(),
          subtitle: stats.devices.offline > 0 ? 'Cần kiểm tra' : 'Tốt',
          color: AppColors.offline,
          onTap: () => context.push('/devices?status=OFFLINE'),
        ),
      ],
    );
  }

  String _getOnlinePercentage() {
    final percentage = stats.devices.onlinePercentage;
    if (percentage == 0 && stats.devices.total == 0) {
      return 'Chưa có thiết bị';
    }
    return '${percentage.toStringAsFixed(1)}% tổng số';
  }
}
