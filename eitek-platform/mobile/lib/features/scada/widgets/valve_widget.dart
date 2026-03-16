import 'package:flutter/material.dart';

/// SCADA Valve Widget
/// 
/// Displays a valve with open/closed states or partial opening.
class ValveWidget extends StatelessWidget {
  final String state; // 'open', 'closed', 'partial', 'fault'
  final double openPercent; // 0-100
  final String label;
  final bool showLabel;
  final Color openColor;
  final Color closedColor;
  final VoidCallback? onTap;
  final VoidCallback? onOpen;
  final VoidCallback? onClose;

  const ValveWidget({
    super.key,
    required this.state,
    this.openPercent = 0,
    this.label = '',
    this.showLabel = true,
    this.openColor = Colors.green,
    this.closedColor = Colors.red,
    this.onTap,
    this.onOpen,
    this.onClose,
  });

  Color get _currentColor {
    switch (state) {
      case 'open':
        return openColor;
      case 'partial':
        return Colors.orange;
      case 'fault':
        return Colors.purple;
      default:
        return closedColor;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Valve body
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final size = constraints.maxWidth.clamp(40.0, constraints.maxHeight);
                return Center(
                  child: SizedBox(
                    width: size * 0.9,
                    height: size * 0.9,
                    child: CustomPaint(
                      painter: _ValvePainter(
                        state: state,
                        color: _currentColor,
                        openPercent: openPercent,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          // Label
          if (showLabel && label.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                color: Colors.grey[700],
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          // State indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: _currentColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              state == 'partial' 
                  ? '${openPercent.toStringAsFixed(0)}%' 
                  : state.toUpperCase(),
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.bold,
                color: _currentColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ValvePainter extends CustomPainter {
  final String state;
  final Color color;
  final double openPercent;

  _ValvePainter({
    required this.state,
    required this.color,
    required this.openPercent,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final strokePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    final center = Offset(size.width / 2, size.height / 2);
    final valveSize = size.width * 0.4;

    // Draw pipe connections
    final pipePaint = Paint()
      ..color = Colors.grey[400]!
      ..style = PaintingStyle.fill;

    // Left pipe
    canvas.drawRect(
      Rect.fromLTWH(0, center.dy - 8, center.dx - valveSize / 2, 16),
      pipePaint,
    );

    // Right pipe
    canvas.drawRect(
      Rect.fromLTWH(center.dx + valveSize / 2, center.dy - 8, center.dx - valveSize / 2, 16),
      pipePaint,
    );

    // Draw valve body (butterfly shape)
    final path = Path();
    
    // Top triangle
    path.moveTo(center.dx, center.dy - valveSize);
    path.lineTo(center.dx - valveSize, center.dy);
    path.lineTo(center.dx + valveSize, center.dy);
    path.close();

    // Bottom triangle
    path.moveTo(center.dx, center.dy + valveSize);
    path.lineTo(center.dx - valveSize, center.dy);
    path.lineTo(center.dx + valveSize, center.dy);
    path.close();

    canvas.drawPath(path, paint);
    canvas.drawPath(path, strokePaint);

    // Draw center circle
    final centerPaint = Paint()
      ..color = state == 'closed' ? Colors.white : color.withValues(alpha: 0.5)
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(center, valveSize * 0.3, centerPaint);
    canvas.drawCircle(center, valveSize * 0.3, strokePaint);

    // Draw open/close indicator (vertical line for closed, horizontal for open)
    final indicatorPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;

    if (state == 'closed') {
      canvas.drawLine(
        Offset(center.dx, center.dy - valveSize * 0.2),
        Offset(center.dx, center.dy + valveSize * 0.2),
        indicatorPaint,
      );
    } else if (state == 'open') {
      canvas.drawLine(
        Offset(center.dx - valveSize * 0.2, center.dy),
        Offset(center.dx + valveSize * 0.2, center.dy),
        indicatorPaint,
      );
    } else {
      // Partial - diagonal
      final angle = (1 - openPercent / 100) * 3.14159 / 2;
      canvas.drawLine(
        Offset(center.dx - valveSize * 0.2 * cos(angle), center.dy - valveSize * 0.2 * sin(angle)),
        Offset(center.dx + valveSize * 0.2 * cos(angle), center.dy + valveSize * 0.2 * sin(angle)),
        indicatorPaint,
      );
    }
  }

  double cos(double angle) => 0.0 + (angle == 0 ? 1 : (angle > 0.7 ? 0 : 0.7));
  double sin(double angle) => 0.0 + (angle == 0 ? 0 : (angle > 0.7 ? 1 : 0.7));

  @override
  bool shouldRepaint(covariant _ValvePainter oldDelegate) {
    return state != oldDelegate.state || openPercent != oldDelegate.openPercent;
  }
}
