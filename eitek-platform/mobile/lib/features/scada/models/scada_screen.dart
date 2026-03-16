// SCADA Screen Definition Models
//
// Dart models for native Flutter SCADA renderer.
// Matches the ScadaRenderer expectations.

// ─── Geometry ────────────────────────────────────────────────────────────────

class ScadaPoint {
  final double x;
  final double y;

  const ScadaPoint({required this.x, required this.y});

  factory ScadaPoint.fromJson(dynamic json) {
    if (json is Map) {
      final map = Map<String, dynamic>.from(json);
      return ScadaPoint(
        x: (map['x'] as num?)?.toDouble() ?? 0,
        y: (map['y'] as num?)?.toDouble() ?? 0,
      );
    }
    return const ScadaPoint(x: 0, y: 0);
  }

  Map<String, dynamic> toJson() => {'x': x, 'y': y};
}

class ScadaSize {
  final double width;
  final double height;

  const ScadaSize({required this.width, required this.height});

  factory ScadaSize.fromJson(dynamic json) {
    if (json is Map) {
      final map = Map<String, dynamic>.from(json);
      return ScadaSize(
        width: (map['width'] as num?)?.toDouble() ?? 100,
        height: (map['height'] as num?)?.toDouble() ?? 100,
      );
    }
    return const ScadaSize(width: 100, height: 100);
  }

  Map<String, dynamic> toJson() => {'width': width, 'height': height};
}

class ScadaTransform {
  final ScadaPoint position;
  final ScadaSize size;
  final double rotation;
  final ScadaPoint scale;
  final double opacity;

  const ScadaTransform({
    required this.position,
    required this.size,
    this.rotation = 0,
    this.scale = const ScadaPoint(x: 1, y: 1),
    this.opacity = 1.0,
  });

  factory ScadaTransform.fromJson(dynamic json) {
    if (json is! Map) {
      return ScadaTransform.defaultTransform();
    }
    final map = Map<String, dynamic>.from(json);
    return ScadaTransform(
      position: ScadaPoint.fromJson(map['position'] ?? {'x': 0, 'y': 0}),
      size: ScadaSize.fromJson(map['size'] ?? {'width': 100, 'height': 100}),
      rotation: (map['rotation'] as num?)?.toDouble() ?? 0,
      scale: map['scale'] != null 
          ? ScadaPoint.fromJson(map['scale']) 
          : const ScadaPoint(x: 1, y: 1),
      opacity: (map['opacity'] as num?)?.toDouble() ?? 1.0,
    );
  }

  factory ScadaTransform.defaultTransform() {
    return const ScadaTransform(
      position: ScadaPoint(x: 0, y: 0),
      size: ScadaSize(width: 100, height: 100),
    );
  }
}

// ─── Background ──────────────────────────────────────────────────────────────

class ScadaBackground {
  final String color;
  final String? image;
  final String? svg;
  final String? fit;
  final double opacity;

  const ScadaBackground({
    this.color = '#FFFFFF',
    this.image,
    this.svg,
    this.fit,
    this.opacity = 1.0,
  });

  factory ScadaBackground.fromJson(dynamic json) {
    // Handle string format (just a color)
    if (json is String) {
      return ScadaBackground(color: json);
    }
    // Handle Map format
    if (json is Map) {
      final map = Map<String, dynamic>.from(json);
      return ScadaBackground(
        color: map['color'] as String? ?? '#FFFFFF',
        image: map['image'] as String? ?? map['imageUrl'] as String?,
        svg: map['svg'] as String? ?? map['svgAssetId'] as String?,
        fit: map['fit'] as String?,
        opacity: (map['opacity'] as num?)?.toDouble() ?? 1.0,
      );
    }
    return const ScadaBackground();
  }
}

// ─── Screen Definition ───────────────────────────────────────────────────────

class ScadaScreenDefinition {
  final String id;
  final String name;
  final ScadaSize canvas;
  final ScadaBackground background;
  final List<ScadaLayer> layers;
  final List<ScadaVariable> variables;

  const ScadaScreenDefinition({
    required this.id,
    required this.name,
    required this.canvas,
    required this.background,
    this.layers = const [],
    this.variables = const [],
  });

  factory ScadaScreenDefinition.fromJson(Map<String, dynamic> json) {
    // Parse widgets from root level or from layers
    List<ScadaLayer> layers = [];
    
    if (json['layers'] != null && json['layers'] is List) {
      layers = (json['layers'] as List)
          .map((e) => ScadaLayer.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    
    // Check if layers have zero widgets but root-level widgets exist
    // (web frontend stores widgets at page level with layerId references)
    final totalLayerWidgets = layers.fold<int>(0, (sum, l) => sum + l.widgets.length);
    if (totalLayerWidgets == 0 && json['widgets'] != null && json['widgets'] is List) {
      final rootWidgets = (json['widgets'] as List)
          .whereType<Map>()
          .map((e) => ScadaWidgetInstance.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      
      if (layers.isEmpty) {
        layers = [
          ScadaLayer(
            id: 'default',
            name: 'Default',
            widgets: rootWidgets,
            visible: true,
            locked: false,
          ),
        ];
      } else {
        // Distribute widgets into layers by layerId
        final rawWidgets = (json['widgets'] as List).whereType<Map>().toList();
        final layerIds = layers.map((l) => l.id).toSet();
        final layerWidgetsMap = <String, List<ScadaWidgetInstance>>{};
        final orphans = <ScadaWidgetInstance>[];
        
        for (int i = 0; i < rootWidgets.length; i++) {
          final rawW = rawWidgets[i];
          final layerId = rawW['layerId'] as String?;
          if (layerId != null && layerIds.contains(layerId)) {
            layerWidgetsMap.putIfAbsent(layerId, () => []).add(rootWidgets[i]);
          } else {
            orphans.add(rootWidgets[i]);
          }
        }
        
        layers = layers.map((l) => ScadaLayer(
          id: l.id,
          name: l.name,
          widgets: layerWidgetsMap[l.id] ?? [],
          visible: l.visible,
          locked: l.locked,
        )).toList();
        
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
      canvas: ScadaSize.fromJson(
        json['canvas'] ?? json['canvasSize'] ?? {'width': 1920, 'height': 1080},
      ),
      background: ScadaBackground.fromJson(json['background'] ?? {}),
      layers: layers,
      variables: (json['variables'] as List<dynamic>?)
              ?.map((e) => ScadaVariable.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

// ─── Layer ───────────────────────────────────────────────────────────────────

class ScadaLayer {
  final String id;
  final String name;
  final List<ScadaWidgetInstance> widgets;
  final bool visible;
  final bool locked;

  const ScadaLayer({
    required this.id,
    required this.name,
    required this.widgets,
    this.visible = true,
    this.locked = false,
  });

  factory ScadaLayer.fromJson(Map<String, dynamic> json) {
    return ScadaLayer(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Layer',
      widgets: (json['widgets'] as List<dynamic>?)
              ?.map((e) => ScadaWidgetInstance.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      visible: json['visible'] as bool? ?? true,
      locked: json['locked'] as bool? ?? false,
    );
  }
}

// ─── Variable ────────────────────────────────────────────────────────────────

class ScadaVariable {
  final String name;
  final String type;
  final dynamic defaultValue;

  const ScadaVariable({
    required this.name,
    required this.type,
    this.defaultValue,
  });

  factory ScadaVariable.fromJson(Map<String, dynamic> json) {
    return ScadaVariable(
      name: json['name'] as String? ?? '',
      type: json['type'] as String? ?? 'string',
      defaultValue: json['defaultValue'],
    );
  }
}

// ─── Widget Instance ─────────────────────────────────────────────────────────

class ScadaWidgetInstance {
  final String id;
  final String type;
  final String name;
  final ScadaTransform transform;
  final Map<String, dynamic> properties;
  final List<ScadaBinding> bindings;
  final List<ScadaAction> actions;
  final List<WidgetEvent> events;  // New: event-driven actions
  final bool visible;
  final bool locked;

  const ScadaWidgetInstance({
    required this.id,
    required this.type,
    required this.name,
    required this.transform,
    required this.properties,
    required this.bindings,
    required this.actions,
    required this.events,
    this.visible = true,
    this.locked = false,
  });

  factory ScadaWidgetInstance.fromJson(Map<String, dynamic> json) {
    // Parse bindings - can be List or Map format
    List<ScadaBinding> bindings = [];
    final bindingsRaw = json['bindings'];
    if (bindingsRaw is List) {
      bindings = bindingsRaw
          .whereType<Map>()
          .map((e) => ScadaBinding.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } else if (bindingsRaw is Map) {
      // Convert Map format { "value": {...} } to List format
      int index = 0;
      bindingsRaw.forEach((key, value) {
        if (value is Map) {
          final valueMap = Map<String, dynamic>.from(value);
          bindings.add(ScadaBinding(
            id: 'binding-$index',
            targetProperty: key as String,
            source: ScadaBindingSource.fromJson(valueMap),
          ));
          index++;
        }
      });
    }
    
    // Parse legacy actions
    List<ScadaAction> actions = [];
    final actionsRaw = json['actions'];
    if (actionsRaw is List) {
      actions = actionsRaw
          .whereType<Map>()
          .map((e) => ScadaAction.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }
    
    // Parse events (new format)
    List<WidgetEvent> events = [];
    final eventsRaw = json['events'];
    if (eventsRaw is List) {
      events = eventsRaw
          .whereType<Map>()
          .map((e) => WidgetEvent.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }
    
    return ScadaWidgetInstance(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'unknown',
      name: json['name'] as String? ?? '',
      transform: ScadaTransform.fromJson(json['transform'] ?? {}),
      properties: json['properties'] is Map 
          ? Map<String, dynamic>.from(json['properties'] as Map)
          : {},
      bindings: bindings,
      actions: actions,
      events: events,
      visible: json['visible'] as bool? ?? true,
      locked: json['locked'] as bool? ?? false,
    );
  }

  /// Get property value with fallback
  T getProp<T>(String key, T defaultValue) {
    final value = properties[key];
    if (value == null) return defaultValue;
    if (value is T) return value;
    if (T == double && value is num) return value.toDouble() as T;
    if (T == int && value is num) return value.toInt() as T;
    if (T == String) return value.toString() as T;
    return defaultValue;
  }
}

// ─── Binding ─────────────────────────────────────────────────────────────────

class ScadaBinding {
  final String id;
  final String targetProperty;
  final ScadaBindingSource source;
  final ScadaBindingFormat? format;
  final String? transform; // Post-processing expression
  final dynamic defaultValue; // Fallback when source is unavailable

  const ScadaBinding({
    required this.id,
    required this.targetProperty,
    required this.source,
    this.format,
    this.transform,
    this.defaultValue,
  });

  factory ScadaBinding.fromJson(Map<String, dynamic> json) {
    return ScadaBinding(
      id: json['id'] as String? ?? '',
      targetProperty: json['targetProperty'] as String? ?? '',
      source: ScadaBindingSource.fromJson(json['source']),
      format: json['format'] != null && json['format'] is Map
          ? ScadaBindingFormat.fromJson(Map<String, dynamic>.from(json['format'] as Map))
          : null,
      transform: json['transform'] as String?,
      defaultValue: json['defaultValue'],
    );
  }
}

class ScadaBindingSource {
  final String type; // 'telemetry', 'attribute', 'variable', 'static', 'calculated', 'alarm'
  final String? entityType; // 'DEVICE', 'ASSET'
  final String? deviceId;
  final String? key;
  final String? attributeScope; // 'SERVER_SCOPE', 'CLIENT_SCOPE', 'SHARED_SCOPE'
  final dynamic staticValue;
  final String? expression; // For calculated bindings

  const ScadaBindingSource({
    required this.type,
    this.entityType,
    this.deviceId,
    this.key,
    this.attributeScope,
    this.staticValue,
    this.expression,
  });

  factory ScadaBindingSource.fromJson(dynamic json) {
    if (json is! Map) {
      return const ScadaBindingSource(type: 'static');
    }
    final map = Map<String, dynamic>.from(json);
    return ScadaBindingSource(
      type: map['type'] as String? ?? 'static',
      entityType: map['entityType'] as String?,
      deviceId: map['deviceId'] as String? ?? map['entityId'] as String?,
      key: map['key'] as String? ?? map['dataKey'] as String?,
      attributeScope: map['attributeScope'] as String?,
      staticValue: map['staticValue'],
      expression: map['expression'] as String?,
    );
  }
}

class ScadaBindingFormat {
  final String? type; // 'number', 'string', 'date', 'boolean'
  final int? decimals;
  final String? unit;
  final String? prefix;
  final String? suffix;
  final String? dateFormat;
  final double? multiplier;
  final double? offset;
  final Map<String, String>? valueMap;

  const ScadaBindingFormat({
    this.type,
    this.decimals,
    this.unit,
    this.prefix,
    this.suffix,
    this.dateFormat,
    this.multiplier,
    this.offset,
    this.valueMap,
  });

  factory ScadaBindingFormat.fromJson(Map<String, dynamic> json) {
    // Parse valueMap 
    Map<String, String>? valueMap;
    if (json['valueMap'] is Map) {
      valueMap = (json['valueMap'] as Map).map(
        (k, v) => MapEntry(k.toString(), v.toString()),
      );
    }
    // Also support old 'mapping' key
    if (valueMap == null && json['mapping'] is Map) {
      valueMap = (json['mapping'] as Map).map(
        (k, v) => MapEntry(k.toString(), v.toString()),
      );
    }

    return ScadaBindingFormat(
      type: json['type'] as String?,
      decimals: json['decimals'] as int?,
      unit: json['unit'] as String?,
      prefix: json['prefix'] as String?,
      suffix: json['suffix'] as String?,
      dateFormat: json['dateFormat'] as String?,
      multiplier: (json['multiplier'] as num?)?.toDouble(),
      offset: (json['offset'] as num?)?.toDouble(),
      valueMap: valueMap,
    );
  }
}

// ─── Action ──────────────────────────────────────────────────────────────────

/// Action types supported by SCADA (matches frontend ACTION_TYPES)
class ActionTypes {
  static const navigateToPage = 'navigateToPage';
  static const goBack = 'goBack';
  static const goHome = 'goHome';
  static const openPopup = 'openPopup';
  static const closePopup = 'closePopup';
  static const rpcCall = 'rpcCall';
  static const setAttribute = 'setAttribute';
  static const setVariable = 'setVariable';
  static const showNotification = 'showNotification';
  static const customScript = 'customScript';
}

/// Event action that can be executed
class ScadaEventAction {
  final String id;
  final String type;
  final String? targetPageId;      // for navigateToPage
  final String? popupPageId;       // for openPopup/closePopup
  final String? deviceId;          // for rpcCall/setAttribute
  final String? rpcMethod;         // for rpcCall
  final Map<String, dynamic>? rpcParams;
  final bool rpcOneWay;
  final int? rpcTimeout;
  final String? attributeScope;    // for setAttribute
  final String? attributeKey;
  final dynamic attributeValue;
  final String? variableName;      // for setVariable
  final dynamic variableValue;
  final String? variableScope;     // 'page' | 'global'
  final String? notificationMessage;  // for showNotification
  final String? notificationLevel; // 'success' | 'info' | 'warning' | 'error'
  final int? notificationDurationMs;
  final bool requireConfirm;
  final String? confirmMessage;

  const ScadaEventAction({
    required this.id,
    required this.type,
    this.targetPageId,
    this.popupPageId,
    this.deviceId,
    this.rpcMethod,
    this.rpcParams,
    this.rpcOneWay = true,
    this.rpcTimeout,
    this.attributeScope,
    this.attributeKey,
    this.attributeValue,
    this.variableName,
    this.variableValue,
    this.variableScope,
    this.notificationMessage,
    this.notificationLevel,
    this.notificationDurationMs,
    this.requireConfirm = false,
    this.confirmMessage,
  });

  factory ScadaEventAction.fromJson(Map<String, dynamic> json) {
    return ScadaEventAction(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'none',
      targetPageId: json['targetPageId'] as String?,
      popupPageId: json['popupPageId'] as String?,
      deviceId: json['deviceId'] as String?,
      rpcMethod: json['rpcMethod'] as String?,
      rpcParams: json['rpcParams'] is Map 
          ? Map<String, dynamic>.from(json['rpcParams'] as Map) 
          : null,
      rpcOneWay: json['rpcOneWay'] as bool? ?? true,
      rpcTimeout: json['rpcTimeout'] as int?,
      attributeScope: json['attributeScope'] as String?,
      attributeKey: json['attributeKey'] as String?,
      attributeValue: json['attributeValue'],
      variableName: json['variableName'] as String?,
      variableValue: json['variableValue'],
      variableScope: json['scope'] as String? ?? json['variableScope'] as String?,
      notificationMessage: json['message'] as String?,
      notificationLevel: json['level'] as String?,
      notificationDurationMs: json['durationMs'] as int?,
      requireConfirm: json['requireConfirm'] as bool? ?? false,
      confirmMessage: json['confirmMessage'] as String?,
    );
  }
}

/// Widget event that contains trigger and actions
class WidgetEvent {
  final String id;
  final String trigger;  // 'onClick', 'onDoubleClick', 'onValueChange', etc.
  final List<ScadaEventAction> actions;
  final bool enabled;

  const WidgetEvent({
    required this.id,
    required this.trigger,
    required this.actions,
    this.enabled = true,
  });

  factory WidgetEvent.fromJson(Map<String, dynamic> json) {
    final actionsRaw = json['actions'];
    List<ScadaEventAction> actions = [];
    if (actionsRaw is List) {
      actions = actionsRaw
          .whereType<Map>()
          .map((e) => ScadaEventAction.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }

    return WidgetEvent(
      id: json['id'] as String? ?? '',
      trigger: json['trigger'] as String? ?? 'onClick',
      actions: actions,
      enabled: json['enabled'] as bool? ?? true,
    );
  }
}

/// Legacy action format (for backward compatibility)
class ScadaAction {
  final String trigger; // 'click', 'toggle', 'change', etc.
  final String type; // 'sendCommand', 'setValue', 'navigate', 'none'
  final Map<String, dynamic> params;

  const ScadaAction({
    required this.trigger,
    required this.type,
    this.params = const {},
  });

  factory ScadaAction.fromJson(Map<String, dynamic> json) {
    return ScadaAction(
      trigger: json['trigger'] as String? ?? 'click',
      type: json['type'] as String? ?? json['actionType'] as String? ?? 'none',
      params: json['params'] is Map 
          ? Map<String, dynamic>.from(json['params'] as Map)
          : (json['config'] is Map 
              ? Map<String, dynamic>.from(json['config'] as Map)
              : {}),
    );
  }
}
