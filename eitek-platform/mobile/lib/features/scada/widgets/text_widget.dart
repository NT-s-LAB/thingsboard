import 'package:flutter/material.dart';

/// SCADA Text Widget
/// 
/// Simple text display with customizable styling.
class ScadaTextWidget extends StatelessWidget {
  final String text;
  final double fontSize;
  final FontWeight fontWeight;
  final Color color;
  final TextAlign alignment;
  final VoidCallback? onTap;

  const ScadaTextWidget({
    super.key,
    required this.text,
    this.fontSize = 14,
    this.fontWeight = FontWeight.normal,
    this.color = Colors.black87,
    this.alignment = TextAlign.left,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Center(
        child: Text(
          text,
          style: TextStyle(
            fontSize: fontSize,
            fontWeight: fontWeight,
            color: color,
          ),
          textAlign: alignment,
        ),
      ),
    );
  }
}
