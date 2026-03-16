// SCADA View Model
// 
// Represents a SCADA view/screen from the backend.
// Contains screen definition for native rendering.

import 'package:flutter/foundation.dart';

class ScadaView {
  final String id;
  final String name;
  final String? description;
  final String? icon;
  final ScadaCanvasSize? canvasSize;
  final String? background;
  final bool isActive;
  final String? projectId;
  final String? areaId;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  
  /// Screen definition JSON for native SCADA rendering
  final Map<String, dynamic>? screenDefinition;
  
  /// Raw scada widgets from backend
  final List<Map<String, dynamic>>? scadaWidgets;

  const ScadaView({
    required this.id,
    required this.name,
    this.description,
    this.icon,
    this.canvasSize,
    this.background,
    this.isActive = true,
    this.projectId,
    this.areaId,
    this.createdAt,
    this.updatedAt,
    this.screenDefinition,
    this.scadaWidgets,
  });

  factory ScadaView.fromJson(Map<String, dynamic> json) {
    debugPrint('[SCADA-VIEW] fromJson: ${json.keys.toList()}');
    
    // Parse canvasSize - can be Map or List [width, height]
    ScadaCanvasSize? canvasSize;
    if (json['canvasSize'] != null) {
      final cs = json['canvasSize'];
      if (cs is Map<String, dynamic>) {
        canvasSize = ScadaCanvasSize.fromJson(cs);
      } else if (cs is Map) {
        canvasSize = ScadaCanvasSize.fromJson(Map<String, dynamic>.from(cs));
      } else if (cs is List && cs.length >= 2) {
        canvasSize = ScadaCanvasSize(
          width: (cs[0] as num).toInt(),
          height: (cs[1] as num).toInt(),
        );
      }
    }
    
    // Parse scadaWidgets from backend response
    List<Map<String, dynamic>>? scadaWidgets;
    if (json['scadaWidgets'] != null && json['scadaWidgets'] is List) {
      scadaWidgets = (json['scadaWidgets'] as List)
          .map((w) => w is Map<String, dynamic> ? w : Map<String, dynamic>.from(w as Map))
          .toList();
      debugPrint('[SCADA-VIEW] scadaWidgets count: ${scadaWidgets.length}');
      for (final sw in scadaWidgets) {
        debugPrint('[SCADA-VIEW] Widget keys: ${sw.keys.toList()}');
        debugPrint('[SCADA-VIEW] Widget bindings raw: ${sw['bindings']}');
        debugPrint('[SCADA-VIEW] Widget dataBindings raw: ${sw['dataBindings']}');
      }
    }
    
    // Parse background (can be string, JSON object, or null)
    String? background;
    if (json['background'] != null) {
      final bg = json['background'];
      if (bg is String) {
        background = bg;
      } else if (bg is Map) {
        final bgMap = Map<String, dynamic>.from(bg);
        background = bgMap['color'] as String? ?? '#1E1E1E';
      }
    }
    
    // Build screenDefinition from scadaWidgets, canvasSize, background
    Map<String, dynamic>? screenDefinition;
    
    // Check if screenDefinition is directly provided (full project export)
    if (json['screenDefinition'] != null) {
      screenDefinition = json['screenDefinition'] is Map 
          ? Map<String, dynamic>.from(json['screenDefinition'] as Map)
          : null;
    }
    // Check for multi-page project structure (pages array at root level)
    else if (json['pages'] is List && (json['pages'] as List).isNotEmpty) {
      // This is a full project export - pass through as screenDefinition
      screenDefinition = Map<String, dynamic>.from(json);
    }
    
    // Check for _projectData inside layout field
    // (web frontend stores full multi-page project in layout._projectData)
    if (screenDefinition == null && json['layout'] is Map) {
      final layout = Map<String, dynamic>.from(json['layout'] as Map);
      if (layout['_projectData'] is Map) {
        final projectData = Map<String, dynamic>.from(layout['_projectData'] as Map);
        debugPrint('[SCADA-VIEW] Found _projectData in layout!');
        debugPrint('[SCADA-VIEW] _projectData keys: ${projectData.keys.toList()}');
        if (projectData['pages'] is List && (projectData['pages'] as List).isNotEmpty) {
          debugPrint('[SCADA-VIEW] Multi-page project with ${(projectData['pages'] as List).length} pages');
          screenDefinition = projectData;
        }
      }
    }
    
    // Fallback: build from scadaWidgets if available
    if (screenDefinition == null && scadaWidgets != null && scadaWidgets.isNotEmpty) {
      screenDefinition = _buildScreenDefinition(
        canvasSize: canvasSize,
        background: background,
        scadaWidgets: scadaWidgets,
      );
    }
    
    return ScadaView(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Untitled',
      description: json['description'] as String?,
      icon: json['icon'] as String?,
      canvasSize: canvasSize,
      background: background,
      isActive: json['isActive'] as bool? ?? true,
      projectId: json['projectId'] as String?,
      areaId: json['areaId'] as String?,
      createdAt: json['createdAt'] != null 
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null 
          ? DateTime.tryParse(json['updatedAt'] as String)
          : null,
      screenDefinition: screenDefinition,
      scadaWidgets: scadaWidgets,
    );
  }
  
  /// Build screenDefinition from backend data
  static Map<String, dynamic> _buildScreenDefinition({
    ScadaCanvasSize? canvasSize,
    String? background,
    required List<Map<String, dynamic>> scadaWidgets,
  }) {
    debugPrint('[SCADA-VIEW] Building screenDefinition from ${scadaWidgets.length} scadaWidgets');
    
    // Transform scadaWidgets to widget instances
    final widgetInstances = scadaWidgets.map((sw) {
      debugPrint('[SCADA-VIEW] Processing scadaWidget: ${sw['id']}');
      
      // Get widget info (from related Widget model) - safe cast
      Map<String, dynamic>? widget;
      if (sw['widget'] is Map) {
        widget = Map<String, dynamic>.from(sw['widget'] as Map);
      }
      final widgetType = widget?['type'] as String? ?? 'valueDisplay';
      debugPrint('[SCADA-VIEW] Widget type: $widgetType');
      
      // Get position data - safe cast
      Map<String, dynamic> position = {};
      if (sw['position'] is Map) {
        position = Map<String, dynamic>.from(sw['position'] as Map);
      }
      final x = (position['x'] as num?)?.toDouble() ?? 0;
      final y = (position['y'] as num?)?.toDouble() ?? 0;
      final width = (position['width'] as num?)?.toDouble() ?? 100;
      final height = (position['height'] as num?)?.toDouble() ?? 100;
      final rotation = (position['rotation'] as num?)?.toDouble() ?? 0;
      
      // Get properties, bindings, actions from scadaWidget - safe cast
      Map<String, dynamic> properties = {};
      if (sw['properties'] is Map) {
        properties = Map<String, dynamic>.from(sw['properties'] as Map);
      }
      
      // Backend returns dataBindings, but also support bindings for backwards compat
      List<Map<String, dynamic>> bindings = [];
      final rawBindings = sw['dataBindings'] ?? sw['bindings'];
      debugPrint('[SCADA-VIEW] rawBindings type: ${rawBindings.runtimeType}, value: $rawBindings');
      if (rawBindings is List) {
        bindings = rawBindings
            .whereType<Map>()
            .map((b) => Map<String, dynamic>.from(b))
            .toList();
      } else if (rawBindings is Map) {
        // Legacy format: convert Map to List
        int index = 0;
        rawBindings.forEach((key, value) {
          if (value is Map) {
            bindings.add({
              'id': 'binding-$index',
              'targetProperty': key,
              'source': Map<String, dynamic>.from(value),
            });
            index++;
          }
        });
      }
      debugPrint('[SCADA-VIEW] Parsed bindings: $bindings');
      
      List<Map<String, dynamic>> actions = [];
      if (sw['actions'] is List) {
        actions = (sw['actions'] as List)
            .whereType<Map>()
            .map((a) => Map<String, dynamic>.from(a))
            .toList();
      }
      
      // Parse events (new format)
      List<Map<String, dynamic>> events = [];
      if (sw['events'] is List) {
        events = (sw['events'] as List)
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      }
      
      // Merge widget config into properties if available - safe cast
      Map<String, dynamic> widgetConfig = {};
      if (widget != null && widget['config'] is Map) {
        widgetConfig = Map<String, dynamic>.from(widget['config'] as Map);
      }
      final mergedProperties = {...widgetConfig, ...properties};
      
      return {
        'id': sw['id'] as String? ?? 'widget-${DateTime.now().millisecondsSinceEpoch}',
        'type': widgetType,
        'name': widget?['name'] as String? ?? widgetType,
        'transform': {
          'position': {'x': x, 'y': y},
          'size': {'width': width, 'height': height},
          'rotation': rotation,
          'scale': {'x': 1.0, 'y': 1.0},
          'opacity': 1.0,
        },
        'properties': mergedProperties,
        'bindings': bindings,  // Already in correct format from API
        'actions': _transformActions(actions),
        'events': events,  // Pass events directly
        'visible': sw['isVisible'] as bool? ?? sw['visible'] as bool? ?? true,
      };
    }).toList();
    
    return {
      'id': 'screen-${DateTime.now().millisecondsSinceEpoch}',
      'name': 'SCADA Screen',
      'canvas': {
        'width': (canvasSize?.width ?? 375).toDouble(),
        'height': (canvasSize?.height ?? 812).toDouble(),
      },
      'background': {
        'color': background ?? '#1E1E1E',
      },
      'layers': [
        {
          'id': 'layer-main',
          'name': 'Main Layer',
          'visible': true,
          'locked': false,
          'opacity': 1.0,
          'widgets': widgetInstances,
        },
      ],
      'variables': [],
    };
  }
  
  /// Transform actions from backend format to mobile format
  static List<Map<String, dynamic>> _transformActions(List<Map<String, dynamic>> actions) {
    return actions.map((action) {
      return {
        'id': action['id'] ?? 'action-${DateTime.now().millisecondsSinceEpoch}',
        'trigger': action['trigger'] ?? 'click',
        'type': action['type'] ?? action['actionType'] ?? 'rpc',
        'config': action['config'] ?? action,
      };
    }).toList();
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'icon': icon,
    'canvasSize': canvasSize?.toJson(),
    'background': background,
    'isActive': isActive,
    'projectId': projectId,
    'areaId': areaId,
    'createdAt': createdAt?.toIso8601String(),
    'updatedAt': updatedAt?.toIso8601String(),
    'screenDefinition': screenDefinition,
    'scadaWidgets': scadaWidgets,
  };

  /// Check if this view has a screen definition for native rendering
  bool get hasScreenDefinition => 
      screenDefinition != null || 
      (scadaWidgets != null && scadaWidgets!.isNotEmpty);

  /// Check if this view is designed for mobile (width <= 480)
  bool get isMobileOptimized {
    if (canvasSize == null) return false;
    return canvasSize!.width <= 480;
  }

  /// Check if this view is designed for tablet (width <= 1024)
  bool get isTabletOptimized {
    if (canvasSize == null) return false;
    return canvasSize!.width <= 1024 && canvasSize!.width > 480;
  }

  /// Get screen type label
  String get screenTypeLabel {
    if (canvasSize == null) return 'Unknown';
    if (canvasSize!.width <= 480) return 'Mobile';
    if (canvasSize!.width <= 1024) return 'Tablet';
    return 'Desktop';
  }

  @override
  String toString() => 'ScadaView(id: $id, name: $name)';
}

/// Canvas size for SCADA view
class ScadaCanvasSize {
  final int width;
  final int height;

  const ScadaCanvasSize({
    required this.width,
    required this.height,
  });

  factory ScadaCanvasSize.fromJson(Map<String, dynamic> json) {
    return ScadaCanvasSize(
      width: (json['width'] as num?)?.toInt() ?? 1920,
      height: (json['height'] as num?)?.toInt() ?? 1080,
    );
  }

  Map<String, dynamic> toJson() => {
    'width': width,
    'height': height,
  };

  String get displaySize => '${width}x$height';

  @override
  String toString() => displaySize;
}

/// Recommended SCADA canvas sizes for different devices
/// 
/// When creating SCADA views for mobile, use these sizes:
/// - Phone Portrait: 375 x 812 (iPhone X standard)
/// - Phone Landscape: 812 x 375
/// - Tablet Portrait: 768 x 1024 (iPad standard)
/// - Tablet Landscape: 1024 x 768
/// 
/// The WebView runtime will auto-fit any size to the screen.
class ScadaRecommendedSizes {
  static const phonePortrait = ScadaCanvasSize(width: 375, height: 812);
  static const phoneLandscape = ScadaCanvasSize(width: 812, height: 375);
  static const tabletPortrait = ScadaCanvasSize(width: 768, height: 1024);
  static const tabletLandscape = ScadaCanvasSize(width: 1024, height: 768);
  
  /// Max width considered as "mobile-friendly"
  static const int mobileMaxWidth = 480;
  
  /// Max width considered as "tablet-friendly"  
  static const int tabletMaxWidth = 1024;
}
