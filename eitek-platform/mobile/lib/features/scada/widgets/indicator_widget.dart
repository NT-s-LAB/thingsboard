import 'package:flutter/material.dart';

/// SCADA Indicator Widget
/// 
/// Multi-state indicator (normal, warning, alarm).
class IndicatorWidget extends StatefulWidget {
  final String state; // 'normal', 'warning', 'alarm'
  final String label;
  final bool showLabel;
  final Color normalColor;
  final Color warningColor;
  final Color alarmColor;
  final VoidCallback? onTap;

  const IndicatorWidget({
    super.key,
    required this.state,
    this.label = '',
    this.showLabel = true,
    this.normalColor = Colors.green,
    this.warningColor = Colors.orange,
    this.alarmColor = Colors.red,
    this.onTap,
  });

  @override
  State<IndicatorWidget> createState() => _IndicatorWidgetState();
}

class _IndicatorWidgetState extends State<IndicatorWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _updateAnimation();
  }

  @override
  void didUpdateWidget(covariant IndicatorWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.state != widget.state) {
      _updateAnimation();
    }
  }

  void _updateAnimation() {
    if (widget.state == 'alarm') {
      _animationController.repeat(reverse: true);
    } else {
      _animationController.stop();
      _animationController.value = 0;
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Color get _currentColor {
    switch (widget.state) {
      case 'warning':
        return widget.warningColor;
      case 'alarm':
        return widget.alarmColor;
      default:
        return widget.normalColor;
    }
  }

  IconData get _icon {
    switch (widget.state) {
      case 'warning':
        return Icons.warning_amber_rounded;
      case 'alarm':
        return Icons.error;
      default:
        return Icons.check_circle;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final size = constraints.maxWidth.clamp(24.0, constraints.maxHeight) * 0.7;
                return Center(
                  child: AnimatedBuilder(
                    animation: _scaleAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: widget.state == 'alarm'
                            ? _scaleAnimation.value
                            : 1.0,
                        child: child,
                      );
                    },
                    child: Container(
                      width: size,
                      height: size,
                      decoration: BoxDecoration(
                        color: _currentColor.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                        border: Border.all(color: _currentColor, width: 2),
                        boxShadow: widget.state == 'alarm'
                            ? [
                                BoxShadow(
                                  color: _currentColor.withValues(alpha: 0.4),
                                  blurRadius: 10,
                                  spreadRadius: 2,
                                ),
                              ]
                            : null,
                      ),
                      child: Icon(
                        _icon,
                        color: _currentColor,
                        size: size * 0.6,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          if (widget.showLabel && widget.label.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              widget.label,
              style: TextStyle(
                fontSize: 10,
                color: Colors.grey[700],
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: _currentColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              widget.state.toUpperCase(),
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
