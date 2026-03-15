import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/storage_service.dart';
import '../providers/scada_provider.dart';
import '../providers/scada_telemetry_provider.dart';
import '../engine/scada_renderer.dart';
import '../models/scada_screen.dart';

/// SCADA Native Runtime Screen
/// 
/// Displays a SCADA view using native Flutter widgets.
/// Connects to WebSocket for realtime telemetry updates.
class ScadaNativeRuntimeScreen extends ConsumerStatefulWidget {
  final String viewId;

  const ScadaNativeRuntimeScreen({
    super.key,
    required this.viewId,
  });

  @override
  ConsumerState<ScadaNativeRuntimeScreen> createState() => _ScadaNativeRuntimeScreenState();
}

class _ScadaNativeRuntimeScreenState extends ConsumerState<ScadaNativeRuntimeScreen> {
  bool _showDebug = false;
  bool _isFullscreen = false;

  @override
  Widget build(BuildContext context) {
    final viewAsync = ref.watch(scadaViewProvider(widget.viewId));
    final telemetryState = ref.watch(scadaTelemetryProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: _isFullscreen
          ? null
          : AppBar(
              title: viewAsync.when(
                data: (view) => Text(view.name),
                loading: () => const Text('Loading...'),
                error: (_, __) => const Text('SCADA Runtime'),
              ),
              actions: [
                // Debug toggle
                IconButton(
                  icon: Icon(
                    _showDebug ? Icons.bug_report : Icons.bug_report_outlined,
                    color: _showDebug ? theme.colorScheme.primary : null,
                  ),
                  tooltip: 'Debug Info',
                  onPressed: () => setState(() => _showDebug = !_showDebug),
                ),
                // Fullscreen toggle
                IconButton(
                  icon: const Icon(Icons.fullscreen),
                  tooltip: 'Toàn màn hình',
                  onPressed: () => setState(() => _isFullscreen = !_isFullscreen),
                ),
                // Refresh
                IconButton(
                  icon: const Icon(Icons.refresh),
                  tooltip: 'Tải lại',
                  onPressed: () => ref.refresh(scadaViewProvider(widget.viewId)),
                ),
              ],
            ),
      body: viewAsync.when(
        data: (view) {
          // Check if view has screen definition
          if (!view.hasScreenDefinition) {
            return _buildNoDefinitionState(theme, view);
          }

          // Parse screen definition
          final screenDefinition = ScadaScreenParser.fromJson(view.screenDefinition!);

          // Subscribe to telemetry for this screen
          WidgetsBinding.instance.addPostFrameCallback((_) {
            ref.read(scadaTelemetryProvider.notifier).subscribeToScreen(screenDefinition);
          });

          return Stack(
            children: [
              // SCADA Renderer
              ScadaRenderer(
                screen: screenDefinition,
                telemetryData: telemetryState.data,
                showDebug: _showDebug,
                onAction: (widget, trigger, params) {
                  _handleAction(widget, trigger, params);
                },
                onSendCommand: (deviceId, key, value) {
                  ref.read(scadaTelemetryProvider.notifier).sendCommand(
                    deviceId,
                    key,
                    value,
                  );
                },
              ),

              // Connection status indicator
              Positioned(
                bottom: 8,
                right: 8,
                child: _buildConnectionIndicator(telemetryState.isConnected),
              ),

              // Exit fullscreen button
              if (_isFullscreen)
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  right: 8,
                  child: IconButton(
                    icon: const Icon(Icons.fullscreen_exit, color: Colors.white),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.black54,
                    ),
                    onPressed: () => setState(() => _isFullscreen = false),
                  ),
                ),
            ],
          );
        },
        loading: () => _buildLoadingState(theme),
        error: (error, stack) => _buildErrorState(theme, error),
      ),
    );
  }

  Widget _buildLoadingState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(
            'Đang tải SCADA...',
            style: theme.textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(ThemeData theme, Object error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: theme.colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Không thể tải SCADA View',
              style: theme.textTheme.titleMedium?.copyWith(
                color: theme.colorScheme.error,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error.toString(),
              style: theme.textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => ref.refresh(scadaViewProvider(widget.viewId)),
              icon: const Icon(Icons.refresh),
              label: const Text('Thử lại'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoDefinitionState(ThemeData theme, dynamic view) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.warning_amber_rounded,
              size: 64,
              color: theme.colorScheme.secondary,
            ),
            const SizedBox(height: 16),
            Text(
              'SCADA chưa có màn hình',
              style: theme.textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'View "${view.name}" chưa có screen definition.\n'
              'Vui lòng thiết kế màn hình SCADA trên web.',
              style: theme.textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            // Demo button to show mock data
            OutlinedButton.icon(
              onPressed: () => _loadDemoScreen(),
              icon: const Icon(Icons.play_arrow),
              label: const Text('Xem Demo'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConnectionIndicator(bool isConnected) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black54,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isConnected ? Colors.green : Colors.red,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            isConnected ? 'Live' : 'Offline',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }

  void _handleAction(
    ScadaWidgetInstance widget,
    String trigger,
    Map<String, dynamic> params,
  ) {
    // Log action for debugging
    debugPrint('SCADA Action: ${widget.name} -> $trigger ($params)');

    // Show snackbar for user feedback
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${widget.name}: $trigger'),
        duration: const Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _loadDemoScreen() {
    // Load demo telemetry data
    ref.read(scadaTelemetryProvider.notifier).updateData({
      'temperature': 25.5,
      'humidity': 65.0,
      'pressure': 1013.25,
      'pump1_state': 'running',
      'pump2_state': 'stopped',
      'valve1_state': 'open',
      'valve2_state': 'closed',
      'tank_level': 75.5,
      'motor_rpm': 1450,
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Demo data loaded'),
        duration: Duration(seconds: 2),
      ),
    );
  }
}
