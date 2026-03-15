import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/api_client.dart';
import '../../core/constants/api_endpoints.dart';
import '../models/device.dart';

/// Device Repository
class DeviceRepository {
  final ApiClient _apiClient;

  DeviceRepository(this._apiClient);

  Future<List<Device>> getDevices({
    int page = 1,
    int limit = 20,
    String? search,
    String? areaId,
    String? status,
  }) async {
    final response = await _apiClient.get(
      ApiEndpoints.devices,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (search != null && search.isNotEmpty) 'search': search,
        if (areaId != null) 'areaId': areaId,
        if (status != null) 'status': status,
      },
    );

    final List<dynamic> data = response.data['data'] ?? response.data;
    return data.map((json) => Device.fromJson(json)).toList();
  }

  Future<Device> getDevice(String id) async {
    final response = await _apiClient.get(ApiEndpoints.device(id));
    return Device.fromJson(response.data);
  }

  Future<Device> createDevice(Map<String, dynamic> data) async {
    final response = await _apiClient.post(ApiEndpoints.devices, data: data);
    return Device.fromJson(response.data);
  }

  Future<Device> updateDevice(String id, Map<String, dynamic> data) async {
    final response = await _apiClient.patch(ApiEndpoints.device(id), data: data);
    return Device.fromJson(response.data);
  }

  Future<void> deleteDevice(String id) async {
    await _apiClient.delete(ApiEndpoints.device(id));
  }

  Future<Map<String, dynamic>> getDeviceTelemetry(String id, {
    List<String>? keys,
    int? startTs,
    int? endTs,
  }) async {
    final response = await _apiClient.get(
      ApiEndpoints.deviceTelemetry(id),
      queryParameters: {
        if (keys != null) 'keys': keys.join(','),
        if (startTs != null) 'startTs': startTs,
        if (endTs != null) 'endTs': endTs,
      },
    );
    return response.data;
  }

  Future<Map<String, dynamic>> getDeviceAttributes(String id) async {
    final response = await _apiClient.get(ApiEndpoints.deviceAttributes(id));
    return response.data;
  }

  Future<void> sendRpcCommand(String id, String method, Map<String, dynamic> params) async {
    await _apiClient.post(
      ApiEndpoints.deviceRpc(id),
      data: {
        'method': method,
        'params': params,
      },
    );
  }
}

// Provider
final deviceRepositoryProvider = Provider<DeviceRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return DeviceRepository(apiClient);
});
