import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/project.dart';
import '../../../data/repositories/project_repository.dart';

/// Projects State
class ProjectsState {
  final List<Project> projects;
  final bool isLoading;
  final bool hasMore;
  final int currentPage;
  final String? errorMessage;

  const ProjectsState({
    this.projects = const [],
    this.isLoading = false,
    this.hasMore = true,
    this.currentPage = 1,
    this.errorMessage,
  });

  ProjectsState copyWith({
    List<Project>? projects,
    bool? isLoading,
    bool? hasMore,
    int? currentPage,
    String? errorMessage,
  }) {
    return ProjectsState(
      projects: projects ?? this.projects,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      errorMessage: errorMessage,
    );
  }
}

/// Projects Notifier
class ProjectsNotifier extends StateNotifier<ProjectsState> {
  final ProjectRepository _repository;

  ProjectsNotifier(this._repository) : super(const ProjectsState()) {
    loadProjects();
  }

  Future<void> loadProjects({bool refresh = false}) async {
    if (state.isLoading) return;
    
    final page = refresh ? 1 : state.currentPage;
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final projects = await _repository.getProjects(page: page);
      
      state = state.copyWith(
        projects: refresh ? projects : [...state.projects, ...projects],
        isLoading: false,
        hasMore: projects.length >= 20,
        currentPage: page + 1,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Không thể tải danh sách dự án',
      );
    }
  }

  Future<void> refresh() async {
    await loadProjects(refresh: true);
  }

  Future<void> loadMore() async {
    if (!state.hasMore || state.isLoading) return;
    await loadProjects();
  }

  Future<Project?> createProject(Map<String, dynamic> data) async {
    try {
      final project = await _repository.createProject(data);
      state = state.copyWith(
        projects: [project, ...state.projects],
      );
      return project;
    } catch (e) {
      return null;
    }
  }

  Future<bool> deleteProject(String id) async {
    try {
      await _repository.deleteProject(id);
      state = state.copyWith(
        projects: state.projects.where((p) => p.id != id).toList(),
      );
      return true;
    } catch (e) {
      return false;
    }
  }
}

/// Provider
final projectsProvider = StateNotifierProvider<ProjectsNotifier, ProjectsState>((ref) {
  final repository = ref.watch(projectRepositoryProvider);
  return ProjectsNotifier(repository);
});

/// Single project provider
final projectProvider = FutureProvider.family<Project?, String>((ref, id) async {
  final repository = ref.watch(projectRepositoryProvider);
  try {
    return await repository.getProject(id);
  } catch (e) {
    return null;
  }
});
