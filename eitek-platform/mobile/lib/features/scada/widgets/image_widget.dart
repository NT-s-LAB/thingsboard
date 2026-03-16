import 'package:flutter/material.dart';

/// SCADA Image Widget
/// 
/// Displays an image from URL with customizable fit.
class ScadaImageWidget extends StatelessWidget {
  final String imageUrl;
  final BoxFit fit;
  final double borderRadius;
  final double borderWidth;
  final Color borderColor;
  final double opacity;
  final Color bgColor;
  final VoidCallback? onTap;

  const ScadaImageWidget({
    super.key,
    required this.imageUrl,
    this.fit = BoxFit.contain,
    this.borderRadius = 0,
    this.borderWidth = 0,
    this.borderColor = const Color(0xFFE5E7EB),
    this.opacity = 1.0,
    this.bgColor = Colors.transparent,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Widget imageChild = imageUrl.isEmpty
        ? _buildPlaceholder()
        : Image.network(
            imageUrl,
            fit: fit,
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return Center(
                child: CircularProgressIndicator(
                  value: loadingProgress.expectedTotalBytes != null
                      ? loadingProgress.cumulativeBytesLoaded /
                          loadingProgress.expectedTotalBytes!
                      : null,
                  strokeWidth: 2,
                ),
              );
            },
            errorBuilder: (context, error, stackTrace) {
              return _buildError();
            },
          );

    return GestureDetector(
      onTap: onTap,
      child: Opacity(
        opacity: opacity.clamp(0.0, 1.0),
        child: Container(
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: borderRadius > 0 ? BorderRadius.circular(borderRadius) : null,
            border: borderWidth > 0
                ? Border.all(color: borderColor, width: borderWidth)
                : null,
          ),
          clipBehavior: borderRadius > 0 ? Clip.antiAlias : Clip.none,
          child: imageChild,
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: Colors.grey[200],
      child: Center(
        child: Icon(
          Icons.image_outlined,
          color: Colors.grey[400],
          size: 32,
        ),
      ),
    );
  }

  Widget _buildError() {
    return Container(
      color: Colors.grey[200],
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.broken_image_outlined,
              color: Colors.grey[400],
              size: 32,
            ),
            const SizedBox(height: 4),
            Text(
              'Image Error',
              style: TextStyle(
                fontSize: 10,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
