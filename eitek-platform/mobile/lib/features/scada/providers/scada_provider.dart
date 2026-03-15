import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/scada_view.dart';
import '../../../data/repositories/scada_view_repository.dart';

/// SCADA Views State
class ScadaViewsState {
  final List<ScadaView> views;
  final bool isLoading;
  final bool hasMore;
  final int currentPage;
  final String? errorMessage;
  final String? selectedProjectId;

  const ScadaViewsState({
    this.views = const [],
    this.isLoading = false,
    this.hasMore = true,
    this.currentPage = 1,
    this.errorMessage,
    this.selectedProjectId,
  });

  ScadaViewsState copyWith({
    List<ScadaView>? views,
    bool? isLoading,
    bool? hasMore,
    int? currentPage,
    String? errorMessage,
    String? selectedProjectId,
  }) {
    return ScadaViewsState(
      views: views ?? this.views,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      errorMessage: errorMessage,
      selectedProjectId: selectedProjectId ?? this.selectedProjectId,
    );
  }

  /// Get mobile-optimized views only
  List<ScadaView> get mobileViews => 
      views.where((v) => v.isMobileOptimized).toList();
  
  /// Get all views (when no mobile views available)
  List<ScadaView> get displayViews {
    final mobile = mobileViews;
    return mobile.isEmpty ? views : mobile;
  }

  int get totalCount => views.length;
  int get mobileCount => mobileViews.length;
}

/// SCADA Views Notifier
class ScadaViewsNotifier extends StateNotifier<ScadaViewsState> {
  final ScadaViewRepository _repository;

  ScadaViewsNotifier(this._repository) : super(const ScadaViewsState()) {
    loadViews();
  }

  Future<void> loadViews({bool refresh = false}) async {
    if (state.isLoading) return;
    
    final page = refresh ? 1 : state.currentPage;
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final views = await _repository.getScadaViews(
        page: page,
        projectId: state.selectedProjectId,
      );
      
      state = state.copyWith(
        views: refresh ? views : [...state.views, ...views],
        isLoading: false,
        hasMore: views.length >= 20,
        currentPage: page + 1,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Không thể tải danh sách SCADA',
      );
    }
  }

  Future<void> refresh() async {
    await loadViews(refresh: true);
  }

  void loadMore() {
    if (!state.isLoading && state.hasMore) {
      loadViews();
    }
  }

  void setProjectFilter(String? projectId) {
    state = state.copyWith(selectedProjectId: projectId);
    refresh();
  }
}

/// Provider for SCADA Views
final scadaViewsProvider = StateNotifierProvider<ScadaViewsNotifier, ScadaViewsState>((ref) {
  final repository = ref.watch(scadaViewRepositoryProvider);
  return ScadaViewsNotifier(repository);
});

/// Provider for a single SCADA view by ID
final scadaViewProvider = FutureProvider.family<ScadaView, String>((ref, id) async {
  final repository = ref.watch(scadaViewRepositoryProvider);
  return repository.getScadaView(id);
});
