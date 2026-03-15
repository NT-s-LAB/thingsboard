import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../constants/app_constants.dart';
import 'storage_service.dart';

/// WebSocket Service for realtime data
class WebSocketService {
  IO.Socket? _socket;
  final StorageService _storage;
  bool _connected = false;

  final Map<String, List<Function(dynamic)>> _subscriptions = {};

  WebSocketService(this._storage);

  Future<void> connect() async {
    if (_connected) return;

    final token = await _storage.getAccessToken();
    if (token == null) return;

    _socket = IO.io(
      AppConstants.wsBaseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionDelay(1000)
          .setReconnectionAttempts(5)
          .build(),
    );

    _socket!.onConnect((_) {
      _connected = true;
      print('WebSocket connected');
    });

    _socket!.onDisconnect((_) {
      _connected = false;
      print('WebSocket disconnected');
    });

    _socket!.onError((error) {
      print('WebSocket error: $error');
    });

    // Handle telemetry updates
    _socket!.on('telemetry', (data) {
      _notifySubscribers('telemetry', data);
    });

    // Handle device status updates
    _socket!.on('device_status', (data) {
      _notifySubscribers('device_status', data);
    });

    // Handle alarm updates
    _socket!.on('alarm', (data) {
      _notifySubscribers('alarm', data);
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _connected = false;
    _subscriptions.clear();
  }

  bool get isConnected => _connected;

  // Subscribe to device telemetry
  void subscribeToDevice(String deviceId) {
    _socket?.emit('subscribe_device', {'deviceId': deviceId});
  }

  // Unsubscribe from device telemetry
  void unsubscribeFromDevice(String deviceId) {
    _socket?.emit('unsubscribe_device', {'deviceId': deviceId});
  }

  // Subscribe to events
  void subscribe(String event, Function(dynamic) callback) {
    _subscriptions.putIfAbsent(event, () => []);
    _subscriptions[event]!.add(callback);
  }

  // Unsubscribe from events
  void unsubscribe(String event, Function(dynamic) callback) {
    _subscriptions[event]?.remove(callback);
  }

  void _notifySubscribers(String event, dynamic data) {
    _subscriptions[event]?.forEach((callback) {
      callback(data);
    });
  }

  // Send RPC command
  void sendRpc(String deviceId, String method, Map<String, dynamic> params) {
    _socket?.emit('rpc_request', {
      'deviceId': deviceId,
      'method': method,
      'params': params,
    });
  }
}

// Provider
final webSocketServiceProvider = Provider<WebSocketService>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return WebSocketService(storage);
});
