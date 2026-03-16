// SCADA Renderer Engine
//
// Renders SCADA screens from JSON definitions using native Flutter widgets.
// Handles widget positioning, binding resolution, and actions.

import 'package:flutter/material.dart';
import '../models/scada_screen.dart';
import 'widget_registry.dart';

/// SCADA Renderer - Main rendering engine
class ScadaRenderer extends StatefulWidget {
  /// Screen definition to render
  final ScadaScreenDefinition screen;

  /// Telemetry data keyed by variable name
  final Map<String, dynamic> telemetryData;

  /// Callback when action is triggered
  final void Function(ScadaWidgetInstance widget, String trigger, Map<String, dynamic> params)? onAction;

  /// Callback to send command to device
  final void Function(String deviceId, String key, dynamic value)? onSendCommand;

  /// Whether to show debug overlay
  final bool showDebug;

  const ScadaRenderer({
    super.key,
    required this.screen,
    this.telemetryData = const {},
    this.onAction,
    this.onSendCommand,
    this.showDebug = false,
  });

  @override
  State<ScadaRenderer> createState() => _ScadaRendererState();
}

class _ScadaRendererState extends State<ScadaRenderer> {
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Calculate scale factor based on screen dimensions vs canvas size
        final screenSize = widget.screen.canvas;
        final scaleX = constraints.maxWidth / screenSize.width;
        final scaleY = constraints.maxHeight / screenSize.height;
        final scale = scaleX < scaleY ? scaleX : scaleY;

        // Calculate offset to center the canvas
        final scaledWidth = screenSize.width * scale;
        final scaledHeight = screenSize.height * scale;
        final offsetX = (constraints.maxWidth - scaledWidth) / 2;
        final offsetY = (constraints.maxHeight - scaledHeight) / 2;

        return ClipRect(
          child: Stack(
            children: [
              // Background
              Positioned.fill(
                child: _buildBackground(),
              ),
              // Widgets canvas
              Positioned(
                left: offsetX,
                top: offsetY,
                width: scaledWidth,
                height: scaledHeight,
                child: Transform.scale(
                  scale: scale,
                  alignment: Alignment.topLeft,
                  child: SizedBox(
                    width: screenSize.width,
                    height: screenSize.height,
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: _buildWidgets(),
                    ),
                  ),
                ),
              ),
              // Debug overlay
              if (widget.showDebug)
                Positioned(
                  left: 8,
                  top: 8,
                  child: _buildDebugOverlay(scale),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildBackground() {
    final bg = widget.screen.background;

    if (bg.image != null && bg.image!.isNotEmpty) {
      return Image.network(
        bg.image!,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Container(color: _parseColor(bg.color)),
      );
    }

    return Container(
      color: _parseColor(bg.color),
    );
  }

  List<Widget> _buildWidgets() {
    // Flatten all layers' widgets
    final allWidgets = <ScadaWidgetInstance>[];
    for (final layer in widget.screen.layers) {
      if (layer.visible) {
        allWidgets.addAll(layer.widgets);
      }
    }

    return allWidgets.map((widgetDef) => _buildWidget(widgetDef)).toList();
  }

  Widget _buildWidget(ScadaWidgetInstance widgetDef) {
    final transform = widgetDef.transform;
    
    // Resolve bindings to properties
    final resolvedProps = _resolveBindings(widgetDef);

    // Build widget using registry
    final child = scadaWidgetRegistry.build(
      widgetDef,
      resolvedProps,
      (trigger, params) => _handleAction(widgetDef, trigger, params),
    );

    // Apply transform
    return Positioned(
      left: transform.position.x,
      top: transform.position.y,
      width: transform.size.width,
      height: transform.size.height,
      child: Transform(
        alignment: Alignment.center,
        transform: Matrix4.identity()
          ..rotateZ(transform.rotation * 3.14159 / 180)
          ..multiply(Matrix4.diagonal3Values(transform.scale.x, transform.scale.y, 1.0)),
        child: Visibility(
          visible: widgetDef.visible,
          child: Opacity(
            opacity: transform.opacity,
            child: child,
          ),
        ),
      ),
    );
  }

  Map<String, dynamic> _resolveBindings(ScadaWidgetInstance widgetDef) {
    // Start with static properties
    final resolved = Map<String, dynamic>.from(widgetDef.properties);

    // Apply bindings
    for (final binding in widgetDef.bindings) {
      final value = _resolveBindingValue(binding);
      if (value != null) {
        resolved[binding.targetProperty] = value;
      }
    }

    // Also resolve from global variables
    for (final variable in widget.screen.variables) {
      if (widget.telemetryData.containsKey(variable.name)) {
        // Variable already has telemetry data bound
      }
    }

    return resolved;
  }

  dynamic _resolveBindingValue(ScadaBinding binding) {
    final source = binding.source;
    dynamic rawValue;

    // Get raw value from source
    switch (source.type) {
      case 'telemetry':
        rawValue = _getTelemetryValue(source.deviceId, source.key ?? '');
        break;
      case 'attribute':
        rawValue = _getTelemetryValue(source.deviceId, 'attr_${source.key}');
        break;
      case 'variable':
        rawValue = widget.screen.variables
            .firstWhere(
              (v) => v.name == source.key,
              orElse: () => ScadaVariable(name: '', type: '', defaultValue: null),
            )
            .defaultValue;
        break;
      case 'constant':
        rawValue = source.key; // Key is the constant value
        break;
      default:
        rawValue = null;
    }

    // Apply format transformations
    if (rawValue != null && binding.format != null) {
      rawValue = _applyFormat(rawValue, binding.format!);
    }

    return rawValue;
  }

  dynamic _getTelemetryValue(String? deviceId, String key) {
    // Try exact key match
    if (widget.telemetryData.containsKey(key)) {
      return widget.telemetryData[key];
    }

    // Try with device prefix
    if (deviceId != null) {
      final prefixedKey = '${deviceId}_$key';
      if (widget.telemetryData.containsKey(prefixedKey)) {
        return widget.telemetryData[prefixedKey];
      }
    }

    return null;
  }

  dynamic _applyFormat(dynamic value, ScadaBindingFormat format) {
    if (value == null) return null;

    // Apply decimals
    if (value is num && format.decimals != null) {
      value = double.parse(value.toStringAsFixed(format.decimals!));
    }

    // Apply multiplier
    if (value is num && format.multiplier != null) {
      value = value * format.multiplier!;
    }

    // Apply offset
    if (value is num && format.offset != null) {
      value = value + format.offset!;
    }

    // Apply mapping
    if (format.mapping != null && format.mapping!.containsKey(value.toString())) {
      value = format.mapping![value.toString()];
    }

    return value;
  }

  void _handleAction(
    ScadaWidgetInstance widget,
    String trigger,
    Map<String, dynamic> params,
  ) {
    // Find matching action
    final action = widget.actions.firstWhere(
      (a) => a.trigger == trigger,
      orElse: () => ScadaAction(
        trigger: trigger,
        type: 'none',
        params: {},
      ),
    );

    if (action.type == 'none') {
      // No action defined, call general callback
      this.widget.onAction?.call(widget, trigger, params);
      return;
    }

    switch (action.type) {
      case 'sendCommand':
        final deviceId = action.params['deviceId'] as String?;
        final key = action.params['key'] as String?;
        final value = action.params['value'] ?? params['value'];
        if (deviceId != null && key != null) {
          this.widget.onSendCommand?.call(deviceId, key, value);
        }
        break;
      case 'setValue':
        // Setting local variable - would need state management
        break;
      case 'navigate':
        // Navigation to another screen
        break;
      default:
        this.widget.onAction?.call(widget, trigger, params);
    }
  }

  Widget _buildDebugOverlay(double scale) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'SCADA Debug',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Canvas: ${widget.screen.canvas.width}x${widget.screen.canvas.height}',
            style: const TextStyle(color: Colors.white70, fontSize: 10),
          ),
          Text(
            'Scale: ${scale.toStringAsFixed(2)}',
            style: const TextStyle(color: Colors.white70, fontSize: 10),
          ),
          Text(
            'Widgets: ${_countWidgets()}',
            style: const TextStyle(color: Colors.white70, fontSize: 10),
          ),
          Text(
            'Telemetry keys: ${widget.telemetryData.keys.length}',
            style: const TextStyle(color: Colors.white70, fontSize: 10),
          ),
        ],
      ),
    );
  }

  int _countWidgets() {
    int count = 0;
    for (final layer in widget.screen.layers) {
      count += layer.widgets.length;
    }
    return count;
  }

  Color _parseColor(String? color) {
    if (color == null || color.isEmpty) return Colors.white;
    if (color.startsWith('#')) {
      final hex = color.replaceFirst('#', '');
      if (hex.length == 6) {
        return Color(int.parse('FF$hex', radix: 16));
      } else if (hex.length == 8) {
        return Color(int.parse(hex, radix: 16));
      }
    }
    return Colors.white;
  }
}

/// Extension to parse screen definition from JSON
extension ScadaScreenParser on ScadaScreenDefinition {
  static ScadaScreenDefinition fromJson(Map<String, dynamic> json) {
    return ScadaScreenDefinition(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Untitled',
      canvas: _parseSize(json['canvas']),
      background: _parseBackground(json['background']),
      layers: _parseLayers(json['layers']),
      variables: _parseVariables(json['variables']),
    );
  }

  static ScadaSize _parseSize(dynamic json) {
    if (json == null) return const ScadaSize(width: 1920, height: 1080);
    if (json is Map<String, dynamic>) {
      return ScadaSize(
        width: (json['width'] as num?)?.toDouble() ?? 1920,
        height: (json['height'] as num?)?.toDouble() ?? 1080,
      );
    }
    return const ScadaSize(width: 1920, height: 1080);
  }

  static ScadaBackground _parseBackground(dynamic json) {
    if (json == null) return const ScadaBackground(color: '#FFFFFF');
    if (json is Map<String, dynamic>) {
      return ScadaBackground(
        color: json['color'] as String? ?? '#FFFFFF',
        image: json['image'] as String?,
        svg: json['svg'] as String?,
      );
    }
    return const ScadaBackground(color: '#FFFFFF');
  }

  static List<ScadaLayer> _parseLayers(dynamic json) {
    if (json == null || json is! List) {
      return [ScadaLayer(id: 'default', name: 'Default', widgets: [], visible: true, locked: false)];
    }
    return json.map<ScadaLayer>((item) {
      if (item is Map<String, dynamic>) {
        return ScadaLayer(
          id: item['id'] as String? ?? '',
          name: item['name'] as String? ?? 'Layer',
          widgets: _parseWidgets(item['widgets']),
          visible: item['visible'] as bool? ?? true,
          locked: item['locked'] as bool? ?? false,
        );
      }
      return ScadaLayer(id: '', name: '', widgets: [], visible: true, locked: false);
    }).toList();
  }

  static List<ScadaVariable> _parseVariables(dynamic json) {
    if (json == null || json is! List) return [];
    return json.map<ScadaVariable>((item) {
      if (item is Map<String, dynamic>) {
        return ScadaVariable(
          name: item['name'] as String? ?? '',
          type: item['type'] as String? ?? 'string',
          defaultValue: item['defaultValue'],
        );
      }
      return const ScadaVariable(name: '', type: 'string');
    }).toList();
  }

  static List<ScadaWidgetInstance> _parseWidgets(dynamic json) {
    if (json == null || json is! List) return [];
    return json.map<ScadaWidgetInstance>((item) {
      if (item is Map<String, dynamic>) {
        return ScadaWidgetInstance(
          id: item['id'] as String? ?? '',
          type: item['type'] as String? ?? 'unknown',
          name: item['name'] as String? ?? '',
          transform: _parseTransform(item['transform']),
          properties: item['properties'] as Map<String, dynamic>? ?? {},
          bindings: _parseBindings(item['bindings']),
          actions: _parseActions(item['actions']),
          visible: item['visible'] as bool? ?? true,
          locked: item['locked'] as bool? ?? false,
        );
      }
      return ScadaWidgetInstance(
        id: '', type: 'unknown', name: '',
        transform: ScadaTransform.defaultTransform(),
        properties: {}, bindings: [], actions: [],
        visible: true, locked: false,
      );
    }).toList();
  }

  static ScadaTransform _parseTransform(dynamic json) {
    if (json == null) return ScadaTransform.defaultTransform();
    if (json is Map<String, dynamic>) {
      return ScadaTransform(
        position: _parsePoint(json['position']),
        size: _parseSizeFromMap(json['size']),
        rotation: (json['rotation'] as num?)?.toDouble() ?? 0,
        scale: _parsePoint(json['scale'], defaultX: 1, defaultY: 1),
        opacity: (json['opacity'] as num?)?.toDouble() ?? 1.0,
      );
    }
    return ScadaTransform.defaultTransform();
  }

  static ScadaPoint _parsePoint(dynamic json, {double defaultX = 0, double defaultY = 0}) {
    if (json == null) return ScadaPoint(x: defaultX, y: defaultY);
    if (json is Map<String, dynamic>) {
      return ScadaPoint(
        x: (json['x'] as num?)?.toDouble() ?? defaultX,
        y: (json['y'] as num?)?.toDouble() ?? defaultY,
      );
    }
    return ScadaPoint(x: defaultX, y: defaultY);
  }

  static ScadaSize _parseSizeFromMap(dynamic json) {
    if (json == null) return const ScadaSize(width: 100, height: 100);
    if (json is Map<String, dynamic>) {
      return ScadaSize(
        width: (json['width'] as num?)?.toDouble() ?? 100,
        height: (json['height'] as num?)?.toDouble() ?? 100,
      );
    }
    return const ScadaSize(width: 100, height: 100);
  }

  static List<ScadaBinding> _parseBindings(dynamic json) {
    if (json == null || json is! List) return [];
    return json.map<ScadaBinding>((item) {
      if (item is Map<String, dynamic>) {
        return ScadaBinding(
          id: item['id'] as String? ?? '',
          targetProperty: item['targetProperty'] as String? ?? '',
          source: _parseBindingSource(item['source']),
          format: _parseBindingFormat(item['format']),
        );
      }
      return ScadaBinding(
        id: '', targetProperty: '',
        source: const ScadaBindingSource(type: 'constant'),
        format: null,
      );
    }).toList();
  }

  static ScadaBindingSource _parseBindingSource(dynamic json) {
    if (json == null) return const ScadaBindingSource(type: 'constant');
    if (json is Map<String, dynamic>) {
      return ScadaBindingSource(
        type: json['type'] as String? ?? 'constant',
        deviceId: json['deviceId'] as String?,
        key: json['key'] as String?,
      );
    }
    return const ScadaBindingSource(type: 'constant');
  }

  static ScadaBindingFormat? _parseBindingFormat(dynamic json) {
    if (json == null) return null;
    if (json is Map<String, dynamic>) {
      return ScadaBindingFormat(
        decimals: json['decimals'] as int?,
        unit: json['unit'] as String?,
        multiplier: (json['multiplier'] as num?)?.toDouble(),
        offset: (json['offset'] as num?)?.toDouble(),
        mapping: json['mapping'] as Map<String, dynamic>?,
      );
    }
    return null;
  }

  static List<ScadaAction> _parseActions(dynamic json) {
    if (json == null || json is! List) return [];
    return json.map<ScadaAction>((item) {
      if (item is Map<String, dynamic>) {
        return ScadaAction(
          trigger: item['trigger'] as String? ?? '',
          type: item['type'] as String? ?? '',
          params: item['params'] as Map<String, dynamic>? ?? {},
        );
      }
      return ScadaAction(trigger: '', type: '', params: {});
    }).toList();
  }
}
