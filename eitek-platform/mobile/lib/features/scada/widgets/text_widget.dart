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
  final Color bgColor;
  final Color borderColor;
  final double borderWidth;
  final double padding;
  final VoidCallback? onTap;

  const ScadaTextWidget({
    super.key,
    required this.text,
    this.fontSize = 14,
    this.fontWeight = FontWeight.normal,
    this.color = Colors.black87,
    this.alignment = TextAlign.left,
    this.bgColor = Colors.transparent,
    this.borderColor = Colors.transparent,
    this.borderWidth = 0,
    this.padding = 4,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: bgColor,
          border: borderWidth > 0
              ? Border.all(color: borderColor, width: borderWidth)
              : null,
        ),
        padding: EdgeInsets.all(padding),
        alignment: Alignment.center,
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
