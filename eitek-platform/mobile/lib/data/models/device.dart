/// Device model for EITEK Platform
class Device {
  final String id;
  final String name;
  final String? description;
  final String type;
  final String? tbDeviceId;
  final String? accessToken;
  final String? templateId;
  final String? areaId;
  final String status;
  final bool isActive;
  final Map<String, dynamic>? attributes;
  final Map<String, dynamic>? latestTelemetry;
  final DateTime? lastActivityTime;
  final DateTime createdAt;
  final DateTime updatedAt;

  Device({
    required this.id,
    required this.name,
    this.description,
    required this.type,
    this.tbDeviceId,
    this.accessToken,
    this.templateId,
    this.areaId,
    required this.status,
    required this.isActive,
    this.attributes,
    this.latestTelemetry,
    this.lastActivityTime,
    required this.createdAt,
    required this.updatedAt,
  });

  bool get isOnline => status == 'ONLINE';
  bool get isOffline => status == 'OFFLINE';

  factory Device.fromJson(Map<String, dynamic> json) {
    return Device(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      type: json['type'] ?? 'default',
      tbDeviceId: json['tbDeviceId'],
      accessToken: json['accessToken'],
      templateId: json['templateId'],
      areaId: json['areaId'],
      status: json['status'] ?? 'UNKNOWN',
      isActive: json['isActive'] ?? true,
      attributes: json['attributes'],
      latestTelemetry: json['latestTelemetry'],
      lastActivityTime: json['lastActivityTime'] != null 
          ? DateTime.parse(json['lastActivityTime']) 
          : null,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'type': type,
      'tbDeviceId': tbDeviceId,
      'accessToken': accessToken,
      'templateId': templateId,
      'areaId': areaId,
      'status': status,
      'isActive': isActive,
      'attributes': attributes,
      'latestTelemetry': latestTelemetry,
      'lastActivityTime': lastActivityTime?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Device copyWith({
    String? id,
    String? name,
    String? description,
    String? type,
    String? tbDeviceId,
    String? accessToken,
    String? templateId,
    String? areaId,
    String? status,
    bool? isActive,
    Map<String, dynamic>? attributes,
    Map<String, dynamic>? latestTelemetry,
    DateTime? lastActivityTime,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Device(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      type: type ?? this.type,
      tbDeviceId: tbDeviceId ?? this.tbDeviceId,
      accessToken: accessToken ?? this.accessToken,
      templateId: templateId ?? this.templateId,
      areaId: areaId ?? this.areaId,
      status: status ?? this.status,
      isActive: isActive ?? this.isActive,
      attributes: attributes ?? this.attributes,
      latestTelemetry: latestTelemetry ?? this.latestTelemetry,
      lastActivityTime: lastActivityTime ?? this.lastActivityTime,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

/// Telemetry data model
class TelemetryData {
  final String key;
  final dynamic value;
  final DateTime timestamp;

  TelemetryData({
    required this.key,
    required this.value,
    required this.timestamp,
  });

  factory TelemetryData.fromJson(Map<String, dynamic> json) {
    return TelemetryData(
      key: json['key'],
      value: json['value'],
      timestamp: DateTime.fromMillisecondsSinceEpoch(json['ts'] ?? 0),
    );
  }
}
