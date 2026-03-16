// SCADA Telemetry Provider
//
// Manages realtime telemetry data for SCADA screens.
// Subscribes to device updates and provides data to the renderer.

import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/websocket_service.dart';
import '../models/scada_screen.dart';

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

/// Notifier for SCADA telemetry
class ScadaTelemetryNotifier extends StateNotifier<ScadaTelemetryState> {
  final WebSocketService _wsService;
  final Set<String> _subscribedDevices = {};
  
  void Function(dynamic)? _telemetryCallback;

  ScadaTelemetryNotifier(this._wsService) : super(const ScadaTelemetryState());

  /// Initialize and connect
  Future<void> initialize() async {
    await _wsService.connect();
    
    _telemetryCallback = _onTelemetryUpdate;
    _wsService.subscribe('telemetry', _telemetryCallback!);
    
    state = state.copyWith(isConnected: _wsService.isConnected);
  }

  /// Subscribe to devices from screen definition
  void subscribeToScreen(ScadaScreenDefinition screen) {
    // Extract device IDs from bindings
    final deviceIds = <String>{};

    for (final layer in screen.layers) {
      for (final widget in layer.widgets) {
        for (final binding in widget.bindings) {
          final deviceId = binding.source.deviceId;
          if (deviceId != null && deviceId.isNotEmpty) {
            deviceIds.add(deviceId);
          }
        }
      }
    }

    // Subscribe to new devices
    for (final deviceId in deviceIds) {
      if (!_subscribedDevices.contains(deviceId)) {
        _wsService.subscribeToDevice(deviceId);
        _subscribedDevices.add(deviceId);
      }
    }
  }

  /// Unsubscribe from all devices
  void unsubscribeAll() {
    for (final deviceId in _subscribedDevices) {
      _wsService.unsubscribeFromDevice(deviceId);
    }
    _subscribedDevices.clear();
  }

  void _onTelemetryUpdate(dynamic data) {
    if (data is Map<String, dynamic>) {
      final newData = Map<String, dynamic>.from(state.data);
      
      // Handle different data formats
      if (data.containsKey('deviceId') && data.containsKey('data')) {
        // Format: { deviceId: 'xxx', data: { key: value } }
        final deviceId = data['deviceId'] as String;
        final telemetry = data['data'] as Map<String, dynamic>;
        
        for (final entry in telemetry.entries) {
          // Store with device prefix and without
          newData['${deviceId}_${entry.key}'] = entry.value;
          newData[entry.key] = entry.value;
        }
      } else {
        // Direct merge
        newData.addAll(data);
      }

      state = state.copyWith(
        data: newData,
        lastUpdate: DateTime.now(),
      );
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
    final notifier = ScadaTelemetryNotifier(wsService);
    
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
