import 'package:flutter/material.dart';

/// SCADA Motor Widget
/// 
/// Displays a motor with running/stopped/fault states and optional RPM display.
class MotorWidget extends StatefulWidget {
  final String state; // 'running', 'stopped', 'fault'
  final double rpm;
  final String label;
  final bool showLabel;
  final bool showRPM;
  final Color runningColor;
  final Color stoppedColor;
  final Color faultColor;
  final VoidCallback? onTap;

  const MotorWidget({
    super.key,
    required this.state,
    this.rpm = 0,
    this.label = '',
    this.showLabel = true,
    this.showRPM = true,
    this.runningColor = Colors.green,
    this.stoppedColor = Colors.grey,
    this.faultColor = Colors.red,
    this.onTap,
  });

  @override
  State<MotorWidget> createState() => _MotorWidgetState();
}

class _MotorWidgetState extends State<MotorWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: widget.rpm > 0 ? (60000 / widget.rpm).round() : 1000),
    );
    _updateAnimation();
  }

  @override
  void didUpdateWidget(covariant MotorWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.state != widget.state || oldWidget.rpm != widget.rpm) {
      _animationController.duration = Duration(
        milliseconds: widget.rpm > 0 ? (60000 / widget.rpm).round().clamp(50, 5000) : 1000,
      );
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
          // Motor body
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final size = constraints.maxWidth.clamp(40.0, constraints.maxHeight);
                return Center(
                  child: Container(
                    width: size * 0.85,
                    height: size * 0.65,
                    decoration: BoxDecoration(
                      color: _currentColor.withOpacity(0.2),
                      border: Border.all(color: _currentColor, width: 2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Motor housing
                        Positioned(
                          left: 0,
                          child: Container(
                            width: size * 0.55,
                            height: size * 0.5,
                            decoration: BoxDecoration(
                              color: _currentColor.withOpacity(0.3),
                              border: Border.all(color: _currentColor, width: 2),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Center(
                              child: Text(
                                'M',
                                style: TextStyle(
                                  fontSize: size * 0.2,
                                  fontWeight: FontWeight.bold,
                                  color: _currentColor,
                                ),
                              ),
                            ),
                          ),
                        ),
                        // Shaft with rotation
                        Positioned(
                          right: size * 0.1,
                          child: AnimatedBuilder(
                            animation: _animationController,
                            builder: (context, child) {
                              return Transform.rotate(
                                angle: _animationController.value * 2 * 3.14159,
                                child: child,
                              );
                            },
                            child: Container(
                              width: size * 0.15,
                              height: size * 0.15,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: _currentColor,
                              ),
                              child: Icon(
                                Icons.settings,
                                color: Colors.white,
                                size: size * 0.1,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          // Label
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
          // State and RPM
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: _currentColor.withOpacity(0.15),
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
              if (widget.showRPM && widget.state == 'running') ...[
                const SizedBox(width: 4),
                Text(
                  '${widget.rpm.toStringAsFixed(0)} RPM',
                  style: TextStyle(
                    fontSize: 9,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
