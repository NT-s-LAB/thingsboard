import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/api_client.dart';
import '../../core/constants/api_endpoints.dart';
import '../models/project.dart';

/// Project Repository
class ProjectRepository {
  final ApiClient _apiClient;

  ProjectRepository(this._apiClient);

  Future<List<Project>> getProjects({
    int page = 1,
    int limit = 20,
    String? search,
  }) async {
    final response = await _apiClient.get(
      ApiEndpoints.projects,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );

    final List<dynamic> data = response.data['data'] ?? response.data;
    return data.map((json) => Project.fromJson(json)).toList();
  }

  Future<Project> getProject(String id) async {
    final response = await _apiClient.get(ApiEndpoints.project(id));
    return Project.fromJson(response.data);
  }

  Future<Project> createProject(Map<String, dynamic> data) async {
    final response = await _apiClient.post(ApiEndpoints.projects, data: data);
    return Project.fromJson(response.data);
  }

  Future<Project> updateProject(String id, Map<String, dynamic> data) async {
    final response = await _apiClient.patch(ApiEndpoints.project(id), data: data);
    return Project.fromJson(response.data);
  }

  Future<void> deleteProject(String id) async {
    await _apiClient.delete(ApiEndpoints.project(id));
  }
}

// Provider
final projectRepositoryProvider = Provider<ProjectRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ProjectRepository(apiClient);
});
