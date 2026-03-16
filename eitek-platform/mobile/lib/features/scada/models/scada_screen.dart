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

  const ScadaBackground({
    this.color = '#FFFFFF',
    this.image,
    this.svg,
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
    } else if (json['widgets'] != null && json['widgets'] is List) {
      // Create default layer with widgets from root
      layers = [
        ScadaLayer(
          id: 'default',
          name: 'Default',
          widgets: (json['widgets'] as List)
              .map((e) => ScadaWidgetInstance.fromJson(e as Map<String, dynamic>))
              .toList(),
          visible: true,
          locked: false,
        ),
      ];
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
    
    // Parse actions
    List<ScadaAction> actions = [];
    final actionsRaw = json['actions'];
    if (actionsRaw is List) {
      actions = actionsRaw
          .whereType<Map>()
          .map((e) => ScadaAction.fromJson(Map<String, dynamic>.from(e)))
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

  const ScadaBinding({
    required this.id,
    required this.targetProperty,
    required this.source,
    this.format,
  });

  factory ScadaBinding.fromJson(Map<String, dynamic> json) {
    return ScadaBinding(
      id: json['id'] as String? ?? '',
      targetProperty: json['targetProperty'] as String? ?? '',
      source: ScadaBindingSource.fromJson(json['source']),
      format: json['format'] != null && json['format'] is Map
          ? ScadaBindingFormat.fromJson(Map<String, dynamic>.from(json['format'] as Map))
          : null,
    );
  }
}

class ScadaBindingSource {
  final String type; // 'telemetry', 'attribute', 'variable', 'constant'
  final String? deviceId;
  final String? key;

  const ScadaBindingSource({
    required this.type,
    this.deviceId,
    this.key,
  });

  factory ScadaBindingSource.fromJson(dynamic json) {
    if (json is! Map) {
      return const ScadaBindingSource(type: 'constant');
    }
    final map = Map<String, dynamic>.from(json);
    return ScadaBindingSource(
      type: map['type'] as String? ?? 'constant',
      deviceId: map['deviceId'] as String? ?? map['entityId'] as String?,
      key: map['key'] as String? ?? map['dataKey'] as String?,
    );
  }
}

class ScadaBindingFormat {
  final int? decimals;
  final String? unit;
  final double? multiplier;
  final double? offset;
  final Map<String, dynamic>? mapping;

  const ScadaBindingFormat({
    this.decimals,
    this.unit,
    this.multiplier,
    this.offset,
    this.mapping,
  });

  factory ScadaBindingFormat.fromJson(Map<String, dynamic> json) {
    return ScadaBindingFormat(
      decimals: json['decimals'] as int?,
      unit: json['unit'] as String?,
      multiplier: (json['multiplier'] as num?)?.toDouble(),
      offset: (json['offset'] as num?)?.toDouble(),
      mapping: json['mapping'] as Map<String, dynamic>?,
    );
  }
}

// ─── Action ──────────────────────────────────────────────────────────────────

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
