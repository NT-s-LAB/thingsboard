/// Area model for EITEK Platform
class Area {
  final String id;
  final String name;
  final String? description;
  final String siteId;
  final bool isActive;
  final int? deviceCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  Area({
    required this.id,
    required this.name,
    this.description,
    required this.siteId,
    required this.isActive,
    this.deviceCount,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Area.fromJson(Map<String, dynamic> json) {
    return Area(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      siteId: json['siteId'],
      isActive: json['isActive'] ?? true,
      deviceCount: json['_count']?['devices'] ?? json['deviceCount'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'siteId': siteId,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Area copyWith({
    String? id,
    String? name,
    String? description,
    String? siteId,
    bool? isActive,
    int? deviceCount,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Area(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      siteId: siteId ?? this.siteId,
      isActive: isActive ?? this.isActive,
      deviceCount: deviceCount ?? this.deviceCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
