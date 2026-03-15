import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/api_client.dart';
import '../../core/constants/api_endpoints.dart';
import '../models/scada_view.dart';

/// SCADA View Repository
class ScadaViewRepository {
  final ApiClient _apiClient;

  ScadaViewRepository(this._apiClient);

  /// Get list of SCADA views with optional filters
  Future<List<ScadaView>> getScadaViews({
    int page = 1,
    int limit = 20,
    String? search,
    String? projectId,
    String? areaId,
  }) async {
    final response = await _apiClient.get(
      ApiEndpoints.scadaViews,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (search != null && search.isNotEmpty) 'search': search,
        if (projectId != null) 'projectId': projectId,
        if (areaId != null) 'areaId': areaId,
      },
    );

    final List<dynamic> data = response.data['data'] ?? response.data['items'] ?? response.data;
    return data.map((json) => ScadaView.fromJson(json)).toList();
  }

  /// Get a single SCADA view by ID
  Future<ScadaView> getScadaView(String id) async {
    final response = await _apiClient.get(ApiEndpoints.scadaView(id));
    final data = response.data['data'] ?? response.data;
    return ScadaView.fromJson(data);
  }

  /// Get SCADA views filtered for mobile (canvas width <= 480)
  Future<List<ScadaView>> getMobileScadaViews({
    int page = 1,
    int limit = 20,
    String? projectId,
  }) async {
    // Since backend doesn't have screenType filter yet,
    // we fetch all and filter client-side
    final allViews = await getScadaViews(
      page: page,
      limit: limit * 3, // Fetch more to compensate for filtering
      projectId: projectId,
    );
    
    // Filter for mobile-optimized views (or return all if none found)
    final mobileViews = allViews.where((v) => v.isMobileOptimized).toList();
    return mobileViews.isEmpty ? allViews : mobileViews;
  }
}

/// Provider for ScadaViewRepository
final scadaViewRepositoryProvider = Provider<ScadaViewRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ScadaViewRepository(apiClient);
});
