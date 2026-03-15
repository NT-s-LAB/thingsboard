import 'package:flutter/material.dart';

/// SCADA Tank Widget
/// 
/// Displays a tank/container with fill level visualization.
/// Supports warning and critical level indicators.
class TankWidget extends StatelessWidget {
  final double level;
  final double minLevel;
  final double maxLevel;
  final String label;
  final String unit;
  final bool showLevel;
  final Color fillColor;
  final Color outlineColor;
  final double warningLevel;
  final double criticalLevel;
  final Color warningColor;
  final Color criticalColor;
  final VoidCallback? onTap;

  const TankWidget({
    super.key,
    required this.level,
    this.minLevel = 0,
    this.maxLevel = 100,
    this.label = '',
    this.unit = '%',
    this.showLevel = true,
    this.fillColor = Colors.blue,
    this.outlineColor = const Color(0xFF757575),
    this.warningLevel = 80,
    this.criticalLevel = 95,
    this.warningColor = Colors.orange,
    this.criticalColor = Colors.red,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final normalizedLevel = ((level - minLevel) / (maxLevel - minLevel)).clamp(0.0, 1.0);
    final currentFillColor = _getFillColor();

    return GestureDetector(
      onTap: onTap,
      child: LayoutBuilder(
        builder: (context, constraints) {
          return Column(
            mainAxisSize: MainAxisSize.min,
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
                child: Container(
                  width: constraints.maxWidth,
                  decoration: BoxDecoration(
                    border: Border.all(color: outlineColor, width: 2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Stack(
                    alignment: Alignment.bottomCenter,
                    children: [
                      // Fill
                      FractionallySizedBox(
                        heightFactor: normalizedLevel,
                        widthFactor: 1.0,
                        alignment: Alignment.bottomCenter,
                        child: Container(
                          decoration: BoxDecoration(
                            color: currentFillColor.withOpacity(0.7),
                            borderRadius: const BorderRadius.only(
                              bottomLeft: Radius.circular(2),
                              bottomRight: Radius.circular(2),
                            ),
                          ),
                        ),
                      ),
                      // Level indicator lines
                      ..._buildLevelLines(),
                      // Level text
                      if (showLevel)
                        Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.85),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '${level.toStringAsFixed(1)}$unit',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: currentFillColor,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Color _getFillColor() {
    if (level >= criticalLevel) return criticalColor;
    if (level >= warningLevel) return warningColor;
    return fillColor;
  }

  List<Widget> _buildLevelLines() {
    return [
      Positioned(
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        child: Column(
          children: List.generate(5, (index) {
            return Expanded(
              child: Container(
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: Colors.grey.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    ];
  }
}
