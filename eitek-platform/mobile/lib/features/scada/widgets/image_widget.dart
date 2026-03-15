import 'package:flutter/material.dart';

/// SCADA Image Widget
/// 
/// Displays an image from URL with customizable fit.
class ScadaImageWidget extends StatelessWidget {
  final String imageUrl;
  final BoxFit fit;
  final VoidCallback? onTap;

  const ScadaImageWidget({
    super.key,
    required this.imageUrl,
    this.fit = BoxFit.contain,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: imageUrl.isEmpty
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
