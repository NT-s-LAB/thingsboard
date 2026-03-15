import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/api_client.dart';
import '../../core/constants/api_endpoints.dart';
import '../models/site.dart';
import '../models/area.dart';

/// Site Repository
class SiteRepository {
  final ApiClient _apiClient;

  SiteRepository(this._apiClient);

  Future<List<Site>> getSites({
    int page = 1,
    int limit = 20,
    String? projectId,
    String? search,
  }) async {
    final response = await _apiClient.get(
      ApiEndpoints.sites,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (projectId != null) 'projectId': projectId,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );

    final List<dynamic> data = response.data['data'] ?? response.data;
    return data.map((json) => Site.fromJson(json)).toList();
  }

  Future<Site> getSite(String id) async {
    final response = await _apiClient.get(ApiEndpoints.site(id));
    return Site.fromJson(response.data);
  }

  Future<Site> createSite(Map<String, dynamic> data) async {
    final response = await _apiClient.post(ApiEndpoints.sites, data: data);
    return Site.fromJson(response.data);
  }

  Future<Site> updateSite(String id, Map<String, dynamic> data) async {
    final response = await _apiClient.patch(ApiEndpoints.site(id), data: data);
    return Site.fromJson(response.data);
  }

  Future<void> deleteSite(String id) async {
    await _apiClient.delete(ApiEndpoints.site(id));
  }

  // Areas
  Future<List<Area>> getAreas({
    int page = 1,
    int limit = 20,
    String? siteId,
    String? search,
  }) async {
    final response = await _apiClient.get(
      ApiEndpoints.areas,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (siteId != null) 'siteId': siteId,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );

    final List<dynamic> data = response.data['data'] ?? response.data;
    return data.map((json) => Area.fromJson(json)).toList();
  }

  Future<Area> getArea(String id) async {
    final response = await _apiClient.get(ApiEndpoints.area(id));
    return Area.fromJson(response.data);
  }

  Future<Area> createArea(Map<String, dynamic> data) async {
    final response = await _apiClient.post(ApiEndpoints.areas, data: data);
    return Area.fromJson(response.data);
  }

  Future<Area> updateArea(String id, Map<String, dynamic> data) async {
    final response = await _apiClient.patch(ApiEndpoints.area(id), data: data);
    return Area.fromJson(response.data);
  }

  Future<void> deleteArea(String id) async {
    await _apiClient.delete(ApiEndpoints.area(id));
  }
}

// Provider
final siteRepositoryProvider = Provider<SiteRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return SiteRepository(apiClient);
});
