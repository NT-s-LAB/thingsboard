/// Site model for EITEK Platform
class Site {
  final String id;
  final String name;
  final String? description;
  final String? address;
  final double? latitude;
  final double? longitude;
  final String projectId;
  final bool isActive;
  final int? areaCount;
  final int? deviceCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  Site({
    required this.id,
    required this.name,
    this.description,
    this.address,
    this.latitude,
    this.longitude,
    required this.projectId,
    required this.isActive,
    this.areaCount,
    this.deviceCount,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Site.fromJson(Map<String, dynamic> json) {
    return Site(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      address: json['address'],
      latitude: json['latitude']?.toDouble(),
      longitude: json['longitude']?.toDouble(),
      projectId: json['projectId'],
      isActive: json['isActive'] ?? true,
      areaCount: json['_count']?['areas'] ?? json['areaCount'],
      deviceCount: json['deviceCount'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'projectId': projectId,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Site copyWith({
    String? id,
    String? name,
    String? description,
    String? address,
    double? latitude,
    double? longitude,
    String? projectId,
    bool? isActive,
    int? areaCount,
    int? deviceCount,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Site(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      projectId: projectId ?? this.projectId,
      isActive: isActive ?? this.isActive,
      areaCount: areaCount ?? this.areaCount,
      deviceCount: deviceCount ?? this.deviceCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
