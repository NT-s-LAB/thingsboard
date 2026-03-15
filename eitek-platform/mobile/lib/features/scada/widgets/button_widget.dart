import 'package:flutter/material.dart';

/// SCADA Button Widget
/// 
/// Interactive button with customizable appearance.
class ScadaButtonWidget extends StatelessWidget {
  final String text;
  final String? icon;
  final Color buttonColor;
  final Color textColor;
  final double borderRadius;
  final bool disabled;
  final VoidCallback? onPressed;

  const ScadaButtonWidget({
    super.key,
    required this.text,
    this.icon,
    this.buttonColor = Colors.blue,
    this.textColor = Colors.white,
    this.borderRadius = 8,
    this.disabled = false,
    this.onPressed,
  });

  IconData? get _iconData {
    if (icon == null) return null;
    switch (icon) {
      case 'play':
        return Icons.play_arrow;
      case 'stop':
        return Icons.stop;
      case 'pause':
        return Icons.pause;
      case 'power':
        return Icons.power_settings_new;
      case 'settings':
        return Icons.settings;
      case 'refresh':
        return Icons.refresh;
      case 'save':
        return Icons.save;
      case 'add':
        return Icons.add;
      case 'remove':
        return Icons.remove;
      case 'close':
        return Icons.close;
      case 'check':
        return Icons.check;
      case 'arrow_up':
        return Icons.arrow_upward;
      case 'arrow_down':
        return Icons.arrow_downward;
      case 'arrow_left':
        return Icons.arrow_back;
      case 'arrow_right':
        return Icons.arrow_forward;
      default:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Opacity(
        opacity: disabled ? 0.5 : 1.0,
        child: Material(
          color: buttonColor,
          borderRadius: BorderRadius.circular(borderRadius),
          elevation: disabled ? 0 : 2,
          child: InkWell(
            onTap: disabled ? null : onPressed,
            borderRadius: BorderRadius.circular(borderRadius),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (_iconData != null) ...[
                    Icon(_iconData, color: textColor, size: 18),
                    if (text.isNotEmpty) const SizedBox(width: 8),
                  ],
                  if (text.isNotEmpty)
                    Text(
                      text,
                      style: TextStyle(
                        color: textColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
