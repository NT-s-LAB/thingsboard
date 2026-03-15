import 'package:flutter/material.dart';

/// SCADA LED Widget
/// 
/// Simple on/off indicator light with optional blinking.
class LedWidget extends StatefulWidget {
  final bool state;
  final String label;
  final bool showLabel;
  final Color onColor;
  final Color offColor;
  final String shape; // 'circle', 'square', 'rounded'
  final bool blinkWhenOn;

  const LedWidget({
    super.key,
    required this.state,
    this.label = '',
    this.showLabel = true,
    this.onColor = Colors.green,
    this.offColor = Colors.grey,
    this.shape = 'circle',
    this.blinkWhenOn = false,
  });

  @override
  State<LedWidget> createState() => _LedWidgetState();
}

class _LedWidgetState extends State<LedWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _opacityAnimation = Tween<double>(begin: 1.0, end: 0.3).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _updateAnimation();
  }

  @override
  void didUpdateWidget(covariant LedWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.state != widget.state || oldWidget.blinkWhenOn != widget.blinkWhenOn) {
      _updateAnimation();
    }
  }

  void _updateAnimation() {
    if (widget.state && widget.blinkWhenOn) {
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

  Color get _currentColor => widget.state ? widget.onColor : widget.offColor;

  BorderRadius? get _borderRadius {
    switch (widget.shape) {
      case 'square':
        return null;
      case 'rounded':
        return BorderRadius.circular(4);
      default:
        return null; // Will use BoxShape.circle
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Expanded(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final size = constraints.maxWidth.clamp(16.0, constraints.maxHeight) * 0.7;
              return Center(
                child: AnimatedBuilder(
                  animation: _opacityAnimation,
                  builder: (context, child) {
                    return Opacity(
                      opacity: widget.blinkWhenOn && widget.state
                          ? _opacityAnimation.value
                          : 1.0,
                      child: child,
                    );
                  },
                  child: Container(
                    width: size,
                    height: size,
                    decoration: BoxDecoration(
                      color: _currentColor,
                      shape: widget.shape == 'circle'
                          ? BoxShape.circle
                          : BoxShape.rectangle,
                      borderRadius: widget.shape != 'circle' ? _borderRadius : null,
                      boxShadow: widget.state
                          ? [
                              BoxShadow(
                                color: _currentColor.withOpacity(0.6),
                                blurRadius: 8,
                                spreadRadius: 2,
                              ),
                            ]
                          : null,
                      border: Border.all(
                        color: _currentColor.withOpacity(0.8),
                        width: 2,
                      ),
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
      ],
    );
  }
}
