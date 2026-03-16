// SCADA Renderer Engine
//
// Renders SCADA screens from JSON definitions using native Flutter widgets.
// Handles widget positioning, binding resolution, and actions/events.

import 'package:flutter/material.dart';
import '../models/scada_screen.dart';
import 'widget_registry.dart';

/// Helper class for recursive descent arithmetic parser
class _ParseResult {
  final double value;
  final int pos;
  const _ParseResult(this.value, this.pos);
}

/// Event action callback - for navigation, popups, notifications
typedef OnEventAction = void Function(ScadaEventAction action, Map<String, dynamic> context);

/// SCADA Renderer - Main rendering engine
class ScadaRenderer extends StatefulWidget {
  /// Screen definition to render
  final ScadaScreenDefinition screen;

  /// Telemetry data keyed by variable name
  final Map<String, dynamic> telemetryData;

  /// Callback when action is triggered (legacy)
  final void Function(ScadaWidgetInstance widget, String trigger, Map<String, dynamic> params)? onAction;

  /// Callback to send command to device
  final void Function(String deviceId, String key, dynamic value)? onSendCommand;

  /// Callback for event actions (navigation, popups, etc.)
  final OnEventAction? onEventAction;

  /// Whether to show debug overlay
  final bool showDebug;

  const ScadaRenderer({
    super.key,
    required this.screen,
    this.telemetryData = const {},
    this.onAction,
    this.onSendCommand,
    this.onEventAction,
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
        // Scale to fit width — if canvas is taller than screen, allow vertical scroll
        final screenSize = widget.screen.canvas;
        final scaleX = constraints.maxWidth / screenSize.width;
        final scaleY = constraints.maxHeight / screenSize.height;

        // If canvas fits within screen, center it (no scroll needed)
        // If canvas is taller, use width-based scale and enable scrolling
        final needsScroll = scaleY < scaleX; // canvas is taller relative to screen
        final scale = needsScroll ? scaleX : scaleY;

        final scaledWidth = screenSize.width * scale;
        final scaledHeight = screenSize.height * scale;
        final offsetX = (constraints.maxWidth - scaledWidth) / 2;

        Widget canvasWidget = SizedBox(
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
                children: [
                  // Canvas background (color or image)
                  Positioned.fill(
                    child: _buildBackground(),
                  ),
                  ..._buildWidgets(),
                ],
              ),
            ),
          ),
        );

        if (needsScroll) {
          // Canvas taller than screen — scrollable vertically
          return Stack(
            children: [
              Positioned.fill(
                child: Container(color: _parseColor(widget.screen.background.color)),
              ),
              ScrollConfiguration(
                behavior: ScrollConfiguration.of(context).copyWith(scrollbars: false),
                child: SingleChildScrollView(
                  physics: const ClampingScrollPhysics(),
                  child: Padding(
                    padding: EdgeInsets.only(left: offsetX > 0 ? offsetX : 0),
                    child: canvasWidget,
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
          );
        }

        // Canvas fits — center it, no scroll
        final offsetY = (constraints.maxHeight - scaledHeight) / 2;
        return ClipRect(
          child: Stack(
            children: [
              Positioned.fill(
                child: Container(color: _parseColor(widget.screen.background.color)),
              ),
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
                      children: [
                        Positioned.fill(
                          child: _buildBackground(),
                        ),
                        ..._buildWidgets(),
                      ],
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

    Widget bgWidget;
    if (bg.image != null && bg.image!.isNotEmpty) {
      BoxFit imageFit;
      switch (bg.fit) {
        case 'contain':
          imageFit = BoxFit.contain;
          break;
        case 'fill':
          imageFit = BoxFit.fill;
          break;
        case 'none':
          imageFit = BoxFit.none;
          break;
        case 'cover':
        default:
          imageFit = BoxFit.cover;
      }
      bgWidget = Image.network(
        bg.image!,
        fit: imageFit,
        errorBuilder: (_, __, ___) => Container(color: _parseColor(bg.color)),
      );
    } else {
      bgWidget = Container(color: _parseColor(bg.color));
    }

    if (bg.opacity < 1.0) {
      return Opacity(opacity: bg.opacity.clamp(0.0, 1.0), child: bgWidget);
    }
    return bgWidget;
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

    // Get raw value from source (match web bindingResolver.resolveRawValue logic)
    switch (source.type) {
      case 'telemetry':
      case 'attribute':
        rawValue = _getTelemetryValue(source.deviceId, source.key ?? '');
        break;
      case 'variable':
        rawValue = _getVariableValue(source.key ?? '');
        break;
      case 'static':
        rawValue = source.staticValue;
        break;
      case 'calculated':
        rawValue = _evaluateExpression(source.expression);
        break;
      case 'constant':
        rawValue = source.staticValue ?? source.key;
        break;
      default:
        rawValue = null;
    }

    // Apply format transformations (matching web applyFormat exactly)
    if (rawValue != null && binding.format != null) {
      rawValue = _applyFormat(rawValue, binding.format!);
    }

    // Fallback to default value if raw is still null
    if (rawValue == null && binding.defaultValue != null) {
      return binding.defaultValue;
    }

    return rawValue;
  }

  dynamic _getTelemetryValue(String? deviceId, String key) {
    debugPrint('[SCADA] _getTelemetryValue: deviceId=$deviceId, key=$key');
    debugPrint('[SCADA] Available keys: ${widget.telemetryData.keys.toList()}');
    
    // Match web format: entityId::key (SubscriptionManager cache key format)
    if (deviceId != null && deviceId.isNotEmpty) {
      final entityKey = '$deviceId::$key';
      debugPrint('[SCADA] Looking for: $entityKey');
      if (widget.telemetryData.containsKey(entityKey)) {
        final value = widget.telemetryData[entityKey];
        debugPrint('[SCADA] Found value: $value');
        return value;
      }
    }

    // Fallback: try exact key match
    if (widget.telemetryData.containsKey(key)) {
      final value = widget.telemetryData[key];
      debugPrint('[SCADA] Found by key: $value');
      return value;
    }

    debugPrint('[SCADA] Value not found!');
    return null;
  }

  dynamic _applyFormat(dynamic value, ScadaBindingFormat format) {
    if (value == null) return null;

    dynamic current = value;

    // Apply multiplier first (matches web applyFormat order)
    if (format.multiplier != null && current is num) {
      current = current * format.multiplier!;
    }

    // Apply offset
    if (format.offset != null && current is num) {
      current = current + format.offset!;
    }

    // Value map (e.g. "0" → "OFF", "1" → "ON") — matches web format.valueMap
    if (format.valueMap != null && format.valueMap!.isNotEmpty) {
      final mapped = format.valueMap![current.toString()];
      if (mapped != null) return mapped;
    }

    // Numeric formatting (matches web format.type === 'number')
    if (format.type == 'number' && current is num) {
      String formatted;
      if (format.decimals != null) {
        formatted = current.toStringAsFixed(format.decimals!);
      } else {
        formatted = current.toString();
      }
      final prefix = format.prefix ?? '';
      final suffix = format.suffix ?? '';
      final unit = format.unit != null ? ' ${format.unit}' : '';
      return '$prefix$formatted$suffix$unit';
    }

    // Apply decimals only (legacy path)
    if (current is num && format.decimals != null) {
      current = double.parse(current.toStringAsFixed(format.decimals!));
    }

    return current;
  }

  /// Get variable value from screen variables (matches web resolveRawValue for 'variable' type)
  dynamic _getVariableValue(String variableName) {
    for (final variable in widget.screen.variables) {
      if (variable.name == variableName) {
        // Check telemetry for runtime-updated variables
        if (widget.telemetryData.containsKey('var::$variableName')) {
          return widget.telemetryData['var::$variableName'];
        }
        return variable.defaultValue;
      }
    }
    return null;
  }

  /// Evaluate calculated expression (matches web evaluateExpression)
  /// Supports: ${entityId::key} and ${variableName} references
  dynamic _evaluateExpression(String? expression) {
    if (expression == null || expression.isEmpty) return null;

    try {
      String expr = expression;

      // Replace ${entityId::key} references with actual values
      final entityPattern = RegExp(r'\$\{([^:}]+)::([^}]+)\}');
      expr = expr.replaceAllMapped(entityPattern, (match) {
        final entityId = match.group(1)?.trim() ?? '';
        final key = match.group(2)?.trim() ?? '';
        final val = _getTelemetryValue(entityId, key);
        return val?.toString() ?? '0';
      });

      // Replace ${variableName} references
      final varPattern = RegExp(r'\$\{(\w+)\}');
      expr = expr.replaceAllMapped(varPattern, (match) {
        final name = match.group(1) ?? '';
        // Try telemetry data first, then variables
        if (widget.telemetryData.containsKey(name)) {
          return widget.telemetryData[name]?.toString() ?? '0';
        }
        final val = _getVariableValue(name);
        return val?.toString() ?? '0';
      });

      // Simple arithmetic evaluation (safe: only numbers and operators)
      if (RegExp(r'^[\d\s+\-*/().]+$').hasMatch(expr)) {
        return _evalArithmetic(expr);
      }

      return expr;
    } catch (e) {
      debugPrint('[SCADA] Expression eval error: $e');
      return null;
    }
  }

  /// Simple safe arithmetic evaluator (no dart eval, just basic ops)
  double? _evalArithmetic(String expr) {
    try {
      // Remove whitespace
      expr = expr.replaceAll(' ', '');
      // Simple single-operation parsing for common cases
      // For complex expressions, we'd need a proper parser
      // This handles: "value * 1.8 + 32" patterns from the expression substitution
      final num result = _parseExpression(expr, 0).value;
      return result.toDouble();
    } catch (_) {
      return null;
    }
  }

  /// Recursive descent parser for arithmetic expressions
  _ParseResult _parseExpression(String expr, int pos) {
    var result = _parseFactor(expr, pos);
    
    while (result.pos < expr.length) {
      final op = expr[result.pos];
      if (op == '+' || op == '-') {
        final right = _parseFactor(expr, result.pos + 1);
        result = _ParseResult(
          op == '+' ? result.value + right.value : result.value - right.value,
          right.pos,
        );
      } else if (op == '*' || op == '/') {
        final right = _parseFactor(expr, result.pos + 1);
        result = _ParseResult(
          op == '*' ? result.value * right.value : result.value / right.value,
          right.pos,
        );
      } else {
        break;
      }
    }
    return result;
  }

  _ParseResult _parseFactor(String expr, int pos) {
    if (pos >= expr.length) return _ParseResult(0, pos);
    
    if (expr[pos] == '(') {
      final result = _parseExpression(expr, pos + 1);
      final endPos = result.pos < expr.length && expr[result.pos] == ')' ? result.pos + 1 : result.pos;
      return _ParseResult(result.value, endPos);
    }

    // Parse number (including negative and decimal)
    int end = pos;
    if (end < expr.length && expr[end] == '-') end++;
    while (end < expr.length && (expr.codeUnitAt(end) >= 48 && expr.codeUnitAt(end) <= 57 || expr[end] == '.')) {
      end++;
    }
    if (end == pos) return _ParseResult(0, pos);
    return _ParseResult(double.parse(expr.substring(pos, end)), end);
  }

  /// Normalize trigger name (click → onClick, change → onValueChange)
  String _normalizeTrigger(String trigger) {
    // Map from widget registry trigger to event trigger
    switch (trigger) {
      case 'click':
        return 'onClick';
      case 'doubleClick':
        return 'onDoubleClick';
      case 'change':
        return 'onValueChange';
      case 'toggle':
        return 'onClick';
      default:
        // Already normalized or custom trigger
        return trigger.startsWith('on') ? trigger : 'on${trigger[0].toUpperCase()}${trigger.substring(1)}';
    }
  }

  void _handleAction(
    ScadaWidgetInstance widgetDef,
    String trigger,
    Map<String, dynamic> payload,
  ) {
    debugPrint('[SCADA-RENDERER] _handleAction: widget=${widgetDef.type}, trigger=$trigger');
    debugPrint('[SCADA-RENDERER] Widget has ${widgetDef.events.length} events, ${widgetDef.actions.length} legacy actions');
    
    // First: Check for event-based actions (new format)
    final normalizedTrigger = _normalizeTrigger(trigger);
    debugPrint('[SCADA-RENDERER] Normalized trigger: $normalizedTrigger');
    
    for (final evt in widgetDef.events) {
      debugPrint('[SCADA-RENDERER] Event: trigger=${evt.trigger}, enabled=${evt.enabled}, actions=${evt.actions.length}');
    }
    
    final matchingEvent = widgetDef.events.where((e) => 
        e.enabled && (e.trigger == trigger || e.trigger == normalizedTrigger)
    ).firstOrNull;

    if (matchingEvent != null && matchingEvent.actions.isNotEmpty) {
      debugPrint('[SCADA-RENDERER] Found matching event! Executing ${matchingEvent.actions.length} actions');
      _executeEventActions(widgetDef, matchingEvent.actions, payload);
      return;
    }

    // Second: Fall back to legacy action format
    final action = widgetDef.actions.firstWhere(
      (a) => a.trigger == trigger,
      orElse: () => ScadaAction(
        trigger: trigger,
        type: 'none',
        params: {},
      ),
    );

    if (action.type == 'none') {
      // No action defined, call general callback
      widget.onAction?.call(widgetDef, trigger, payload);
      return;
    }

    _executeLegacyAction(widgetDef, action, payload);
  }

  /// Execute event actions (new format from frontend)
  void _executeEventActions(
    ScadaWidgetInstance widgetDef,
    List<ScadaEventAction> actions,
    Map<String, dynamic> payload,
  ) {
    for (final action in actions) {
      switch (action.type) {
        case ActionTypes.navigateToPage:
          widget.onEventAction?.call(action, {
            'widgetId': widgetDef.id,
            'targetPageId': action.targetPageId,
          });
          break;

        case ActionTypes.goBack:
          widget.onEventAction?.call(action, {'widgetId': widgetDef.id});
          break;

        case ActionTypes.goHome:
          widget.onEventAction?.call(action, {'widgetId': widgetDef.id});
          break;

        case ActionTypes.openPopup:
          widget.onEventAction?.call(action, {
            'widgetId': widgetDef.id,
            'popupPageId': action.popupPageId,
          });
          break;

        case ActionTypes.closePopup:
          widget.onEventAction?.call(action, {
            'widgetId': widgetDef.id,
            'popupPageId': action.popupPageId,
          });
          break;

        case ActionTypes.rpcCall:
          if (action.deviceId != null && action.rpcMethod != null) {
            final params = <String, dynamic>{
              ...?action.rpcParams,
              ...payload,
            };
            widget.onSendCommand?.call(action.deviceId!, action.rpcMethod!, params);
          }
          break;

        case ActionTypes.setAttribute:
          if (action.deviceId != null && action.attributeKey != null) {
            widget.onSendCommand?.call(action.deviceId!, 'setAttribute', {
              'key': action.attributeKey,
              'value': action.attributeValue ?? payload['value'],
              'scope': action.attributeScope ?? 'SHARED_SCOPE',
            });
          }
          break;

        case ActionTypes.setVariable:
          if (action.variableName != null) {
            widget.onEventAction?.call(action, {
              'widgetId': widgetDef.id,
              'variableName': action.variableName,
              'variableValue': action.variableValue ?? payload['value'],
              'scope': action.variableScope ?? 'page',
            });
          }
          break;

        case ActionTypes.showNotification:
          widget.onEventAction?.call(action, {
            'widgetId': widgetDef.id,
            'message': action.notificationMessage,
            'level': action.notificationLevel ?? 'info',
            'durationMs': action.notificationDurationMs ?? 3000,
          });
          break;

        default:
          // Pass to generic handler
          widget.onEventAction?.call(action, payload);
      }
    }
  }

  /// Execute legacy action format
  void _executeLegacyAction(
    ScadaWidgetInstance widgetDef,
    ScadaAction action,
    Map<String, dynamic> payload,
  ) {
    final config = action.params;

    // Match web RuntimeRenderer.handleAction switch cases
    switch (action.type) {
      case 'rpcCall':
        // RPC call to device
        final deviceId = config['deviceId'] as String?;
        final rpcMethod = config['rpcMethod'] as String?;
        final rpcParams = <String, dynamic>{
          ...?config['rpcParams'] as Map<String, dynamic>?,
          ...payload,
        };
        if (deviceId != null && rpcMethod != null) {
          widget.onSendCommand?.call(deviceId, rpcMethod, rpcParams);
        }
        break;
        
      case 'setAttribute':
        // Set device attribute
        final deviceId = config['deviceId'] as String?;
        final attributeKey = config['attributeKey'] as String?;
        final attributeValue = payload['value'] ?? config['attributeValue'];
        if (deviceId != null && attributeKey != null) {
          widget.onSendCommand?.call(deviceId, 'setAttribute', {
            'key': attributeKey,
            'value': attributeValue,
            'scope': config['attributeScope'] ?? 'SHARED_SCOPE',
          });
        }
        break;
        
      case 'setVariable':
        // Set screen variable (handled by onAction callback)
        final variableName = config['variableName'] as String?;
        final variableValue = payload['value'] ?? config['variableValue'];
        if (variableName != null) {
          widget.onAction?.call(widgetDef, 'setVariable', {
            'name': variableName,
            'value': variableValue,
          });
        }
        break;
        
      case 'navigate':
        // Navigate to another screen/window
        final targetWindowId = config['targetWindowId'] as String?;
        if (targetWindowId != null) {
          widget.onAction?.call(widgetDef, 'navigate', {
            'windowId': targetWindowId,
          });
        }
        break;

      // Legacy support
      case 'sendCommand':
        final deviceId = config['deviceId'] as String?;
        final key = config['key'] as String?;
        final value = payload['value'] ?? config['value'];
        if (deviceId != null && key != null) {
          widget.onSendCommand?.call(deviceId, key, value);
        }
        break;
        
      case 'setValue':
        // Legacy: same as setVariable
        widget.onAction?.call(widgetDef, action.trigger, {...config, ...payload});
        break;
        
      default:
        widget.onAction?.call(widgetDef, action.trigger, payload);
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
    if (color == 'transparent') return Colors.transparent;
    if (color.startsWith('#')) {
      final hex = color.replaceFirst('#', '');
      if (hex.length == 6) {
        return Color(int.parse('FF$hex', radix: 16));
      } else if (hex.length == 8) {
        return Color(int.parse(hex, radix: 16));
      }
    }
    if (color.startsWith('rgba')) {
      final match = RegExp(r'rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)').firstMatch(color);
      if (match != null) {
        final r = int.parse(match.group(1)!);
        final g = int.parse(match.group(2)!);
        final b = int.parse(match.group(3)!);
        final a = match.group(4) != null ? (double.parse(match.group(4)!) * 255).round() : 255;
        return Color.fromARGB(a, r, g, b);
      }
    }
    if (color.startsWith('rgb')) {
      final match = RegExp(r'rgb\((\d+),\s*(\d+),\s*(\d+)\)').firstMatch(color);
      if (match != null) {
        return Color.fromARGB(255, int.parse(match.group(1)!), int.parse(match.group(2)!), int.parse(match.group(3)!));
      }
    }
    return Colors.white;
  }
}

/// Extension to parse screen definition from JSON
extension ScadaScreenParser on ScadaScreenDefinition {
  static ScadaScreenDefinition fromJson(Map<String, dynamic> json) {
    List<ScadaLayer> layers = _parseLayers(json['layers']);

    // If layers exist but have zero widgets, check for root-level widgets
    // (web frontend stores widgets at page level, not inside layers)
    final totalWidgets = layers.fold<int>(0, (sum, l) => sum + l.widgets.length);
    if (totalWidgets == 0 && json['widgets'] is List && (json['widgets'] as List).isNotEmpty) {
      final rootWidgets = _parseWidgets(json['widgets']);
      if (layers.isEmpty) {
        layers = [
          ScadaLayer(id: 'default', name: 'Default', widgets: rootWidgets, visible: true, locked: false),
        ];
      } else {
        // Distribute widgets to layers by layerId
        final layerMap = {for (final l in layers) l.id: <ScadaWidgetInstance>[]};
        final orphans = <ScadaWidgetInstance>[];
        for (final w in rootWidgets) {
          // Get layerId from the raw JSON
          final rawWidget = (json['widgets'] as List).firstWhere(
            (raw) => raw is Map && raw['id'] == w.id,
            orElse: () => null,
          );
          final layerId = rawWidget is Map ? rawWidget['layerId'] as String? : null;
          if (layerId != null && layerMap.containsKey(layerId)) {
            layerMap[layerId]!.add(w);
          } else {
            orphans.add(w);
          }
        }
        // Rebuild layers with their widgets
        layers = layers.map((l) {
          final widgets = layerMap[l.id] ?? [];
          return ScadaLayer(
            id: l.id, name: l.name,
            widgets: widgets,
            visible: l.visible, locked: l.locked,
          );
        }).toList();
        // Add orphans to first layer
        if (orphans.isNotEmpty && layers.isNotEmpty) {
          final first = layers.first;
          layers[0] = ScadaLayer(
            id: first.id, name: first.name,
            widgets: [...first.widgets, ...orphans],
            visible: first.visible, locked: first.locked,
          );
        }
      }
    }

    return ScadaScreenDefinition(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Untitled',
      canvas: _parseSize(json['canvas']),
      background: _parseBackground(json['background']),
      layers: layers,
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
          events: _parseEvents(item['events']),
          visible: item['visible'] as bool? ?? true,
          locked: item['locked'] as bool? ?? false,
        );
      }
      return ScadaWidgetInstance(
        id: '', type: 'unknown', name: '',
        transform: ScadaTransform.defaultTransform(),
        properties: {}, bindings: [], actions: [], events: [],
        visible: true, locked: false,
      );
    }).toList();
  }

  static List<WidgetEvent> _parseEvents(dynamic json) {
    if (json == null || json is! List) return [];
    return json.map<WidgetEvent>((item) {
      if (item is Map<String, dynamic>) {
        return WidgetEvent.fromJson(item);
      }
      return WidgetEvent(id: '', trigger: 'onClick', actions: [], enabled: true);
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
          transform: item['transform'] as String?,
          defaultValue: item['defaultValue'],
        );
      }
      return ScadaBinding(
        id: '', targetProperty: '',
        source: const ScadaBindingSource(type: 'static'),
        format: null,
      );
    }).toList();
  }

  static ScadaBindingSource _parseBindingSource(dynamic json) {
    if (json == null) return const ScadaBindingSource(type: 'static');
    if (json is Map<String, dynamic>) {
      return ScadaBindingSource(
        type: json['type'] as String? ?? 'static',
        entityType: json['entityType'] as String?,
        deviceId: json['deviceId'] as String? ?? json['entityId'] as String?,
        key: json['key'] as String? ?? json['dataKey'] as String?,
        attributeScope: json['attributeScope'] as String?,
        staticValue: json['staticValue'],
        expression: json['expression'] as String?,
      );
    }
    return const ScadaBindingSource(type: 'static');
  }

  static ScadaBindingFormat? _parseBindingFormat(dynamic json) {
    if (json == null) return null;
    if (json is Map<String, dynamic>) {
      return ScadaBindingFormat.fromJson(json);
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
