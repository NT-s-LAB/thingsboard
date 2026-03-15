import 'package:flutter/material.dart';

/// SCADA Pipe Widget
/// 
/// Displays a pipe with optional flow animation.
class PipeWidget extends StatefulWidget {
  final String orientation; // 'horizontal', 'vertical'
  final String flowDirection; // 'left-right', 'right-left', 'top-bottom', 'bottom-top'
  final bool flowing;
  final Color pipeColor;
  final Color fluidColor;

  const PipeWidget({
    super.key,
    this.orientation = 'horizontal',
    this.flowDirection = 'left-right',
    this.flowing = false,
    this.pipeColor = const Color(0xFFBDBDBD),
    this.fluidColor = Colors.blue,
  });

  @override
  State<PipeWidget> createState() => _PipeWidgetState();
}

class _PipeWidgetState extends State<PipeWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    if (widget.flowing) {
      _animationController.repeat();
    }
  }

  @override
  void didUpdateWidget(covariant PipeWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.flowing != widget.flowing) {
      if (widget.flowing) {
        _animationController.repeat();
      } else {
        _animationController.stop();
      }
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  bool get _isHorizontal => widget.orientation == 'horizontal';

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return CustomPaint(
          size: Size(constraints.maxWidth, constraints.maxHeight),
          painter: _PipePainter(
            isHorizontal: _isHorizontal,
            flowDirection: widget.flowDirection,
            flowing: widget.flowing,
            pipeColor: widget.pipeColor,
            fluidColor: widget.fluidColor,
            animationValue: _animationController,
          ),
        );
      },
    );
  }
}

class _PipePainter extends CustomPainter {
  final bool isHorizontal;
  final String flowDirection;
  final bool flowing;
  final Color pipeColor;
  final Color fluidColor;
  final Animation<double> animationValue;

  _PipePainter({
    required this.isHorizontal,
    required this.flowDirection,
    required this.flowing,
    required this.pipeColor,
    required this.fluidColor,
    required this.animationValue,
  }) : super(repaint: animationValue);

  @override
  void paint(Canvas canvas, Size size) {
    final pipePaint = Paint()
      ..color = pipeColor
      ..style = PaintingStyle.fill;

    final borderPaint = Paint()
      ..color = pipeColor.withOpacity(0.8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    if (isHorizontal) {
      // Horizontal pipe
      final pipeHeight = size.height * 0.4;
      final pipeTop = (size.height - pipeHeight) / 2;

      // Pipe body
      canvas.drawRect(
        Rect.fromLTWH(0, pipeTop, size.width, pipeHeight),
        pipePaint,
      );
      canvas.drawRect(
        Rect.fromLTWH(0, pipeTop, size.width, pipeHeight),
        borderPaint,
      );

      // Flow indicator
      if (flowing) {
        _drawFlowIndicators(canvas, size, pipeTop, pipeHeight);
      }
    } else {
      // Vertical pipe
      final pipeWidth = size.width * 0.4;
      final pipeLeft = (size.width - pipeWidth) / 2;

      // Pipe body
      canvas.drawRect(
        Rect.fromLTWH(pipeLeft, 0, pipeWidth, size.height),
        pipePaint,
      );
      canvas.drawRect(
        Rect.fromLTWH(pipeLeft, 0, pipeWidth, size.height),
        borderPaint,
      );

      // Flow indicator
      if (flowing) {
        _drawVerticalFlowIndicators(canvas, size, pipeLeft, pipeWidth);
      }
    }
  }

  void _drawFlowIndicators(Canvas canvas, Size size, double pipeTop, double pipeHeight) {
    final fluidPaint = Paint()
      ..color = fluidColor.withOpacity(0.6)
      ..style = PaintingStyle.fill;

    final indicatorWidth = 8.0;
    final spacing = 20.0;
    final offset = animationValue.value * spacing;

    final isReverse = flowDirection == 'right-left';
    final startX = isReverse ? size.width + offset - indicatorWidth : -offset;
    final step = isReverse ? -spacing : spacing;

    for (double x = startX; isReverse ? x > -indicatorWidth : x < size.width + indicatorWidth; x += step) {
      if (x >= 0 && x <= size.width - indicatorWidth) {
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(x, pipeTop + 4, indicatorWidth, pipeHeight - 8),
            const Radius.circular(2),
          ),
          fluidPaint,
        );
      }
    }
  }

  void _drawVerticalFlowIndicators(Canvas canvas, Size size, double pipeLeft, double pipeWidth) {
    final fluidPaint = Paint()
      ..color = fluidColor.withOpacity(0.6)
      ..style = PaintingStyle.fill;

    final indicatorHeight = 8.0;
    final spacing = 20.0;
    final offset = animationValue.value * spacing;

    final isReverse = flowDirection == 'bottom-top';
    final startY = isReverse ? size.height + offset - indicatorHeight : -offset;
    final step = isReverse ? -spacing : spacing;

    for (double y = startY; isReverse ? y > -indicatorHeight : y < size.height + indicatorHeight; y += step) {
      if (y >= 0 && y <= size.height - indicatorHeight) {
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(pipeLeft + 4, y, pipeWidth - 8, indicatorHeight),
            const Radius.circular(2),
          ),
          fluidPaint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant _PipePainter oldDelegate) {
    return flowing != oldDelegate.flowing ||
        pipeColor != oldDelegate.pipeColor ||
        fluidColor != oldDelegate.fluidColor;
  }
}
