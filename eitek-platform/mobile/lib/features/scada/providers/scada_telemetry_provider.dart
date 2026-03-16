// SCADA Telemetry Provider
//
// Manages realtime telemetry data for SCADA screens.
// Subscribes to device updates and provides data to the renderer.
// Matches Web SubscriptionManager architecture:
// - WebSocket subscriptions for real-time updates
// - HTTP polling as fallback
// - Cache format: entityId::key

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/websocket_service.dart';
import '../../../core/services/api_client.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/scada_screen.dart';

/// Data point for subscription (matches Web DataPoint interface)
class DataPoint {
  final String entityId;
  final String entityType;  // 'DEVICE' | 'ASSET'
  final String key;
  final String kind;  // 'telemetry' | 'attribute'

  const DataPoint({
    required this.entityId,
    required this.entityType,
    required this.key,
    required this.kind,
  });
}

/// State for SCADA telemetry
class ScadaTelemetryState {
  final Map<String, dynamic> data;
  final bool isConnected;
  final DateTime? lastUpdate;

  const ScadaTelemetryState({
    this.data = const {},
    this.isConnected = false,
    this.lastUpdate,
  });

  ScadaTelemetryState copyWith({
    Map<String, dynamic>? data,
    bool? isConnected,
    DateTime? lastUpdate,
  }) {
    return ScadaTelemetryState(
      data: data ?? this.data,
      isConnected: isConnected ?? this.isConnected,
      lastUpdate: lastUpdate ?? this.lastUpdate,
    );
  }
}

/// Notifier for SCADA telemetry (matches Web SubscriptionManager)
class ScadaTelemetryNotifier extends StateNotifier<ScadaTelemetryState> {
  final WebSocketService _wsService;
  final ApiClient _apiClient;
  final Set<String> _subscribedDevices = {};
  final List<DataPoint> _dataPoints = [];
  Timer? _pollTimer;
  static const _pollIntervalMs = 5000;  // 5 seconds like web
  
  void Function(dynamic)? _telemetryCallback;

  ScadaTelemetryNotifier(this._wsService, this._apiClient) : super(const ScadaTelemetryState());

  /// Initialize and connect
  Future<void> initialize() async {
    debugPrint('[SCADA] Initializing telemetry provider...');
    await _wsService.connect();
    
    _telemetryCallback = _onTelemetryUpdate;
    _wsService.subscribe('telemetry', _telemetryCallback!);
    
    debugPrint('[SCADA] WebSocket connected: ${_wsService.isConnected}');
    state = state.copyWith(isConnected: _wsService.isConnected);
  }

  /// Collect data points from screen definition (matches Web collectDataPoints)
  List<DataPoint> _collectDataPoints(ScadaScreenDefinition screen) {
    final points = <DataPoint>[];
    final seen = <String>{};

    for (final layer in screen.layers) {
      debugPrint('[SCADA] Layer: ${layer.name}, widgets: ${layer.widgets.length}');
      for (final widget in layer.widgets) {
        debugPrint('[SCADA] Widget: ${widget.type}, bindings: ${widget.bindings.length}');
        for (final binding in widget.bindings) {
          final src = binding.source;
          debugPrint('[SCADA] Binding: targetProperty=${binding.targetProperty}, type=${src.type}, deviceId=${src.deviceId}, key=${src.key}');
          if (src.deviceId == null || src.key == null) continue;
          if (src.type != 'telemetry' && src.type != 'attribute') continue;

          final dedupKey = '${src.deviceId}::${src.key}::${src.type}';
          if (seen.contains(dedupKey)) continue;
          seen.add(dedupKey);

          points.add(DataPoint(
            entityId: src.deviceId!,
            entityType: 'DEVICE',
            key: src.key!,
            kind: src.type == 'attribute' ? 'attribute' : 'telemetry',
          ));
        }
      }
    }

    return points;
  }

  /// Subscribe to devices from screen definition
  void subscribeToScreen(ScadaScreenDefinition screen) {
    debugPrint('[SCADA] subscribeToScreen() called');
    debugPrint('[SCADA] Screen layers: ${screen.layers.length}');
    
    // Collect data points (like web)
    _dataPoints.clear();
    _dataPoints.addAll(_collectDataPoints(screen));
    debugPrint('[SCADA] Collected ${_dataPoints.length} data points');

    // Extract unique device IDs
    final deviceIds = _dataPoints.map((p) => p.entityId).toSet();
    debugPrint('[SCADA] Unique device IDs: $deviceIds');

    // Subscribe to new devices via WebSocket
    for (final deviceId in deviceIds) {
      if (!_subscribedDevices.contains(deviceId)) {
        debugPrint('[SCADA] Subscribing to device: $deviceId');
        _wsService.subscribeToDevice(deviceId);
        _subscribedDevices.add(deviceId);
      }
    }

    // Initial fetch via HTTP (like web)
    _fetchAll();

    // Start polling as fallback (like web)
    _startPolling();
  }

  /// Start HTTP polling (fallback for when WebSocket is not connected)
  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(
      const Duration(milliseconds: _pollIntervalMs),
      (_) => _fetchAll(),
    );
  }

  /// Fetch all telemetry data via HTTP (matches Web fetchAll)
  Future<void> _fetchAll() async {
    debugPrint('[SCADA] _fetchAll() called, dataPoints: ${_dataPoints.length}');
    if (_dataPoints.isEmpty) {
      debugPrint('[SCADA] No data points to fetch');
      return;
    }

    // Group by entity
    final byEntity = <String, List<DataPoint>>{};
    for (final p in _dataPoints) {
      byEntity.putIfAbsent(p.entityId, () => []).add(p);
    }
    
    debugPrint('[SCADA] Fetching from ${byEntity.length} entities');

    final newData = Map<String, dynamic>.from(state.data);

    for (final entry in byEntity.entries) {
      final entityId = entry.key;
      final entityPoints = entry.value;

      try {
        // Fetch telemetry
        final telemetryKeys = entityPoints
            .where((p) => p.kind == 'telemetry')
            .map((p) => p.key)
            .toList();

        if (telemetryKeys.isNotEmpty) {
          final url = '${ApiEndpoints.deviceTelemetry(entityId)}?keys=${telemetryKeys.join(',')}';
          debugPrint('[SCADA] HTTP Fetch: $url');
          
          final response = await _apiClient.get(url);
          debugPrint('[SCADA] HTTP Response: ${response.data}');

          final data = response.data;
          if (data is Map<String, dynamic>) {
            for (final e in data.entries) {
              dynamic value;
              // Handle ThingsBoard format: { key: [{ ts, value }] }
              if (e.value is List && (e.value as List).isNotEmpty) {
                final first = (e.value as List).first;
                if (first is Map) {
                  value = first['value'];
                } else {
                  value = first;
                }
              } else {
                value = e.value;
              }
              
              // Cache with entityId::key format (matches web)
              final cacheKey = '$entityId::${e.key}';
              debugPrint('[SCADA] Caching: $cacheKey = $value');
              newData[cacheKey] = value;
              newData[e.key] = value;
            }
          }
        }
      } catch (e) {
        debugPrint('[SCADA] HTTP Fetch error for $entityId: $e');
      }
    }

    state = state.copyWith(
      data: newData,
      lastUpdate: DateTime.now(),
    );
  }

  /// Unsubscribe from all devices
  void unsubscribeAll() {
    _pollTimer?.cancel();
    _pollTimer = null;
    
    for (final deviceId in _subscribedDevices) {
      _wsService.unsubscribeFromDevice(deviceId);
    }
    _subscribedDevices.clear();
    _dataPoints.clear();
  }

  void _onTelemetryUpdate(dynamic data) {
    debugPrint('[SCADA] WebSocket telemetry received: $data');
    if (data is Map<String, dynamic>) {
      final newData = Map<String, dynamic>.from(state.data);
      
      // Handle different data formats (match web format)
      if (data.containsKey('deviceId') && data.containsKey('data')) {
        // Format: { deviceId: 'xxx', data: { key: [{ ts, value }] OR value } }
        final deviceId = data['deviceId'] as String;
        final telemetry = data['data'] as Map<String, dynamic>;
        debugPrint('[SCADA] WebSocket data from device: $deviceId');
        
        for (final entry in telemetry.entries) {
          final key = entry.key;
          dynamic value;
          
          // Extract value from ThingsBoard format: { key: [{ ts, value }] }
          if (entry.value is List && (entry.value as List).isNotEmpty) {
            final firstItem = (entry.value as List).first;
            if (firstItem is Map) {
              value = firstItem['value'];
            } else {
              value = firstItem;
            }
          } else {
            value = entry.value;
          }
          
          // Store with entityId::key format (matches web SubscriptionManager)
          final cacheKey = '$deviceId::$key';
          debugPrint('[SCADA] WebSocket cache: $cacheKey = $value');
          newData['$deviceId::$key'] = value;
          // Also store without prefix for simple key lookup
          newData[key] = value;
        }
      } else {
        debugPrint('[SCADA] WebSocket direct merge: $data');
        // Direct merge
        newData.addAll(data);
      }

      state = state.copyWith(
        data: newData,
        lastUpdate: DateTime.now(),
      );
      debugPrint('[SCADA] State data now: ${state.data.keys.toList()}');
    }
  }

  /// Send command to device
  void sendCommand(String deviceId, String key, dynamic value) {
    _wsService.sendRpc(deviceId, 'setValue', {
      'key': key,
      'value': value,
    });
  }

  /// Get value for a key
  dynamic getValue(String key) => state.data[key];

  /// Set a screen-level variable (matches web setVariable action)
  void setVariable(String name, dynamic value) {
    final newData = Map<String, dynamic>.from(state.data);
    newData['var::$name'] = value;
    state = state.copyWith(
      data: newData,
      lastUpdate: DateTime.now(),
    );
    debugPrint('[SCADA] Variable set: var::$name = $value');
  }

  /// Update local data (for testing or mock data)
  void updateData(Map<String, dynamic> data) {
    final newData = Map<String, dynamic>.from(state.data)..addAll(data);
    state = state.copyWith(
      data: newData,
      lastUpdate: DateTime.now(),
    );
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    if (_telemetryCallback != null) {
      _wsService.unsubscribe('telemetry', _telemetryCallback!);
    }
    unsubscribeAll();
    super.dispose();
  }
}

/// Provider for SCADA telemetry
final scadaTelemetryProvider =
    StateNotifierProvider.autoDispose<ScadaTelemetryNotifier, ScadaTelemetryState>(
  (ref) {
    final wsService = ref.watch(webSocketServiceProvider);
    final apiClient = ref.watch(apiClientProvider);
    final notifier = ScadaTelemetryNotifier(wsService, apiClient);
    
    // Initialize on creation
    notifier.initialize();
    
    return notifier;
  },
);

/// Provider for SCADA screen with telemetry
final scadaScreenWithTelemetryProvider = Provider.family<
    ({ScadaScreenDefinition screen, Map<String, dynamic> telemetry}),
    ScadaScreenDefinition>((ref, screen) {
  final telemetryState = ref.watch(scadaTelemetryProvider);
  
  // Subscribe to devices when screen changes
  ref.read(scadaTelemetryProvider.notifier).subscribeToScreen(screen);
  
  return (screen: screen, telemetry: telemetryState.data);
});
