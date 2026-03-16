import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/scada_provider.dart';
import '../providers/scada_telemetry_provider.dart';
import '../engine/scada_renderer.dart';
import '../models/scada_screen.dart';

/// SCADA Native Runtime Screen
/// 
/// Displays a SCADA view using native Flutter widgets.
/// Supports multi-page navigation with events.
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
  
  // Multi-page navigation state
  String? _currentPageId;
  String? _homePageId;
  List<Map<String, dynamic>> _pages = [];
  final List<String> _navigationStack = [];  // For goBack support
  final List<String> _popupStack = [];  // For popup overlay support

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

          // Check for multi-page project structure
          final screenDef = view.screenDefinition!;
          debugPrint('[SCADA-RUNTIME] screenDef keys: ${screenDef.keys.toList()}');
          debugPrint('[SCADA-RUNTIME] pages: ${screenDef['pages']?.runtimeType}');
          
          // Initialize multi-page state if needed
          if (screenDef['pages'] is List) {
            debugPrint('[SCADA-RUNTIME] Multi-page project detected!');
            _initializeMultiPageProject(screenDef);
            return _buildMultiPageView(screenDef, telemetryState, theme);
          }

          debugPrint('[SCADA-RUNTIME] Single page mode');
          // Single page mode (legacy)
          final screenDefinition = ScadaScreenParser.fromJson(screenDef);
          
          // Subscribe to telemetry for this screen
          WidgetsBinding.instance.addPostFrameCallback((_) {
            ref.read(scadaTelemetryProvider.notifier).subscribeToScreen(screenDefinition);
          });

          return _buildSinglePageView(screenDefinition, telemetryState);
        },
        loading: () => _buildLoadingState(theme),
        error: (error, stack) => _buildErrorState(theme, error),
      ),
    );
  }

  /// Initialize multi-page project state
  void _initializeMultiPageProject(Map<String, dynamic> screenDef) {
    debugPrint('[SCADA-RUNTIME] _initializeMultiPageProject');
    if (_pages.isEmpty || _homePageId != screenDef['homePageId']) {
      _pages = (screenDef['pages'] as List)
          .whereType<Map>()
          .map((p) => Map<String, dynamic>.from(p))
          .toList();
      _homePageId = screenDef['homePageId'] as String?;
      debugPrint('[SCADA-RUNTIME] Pages: ${_pages.length}, homePageId: $_homePageId');
      
      // Start on home page
      if (_currentPageId == null && _homePageId != null) {
        _currentPageId = _homePageId;
      } else if (_currentPageId == null && _pages.isNotEmpty) {
        _currentPageId = _pages.first['id'] as String?;
      }
      debugPrint('[SCADA-RUNTIME] Current page: $_currentPageId');
    }
  }

  /// Build view for multi-page project
  Widget _buildMultiPageView(
    Map<String, dynamic> screenDef,
    ScadaTelemetryState telemetryState,
    ThemeData theme,
  ) {
    debugPrint('[SCADA-RUNTIME] _buildMultiPageView, currentPage: $_currentPageId');
    // Find current page
    final currentPage = _pages.firstWhere(
      (p) => p['id'] == _currentPageId,
      orElse: () => _pages.isNotEmpty ? _pages.first : {},
    );

    if (currentPage.isEmpty) {
      return _buildNoDefinitionState(theme, null);
    }

    // Convert page to screen definition format
    final pageScreenDef = _pageToScreenDefinition(currentPage, screenDef);
    final screenDefinition = ScadaScreenParser.fromJson(pageScreenDef);

    // Subscribe to telemetry
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
          onEventAction: (action, context) {
            _handleEventAction(action, context);
          },
        ),

        // Popup overlays (matches web MultiPageRuntime popup stack)
        ..._buildPopupOverlays(screenDef, telemetryState),

        // Connection status indicator
        Positioned(
          bottom: 8,
          right: 8,
          child: _buildConnectionIndicator(telemetryState.isConnected),
        ),

        // Page indicator (if multiple pages)
        if (_pages.length > 1)
          Positioned(
            bottom: 8,
            left: 8,
            child: _buildPageIndicator(theme),
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
  }

  /// Build view for single page
  Widget _buildSinglePageView(
    ScadaScreenDefinition screenDefinition,
    ScadaTelemetryState telemetryState,
  ) {
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
          onEventAction: (action, context) {
            _handleEventAction(action, context);
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
  }

  /// Convert a page definition to screen definition format
  Map<String, dynamic> _pageToScreenDefinition(
    Map<String, dynamic> page,
    Map<String, dynamic> projectDef,
  ) {
    // Get default settings from project
    final defaultBackground = projectDef['settings']?['defaultBackground'];
    final defaultCanvasSize = projectDef['settings']?['defaultCanvasSize'];

    // Get layers and page-level widgets
    final rawLayers = (page['layers'] as List?)
        ?.map((l) => Map<String, dynamic>.from(l as Map))
        .toList() ?? [];
    final pageWidgets = (page['widgets'] as List?)
        ?.map((w) => Map<String, dynamic>.from(w as Map))
        .toList() ?? [];

    // Merge widgets into their respective layers based on layerId
    // The web frontend stores widgets at page level with layerId references,
    // but the mobile parser expects widgets inside each layer object.
    List<Map<String, dynamic>> mergedLayers;
    if (rawLayers.isEmpty) {
      // No layers — create a default layer containing all widgets
      mergedLayers = [{
        'id': 'default',
        'name': 'Default',
        'visible': true,
        'locked': false,
        'widgets': pageWidgets,
      }];
    } else {
      // Check if layers already contain widgets (embedded format)
      final layersHaveWidgets = rawLayers.any(
        (l) => l['widgets'] is List && (l['widgets'] as List).isNotEmpty,
      );

      if (layersHaveWidgets || pageWidgets.isEmpty) {
        // Layers already have widgets embedded, or no widgets to merge
        mergedLayers = rawLayers;
      } else {
        // Distribute page-level widgets into layers by layerId
        final layerIds = rawLayers.map((l) => l['id'] as String?).toSet();
        mergedLayers = rawLayers.map((layer) {
          final layerId = layer['id'] as String?;
          final layerWidgets = pageWidgets
              .where((w) => (w['layerId'] as String?) == layerId)
              .toList();
          return {...layer, 'widgets': layerWidgets};
        }).toList();

        // Collect orphan widgets (no layerId or unknown layerId) into first layer
        final orphans = pageWidgets.where((w) {
          final wLayerId = w['layerId'] as String?;
          return wLayerId == null || !layerIds.contains(wLayerId);
        }).toList();
        if (orphans.isNotEmpty && mergedLayers.isNotEmpty) {
          final existing = (mergedLayers.first['widgets'] as List?) ?? [];
          mergedLayers.first['widgets'] = [...existing, ...orphans];
        }
      }
    }

    return {
      'id': page['id'],
      'name': page['name'],
      'canvas': page['canvasSize'] ?? defaultCanvasSize ?? {'width': 398, 'height': 844},
      'background': page['background'] ?? defaultBackground ?? {'color': '#f8fafc'},
      'layers': mergedLayers,
      'variables': page['variables'] ?? [],
    };
  }

  /// Handle event actions (navigation, popups, etc.)
  void _handleEventAction(ScadaEventAction action, Map<String, dynamic> context) {
    debugPrint('[SCADA] Event action: ${action.type}, context: $context');

    switch (action.type) {
      case ActionTypes.navigateToPage:
        final targetPageId = action.targetPageId ?? context['targetPageId'];
        if (targetPageId != null && _currentPageId != targetPageId) {
          setState(() {
            // Push current page to stack for goBack
            if (_currentPageId != null) {
              _navigationStack.add(_currentPageId!);
            }
            _currentPageId = targetPageId;
          });
        }
        break;

      case ActionTypes.goBack:
        if (_popupStack.isNotEmpty) {
          // Close topmost popup first (matches web behavior)
          setState(() => _popupStack.removeLast());
        } else if (_navigationStack.isNotEmpty) {
          setState(() {
            _currentPageId = _navigationStack.removeLast();
          });
        }
        break;

      case ActionTypes.goHome:
        if (_homePageId != null && _currentPageId != _homePageId) {
          setState(() {
            _navigationStack.clear();
            _popupStack.clear();
            _currentPageId = _homePageId;
          });
        }
        break;

      case ActionTypes.openPopup:
        final popupPageId = action.popupPageId ?? context['popupPageId'] as String?;
        if (popupPageId != null && !_popupStack.contains(popupPageId)) {
          setState(() => _popupStack.add(popupPageId));
        }
        break;

      case ActionTypes.closePopup:
        final popupPageId = action.popupPageId ?? context['popupPageId'] as String?;
        setState(() {
          if (popupPageId != null) {
            _popupStack.remove(popupPageId);
          } else if (_popupStack.isNotEmpty) {
            _popupStack.removeLast();
          }
        });
        break;

      case ActionTypes.setVariable:
        final varName = action.variableName ?? context['variableName'] as String?;
        final varValue = action.variableValue ?? context['variableValue'];
        if (varName != null) {
          // Update telemetry data with variable value for runtime binding
          ref.read(scadaTelemetryProvider.notifier).setVariable(varName, varValue);
        }
        break;

      case ActionTypes.showNotification:
        _showNotification(
          action.notificationMessage ?? context['message'] as String? ?? '',
          action.notificationLevel ?? context['level'] as String? ?? 'info',
        );
        break;

      default:
        debugPrint('[SCADA] Unknown event action: ${action.type}');
    }
  }

  /// Show notification snackbar
  void _showNotification(String message, String level) {
    final messenger = ScaffoldMessenger.of(context);
    Color backgroundColor;
    
    switch (level) {
      case 'success':
        backgroundColor = Colors.green;
        break;
      case 'warning':
        backgroundColor = Colors.orange;
        break;
      case 'error':
        backgroundColor = Colors.red;
        break;
      default:
        backgroundColor = Colors.blue;
    }

    messenger.showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: backgroundColor,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  /// Build popup overlay widgets (matches web PopupOverlay component)
  List<Widget> _buildPopupOverlays(
    Map<String, dynamic> screenDef,
    ScadaTelemetryState telemetryState,
  ) {
    return _popupStack.map((popupPageId) {
      
      final popupPage = _pages.firstWhere(
        (p) => p['id'] == popupPageId,
        orElse: () => <String, dynamic>{},
      );
      
      if (popupPage.isEmpty) return const SizedBox.shrink();
      
      final popupSettings = popupPage['popupSettings'] as Map<String, dynamic>?;
      final showTitleBar = popupSettings?['showTitleBar'] as bool? ?? true;
      final title = popupSettings?['title'] as String? ?? popupPage['name'] as String? ?? 'Popup';
      final closeOnBackdrop = popupSettings?['closeOnBackdropClick'] as bool? ?? true;
      
      // Convert popup page to screen definition
      final pageScreenDef = _pageToScreenDefinition(popupPage, screenDef);
      final screenDefinition = ScadaScreenParser.fromJson(pageScreenDef);
      
      return Positioned.fill(
        child: Material(
          color: Colors.black54,
          child: GestureDetector(
            onTap: closeOnBackdrop ? () {
              setState(() => _popupStack.remove(popupPageId));
            } : null,
            child: Center(
              child: GestureDetector(
                onTap: () {}, // Prevent tap-through to backdrop
                child: Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.9,
                    maxHeight: MediaQuery.of(context).size.height * 0.85,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.25),
                        blurRadius: 25,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (showTitleBar)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F172A).withValues(alpha: 0.95),
                            borderRadius: const BorderRadius.only(
                              topLeft: Radius.circular(12),
                              topRight: Radius.circular(12),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                title,
                                style: const TextStyle(
                                  color: Color(0xFFE2E8F0),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              GestureDetector(
                                onTap: () {
                                  setState(() => _popupStack.remove(popupPageId));
                                },
                                child: const Icon(
                                  Icons.close,
                                  color: Color(0xFF94A3B8),
                                  size: 18,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ClipRRect(
                        borderRadius: BorderRadius.only(
                          bottomLeft: const Radius.circular(12),
                          bottomRight: const Radius.circular(12),
                          topLeft: showTitleBar ? Radius.zero : const Radius.circular(12),
                          topRight: showTitleBar ? Radius.zero : const Radius.circular(12),
                        ),
                        child: SizedBox(
                          width: screenDefinition.canvas.width,
                          height: screenDefinition.canvas.height,
                          child: ScadaRenderer(
                            screen: screenDefinition,
                            telemetryData: telemetryState.data,
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
                            onEventAction: (action, context) {
                              _handleEventAction(action, context);
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }).toList();
  }

  /// Build page indicator for multi-page projects
  Widget _buildPageIndicator(ThemeData theme) {
    final currentPage = _pages.firstWhere(
      (p) => p['id'] == _currentPageId,
      orElse: () => {},
    );
    final pageName = currentPage['name'] ?? 'Page';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black54,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.pages, size: 16, color: Colors.white70),
          const SizedBox(width: 6),
          Text(
            pageName,
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
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
