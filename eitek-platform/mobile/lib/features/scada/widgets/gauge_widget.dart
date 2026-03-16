import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../engine/widget_registry.dart';

/// Gauge variant types
enum GaugeVariant {
  radial,     // 270° sweep
  semicircle, // 180° sweep (top half)
  arc,        // 240° sweep
  linear,     // Horizontal bar
}

/// Gauge threshold for color zones
class GaugeThreshold {
  final double value;
  final Color color;
  final String? label;

  const GaugeThreshold({
    required this.value,
    required this.color,
    this.label,
  });

  /// Parse from JSON map
  factory GaugeThreshold.fromJson(Map<String, dynamic> json) {
    return GaugeThreshold(
      value: (json['value'] as num?)?.toDouble() ?? 0,
      color: _parseColorString(json['color'] as String? ?? '#22C55E'),
      label: json['label'] as String?,
    );
  }

  static Color _parseColorString(String colorString) {
    if (colorString.startsWith('#')) {
      final hex = colorString.substring(1);
      if (hex.length == 6) {
        return Color(int.parse('FF$hex', radix: 16));
      } else if (hex.length == 8) {
        return Color(int.parse(hex, radix: 16));
      }
    }
    return Colors.grey;
  }
}

/// Default thresholds
const List<GaugeThreshold> defaultThresholds = [
  GaugeThreshold(value: 0, color: Color(0xFF22C55E), label: 'Normal'),
  GaugeThreshold(value: 60, color: Color(0xFFF59E0B), label: 'Warning'),
  GaugeThreshold(value: 80, color: Color(0xFFEF4444), label: 'Critical'),
];

/// SCADA Gauge Widget
/// 
/// Supports radial, semicircle, arc, and linear variants.
/// Matches Web implementation for cross-platform consistency.
class GaugeWidget extends StatelessWidget {
  final GaugeVariant variant;
  final double value;
  final double minValue;
  final double maxValue;
  final String unit;
  final String title;
  final int precision;
  final bool showTitle;
  final bool showValue;
  final bool showUnit;
  final bool showMinMax;
  final bool showNeedle;
  final double thickness;
  final double startAngle;
  final double endAngle;
  final Color trackColor;
  final Color fillColor;
  final Color? backgroundColor;
  final Color needleColor;
  final Color textColor;
  final Color titleColor;
  final bool thresholdEnabled;
  final List<GaugeThreshold> thresholds;
  final double needleWidth;
  final VoidCallback? onTap;

  // Legacy compatibility
  final List<GaugeRange> ranges;
  final String label;
  final int? decimals;

  const GaugeWidget({
    super.key,
    this.variant = GaugeVariant.radial,
    required this.value,
    this.minValue = 0,
    this.maxValue = 100,
    this.unit = '',
    this.title = '',
    this.precision = 0,
    this.showTitle = false,
    this.showValue = true,
    this.showUnit = true,
    this.showMinMax = true,
    this.showNeedle = true,
    this.thickness = 12,
    this.startAngle = 135, // degrees
    this.endAngle = 405,   // degrees (405 = 135 + 270)
    this.trackColor = const Color(0xFFE5E7EB),
    this.fillColor = const Color(0xFF3B82F6),
    this.backgroundColor,
    this.needleColor = const Color(0xFF374151),
    this.textColor = const Color(0xFF1F2937),
    this.titleColor = const Color(0xFF6B7280),
    this.thresholdEnabled = true,
    this.thresholds = defaultThresholds,
    this.needleWidth = 3,
    this.onTap,
    // Legacy
    this.ranges = const [],
    this.label = '',
    this.decimals,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: LayoutBuilder(
        builder: (context, constraints) {
          return Container(
            width: constraints.maxWidth,
            height: constraints.maxHeight,
            color: backgroundColor,
            child: _buildVariant(constraints),
          );
        },
      ),
    );
  }

  Widget _buildVariant(BoxConstraints constraints) {
    switch (variant) {
      case GaugeVariant.linear:
        return _buildLinearGauge(constraints);
      case GaugeVariant.radial:
      case GaugeVariant.semicircle:
      case GaugeVariant.arc:
        return _buildRadialGauge(constraints);
    }
  }

  Widget _buildRadialGauge(BoxConstraints constraints) {
    final effectiveTitle = title.isNotEmpty ? title : label;
    final availableHeight = constraints.maxHeight;
    final titleHeight = (showTitle && effectiveTitle.isNotEmpty) ? 24.0 : 0.0;
    final minMaxHeight = showMinMax ? 20.0 : 0.0;
    final gaugeSize = math.min(
      constraints.maxWidth,
      availableHeight - titleHeight - minMaxHeight,
    );
    
    // Determine actual angles based on variant
    final actualStartAngle = variant == GaugeVariant.semicircle ? 180.0 : startAngle;
    final actualEndAngle = variant == GaugeVariant.semicircle ? 360.0 : 
                           variant == GaugeVariant.arc ? (startAngle + 240) : endAngle;

    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Title above gauge (like Web)
        if (showTitle && effectiveTitle.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text(
              effectiveTitle,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: titleColor,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        // Gauge canvas
        SizedBox(
          width: gaugeSize,
          height: gaugeSize * (variant == GaugeVariant.semicircle ? 0.6 : 1.0),
          child: Stack(
            alignment: Alignment.center,
            children: [
              CustomPaint(
                size: Size(gaugeSize, gaugeSize),
                painter: _RadialGaugePainter(
                  value: value.clamp(minValue, maxValue),
                  min: minValue,
                  max: maxValue,
                  startAngle: actualStartAngle,
                  endAngle: actualEndAngle,
                  thickness: thickness,
                  trackColor: trackColor,
                  fillColor: fillColor,
                  needleColor: needleColor,
                  showNeedle: showNeedle,
                  needleWidth: needleWidth,
                  thresholdEnabled: thresholdEnabled,
                  thresholds: thresholds,
                  ranges: ranges,
                ),
              ),
              // Value display in center
              Positioned(
                child: _buildCenterValueDisplay(gaugeSize),
              ),
            ],
          ),
        ),
        // Min/Max labels below (like Web)
        if (showMinMax)
          Padding(
            padding: EdgeInsets.symmetric(horizontal: gaugeSize * 0.15),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  minValue.toStringAsFixed(0),
                  style: TextStyle(fontSize: 10, color: textColor.withValues(alpha: 0.6)),
                ),
                Text(
                  maxValue.toStringAsFixed(0),
                  style: TextStyle(fontSize: 10, color: textColor.withValues(alpha: 0.6)),
                ),
              ],
            ),
          ),
      ],
    );
  }

  /// Center display for radial gauges - value + unit on same line
  Widget _buildCenterValueDisplay(double size) {
    final effectivePrecision = decimals ?? precision;
    final valueStr = value.toStringAsFixed(effectivePrecision);
    final displayText = showUnit && unit.isNotEmpty 
        ? '$valueStr $unit' 
        : valueStr;

    return Text(
      displayText,
      style: TextStyle(
        fontSize: size * 0.14,
        fontWeight: FontWeight.bold,
        color: textColor,
      ),
      textAlign: TextAlign.center,
    );
  }

  Widget _buildLinearGauge(BoxConstraints constraints) {
    final width = constraints.maxWidth;
    final barHeight = thickness;
    final fraction = ((value - minValue) / (maxValue - minValue)).clamp(0.0, 1.0);
    final currentColor = _getColorForValue(value);

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (showTitle && title.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              title,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: titleColor,
              ),
            ),
          ),
        if (showMinMax)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  minValue.toStringAsFixed(0),
                  style: TextStyle(fontSize: 10, color: textColor),
                ),
                Text(
                  maxValue.toStringAsFixed(0),
                  style: TextStyle(fontSize: 10, color: textColor),
                ),
              ],
            ),
          ),
        const SizedBox(height: 4),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 8),
          height: barHeight,
          decoration: BoxDecoration(
            color: trackColor,
            borderRadius: BorderRadius.circular(barHeight / 2),
          ),
          child: Align(
            alignment: Alignment.centerLeft,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: (width - 16) * fraction,
              height: barHeight,
              decoration: BoxDecoration(
                color: currentColor,
                borderRadius: BorderRadius.circular(barHeight / 2),
              ),
            ),
          ),
        ),
        if (showValue)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              '${value.toStringAsFixed(_getEffectivePrecision())}${showUnit && unit.isNotEmpty ? ' $unit' : ''}',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),
          ),
      ],
    );
  }

  int _getEffectivePrecision() {
    return decimals ?? precision;
  }

  Color _getColorForValue(double val) {
    if (!thresholdEnabled || thresholds.isEmpty) {
      // Fallback to legacy ranges
      if (ranges.isNotEmpty) {
        for (final range in ranges.reversed) {
          if (val >= range.from) {
            return range.color;
          }
        }
        return ranges.first.color;
      }
      return fillColor;
    }

    // Sort descending to find highest matching threshold
    final sorted = List<GaugeThreshold>.from(thresholds)
      ..sort((a, b) => b.value.compareTo(a.value));

    for (final threshold in sorted) {
      if (val >= threshold.value) {
        return threshold.color;
      }
    }

    return sorted.isNotEmpty ? sorted.last.color : fillColor;
  }
}

/// Radial gauge painter
class _RadialGaugePainter extends CustomPainter {
  final double value;
  final double min;
  final double max;
  final double startAngle;
  final double endAngle;
  final double thickness;
  final Color trackColor;
  final Color fillColor;
  final Color needleColor;
  final bool showNeedle;
  final double needleWidth;
  final bool thresholdEnabled;
  final List<GaugeThreshold> thresholds;
  final List<GaugeRange> ranges;

  _RadialGaugePainter({
    required this.value,
    required this.min,
    required this.max,
    required this.startAngle,
    required this.endAngle,
    required this.thickness,
    required this.trackColor,
    required this.fillColor,
    required this.needleColor,
    required this.showNeedle,
    required this.needleWidth,
    required this.thresholdEnabled,
    required this.thresholds,
    required this.ranges,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (math.min(size.width, size.height) / 2) - thickness / 2 - 8;
    
    // Convert degrees to radians
    final startRad = _degToRad(startAngle);
    final endRad = _degToRad(endAngle);
    final sweepRad = endRad - startRad;

    // Draw background track
    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = thickness
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startRad,
      sweepRad,
      false,
      trackPaint,
    );

    // Draw value arc
    final fraction = ((value - min) / (max - min)).clamp(0.0, 1.0);
    final valueRad = startRad + fraction * sweepRad;
    final currentColor = _getColorForValue(value);

    if (fraction > 0.001) {
      final fillPaint = Paint()
        ..color = currentColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = thickness
        ..strokeCap = StrokeCap.round;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startRad,
        fraction * sweepRad,
        false,
        fillPaint,
      );
    }

    // Draw needle
    if (showNeedle) {
      final needlePaint = Paint()
        ..color = needleColor
        ..strokeWidth = needleWidth
        ..strokeCap = StrokeCap.round;

      final needleLength = radius - thickness / 2 - 4;
      final needleEnd = Offset(
        center.dx + needleLength * math.cos(valueRad),
        center.dy + needleLength * math.sin(valueRad),
      );

      canvas.drawLine(center, needleEnd, needlePaint);

      // Draw center cap
      final capPaint = Paint()
        ..color = needleColor
        ..style = PaintingStyle.fill;
      canvas.drawCircle(center, needleWidth + 2, capPaint);
    }
  }

  double _degToRad(double deg) => deg * math.pi / 180;

  Color _getColorForValue(double val) {
    if (!thresholdEnabled || thresholds.isEmpty) {
      // Fallback to legacy ranges
      if (ranges.isNotEmpty) {
        for (final range in ranges.reversed) {
          if (val >= range.from) {
            return range.color;
          }
        }
        return ranges.first.color;
      }
      return fillColor;
    }

    final sorted = List<GaugeThreshold>.from(thresholds)
      ..sort((a, b) => b.value.compareTo(a.value));

    for (final threshold in sorted) {
      if (val >= threshold.value) {
        return threshold.color;
      }
    }

    return sorted.isNotEmpty ? sorted.last.color : fillColor;
  }

  @override
  bool shouldRepaint(covariant _RadialGaugePainter oldDelegate) {
    return value != oldDelegate.value ||
        min != oldDelegate.min ||
        max != oldDelegate.max ||
        startAngle != oldDelegate.startAngle ||
        endAngle != oldDelegate.endAngle;
  }
}
