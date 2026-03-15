import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../data/models/scada_view.dart';
import '../providers/scada_provider.dart';

/// SCADA List Screen
/// 
/// Displays a list of available SCADA views.
/// Tapping a view opens it in WebView for realtime monitoring.
class ScadaListScreen extends ConsumerWidget {
  const ScadaListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(scadaViewsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('SCADA Views'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(scadaViewsProvider.notifier).refresh(),
          ),
        ],
      ),
      body: _buildBody(context, ref, state, theme),
    );
  }

  Widget _buildBody(
    BuildContext context, 
    WidgetRef ref, 
    ScadaViewsState state, 
    ThemeData theme,
  ) {
    if (state.isLoading && state.views.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.errorMessage != null && state.views.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: theme.colorScheme.error),
            const SizedBox(height: 16),
            Text(state.errorMessage!, style: theme.textTheme.bodyLarge),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => ref.read(scadaViewsProvider.notifier).refresh(),
              icon: const Icon(Icons.refresh),
              label: const Text('Thử lại'),
            ),
          ],
        ),
      );
    }

    if (state.views.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.dashboard_outlined, size: 80, color: theme.colorScheme.outline),
            const SizedBox(height: 16),
            Text(
              'Chưa có SCADA View nào',
              style: theme.textTheme.titleMedium?.copyWith(
                color: theme.colorScheme.outline,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Tạo SCADA View trên web để hiển thị ở đây',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.outline,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(scadaViewsProvider.notifier).refresh(),
      child: Column(
        children: [
          // Info banner about screen sizes
          _buildInfoBanner(context, state, theme),
          
          // List of SCADA views
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: state.views.length + (state.hasMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index >= state.views.length) {
                  // Load more indicator
                  ref.read(scadaViewsProvider.notifier).loadMore();
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                return _ScadaViewCard(view: state.views[index]);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoBanner(BuildContext context, ScadaViewsState state, ThemeData theme) {
    final mobileCount = state.mobileCount;
    final totalCount = state.totalCount;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: theme.colorScheme.primary.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.info_outline,
            color: theme.colorScheme.primary,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              mobileCount > 0
                  ? '$mobileCount/$totalCount views được tối ưu cho mobile (≤480px)'
                  : 'Các views sẽ tự động scale để fit màn hình',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// SCADA View Card Widget
class _ScadaViewCard extends ConsumerWidget {
  final ScadaView view;

  const _ScadaViewCard({required this.view});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => context.push('/scada/${view.id}'),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Icon
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _getIcon(view.icon),
                  color: theme.colorScheme.primary,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      view.name,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (view.description != null && view.description!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        view.description!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.outline,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 8),
                    // Tags
                    Row(
                      children: [
                        _buildTag(
                          context,
                          view.screenTypeLabel,
                          view.isMobileOptimized 
                              ? Colors.green 
                              : Colors.orange,
                        ),
                        if (view.canvasSize != null) ...[
                          const SizedBox(width: 8),
                          _buildTag(
                            context,
                            view.canvasSize!.displaySize,
                            theme.colorScheme.outline,
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              
              // Arrow
              Icon(
                Icons.chevron_right,
                color: theme.colorScheme.outline,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTag(BuildContext context, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  IconData _getIcon(String? iconName) {
    switch (iconName?.toLowerCase()) {
      case 'factory':
        return Icons.factory;
      case 'water':
        return Icons.water_drop;
      case 'power':
      case 'electric':
        return Icons.electric_bolt;
      case 'hvac':
      case 'air':
        return Icons.air;
      case 'solar':
        return Icons.solar_power;
      case 'pump':
        return Icons.water;
      case 'tank':
        return Icons.propane_tank;
      default:
        return Icons.dashboard;
    }
  }
}
