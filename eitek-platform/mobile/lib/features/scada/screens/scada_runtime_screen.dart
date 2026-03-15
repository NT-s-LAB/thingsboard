import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import '../../../core/services/storage_service.dart';
import '../providers/scada_provider.dart';

/// SCADA Runtime Screen
/// 
/// Displays a SCADA view in a WebView for realtime monitoring.
/// Uses the web frontend's SCADA runtime renderer with autoFit.
class ScadaRuntimeScreen extends ConsumerStatefulWidget {
  final String viewId;

  const ScadaRuntimeScreen({
    super.key,
    required this.viewId,
  });

  @override
  ConsumerState<ScadaRuntimeScreen> createState() => _ScadaRuntimeScreenState();
}

class _ScadaRuntimeScreenState extends ConsumerState<ScadaRuntimeScreen> {
  WebViewController? _controller;
  bool _isLoading = true;
  bool _hasError = false;
  bool _isControllerReady = false;
  String? _errorMessage;
  double _loadingProgress = 0;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  Future<void> _initializeWebView() async {
    final storage = ref.read(storageServiceProvider);
    final token = await storage.getAccessToken();

    // Create controller with platform-specific params for DOM storage
    late final PlatformWebViewControllerCreationParams params;
    if (!kIsWeb && Platform.isAndroid) {
      params = AndroidWebViewControllerCreationParams();
    } else {
      params = const PlatformWebViewControllerCreationParams();
    }

    final controller = WebViewController.fromPlatformCreationParams(params)
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white);

    // Android-specific settings
    if (!kIsWeb && Platform.isAndroid && controller.platform is AndroidWebViewController) {
      final androidController = controller.platform as AndroidWebViewController;
      await androidController.setMediaPlaybackRequiresUserGesture(false);
    }

    controller.setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            if (mounted) {
              setState(() {
                _loadingProgress = progress / 100;
              });
            }
          },
          onPageStarted: (url) {
            if (mounted) {
              setState(() {
                _isLoading = true;
                _hasError = false;
              });
            }
          },
          onPageFinished: (url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
            // Inject auth token if needed
            if (token != null) {
              _injectAuthToken(token);
            }
          },
          onWebResourceError: (error) {
            if (mounted) {
              setState(() {
                _isLoading = false;
                _hasError = true;
                _errorMessage = error.description;
              });
            }
          },
        ),
      );

    // Inject token via intermediate HTML page that sets localStorage and redirects
    final url = _buildRuntimeUrl();
    final tokenInjectionHtml = '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      margin: 0;
      font-family: system-ui;
      background: #f5f5f5;
    }
    .loader { 
      text-align: center; 
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e0e0e0;
      border-top: 3px solid #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Đang tải SCADA...</p>
  </div>
  <script>
    // Inject auth token from mobile app (FE uses both auth_token and auth-token)
    ${token != null ? "localStorage.setItem('auth_token', '$token');" : ""}
    ${token != null ? "localStorage.setItem('auth-token', '$token');" : ""}
    // Redirect to SCADA page
    setTimeout(function() {
      window.location.href = '$url';
    }, 500);
  </script>
</body>
</html>
''';

    await controller.loadHtmlString(
      tokenInjectionHtml,
      baseUrl: 'http://${_getHost()}:3000',
    );

    if (mounted) {
      setState(() {
        _controller = controller;
        _isControllerReady = true;
      });
    }
  }

  String _buildRuntimeUrl() {
    // Frontend URL (Next.js on port 3000)
    final host = _getHost();
    // SCADA page URL: /scada/{id}
    return 'http://$host:3000/scada/${widget.viewId}';
  }

  String _getHost() {
    if (kIsWeb) return 'localhost';
    if (Platform.isAndroid) return '10.0.2.2';
    return 'localhost';
  }

  Future<void> _injectAuthToken(String token) async {
    // Inject token into localStorage for the web app
    await _controller?.runJavaScript('''
      localStorage.setItem('accessToken', '$token');
      localStorage.setItem('eitek_token', '$token');
    ''');
  }

  Future<void> _reload() async {
    if (_controller == null) return;
    setState(() {
      _isLoading = true;
      _hasError = false;
      _errorMessage = null;
    });
    await _controller!.reload();
  }

  @override
  Widget build(BuildContext context) {
    final viewAsync = ref.watch(scadaViewProvider(widget.viewId));
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: viewAsync.when(
          data: (view) => Text(view.name),
          loading: () => const Text('Loading...'),
          error: (_, __) => const Text('SCADA Runtime'),
        ),
        actions: [
          // Fullscreen toggle
          IconButton(
            icon: const Icon(Icons.fullscreen),
            tooltip: 'Toàn màn hình',
            onPressed: _toggleFullscreen,
          ),
          // Reload button
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Tải lại',
            onPressed: _reload,
          ),
        ],
      ),
      body: Stack(
        children: [
          // WebView - only show when controller is ready
          if (_isControllerReady && !_hasError && _controller != null) 
            WebViewWidget(controller: _controller!),

          // Loading overlay
          if (_isLoading || !_isControllerReady)
            Container(
              color: theme.scaffoldBackgroundColor,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(
                      value: _loadingProgress > 0 ? _loadingProgress : null,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Đang tải SCADA Runtime...',
                      style: theme.textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${(_loadingProgress * 100).toInt()}%',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),

          // Error state
          if (_hasError)
            Container(
              color: theme.scaffoldBackgroundColor,
              child: Center(
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
                        _errorMessage ?? 'Vui lòng kiểm tra kết nối mạng',
                        style: theme.textTheme.bodySmall,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'URL: ${_buildRuntimeUrl()}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.outline,
                          fontSize: 10,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: _reload,
                        icon: const Icon(Icons.refresh),
                        label: const Text('Thử lại'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
      // Bottom info bar
      bottomNavigationBar: viewAsync.when(
        data: (view) => _buildInfoBar(context, view),
        loading: () => null,
        error: (_, __) => null,
      ),
    );
  }

  Widget _buildInfoBar(BuildContext context, view) {
    final theme = Theme.of(context);
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(
          top: BorderSide(color: theme.dividerColor),
        ),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Icon(
              Icons.info_outline,
              size: 16,
              color: theme.colorScheme.outline,
            ),
            const SizedBox(width: 8),
            if (view.canvasSize != null)
              Text(
                'Canvas: ${view.canvasSize!.displaySize}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.outline,
                ),
              ),
            const Spacer(),
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: _hasError ? Colors.red : Colors.green,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              _hasError ? 'Offline' : 'Realtime',
              style: theme.textTheme.bodySmall?.copyWith(
                color: _hasError ? Colors.red : Colors.green,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _toggleFullscreen() {
    // Navigate to fullscreen route or toggle system UI
    // For now, just hide status bar
    // SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Xoay ngang màn hình để xem toàn màn hình'),
        duration: Duration(seconds: 2),
      ),
    );
  }
}
