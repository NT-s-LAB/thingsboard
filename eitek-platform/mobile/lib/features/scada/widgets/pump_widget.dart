import 'package:flutter/material.dart';

/// SCADA Pump Widget
/// 
/// Displays a pump with running/stopped/fault states.
/// Includes optional control buttons for start/stop.
class PumpWidget extends StatefulWidget {
  final String state; // 'running', 'stopped', 'fault'
  final String label;
  final bool showLabel;
  final Color runningColor;
  final Color stoppedColor;
  final Color faultColor;
  final VoidCallback? onTap;
  final VoidCallback? onStart;
  final VoidCallback? onStop;

  const PumpWidget({
    super.key,
    required this.state,
    this.label = '',
    this.showLabel = true,
    this.runningColor = Colors.green,
    this.stoppedColor = Colors.grey,
    this.faultColor = Colors.red,
    this.onTap,
    this.onStart,
    this.onStop,
  });

  @override
  State<PumpWidget> createState() => _PumpWidgetState();
}

class _PumpWidgetState extends State<PumpWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _updateAnimation();
  }

  @override
  void didUpdateWidget(covariant PumpWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.state != widget.state) {
      _updateAnimation();
    }
  }

  void _updateAnimation() {
    if (widget.state == 'running') {
      _animationController.repeat();
    } else {
      _animationController.stop();
      _animationController.reset();
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Color get _currentColor {
    switch (widget.state) {
      case 'running':
        return widget.runningColor;
      case 'fault':
        return widget.faultColor;
      default:
        return widget.stoppedColor;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Pump body
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final size = constraints.maxWidth.clamp(40.0, constraints.maxHeight);
                return Center(
                  child: AnimatedBuilder(
                    animation: _animationController,
                    builder: (context, child) {
                      return Transform.rotate(
                        angle: _animationController.value * 2 * 3.14159,
                        child: child,
                      );
                    },
                    child: Container(
                      width: size * 0.8,
                      height: size * 0.8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _currentColor.withValues(alpha: 0.2),
                        border: Border.all(
                          color: _currentColor,
                          width: 3,
                        ),
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Impeller blades
                          ...List.generate(4, (index) {
                            return Transform.rotate(
                              angle: index * 3.14159 / 2,
                              child: Container(
                                width: size * 0.08,
                                height: size * 0.4,
                                decoration: BoxDecoration(
                                  color: _currentColor,
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              ),
                            );
                          }),
                          // Center hub
                          Container(
                            width: size * 0.2,
                            height: size * 0.2,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _currentColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          // Label and state
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
