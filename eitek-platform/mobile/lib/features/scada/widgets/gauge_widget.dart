import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../engine/widget_registry.dart';

/// SCADA Gauge Widget
/// 
/// Circular gauge for displaying values within a range.
/// Supports multiple colored ranges and customization.
class GaugeWidget extends StatelessWidget {
  final double value;
  final double minValue;
  final double maxValue;
  final String unit;
  final String label;
  final int decimals;
  final bool showValue;
  final bool showMinMax;
  final Color needleColor;
  final List<GaugeRange> ranges;
  final VoidCallback? onTap;

  const GaugeWidget({
    super.key,
    required this.value,
    this.minValue = 0,
    this.maxValue = 100,
    this.unit = '',
    this.label = '',
    this.decimals = 0,
    this.showValue = true,
    this.showMinMax = true,
    this.needleColor = Colors.black87,
    this.ranges = const [],
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final size = math.min(constraints.maxWidth, constraints.maxHeight);
          return SizedBox(
            width: size,
            height: size,
            child: CustomPaint(
              painter: _GaugePainter(
                value: value.clamp(minValue, maxValue),
                min: minValue,
                max: maxValue,
                ranges: ranges,
                needleColor: needleColor,
              ),
              child: Center(
                child: Padding(
                  padding: EdgeInsets.only(top: size * 0.15),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (showValue)
                        Text(
                          value.toStringAsFixed(decimals),
                          style: TextStyle(
                            fontSize: size * 0.15,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                      if (unit.isNotEmpty)
                        Text(
                          unit,
                          style: TextStyle(
                            fontSize: size * 0.08,
                            color: Colors.grey[600],
                          ),
                        ),
                      if (label.isNotEmpty) ...[
                        SizedBox(height: size * 0.02),
                        Text(
                          label,
                          style: TextStyle(
                            fontSize: size * 0.07,
                            color: Colors.grey[700],
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _GaugePainter extends CustomPainter {
  final double value;
  final double min;
  final double max;
  final List<GaugeRange> ranges;
  final Color needleColor;

  _GaugePainter({
    required this.value,
    required this.min,
    required this.max,
    required this.ranges,
    required this.needleColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 * 0.8;
    
    final startAngle = 0.75 * math.pi;
    final sweepAngle = 1.5 * math.pi;

    // Draw background arc
    final bgPaint = Paint()
      ..color = Colors.grey[200]!
      ..style = PaintingStyle.stroke
      ..strokeWidth = radius * 0.15
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      bgPaint,
    );

    // Draw range arcs
    for (final range in ranges) {
      final rangeStart = ((range.from - min) / (max - min)).clamp(0.0, 1.0);
      final rangeEnd = ((range.to - min) / (max - min)).clamp(0.0, 1.0);
      
      final rangePaint = Paint()
        ..color = range.color
        ..style = PaintingStyle.stroke
        ..strokeWidth = radius * 0.15
        ..strokeCap = StrokeCap.butt;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle + rangeStart * sweepAngle,
        (rangeEnd - rangeStart) * sweepAngle,
        false,
        rangePaint,
      );
    }

    // Draw needle
    final valueNormalized = ((value - min) / (max - min)).clamp(0.0, 1.0);
    final needleAngle = startAngle + valueNormalized * sweepAngle;
    
    final needlePaint = Paint()
      ..color = needleColor
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;

    final needleLength = radius * 0.7;
    final needleEnd = Offset(
      center.dx + needleLength * math.cos(needleAngle),
      center.dy + needleLength * math.sin(needleAngle),
    );

    canvas.drawLine(center, needleEnd, needlePaint);

    // Draw center circle
    final centerPaint = Paint()
      ..color = needleColor
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, radius * 0.08, centerPaint);
  }

  @override
  bool shouldRepaint(covariant _GaugePainter oldDelegate) {
    return value != oldDelegate.value ||
        min != oldDelegate.min ||
        max != oldDelegate.max;
  }
}
