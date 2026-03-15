import 'package:flutter/material.dart';

/// SCADA Switch Widget
/// 
/// Interactive toggle switch with on/off states.
/// Named SwitchWidgetScada to avoid conflict with Flutter's Switch.
class SwitchWidgetScada extends StatelessWidget {
  final bool state;
  final String label;
  final bool showLabel;
  final Color onColor;
  final Color offColor;
  final bool disabled;
  final ValueChanged<bool>? onChanged;

  const SwitchWidgetScada({
    super.key,
    required this.state,
    this.label = '',
    this.showLabel = true,
    this.onColor = Colors.green,
    this.offColor = Colors.grey,
    this.disabled = false,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (showLabel && label.isNotEmpty) ...[
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
          const SizedBox(height: 8),
        ],
        Expanded(
          child: Center(
            child: Opacity(
              opacity: disabled ? 0.5 : 1.0,
              child: GestureDetector(
                onTap: disabled || onChanged == null
                    ? null
                    : () => onChanged!(!state),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 52,
                  height: 28,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    color: state ? onColor : offColor.withOpacity(0.4),
                    border: Border.all(
                      color: state ? onColor.withOpacity(0.8) : offColor,
                      width: 2,
                    ),
                  ),
                  child: Stack(
                    children: [
                      AnimatedPositioned(
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeInOut,
                        left: state ? 26 : 2,
                        top: 2,
                        child: Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.2),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        // State text
        Text(
          state ? 'ON' : 'OFF',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: state ? onColor : offColor,
          ),
        ),
      ],
    );
  }
}
