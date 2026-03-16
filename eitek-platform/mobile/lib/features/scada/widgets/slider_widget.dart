import 'package:flutter/material.dart';

/// SCADA Slider Widget
/// 
/// Interactive slider for value input.
class ScadaSliderWidget extends StatelessWidget {
  final double value;
  final double min;
  final double max;
  final String label;
  final bool showValue;
  final Color activeColor;
  final bool disabled;
  final ValueChanged<double>? onChanged;

  const ScadaSliderWidget({
    super.key,
    required this.value,
    this.min = 0,
    this.max = 100,
    this.label = '',
    this.showValue = true,
    this.activeColor = Colors.blue,
    this.disabled = false,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final clampedValue = value.clamp(min, max);

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (label.isNotEmpty) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey[700],
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (showValue)
                Text(
                  clampedValue.toStringAsFixed(1),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: activeColor,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),
        ],
        Expanded(
          child: Center(
            child: Opacity(
              opacity: disabled ? 0.5 : 1.0,
              child: SliderTheme(
                data: SliderThemeData(
                  activeTrackColor: activeColor,
                  inactiveTrackColor: activeColor.withValues(alpha: 0.2),
                  thumbColor: activeColor,
                  overlayColor: activeColor.withValues(alpha: 0.2),
                  trackHeight: 6,
                  thumbShape: const RoundSliderThumbShape(
                    enabledThumbRadius: 10,
                  ),
                ),
                child: Slider(
                  value: clampedValue,
                  min: min,
                  max: max,
                  onChanged: disabled || onChanged == null
                      ? null
                      : (newValue) => onChanged!(newValue),
                ),
              ),
            ),
          ),
        ),
        // Min / Max labels
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              min.toStringAsFixed(0),
              style: TextStyle(
                fontSize: 9,
                color: Colors.grey[500],
              ),
            ),
            Text(
              max.toStringAsFixed(0),
              style: TextStyle(
                fontSize: 9,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      ],
    );
  }
}
