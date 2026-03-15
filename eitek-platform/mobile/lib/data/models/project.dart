/// Project model for EITEK Platform
class Project {
  final String id;
  final String name;
  final String? description;
  final String? code;
  final String tenantId;
  final bool isActive;
  final int? siteCount;
  final int? deviceCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  Project({
    required this.id,
    required this.name,
    this.description,
    this.code,
    required this.tenantId,
    required this.isActive,
    this.siteCount,
    this.deviceCount,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      code: json['code'],
      tenantId: json['tenantId'],
      isActive: json['isActive'] ?? true,
      siteCount: json['_count']?['sites'] ?? json['siteCount'],
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
      'code': code,
      'tenantId': tenantId,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Project copyWith({
    String? id,
    String? name,
    String? description,
    String? code,
    String? tenantId,
    bool? isActive,
    int? siteCount,
    int? deviceCount,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Project(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      code: code ?? this.code,
      tenantId: tenantId ?? this.tenantId,
      isActive: isActive ?? this.isActive,
      siteCount: siteCount ?? this.siteCount,
      deviceCount: deviceCount ?? this.deviceCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
