import 'package:flutter/material.dart';

/// SCADA Progress Bar Widget
/// 
/// Displays a progress bar with optional label and value.
class ProgressBarWidget extends StatelessWidget {
  final double value;
  final double min;
  final double max;
  final String label;
  final bool showValue;
  final Color fillColor;
  final Color backgroundColor;
  final String orientation; // 'horizontal', 'vertical'

  const ProgressBarWidget({
    super.key,
    required this.value,
    this.min = 0,
    this.max = 100,
    this.label = '',
    this.showValue = true,
    this.fillColor = Colors.blue,
    this.backgroundColor = const Color(0xFFE0E0E0),
    this.orientation = 'horizontal',
  });

  double get _normalizedValue => ((value - min) / (max - min)).clamp(0.0, 1.0);

  @override
  Widget build(BuildContext context) {
    final isHorizontal = orientation == 'horizontal';

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (label.isNotEmpty) ...[
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey[700],
              fontWeight: FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
        ],
        Expanded(
          child: LayoutBuilder(
            builder: (context, constraints) {
              if (isHorizontal) {
                return _buildHorizontalBar(constraints);
              } else {
                return _buildVerticalBar(constraints);
              }
            },
          ),
        ),
        if (showValue) ...[
          const SizedBox(height: 4),
          Text(
            value.toStringAsFixed(1),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: fillColor,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }

  Widget _buildHorizontalBar(BoxConstraints constraints) {
    return Container(
      height: 12,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Stack(
        children: [
          FractionallySizedBox(
            widthFactor: _normalizedValue,
            heightFactor: 1.0,
            alignment: Alignment.centerLeft,
            child: Container(
              decoration: BoxDecoration(
                color: fillColor,
                borderRadius: BorderRadius.circular(6),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerticalBar(BoxConstraints constraints) {
    return Center(
      child: Container(
        width: 20,
        height: constraints.maxHeight,
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Stack(
          children: [
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: FractionallySizedBox(
                heightFactor: _normalizedValue,
                alignment: Alignment.bottomCenter,
                child: Container(
                  decoration: BoxDecoration(
                    color: fillColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
