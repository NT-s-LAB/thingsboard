// SCADA Widget Registry
//
// Maps widget type strings to Flutter widget builders.
// This enables dynamic rendering of SCADA screens from JSON definitions.

import 'package:flutter/material.dart';
import '../models/scada_screen.dart';
import '../widgets/value_display_widget.dart';
import '../widgets/gauge_widget.dart';
import '../widgets/tank_widget.dart';
import '../widgets/pump_widget.dart';
import '../widgets/valve_widget.dart';
import '../widgets/motor_widget.dart';
import '../widgets/led_widget.dart';
import '../widgets/switch_widget.dart';
import '../widgets/text_widget.dart';
import '../widgets/button_widget.dart';
import '../widgets/progress_bar_widget.dart';
import '../widgets/indicator_widget.dart';
import '../widgets/pipe_widget.dart';
import '../widgets/slider_widget.dart';
import '../widgets/image_widget.dart';

/// Callback for widget data binding updates
typedef OnDataUpdate = void Function(String propertyKey, dynamic value);

/// Callback for widget actions (e.g., button click, switch toggle)
typedef OnAction = void Function(String trigger, Map<String, dynamic> params);

/// Widget builder function signature
typedef ScadaWidgetBuilder = Widget Function(
  ScadaWidgetInstance widget,
  Map<String, dynamic> resolvedProperties,
  OnAction? onAction,
);

/// SCADA Widget Registry
/// 
/// Central registry for all SCADA widget types.
/// Add new widget types by calling [register].
class ScadaWidgetRegistry {
  static final ScadaWidgetRegistry _instance = ScadaWidgetRegistry._internal();
  factory ScadaWidgetRegistry() => _instance;
  ScadaWidgetRegistry._internal() {
    _registerBuiltinWidgets();
  }

  final Map<String, ScadaWidgetBuilder> _registry = {};

  /// Register a widget type with its builder
  void register(String type, ScadaWidgetBuilder builder) {
    _registry[type] = builder;
  }

  /// Check if a widget type is registered
  bool hasWidget(String type) => _registry.containsKey(type);

  /// Build a widget from its definition
  Widget build(
    ScadaWidgetInstance widget,
    Map<String, dynamic> resolvedProperties,
    OnAction? onAction,
  ) {
    final builder = _registry[widget.type];
    if (builder == null) {
      return _buildUnknownWidget(widget);
    }
    return builder(widget, resolvedProperties, onAction);
  }

  /// Build placeholder for unknown widget types
  Widget _buildUnknownWidget(ScadaWidgetInstance widget) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[200],
        border: Border.all(color: Colors.grey[400]!, width: 1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.help_outline, color: Colors.grey[600], size: 24),
            const SizedBox(height: 4),
            Text(
              widget.type,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Register all built-in widgets
  void _registerBuiltinWidgets() {
    // Display widgets
    register('valueDisplay', (widget, props, onAction) {
      return ValueDisplayWidget(
        label: props['label'] as String? ?? '',
        value: props['value'],
        unit: props['unit'] as String? ?? '',
        prefix: props['prefix'] as String? ?? '',
        suffix: props['suffix'] as String? ?? '',
        decimals: props['decimals'] as int? ?? 1,
        bgColor: _parseColor(props['bgColor'], Colors.white),
        textColor: _parseColor(props['textColor'], Colors.black87),
        borderRadius: (props['borderRadius'] as num?)?.toDouble() ?? 6,
        borderColor: _parseColor(props['borderColor'], Colors.grey[300]!),
        borderWidth: (props['borderWidth'] as num?)?.toDouble() ?? 1,
        thresholds: _parseThresholds(props['thresholds']),
        onTap: onAction != null ? () => onAction('click', {}) : null,
      );
    });

    register('gauge', (widget, props, onAction) {
      // Match web: showTitle defaults to true if title or label is present
      final title = props['title'] as String? ?? '';
      final label = props['label'] as String? ?? '';
      final hasTitle = title.isNotEmpty || label.isNotEmpty;
      final showTitle = props['showTitle'] as bool? ?? hasTitle;
      
      return GaugeWidget(
        variant: _parseGaugeVariant(props['variant']),
        value: (props['value'] as num?)?.toDouble() ?? 0,
        minValue: (props['min'] as num?)?.toDouble() ?? 0,
        maxValue: (props['max'] as num?)?.toDouble() ?? 100,
        unit: props['unit'] as String? ?? '',
        title: title.isNotEmpty ? title : label,
        precision: props['precision'] as int? ?? 0,
        showTitle: showTitle,
        showValue: props['showValue'] as bool? ?? true,
        showUnit: props['showUnit'] as bool? ?? true,
        showMinMax: props['showMinMax'] as bool? ?? true,
        showNeedle: props['showNeedle'] as bool? ?? true,
        thickness: (props['thickness'] as num?)?.toDouble() ?? 12,
        startAngle: (props['startAngle'] as num?)?.toDouble() ?? 135,
        endAngle: (props['endAngle'] as num?)?.toDouble() ?? 405,
        trackColor: _parseColor(props['trackColor'], Colors.grey[300]!),
        fillColor: _parseColor(props['fillColor'], Colors.blue),
        backgroundColor: props['backgroundColor'] != null
            ? _parseColor(props['backgroundColor'], Colors.transparent)
            : null,
        needleColor: _parseColor(props['needleColor'], Colors.grey[800]!),
        textColor: _parseColor(props['textColor'], Colors.grey[800]!),
        titleColor: _parseColor(props['titleColor'], Colors.grey[600]!),
        thresholdEnabled: props['thresholdEnabled'] as bool? ?? true,
        thresholds: _parseGaugeThresholds(props['thresholds']),
        needleWidth: (props['needleWidth'] as num?)?.toDouble() ?? 3,
        // Legacy support
        label: label,
        decimals: props['decimals'] as int?,
        ranges: _parseGaugeRanges(props['ranges']),
        onTap: onAction != null ? () => onAction('click', {}) : null,
      );
    });

    register('tank', (widget, props, onAction) {
      return TankWidget(
        level: (props['level'] as num?)?.toDouble() ?? 0,
        minLevel: (props['minLevel'] as num?)?.toDouble() ?? 0,
        maxLevel: (props['maxLevel'] as num?)?.toDouble() ?? 100,
        label: props['label'] as String? ?? '',
        unit: props['unit'] as String? ?? '%',
        showLevel: props['showLevel'] as bool? ?? true,
        fillColor: _parseColor(props['fillColor'], Colors.blue),
        outlineColor: _parseColor(props['outlineColor'], Colors.grey[600]!),
        warningLevel: (props['warningLevel'] as num?)?.toDouble() ?? 80,
        criticalLevel: (props['criticalLevel'] as num?)?.toDouble() ?? 95,
        warningColor: _parseColor(props['warningColor'], Colors.orange),
        criticalColor: _parseColor(props['criticalColor'], Colors.red),
        onTap: onAction != null ? () => onAction('click', {}) : null,
      );
    });

    register('pump', (widget, props, onAction) {
      return PumpWidget(
        state: props['state'] as String? ?? 'stopped',
        label: props['label'] as String? ?? '',
        showLabel: props['showLabel'] as bool? ?? true,
        runningColor: _parseColor(props['runningColor'], Colors.green),
        stoppedColor: _parseColor(props['stoppedColor'], Colors.grey),
        faultColor: _parseColor(props['faultColor'], Colors.red),
        onTap: onAction != null ? () => onAction('click', {}) : null,
        onStart: onAction != null ? () => onAction('start', {}) : null,
        onStop: onAction != null ? () => onAction('stop', {}) : null,
      );
    });

    register('valve', (widget, props, onAction) {
      return ValveWidget(
        state: props['state'] as String? ?? 'closed',
        openPercent: (props['openPercent'] as num?)?.toDouble() ?? 0,
        label: props['label'] as String? ?? '',
        showLabel: props['showLabel'] as bool? ?? true,
        openColor: _parseColor(props['openColor'], Colors.green),
        closedColor: _parseColor(props['closedColor'], Colors.red),
        onTap: onAction != null ? () => onAction('click', {}) : null,
        onOpen: onAction != null ? () => onAction('open', {}) : null,
        onClose: onAction != null ? () => onAction('close', {}) : null,
      );
    });

    register('motor', (widget, props, onAction) {
      return MotorWidget(
        state: props['state'] as String? ?? 'stopped',
        rpm: (props['rpm'] as num?)?.toDouble() ?? 0,
        label: props['label'] as String? ?? '',
        showLabel: props['showLabel'] as bool? ?? true,
        showRPM: props['showRPM'] as bool? ?? true,
        runningColor: _parseColor(props['runningColor'], Colors.green),
        stoppedColor: _parseColor(props['stoppedColor'], Colors.grey),
        faultColor: _parseColor(props['faultColor'], Colors.red),
        onTap: onAction != null ? () => onAction('click', {}) : null,
      );
    });

    register('led', (widget, props, onAction) {
      return LedWidget(
        state: props['state'] as bool? ?? false,
        label: props['label'] as String? ?? '',
        showLabel: props['showLabel'] as bool? ?? true,
        onColor: _parseColor(props['onColor'], Colors.green),
        offColor: _parseColor(props['offColor'], Colors.grey),
        shape: props['shape'] as String? ?? 'circle',
        blinkWhenOn: props['blinkWhenOn'] as bool? ?? false,
      );
    });

    register('switch', (widget, props, onAction) {
      return SwitchWidgetScada(
        state: props['state'] as bool? ?? false,
        label: props['label'] as String? ?? '',
        showLabel: props['showLabel'] as bool? ?? true,
        onColor: _parseColor(props['onColor'], Colors.green),
        offColor: _parseColor(props['offColor'], Colors.grey),
        disabled: props['disabled'] as bool? ?? false,
        onChanged: onAction != null 
            ? (value) => onAction('toggle', {'value': value}) 
            : null,
      );
    });

    register('text', (widget, props, onAction) {
      return ScadaTextWidget(
        text: props['text'] as String? ?? '',
        fontSize: (props['fontSize'] as num?)?.toDouble() ?? 14,
        fontWeight: _parseFontWeight(props['fontWeight']),
        color: _parseColor(props['textColor'] ?? props['color'], Colors.black87),
        alignment: _parseAlignment(props['align'] ?? props['alignment']),
        bgColor: _parseColor(props['bgColor'], Colors.transparent),
        borderColor: _parseColor(props['borderColor'], Colors.transparent),
        borderWidth: (props['borderWidth'] as num?)?.toDouble() ?? 0,
        padding: (props['padding'] as num?)?.toDouble() ?? 4,
        onTap: onAction != null ? () => onAction('click', {}) : null,
      );
    });

    register('button', (widget, props, onAction) {
      return ScadaButtonWidget(
        text: (props['label'] ?? props['text']) as String? ?? 'Button',
        icon: props['icon'] as String?,
        buttonColor: _parseColor(props['bgColor'] ?? props['buttonColor'], Colors.blue),
        textColor: _parseColor(props['textColor'], Colors.white),
        fontSize: (props['fontSize'] as num?)?.toDouble() ?? 12,
        borderRadius: (props['borderRadius'] as num?)?.toDouble() ?? 6,
        disabled: props['disabled'] as bool? ?? false,
        onPressed: onAction != null ? () => onAction('click', {}) : null,
      );
    });

    register('progressBar', (widget, props, onAction) {
      return ProgressBarWidget(
        value: (props['value'] as num?)?.toDouble() ?? 0,
        min: (props['min'] as num?)?.toDouble() ?? 0,
        max: (props['max'] as num?)?.toDouble() ?? 100,
        label: props['label'] as String? ?? '',
        unit: props['unit'] as String? ?? '%',
        decimals: props['decimals'] as int? ?? 0,
        showValue: props['showValue'] as bool? ?? true,
        showMinMax: props['showMinMax'] as bool? ?? false,
        fillColor: _parseColor(props['barColor'] ?? props['fillColor'], Colors.blue),
        backgroundColor: _parseColor(props['trackColor'] ?? props['backgroundColor'], Colors.grey[200]!),
        orientation: props['orientation'] as String? ?? 'horizontal',
        barRadius: (props['barRadius'] as num?)?.toDouble() ?? 4,
        barHeight: (props['barHeight'] as num?)?.toDouble() ?? 12,
      );
    });

    register('indicator', (widget, props, onAction) {
      return IndicatorWidget(
        state: (props['value'] ?? props['state']) as String? ?? 'normal',
        label: props['label'] as String? ?? '',
        showLabel: props['showValue'] as bool? ?? props['showLabel'] as bool? ?? true,
        normalColor: _parseColor(props['normalColor'], Colors.green),
        warningColor: _parseColor(props['warningColor'], Colors.orange),
        alarmColor: _parseColor(props['alarmColor'], Colors.red),
        states: _parseIndicatorStates(props['states']),
        shape: props['shape'] as String? ?? 'circle',
        blinkWhenActive: props['blinkWhenActive'] as bool? ?? false,
        onTap: onAction != null ? () => onAction('click', {}) : null,
      );
    });

    register('pipe', (widget, props, onAction) {
      return PipeWidget(
        orientation: props['orientation'] as String? ?? 'horizontal',
        flowDirection: props['flowDirection'] as String? ?? 'left-right',
        flowing: (props['flowActive'] ?? props['flowing']) as bool? ?? false,
        pipeColor: _parseColor(props['pipeColor'], Colors.grey[400]!),
        fluidColor: _parseColor(props['flowColor'] ?? props['fluidColor'], Colors.blue),
        pipeWidth: (props['pipeWidth'] as num?)?.toDouble() ?? 12,
        flowSpeed: (props['flowSpeed'] as num?)?.toDouble() ?? 1,
      );
    });

    register('slider', (widget, props, onAction) {
      return ScadaSliderWidget(
        value: (props['value'] as num?)?.toDouble() ?? 0,
        min: (props['min'] as num?)?.toDouble() ?? 0,
        max: (props['max'] as num?)?.toDouble() ?? 100,
        step: (props['step'] as num?)?.toDouble() ?? 1,
        label: props['label'] as String? ?? '',
        unit: props['unit'] as String? ?? '',
        showValue: props['showValue'] as bool? ?? true,
        showMinMax: props['showMinMax'] as bool? ?? false,
        activeColor: _parseColor(props['fillColor'] ?? props['activeColor'], Colors.blue),
        trackColor: _parseColor(props['trackColor'], Colors.grey[300]!),
        disabled: props['disabled'] as bool? ?? false,
        onChanged: onAction != null 
            ? (value) => onAction('change', {'value': value}) 
            : null,
      );
    });

    register('imageWidget', (widget, props, onAction) {
      return ScadaImageWidget(
        imageUrl: props['imageUrl'] as String? ?? '',
        fit: _parseBoxFit(props['objectFit'] ?? props['fit']),
        borderRadius: (props['borderRadius'] as num?)?.toDouble() ?? 0,
        borderWidth: (props['borderWidth'] as num?)?.toDouble() ?? 0,
        borderColor: _parseColor(props['borderColor'], Colors.grey[300]!),
        opacity: (props['opacity'] as num?)?.toDouble() ?? 1.0,
        bgColor: _parseColor(props['bgColor'], Colors.transparent),
        onTap: onAction != null ? () => onAction('click', {}) : null,
      );
    });

    // Also register short aliases
    register('value', _registry['valueDisplay']!);
    register('image', _registry['imageWidget']!);
  }

  // ─── Helper Methods ────────────────────────────────────────────────────────

  Color _parseColor(dynamic value, Color defaultColor) {
    if (value == null) return defaultColor;
    if (value is String && value.startsWith('#')) {
      try {
        final hex = value.replaceFirst('#', '');
        if (hex.length == 6) {
          return Color(int.parse('FF$hex', radix: 16));
        } else if (hex.length == 8) {
          return Color(int.parse(hex, radix: 16));
        }
      } catch (_) {}
    }
    return defaultColor;
  }

  List<ValueThreshold> _parseThresholds(dynamic value) {
    if (value == null || value is! List) return [];
    return value.map<ValueThreshold>((item) {
      if (item is Map<String, dynamic>) {
        return ValueThreshold(
          value: (item['value'] as num?)?.toDouble() ?? 0,
          color: _parseColor(item['color'], Colors.red),
        );
      }
      return ValueThreshold(value: 0, color: Colors.red);
    }).toList();
  }

  List<GaugeRange> _parseGaugeRanges(dynamic value) {
    if (value == null || value is! List) {
      return [
        GaugeRange(from: 0, to: 50, color: Colors.green),
        GaugeRange(from: 50, to: 80, color: Colors.orange),
        GaugeRange(from: 80, to: 100, color: Colors.red),
      ];
    }
    return value.map<GaugeRange>((item) {
      if (item is Map<String, dynamic>) {
        return GaugeRange(
          from: (item['from'] as num?)?.toDouble() ?? 0,
          to: (item['to'] as num?)?.toDouble() ?? 100,
          color: _parseColor(item['color'], Colors.grey),
        );
      }
      return GaugeRange(from: 0, to: 100, color: Colors.grey);
    }).toList();
  }

  GaugeVariant _parseGaugeVariant(dynamic value) {
    switch (value) {
      case 'semicircle':
        return GaugeVariant.semicircle;
      case 'arc':
        return GaugeVariant.arc;
      case 'linear':
        return GaugeVariant.linear;
      case 'radial':
      default:
        return GaugeVariant.radial;
    }
  }

  List<GaugeThreshold> _parseGaugeThresholds(dynamic value) {
    if (value == null || value is! List) {
      return defaultThresholds;
    }
    return value.map<GaugeThreshold>((item) {
      if (item is Map<String, dynamic>) {
        return GaugeThreshold.fromJson(item);
      }
      return const GaugeThreshold(value: 0, color: Color(0xFF22C55E));
    }).toList();
  }

  FontWeight _parseFontWeight(dynamic value) {
    switch (value) {
      case 'bold':
      case '700':
        return FontWeight.bold;
      case 'medium':
      case '500':
        return FontWeight.w500;
      case 'light':
      case '300':
        return FontWeight.w300;
      default:
        return FontWeight.normal;
    }
  }

  TextAlign _parseAlignment(dynamic value) {
    switch (value) {
      case 'center':
        return TextAlign.center;
      case 'right':
      case 'end':
        return TextAlign.right;
      default:
        return TextAlign.left;
    }
  }

  List<IndicatorState> _parseIndicatorStates(dynamic value) {
    if (value == null || value is! List) return [];
    return value.whereType<Map>().map<IndicatorState>((item) {
      final m = Map<String, dynamic>.from(item);
      return IndicatorState(
        value: m['value'] as String? ?? '',
        color: _parseColor(m['color'], Colors.green),
        label: m['label'] as String? ?? '',
      );
    }).toList();
  }

  BoxFit _parseBoxFit(dynamic value) {
    switch (value) {
      case 'contain':
        return BoxFit.contain;
      case 'cover':
        return BoxFit.cover;
      case 'fill':
        return BoxFit.fill;
      case 'none':
        return BoxFit.none;
      default:
        return BoxFit.contain;
    }
  }
}

/// Global widget registry instance
final scadaWidgetRegistry = ScadaWidgetRegistry();

/// Helper classes for registry
class ValueThreshold {
  final double value;
  final Color color;
  const ValueThreshold({required this.value, required this.color});
}

class GaugeRange {
  final double from;
  final double to;
  final Color color;
  const GaugeRange({required this.from, required this.to, required this.color});
}

class IndicatorState {
  final String value;
  final Color color;
  final String label;
  const IndicatorState({required this.value, required this.color, this.label = ''});
}
