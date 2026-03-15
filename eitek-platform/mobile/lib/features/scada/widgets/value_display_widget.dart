import 'package:flutter/material.dart';
import '../engine/widget_registry.dart';

/// SCADA Value Display Widget
/// 
/// Displays a numeric or text value with optional label, unit and styling.
/// Supports threshold-based color changes.
class ValueDisplayWidget extends StatelessWidget {
  final String label;
  final dynamic value;
  final String unit;
  final String prefix;
  final String suffix;
  final int decimals;
  final Color bgColor;
  final Color textColor;
  final double borderRadius;
  final Color borderColor;
  final double borderWidth;
  final List<ValueThreshold> thresholds;
  final VoidCallback? onTap;

  const ValueDisplayWidget({
    super.key,
    required this.label,
    this.value,
    this.unit = '',
    this.prefix = '',
    this.suffix = '',
    this.decimals = 1,
    this.bgColor = Colors.white,
    this.textColor = Colors.black87,
    this.borderRadius = 6,
    this.borderColor = const Color(0xFFE0E0E0),
    this.borderWidth = 1,
    this.thresholds = const [],
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final displayValue = _formatValue();
    final valueColor = _getValueColor();

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(borderRadius),
          border: Border.all(color: borderColor, width: borderWidth),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            if (label.isNotEmpty) ...[
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: textColor.withOpacity(0.7),
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
            ],
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                '$prefix$displayValue$suffix',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: valueColor,
                ),
              ),
            ),
            if (unit.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                unit,
                style: TextStyle(
                  fontSize: 10,
                  color: textColor.withOpacity(0.6),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatValue() {
    if (value == null) return '--';
    if (value is num) {
      return value.toStringAsFixed(decimals);
    }
    return value.toString();
  }

  Color _getValueColor() {
    if (value == null || value is! num || thresholds.isEmpty) {
      return textColor;
    }

    final numValue = (value as num).toDouble();
    
    // Sort thresholds by value descending and find first match
    final sortedThresholds = [...thresholds]
      ..sort((a, b) => b.value.compareTo(a.value));
    
    for (final threshold in sortedThresholds) {
      if (numValue >= threshold.value) {
        return threshold.color;
      }
    }
    
    return textColor;
  }
}
